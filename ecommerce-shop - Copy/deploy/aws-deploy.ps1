param(
    [string]$Region = "us-east-1",
    [string]$ProjectName = "ecommerce-shop",
    [string]$DbPassword = "",
    [string]$KeyName = "ecommerce-shop-key"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$DeployDir = $PSScriptRoot

function Test-AwsAuth {
    $output = aws sts get-caller-identity --region $Region --output json 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "AWS credentials are invalid. Run 'aws configure' or set valid AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
    }
    $identity = $output | ConvertFrom-Json
    if (-not $identity.Account) {
        throw "AWS credentials are invalid. Run 'aws configure' or set valid AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
    }
    Write-Host "AWS account: $($identity.Account)" -ForegroundColor Green
    return $identity.Account
}

function New-ProjectZip {
    $zipPath = Join-Path $DeployDir "ecommerce-shop-deploy.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

    $staging = Join-Path $env:TEMP "ecommerce-shop-deploy"
    if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
    New-Item -ItemType Directory -Path $staging | Out-Null

    $items = @("backend", "my-shop", "deploy", "docker-compose.prod.yml", ".env.example")
    foreach ($item in $items) {
        $source = Join-Path $Root $item
        if (Test-Path $source) {
            Copy-Item $source (Join-Path $staging $item) -Recurse -Force
        }
    }

  Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
    Remove-Item $staging -Recurse -Force
    Write-Host "Created package: $zipPath" -ForegroundColor Green
    return $zipPath
}

if (-not $DbPassword) {
    $DbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | ForEach-Object { [char]$_ })
    Write-Host "Generated DB password (save this): $DbPassword" -ForegroundColor Yellow
}

$AccountId = Test-AwsAuth
$VpcId = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $Region
$Subnets = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VpcId" --query "Subnets[*].SubnetId" --output text --region $Region
$SubnetList = $Subnets -split "\s+"
$SubnetA = $SubnetList[0]
$SubnetB = if ($SubnetList.Count -gt 1) { $SubnetList[1] } else { $SubnetList[0] }

Write-Host "Using VPC: $VpcId" -ForegroundColor Cyan

# Security groups
$Ec2Sg = aws ec2 create-security-group --group-name "$ProjectName-ec2-sg" --description "EC2 web and API" --vpc-id $VpcId --region $Region --output text 2>$null
if (-not $Ec2Sg) {
    $Ec2Sg = aws ec2 describe-security-groups --filters "Name=group-name,Values=$ProjectName-ec2-sg" --query "SecurityGroups[0].GroupId" --output text --region $Region
}
aws ec2 authorize-security-group-ingress --group-id $Ec2Sg --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region 2>$null
aws ec2 authorize-security-group-ingress --group-id $Ec2Sg --protocol tcp --port 4000 --cidr 0.0.0.0/0 --region $Region 2>$null
aws ec2 authorize-security-group-ingress --group-id $Ec2Sg --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $Region 2>$null

$RdsSg = aws ec2 create-security-group --group-name "$ProjectName-rds-sg" --description "RDS PostgreSQL" --vpc-id $VpcId --region $Region --output text 2>$null
if (-not $RdsSg) {
    $RdsSg = aws ec2 describe-security-groups --filters "Name=group-name,Values=$ProjectName-rds-sg" --query "SecurityGroups[0].GroupId" --output text --region $Region
}
aws ec2 authorize-security-group-ingress --group-id $RdsSg --protocol tcp --port 5432 --source-group $Ec2Sg --region $Region 2>$null

Write-Host "Security groups ready: EC2=$Ec2Sg RDS=$RdsSg" -ForegroundColor Green

# Key pair
$KeyPath = Join-Path $DeployDir "$KeyName.pem"
if (-not (Test-Path $KeyPath)) {
    aws ec2 create-key-pair --key-name $KeyName --query KeyMaterial --output text --region $Region | Out-File -FilePath $KeyPath -Encoding ascii
    Write-Host "Saved key pair: $KeyPath" -ForegroundColor Green
}

# RDS subnet group
aws rds create-db-subnet-group `
    --db-subnet-group-name "$ProjectName-subnet-group" `
    --db-subnet-group-description "Ecommerce shop subnets" `
    --subnet-ids $SubnetA $SubnetB `
    --region $Region 2>$null

$DbId = "$ProjectName-db"
aws rds describe-db-instances --db-instance-identifier $DbId --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating RDS instance (takes 5-10 minutes)..." -ForegroundColor Yellow
    aws rds create-db-instance `
        --db-instance-identifier $DbId `
        --db-instance-class db.t3.micro `
        --engine postgres `
        --master-username shopadmin `
        --master-user-password $DbPassword `
        --allocated-storage 20 `
        --db-name shopdb `
        --vpc-security-group-ids $RdsSg `
        --db-subnet-group-name "$ProjectName-subnet-group" `
        --no-publicly-accessible `
        --backup-retention-period 0 `
        --region $Region | Out-Null

    aws rds wait db-instance-available --db-instance-identifier $DbId --region $Region
}

$RdsEndpoint = aws rds describe-db-instances --db-instance-identifier $DbId --query "DBInstances[0].Endpoint.Address" --output text --region $Region
Write-Host "RDS endpoint: $RdsEndpoint" -ForegroundColor Green

# S3 bucket for deploy package
$Bucket = "$ProjectName-deploy-$AccountId".ToLower()
aws s3api head-bucket --bucket $Bucket --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
    if ($Region -eq "us-east-1") {
        aws s3api create-bucket --bucket $Bucket --region $Region | Out-Null
    } else {
        aws s3api create-bucket --bucket $Bucket --region $Region --create-bucket-configuration LocationConstraint=$Region | Out-Null
    }
}

$ZipPath = New-ProjectZip
aws s3 cp $ZipPath "s3://$Bucket/ecommerce-shop-deploy.zip" --region $Region | Out-Null
Write-Host "Uploaded deploy package to s3://$Bucket" -ForegroundColor Green

# EC2 user data
$UserData = @"
#!/bin/bash
set -e
yum update -y
yum install -y docker unzip
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
mkdir -p /opt/ecommerce-shop
aws s3 cp s3://$Bucket/ecommerce-shop-deploy.zip /tmp/deploy.zip --region $Region
unzip -o /tmp/deploy.zip -d /opt/ecommerce-shop
chown -R ec2-user:ec2-user /opt/ecommerce-shop
"@

$UserDataFile = Join-Path $DeployDir "user-data.sh"
$UserData | Out-File -FilePath $UserDataFile -Encoding ascii -NoNewline

# Launch EC2
$AmiId = aws ssm get-parameters --names /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --query "Parameters[0].Value" --output text --region $Region
$InstanceId = aws ec2 run-instances `
    --image-id $AmiId `
    --instance-type t3.micro `
    --key-name $KeyName `
    --security-group-ids $Ec2Sg `
    --subnet-id $SubnetA `
    --associate-public-ip-address `
    --user-data file://$UserDataFile `
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$ProjectName}]" `
    --query "Instances[0].InstanceId" `
    --output text `
    --region $Region

Write-Host "Waiting for EC2 instance $InstanceId ..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $InstanceId --region $Region
Start-Sleep -Seconds 90

$PublicIp = aws ec2 describe-instances --instance-ids $InstanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text --region $Region
Write-Host "EC2 public IP: $PublicIp" -ForegroundColor Green

# Create .env content
$EnvContent = @"
DATABASE_URL=postgresql://shopadmin:$DbPassword@${RdsEndpoint}:5432/shopdb
PORT=4000
NODE_ENV=production
DB_SSL=true
CORS_ORIGIN=http://$PublicIp
VITE_API_URL=http://$PublicIp:4000
"@

$EnvFile = Join-Path $DeployDir "production.env"
$EnvContent | Out-File -FilePath $EnvFile -Encoding utf8

# Deploy on EC2 via SSH
$SshCommands = @"
cd /opt/ecommerce-shop
cp production.env .env 2>/dev/null || true
cat > .env << 'ENVEOF'
$EnvContent
ENVEOF
docker-compose -f docker-compose.prod.yml up -d --build
"@

$SshScript = Join-Path $DeployDir "remote-deploy.sh"
$SshCommands | Out-File -FilePath $SshScript -Encoding ascii

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Infrastructure created. Finish deploy with:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Wait 2-3 min for EC2 user-data to finish, then run:" -ForegroundColor White
Write-Host "   scp -i `"$KeyPath`" `"$EnvFile`" ec2-user@${PublicIp}:/opt/ecommerce-shop/.env" -ForegroundColor Yellow
Write-Host "   ssh -i `"$KeyPath`" ec2-user@${PublicIp} `"cd /opt/ecommerce-shop && docker-compose -f docker-compose.prod.yml up -d --build`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Open frontend: http://$PublicIp" -ForegroundColor Green
Write-Host "3. API: http://${PublicIp}:4000/health" -ForegroundColor Green
Write-Host ""
Write-Host "Saved credentials in: $EnvFile" -ForegroundColor Yellow
Write-Host "DB password: $DbPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: add ALB + API Gateway (see DEPLOY.md steps 4-5)" -ForegroundColor Cyan
