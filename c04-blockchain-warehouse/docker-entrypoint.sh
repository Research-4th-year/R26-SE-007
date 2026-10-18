#!/bin/sh
set -e

# Apply any pending migrations before the server accepts traffic.
# `migrate deploy` is the production command: it applies committed
# migrations and never generates new ones or prompts.
echo "==> Applying database migrations"
npx prisma migrate deploy

echo "==> Starting backend"
exec node dist/server.js
