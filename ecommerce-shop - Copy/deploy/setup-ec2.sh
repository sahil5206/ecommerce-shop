#!/bin/bash
set -euo pipefail

# Run on Amazon Linux 2023 EC2 after cloning the repo.
# Usage: sudo bash deploy/setup-ec2.sh

yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "Docker installed. Log out and back in, then:"
echo "  cp .env.example .env   # fill RDS + API Gateway values"
echo "  docker-compose -f docker-compose.prod.yml up -d --build"
