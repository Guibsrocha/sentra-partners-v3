#!/bin/bash

# Script para aplicar a correção das tabelas VPS e EAs
# Executar: bash server/migrations/execute_vps_ea_fix.sh

echo "🔧 Aplicando correção das tabelas VPS e EAs..."

# Ler credenciais do .env
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Variáveis do banco (ajustar conforme necessário)
DB_HOST=${DATABASE_HOST:-"localhost"}
DB_PORT=${DATABASE_PORT:-3306}
DB_USER=${DATABASE_USER:-"root"}
DB_PASS=${DATABASE_PASSWORD:-""}
DB_NAME=${DATABASE_NAME:-"sentra_partners"}

# Verificar se o banco está acessível
echo "📊 Verificando conexão com banco de dados..."

if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" 2>/dev/null; then
    echo "❌ Erro: Não foi possível conectar ao banco de dados"
    echo "   Host: $DB_HOST:$DB_PORT"
    echo "   User: $DB_USER"
    echo "   Database: $DB_NAME"
    echo ""
    echo "Por favor, verifique:"
    echo "1. As credenciais no arquivo .env"
    echo "2. Se o banco MySQL está rodando"
    echo "3. Se o banco '$DB_NAME' existe"
    exit 1
fi

echo "✅ Conexão com banco estabelecida!"

# Executar migração
echo ""
echo "🗃️ Aplicando migração 010 (correção das tabelas)..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < server/migrations/010_fix_vps_ea_tables.sql; then
    echo "✅ Migração aplicada com sucesso!"
else
    echo "❌ Erro ao aplicar migração"
    exit 1
fi

# Popular dados iniciais
echo ""
echo "📦 Populando dados iniciais de VPS e EAs..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/populate-vps-eas)

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Dados populados com sucesso!"
    echo "📋 $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
    echo "⚠️  Não foi possível popular automaticamente via API"
    echo "   Execute manualmente: POST /api/admin/populate-vps-eas"
fi

echo ""
echo "🎉 Correção concluída!"
echo ""
echo "📋 Resumo das alterações:"
echo "   • Tabelas vps_products e expert_advisors atualizadas"
echo "   • 4 produtos VPS criados (Starter, Professional, Enterprise, Ultimate)"
echo "   • 5 EAs criados (Scalper Pro, Trend Master, Grid Master, News Trader, Crypto Arbitrage)"
echo ""
echo "🌐 Para testar:"
echo "   GET /api/vps-products  - Listar VPS"
echo "   GET /api/expert-advisors - Listar EAs"
echo ""
echo "🔗 Admin Panel: http://localhost:3000/admin (aba VPS e EAs)"
