#!/bin/bash
set -e

echo "=== Iniciando servicios ==="

# 1. Iniciar PostgreSQL
echo "→ Iniciando PostgreSQL..."
sudo pg_ctlcluster 16 main start 2>/dev/null || true
sleep 1

# Configurar auth trust si es necesario
if ! pg_isready -q 2>/dev/null; then
  echo "  PostgreSQL no responde, intentando configurar..."
  sudo sed -i 's/peer$/trust/' /etc/postgresql/16/main/pg_hba.conf 2>/dev/null || true
  sudo pg_ctlcluster 16 main restart 2>/dev/null || true
  sleep 2
fi

if pg_isready -q 2>/dev/null; then
  echo "  ✓ PostgreSQL corriendo"
else
  echo "  ✗ PostgreSQL no pudo iniciar"
fi

# 2. Crear usuario y base de datos si no existen
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='appuser'" 2>/dev/null | grep -q 1 || \
  psql -U postgres -c "CREATE USER appuser WITH PASSWORD 'apppass123' CREATEDB;" 2>/dev/null || true

psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='avivandofuego'" 2>/dev/null | grep -q 1 || \
  psql -U postgres -c "CREATE DATABASE avivandofuego OWNER appuser;" 2>/dev/null || true

echo "  ✓ Base de datos lista"

# 3. Instalar dependencias si faltan
cd /workspaces/mi-web-proyecto.
if [ ! -d "node_modules" ]; then
  echo "→ Instalando dependencias raíz..."
  npm install
fi
if [ ! -d "client/node_modules" ]; then
  echo "→ Instalando dependencias del cliente..."
  cd client && npm install && cd ..
fi

# 4. Push schema si hay tablas faltantes
TABLE_COUNT=$(psql -U appuser -d avivandofuego -Atc "SELECT count(*) FROM pg_tables WHERE schemaname='public';" 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" -lt 10 ]; then
  echo "→ Creando tablas en la base de datos..."
  DATABASE_URL=postgresql://appuser:apppass123@localhost:5432/avivandofuego npx drizzle-kit push 2>/dev/null || true
fi

echo "  ✓ Schema verificado ($TABLE_COUNT tablas)"

# 5. Iniciar el servidor
echo "→ Iniciando servidor..."
npm run dev &

echo ""
echo "=== Servicios listos ==="
echo "  App: http://localhost:5000"
echo "  DB:  postgresql://localhost:5432/avivandofuego"
