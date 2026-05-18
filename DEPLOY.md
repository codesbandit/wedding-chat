## Deployment — VPS + PM2 + Nginx

### 1. Server setup (first time only)

```bash
# Install Node 20, PM2, Nginx on VPS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

### 2. Deploy steps (every release)

```bash
# On VPS — clone or pull latest
cd /var/www/wedding-gpt
git pull origin main          # or: scp -r . user@vps:/var/www/wedding-gpt

# Install prod deps
npm install --omit=dev

# Copy env
cp .env.example .env
# Edit .env with real DATABASE_URL

# Generate Prisma client
npx prisma generate

# Run migrations (first deploy only — after that use `migrate deploy`)
npx prisma migrate deploy

# Seed guests (first deploy only)
npm run db:seed

# Build
npm run build

# Start / reload PM2
pm2 start ecosystem.config.js
# OR on subsequent deploys:
pm2 reload wedding-gpt
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

### 3. Nginx config

Create `/etc/nginx/sites-available/wedding-gpt`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/wedding-gpt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4. Adding new guests

```sql
-- Via MySQL CLI or Prisma Studio:
INSERT INTO guests (slug, guest_name, category)
VALUES ('nama-tamu', 'Nama Lengkap Tamu', 'FRIEND');
```

Or via seed: add to `prisma/seed.ts` and re-run `npm run db:seed`.

### 5. View RSVP results

```bash
npx prisma studio   # opens browser-based GUI
```

### 6. Useful PM2 commands

```bash
pm2 logs wedding-gpt     # live logs
pm2 status               # process table
pm2 restart wedding-gpt  # restart
```
