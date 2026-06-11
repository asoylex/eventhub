#!/bin/sh
set -e

echo "Sincronizando schema con la base de datos..."
npx prisma db push --accept-data-loss

echo " Corriendo seed..."
node dist/prisma/seed.js

echo " Arrancando servidor..."
exec node dist/src/app.js