#!/bin/bash

echo "🚀 Iniciando Sentra Partners - Controle Total"
echo "============================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ ERRO: package.json não encontrado. Execute este script no diretório do projeto."
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ ERRO: Arquivo .env não encontrado."
    exit 1
fi

echo "✅ Verificações concluídas"
echo ""
echo "🔍 Testando conexão com o banco de dados..."
npx tsx test-conection.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎯 Todas as conexões estão funcionando!"
    echo ""
    echo "Escolha uma opção:"
    echo "1) Executar em desenvolvimento (dev)"
    echo "2) Executar em desenvolvimento com watch (dev:watch)"
    echo "3) Construir para produção (build)"
    echo "4) Executar em produção (start)"
    echo "5) Executar migrações (db:push)"
    echo "6) Testar conexão (test-connection)"
    echo "7) Apenas mostrar status"
    echo ""
    read -p "Digite sua escolha (1-7): " choice

    case $choice in
        1)
            echo "🔄 Iniciando em modo desenvolvimento..."
            pnpm run dev
            ;;
        2)
            echo "🔄 Iniciando em modo desenvolvimento com watch..."
            pnpm run dev:watch
            ;;
        3)
            echo "🔨 Construindo para produção..."
            pnpm run build
            ;;
        4)
            echo "🚀 Iniciando em produção..."
            pnpm run start
            ;;
        5)
            echo "📋 Executando migrações do banco..."
            pnpm run db:push
            ;;
        6)
            echo "🔍 Testando conexão..."
            npx tsx test-conection.ts
            ;;
        7)
            echo "📊 Status do Projeto:"
            echo "   📁 Diretório: $(pwd)"
            echo "   📋 Package.json: $(jq -r '.name' package.json)@$(jq -r '.version' package.json)"
            echo "   🗄️  Banco: MySQL Aiven"
            echo "   🔧 Dependências: $(pnpm list | grep -c "packages installed" | xargs) pacotes"
            echo "   📂 Estrutura: $(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l) arquivos de código"
            ;;
        *)
            echo "❌ Opção inválida!"
            exit 1
            ;;
    esac
else
    echo "❌ Falha no teste de conexão. Verifique as configurações."
    exit 1
fi