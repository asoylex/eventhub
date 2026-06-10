#!/bin/sh
set -e

echo " Corriendo migraciones..."
npx prisma migrate deploy

echo " Corriendo seed..."
node dist/prisma/seed.js

echo " Arrancando servidor..."
exec node dist/src/app.js