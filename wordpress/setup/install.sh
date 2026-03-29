#!/bin/bash
# ─── WordPress Multisite VPS Setup Script ─────────────────────────────────────
# Run this on a fresh Ubuntu 22.04+ VPS (DigitalOcean/Hetzner)
# Usage: sudo bash install.sh <domain>
# Example: sudo bash install.sh saasmarket.com

set -euo pipefail

DOMAIN="${1:?Usage: sudo bash install.sh <domain>}"
DB_NAME="wordpress_multisite"
DB_USER="wp_user"
DB_PASS=$(openssl rand -base64 24)
WP_ADMIN_USER="admin"
WP_ADMIN_PASS=$(openssl rand -base64 16)
WP_ADMIN_EMAIL="admin@${DOMAIN}"

echo "═══════════════════════════════════════════════════════"
echo "  SaaS Marketplace - WordPress Multisite Setup"
echo "  Domain: ${DOMAIN}"
echo "═══════════════════════════════════════════════════════"

# ─── 1. System packages ──────────────────────────────────────────────────────

echo "[1/7] Installing system packages..."
apt-get update -qq
apt-get install -y -qq nginx mysql-server php8.1-fpm php8.1-mysql php8.1-xml \
  php8.1-mbstring php8.1-curl php8.1-zip php8.1-gd php8.1-intl \
  certbot python3-certbot-nginx curl unzip

# ─── 2. MySQL setup ─────────────────────────────────────────────────────────

echo "[2/7] Configuring MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# ─── 3. WordPress installation ──────────────────────────────────────────────

echo "[3/7] Installing WordPress..."
WP_DIR="/var/www/${DOMAIN}"
mkdir -p "${WP_DIR}"

# Install WP-CLI
if ! command -v wp &> /dev/null; then
  curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
  chmod +x wp-cli.phar
  mv wp-cli.phar /usr/local/bin/wp
fi

cd "${WP_DIR}"
wp core download --allow-root

wp config create --allow-root \
  --dbname="${DB_NAME}" \
  --dbuser="${DB_USER}" \
  --dbpass="${DB_PASS}" \
  --dbhost="localhost" \
  --extra-php <<'PHP'
define('WP_ALLOW_MULTISITE', true);
PHP

wp core install --allow-root \
  --url="https://${DOMAIN}" \
  --title="SaaS Marketplace" \
  --admin_user="${WP_ADMIN_USER}" \
  --admin_password="${WP_ADMIN_PASS}" \
  --admin_email="${WP_ADMIN_EMAIL}"

# ─── 4. Enable Multisite ────────────────────────────────────────────────────

echo "[4/7] Enabling WordPress Multisite (subdomain)..."
wp core multisite-convert --allow-root --subdomains

# ─── 5. Install MU-Plugin ───────────────────────────────────────��───────────

echo "[5/7] Installing MU-Plugin..."
mkdir -p "${WP_DIR}/wp-content/mu-plugins"
cp "$(dirname "$0")/../mu-plugins/saas-marketplace-access-control.php" \
   "${WP_DIR}/wp-content/mu-plugins/"

# ─── 6. Nginx configuration ─────────────────────────────────────────────────

echo "[6/7] Configuring Nginx..."
cat > "/etc/nginx/sites-available/${DOMAIN}" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} *.${DOMAIN};
    root ${WP_DIR};
    index index.php;

    client_max_body_size 64M;

    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location ~ /\. {
        deny all;
    }
}
NGINX

ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# ─── 7. SSL with wildcard (manual DNS challenge) ────────────────────────────

echo "[7/7] SSL setup..."
echo "Run this command to get a wildcard SSL certificate:"
echo "  certbot certonly --manual --preferred-challenges=dns -d ${DOMAIN} -d *.${DOMAIN}"
echo ""

# ─── Set permissions ─────────────────────────────────────────────────────────

chown -R www-data:www-data "${WP_DIR}"

# ���── Output credentials ─────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  WordPress URL:  https://${DOMAIN}"
echo "  WP Admin:       https://${DOMAIN}/wp-admin"
echo "  Admin User:     ${WP_ADMIN_USER}"
echo "  Admin Password: ${WP_ADMIN_PASS}"
echo ""
echo "  MySQL User:     ${DB_USER}"
echo "  MySQL Password: ${DB_PASS}"
echo ""
echo "  SAVE THESE CREDENTIALS SECURELY!"
echo "═══════════════════════════════════════════════════════"
