# Deploy on AWS (Console) — No RDS

Deploy the full app on **one EC2 instance** using Docker. PostgreSQL runs inside Docker on EC2 (not AWS RDS).

```
Browser → EC2 port 80  (React shop)
Browser → EC2 port 4000 or API Gateway  (Node API)
API     → PostgreSQL container on same EC2
```

**Estimated cost:** ~$8–15/month (t3.micro + storage) on free tier if eligible.

---

## Before you start

- AWS account
- Project folder zipped, or pushed to GitHub
- [PuTTY](https://www.putty.org/) or Windows Terminal for SSH (Windows)

---

## Step 1 — Create a key pair (EC2 Console)

1. Open [AWS Console](https://console.aws.amazon.com) → search **EC2** → open it.
2. Left menu → **Key Pairs** (under Network & Security).
3. Click **Create key pair**.
4. Name: `ecommerce-shop-key`
5. Type: **RSA**
6. Format: **.pem** (for OpenSSH) or **.ppk** (for PuTTY)
7. Click **Create** — the file downloads. **Keep it safe**; you need it to SSH.

---

## Step 2 — Create a security group

1. EC2 → **Security Groups** → **Create security group**.
2. Name: `ecommerce-shop-sg`
3. Description: `Allow web and API traffic`
4. VPC: leave **default**
5. **Inbound rules** — add these:

| Type       | Port | Source    | Purpose        |
|------------|------|-----------|----------------|
| SSH        | 22   | My IP     | SSH access     |
| HTTP       | 80   | 0.0.0.0/0 | Frontend shop  |
| Custom TCP | 4000 | 0.0.0.0/0 | API (optional) |

6. Click **Create security group**.

---

## Step 3 — Launch EC2 instance

1. EC2 → **Instances** → **Launch instances**.
2. Settings:

| Setting | Value |
|---------|--------|
| Name | `ecommerce-shop` |
| AMI | **Amazon Linux 2023** |
| Instance type | **t3.micro** or **t3.small** |
| Key pair | `ecommerce-shop-key` |
| Security group | Select existing → `ecommerce-shop-sg` |

3. **Storage:** set **20 GiB** (Docker needs space).
4. Click **Launch instance**.
5. Wait until **Instance state** = **Running**.
6. Copy the **Public IPv4 address** (e.g. `3.85.120.45`) — you will use this as `YOUR_EC2_IP`.

---

## Step 4 — Connect to EC2 (SSH)

**Windows (PowerShell):**

```powershell
ssh -i "C:\path\to\ecommerce-shop-key.pem" ec2-user@YOUR_EC2_IP
```

If permission error on the `.pem` file:

```powershell
icacls "C:\path\to\ecommerce-shop-key.pem" /inheritance:r
icacls "C:\path\to\ecommerce-shop-key.pem" /grant:r "$($env:USERNAME):(R)"
```

Type `yes` when asked to continue connecting.

---

## Step 5 — Install Docker on EC2

Run these commands on the EC2 instance:

```bash
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

Log out and back in so Docker group applies:

```bash
exit
```

SSH in again, then verify:

```bash
docker --version
docker-compose --version
```

---

## Step 6 — Upload your project to EC2

### Option A — From GitHub (if repo is on GitHub)

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### Option B — Upload zip from your PC (no GitHub)

**On your Windows PC** — zip the project folder (without `node_modules`), then:

```powershell
scp -i "C:\path\to\ecommerce-shop-key.pem" "C:\path\to\ecommerce-shop.zip" ec2-user@YOUR_EC2_IP:/home/ec2-user/
```

**On EC2:**

```bash
sudo yum install -y unzip
unzip ecommerce-shop.zip -d ecommerce-shop
cd ecommerce-shop
```

Make sure you see `docker-compose.aws.yml`, `backend/`, and `my-shop/` in the folder.

---

## Step 7 — Configure environment and start app

On EC2, inside the project folder:

```bash
cat > .env << EOF
CORS_ORIGIN=http://YOUR_EC2_IP
VITE_API_URL=http://YOUR_EC2_IP:4000
EOF
```

Replace `YOUR_EC2_IP` with your real public IP (both lines).

Start everything (first build takes **5–10 minutes**):

```bash
docker-compose -f docker-compose.aws.yml up -d --build
```

Check status:

```bash
docker-compose -f docker-compose.aws.yml ps
docker-compose -f docker-compose.aws.yml logs -f
```

Press `Ctrl+C` to stop following logs.

---

## Step 8 — Test in browser

| What | URL |
|------|-----|
| Shop | `http://YOUR_EC2_IP` |
| API health | `http://YOUR_EC2_IP:4000/health` |
| Products | `http://YOUR_EC2_IP:4000/products` |

Browse products, add to cart, place an order.

---

## Step 9 (Optional) — API Gateway via AWS Console

Use this if you want a managed API URL instead of `http://YOUR_EC2_IP:4000`.

### 9.1 Create HTTP API

1. AWS Console → **API Gateway** → **Create API**.
2. Choose **HTTP API** → **Build**.
3. **Integrations** → **Add integration**:
   - Type: **HTTP**
   - Integration URL: `http://YOUR_EC2_IP:4000/{proxy}`
   - Method: **ANY**
4. **API name:** `ecommerce-shop-api` → **Next**.

### 9.2 Add routes

On the **Routes** step, add:

| Method | Path |
|--------|------|
| GET | `/health` |
| GET | `/products` |
| GET | `/products/{id}` |
| POST | `/orders` |

For each route, connect it to the HTTP integration you created.

### 9.3 Configure CORS

1. API Gateway → your API → **CORS**.
2. **Access-Control-Allow-Origin:** `http://YOUR_EC2_IP`
3. **Access-Control-Allow-Methods:** `GET, POST, OPTIONS`
4. **Access-Control-Allow-Headers:** `Content-Type`
5. Save.

### 9.4 Deploy

1. **Deploy** → Stage: `prod` → **Deploy**.
2. Copy the **Invoke URL**, e.g.  
   `https://abc123.execute-api.us-east-1.amazonaws.com`

### 9.5 Rebuild frontend with API Gateway URL

On EC2:

```bash
cat > .env << EOF
CORS_ORIGIN=http://YOUR_EC2_IP
VITE_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com
EOF

docker-compose -f docker-compose.aws.yml up -d --build web
```

Also update API CORS on EC2 — edit `.env` is already `CORS_ORIGIN`; rebuild API if you change it:

```bash
docker-compose -f docker-compose.aws.yml up -d --build api
```

Test:

```
https://abc123.execute-api.us-east-1.amazonaws.com/health
https://abc123.execute-api.us-east-1.amazonaws.com/products
```

---

## Useful commands on EC2

```bash
# Stop app
docker-compose -f docker-compose.aws.yml down

# Start again
docker-compose -f docker-compose.aws.yml up -d

# Rebuild after code changes
docker-compose -f docker-compose.aws.yml up -d --build

# View logs
docker-compose -f docker-compose.aws.yml logs -f api
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't SSH | Check security group allows port 22 from your IP |
| Site won't load | Check port 80 rule; run `docker-compose ps` |
| "Failed to load products" | Check port 4000 rule; test `/health` URL |
| Build runs out of memory | Use **t3.small** instead of t3.micro |
| EC2 IP changed after restart | Update `.env` and rebuild, or use an **Elastic IP** |

### Elastic IP (recommended)

EC2 → **Elastic IPs** → **Allocate** → **Associate** with your instance.  
Use the Elastic IP instead of the changing public IP in `.env` and API Gateway.

---

## What you are NOT using (by design)

- **AWS RDS** — database runs in Docker on EC2
- **EKS** — not needed for this project
- **CLI/scripts** — everything above is via AWS Console + SSH

When you want a managed database later, see AWS RDS and switch to `docker-compose.prod.yml`.
