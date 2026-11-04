```bash
npm ci
cp .env.example .env
docker compose up -d
npm run push-migrate
npx nest start audit-service
npx nest start
```
