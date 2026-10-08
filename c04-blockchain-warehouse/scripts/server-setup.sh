#!/usr/bin/env bash
#
# One-time preparation of the Oracle ARM instance.
# Run as the `ubuntu` user:  bash server-setup.sh
#
set -euo pipefail

echo "==> 1/6  System packages"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo apt-get install -y git curl ca-certificates iptables-persistent

echo "==> 2/6  Swap file"
# 12 GB of RAM is enough to RUN the stack but not always to BUILD it --
# pip resolving torch and tsc compiling both spike hard. Swap turns an
# OOM-kill during `docker compose build` into a slow build that finishes.
if [ ! -f /swapfile ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  # Prefer RAM; only reach for swap under real pressure.
  echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf >/dev/null
  sudo sysctl -p /etc/sysctl.d/99-swap.conf
else
  echo "    /swapfile already present, skipping"
fi

echo "==> 3/6  OS firewall"
# Oracle's Ubuntu images ship an iptables ruleset that REJECTs everything
# except 22. Opening the VCN security list is NOT enough -- without this
# step, port 80 times out with no error anywhere to explain it.
for PORT in 80 443; do
  if ! sudo iptables -C INPUT -p tcp --dport "$PORT" -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT -p tcp --dport "$PORT" -j ACCEPT
    echo "    opened $PORT"
  else
    echo "    $PORT already open"
  fi
done
sudo netfilter-persistent save

echo "==> 4/6  Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
else
  echo "    already installed"
fi
# Lets you run docker without sudo. Needs a new login to take effect.
sudo usermod -aG docker "$USER"

echo "==> 5/6  Docker daemon log rotation"
# Without this, container logs grow without bound and eventually fill the
# 100 GB boot volume -- which fails as "no space left on device" in places
# that look nothing like a logging problem.
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
sudo systemctl restart docker

echo "==> 6/6  Verify"
docker --version
docker compose version
free -h | sed -n '1,3p'

cat <<'DONE'

----------------------------------------------------------
Setup complete.

Log out and back in (exit, then ssh again) so the docker
group membership applies -- otherwise every docker command
needs sudo.

Next:
  git clone <your repo>
  cd warehouse/c04-blockchain-warehouse
  cp env-production.example .env
  nano .env                 # fill in the secrets
  docker compose up -d --build
----------------------------------------------------------
DONE
