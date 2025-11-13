# 📊 Análise do Projeto Sentra Partners

**Data da Análise:** 06 de Novembro de 2025  
**Repositório:** https://github.com/sentrapartners-ctrl/Sentra-Partenrs  
**Status:** ✅ Repositório clonado e banco de dados conectado com sucesso

---

## 🎯 Visão Geral do Projeto

**Sentra Partners** é uma plataforma completa de gerenciamento e monitoramento de contas de trading forex com alertas automáticos, calendário econômico e análise de performance em tempo real.

### Principais Características

- **Monitoramento em tempo real** de múltiplas contas MT4/MT5
- **Alertas inteligentes** via Telegram e email
- **Calendário econômico** com notificações automáticas
- **Análise detalhada** de performance e métricas
- **Sistema de copy trading** com provedores de sinais
- **Gestão de assinaturas e produtos**
- **Sistema de suporte** com chat e tickets

---

## 🗄️ Banco de Dados

### Informações de Conexão

| Campo | Valor |
|-------|-------|
| **Host** | mysql-144d74da-sentrapartners-172c.f.aivencloud.com |
| **Porta** | 11642 |
| **Usuário** | avnadmin |
| **Banco de Dados** | defaultdb |
| **Versão MySQL** | 8.0.35 |
| **SSL** | Obrigatório |
| **Status** | ✅ Conectado com sucesso |

> **Nota:** As credenciais de conexão estão configuradas no arquivo `.env` do servidor.

### Estrutura do Banco de Dados

O banco de dados contém **57 tabelas** organizadas nas seguintes categorias:

#### 1. Usuários e Autenticação (4 tabelas)
- `users` - Dados dos usuários
- `user_settings` - Configurações individuais
- `telegram_users` - Integração com Telegram
- `password_reset_tokens` - Tokens de recuperação de senha

#### 2. Contas de Trading (6 tabelas)
- `trading_accounts` - Contas MT4/MT5
- `trades` - Histórico de operações
- `balance_history` - Histórico de saldo
- `account_drawdown` - Drawdown por conta
- `consolidated_drawdown` - Drawdown consolidado
- `trade_notes` - Anotações sobre trades

#### 3. Copy Trading (8 tabelas)
- `signal_providers` - Provedores de sinais
- `signal_subscriptions` - Assinaturas de sinais
- `copy_signals` - Sinais de copy trading
- `copy_trades` - Trades copiados
- `copy_trading_configs` - Configurações de copy trading
- `copy_trading_settings` - Settings de copy trading
- `slave_heartbeats` - Heartbeat das contas escravas
- `provider_statistics` - Estatísticas dos provedores

#### 4. Alertas e Notificações (7 tabelas)
- `alerts` - Configurações de alertas
- `notifications` - Notificações enviadas
- `notification_history` - Histórico de notificações
- `drawdown_alert_history` - Histórico de alertas de drawdown
- `economic_events` - Eventos do calendário econômico
- `support_notifications` - Notificações de suporte
- `daily_journal` - Diário de operações

#### 5. Produtos e Assinaturas (9 tabelas)
- `subscription_plans` - Planos de assinatura
- `user_subscriptions` - Assinaturas dos usuários
- `user_purchases` - Compras realizadas
- `ea_products` - Produtos Expert Advisors
- `ea_licenses` - Licenças de EAs
- `expert_advisors` - Expert Advisors cadastrados
- `vps_products` - Produtos VPS
- `product_reviews` - Avaliações de produtos
- `provider_reviews` - Avaliações de provedores

#### 6. Pagamentos e Financeiro (7 tabelas)
- `payment_transactions` - Transações de pagamento
- `transactions` - Transações gerais
- `crypto_payment_addresses` - Endereços de pagamento cripto
- `crypto_exchange_rates` - Taxas de câmbio cripto
- `provider_commissions` - Comissões dos provedores
- `provider_wallets` - Carteiras dos provedores
- `wallet_sessions` - Sessões de carteira
- `client_transfer_history` - Histórico de transferências

#### 7. Suporte ao Cliente (6 tabelas)
- `support_tickets` - Tickets de suporte
- `support_messages` - Mensagens de suporte
- `support_attachments` - Anexos de suporte
- `support_quick_replies` - Respostas rápidas
- `support_ratings` - Avaliações de atendimento
- `bug_reports` - Relatórios de bugs

#### 8. Administração e Sistema (10 tabelas)
- `system_settings` - Configurações do sistema
- `api_keys` - Chaves de API
- `landing_page_config` - Configuração da landing page
- `landing_page_content` - Conteúdo da landing page
- `landing_page_pixels` - Pixels de rastreamento
- `manager_assignments` - Atribuições de gerentes
- `client_vms` - VMs dos clientes
- `strategies` - Estratégias de trading
- `__drizzle_migrations` - Migrações do Drizzle ORM

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** com TypeScript
- **Tailwind CSS 4** para estilização
- **shadcn/ui** para componentes
- **tRPC** para comunicação type-safe
- **Recharts** para gráficos
- **Wouter** para roteamento
- **i18next** para internacionalização

### Backend
- **Node.js** com TypeScript
- **Express.js** como framework web
- **tRPC** para APIs type-safe
- **Drizzle ORM** para banco de dados
- **node-cron** para tarefas agendadas
- **WebSocket** para comunicação em tempo real

### Banco de Dados
- **MySQL 8.0.35** (Aiven Cloud)
- **Drizzle ORM** para migrations

### Integrações
- **MetaTrader 4/5** via API REST
- **Telegram Bot API** para notificações
- **Resend** para emails transacionais
- **AWS S3** para armazenamento de arquivos
- **NowPayments** para pagamentos em cripto

---

## 📁 Estrutura de Diretórios

```
sentra-partners/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── hooks/            # Custom hooks
│   │   ├── contexts/         # Context providers
│   │   ├── services/         # Serviços e APIs
│   │   └── i18n/             # Internacionalização
│   └── public/               # Arquivos estáticos
│
├── server/                    # Backend Node.js
│   ├── _core/                # Core do servidor (tRPC, OAuth, etc)
│   ├── routes/               # Rotas da API
│   ├── services/             # Serviços de negócio
│   ├── jobs/                 # Jobs agendados
│   ├── cron/                 # Tarefas cron
│   ├── websocket/            # WebSocket handlers
│   └── migrations/           # Migrações SQL
│
├── shared/                    # Código compartilhado
├── drizzle/                   # Configuração Drizzle ORM
├── scripts/                   # Scripts utilitários
└── migrations/                # Migrações adicionais
```

---

## 🚀 Configuração Atual

### Arquivo .env Criado

O arquivo `.env` foi criado com as seguintes configurações:

```env
# Banco de Dados MySQL (Aiven Cloud)
DATABASE_URL=mysql://[usuario]:[senha]@[host]:[porta]/[database]?ssl-mode=REQUIRED

# OAuth e Autenticação
VITE_APP_ID=proj_sentrapartners
VITE_OAUTH_PORTAL_URL=https://vida.butterfly-effect.dev
OAUTH_SERVER_URL=https://vidabiz.butterfly-effect.dev
JWT_SECRET=sentra-partners-jwt-secret-2025-production

# Servidor
PORT=3000
FRONTEND_URL=http://localhost:5173

# Integrações (necessitam configuração)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
RESEND_API_KEY=your_resend_api_key
EMAIL_USER=sentrapartners@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

### Dependências Instaladas

✅ Todas as 539 dependências foram instaladas com sucesso via pnpm.

---

## 🔍 Funcionalidades Identificadas

### 1. Dashboard Principal
- Visão consolidada de todas as contas
- Gráficos de equity e drawdown
- Métricas de performance em tempo real

### 2. Gerenciamento de Contas MT4/MT5
- Sincronização automática de contas
- Histórico de trades
- Análise de performance individual

### 3. Sistema de Alertas
- Alertas de drawdown configuráveis
- Notificações de calendário econômico
- Envio via Telegram e email

### 4. Copy Trading
- Sistema completo de provedores de sinais
- Configuração de copy trading automático
- Estatísticas e comissões de provedores

### 5. Calendário Econômico
- Eventos organizados por impacto
- Alertas automáticos para eventos HIGH
- Integração com Manus Forge API

### 6. Sistema de Assinaturas
- Planos de assinatura configuráveis
- Gestão de pagamentos
- Suporte a pagamentos em cripto

### 7. Produtos e Licenças
- Venda de Expert Advisors
- Sistema de licenciamento
- Produtos VPS

### 8. Suporte ao Cliente
- Sistema de tickets
- Chat em tempo real
- Avaliações de atendimento

### 9. Área Administrativa
- Gestão de usuários
- Configurações do sistema
- Relatórios e analytics

---

## 📝 Próximos Passos Recomendados

### 1. Configuração de Integrações Externas

#### Telegram Bot
1. Criar bot via @BotFather
2. Obter token e configurar em `TELEGRAM_BOT_TOKEN`
3. Registrar comandos do bot

#### Email (Resend)
1. Criar conta em resend.com
2. Verificar domínio
3. Gerar API key e configurar em `RESEND_API_KEY`

#### Calendário Econômico
1. Obter API key da Manus Forge
2. Configurar em `VITE_FRONTEND_FORGE_API_KEY`

### 2. Inicialização do Projeto

```bash
# Executar migrações do banco de dados
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar em produção
pnpm start
```

### 3. Testes e Validação

- Testar conexão com MT4/MT5
- Validar sistema de alertas
- Testar copy trading
- Verificar integrações de pagamento

### 4. Deploy

O projeto está configurado para deploy em:
- **Render.com** (recomendado)
- **Railway**
- **Docker**
- **Manual**

---

## ⚠️ Observações Importantes

1. **Certificado SSL**: O banco de dados usa certificado auto-assinado. A configuração `rejectUnauthorized: false` foi aplicada para permitir a conexão.

2. **Variáveis de Ambiente**: Algumas variáveis ainda precisam ser configuradas com valores reais:
   - `TELEGRAM_BOT_TOKEN`
   - `RESEND_API_KEY`
   - `EMAIL_PASSWORD`
   - `VITE_FRONTEND_FORGE_API_KEY`

3. **Segurança**: O token do GitHub fornecido tem permissões completas. Recomenda-se rotacionar após a configuração inicial.

4. **Banco de Dados**: O banco já contém 57 tabelas criadas, indicando que o projeto já está em uso ou foi previamente configurado.

---

## 📞 Recursos Disponíveis

### Documentação no Repositório
- `README.md` - Documentação principal
- `TROUBLESHOOTING.md` - Solução de problemas
- `TELEGRAM_SETUP.md` - Configuração do Telegram
- `VPS_INTEGRATION_GUIDE.md` - Guia de integração VPS
- `MANUAL_USUARIO_SENTRA_PARTNERS.pdf` - Manual do usuário
- `MANUAL_PROGRAMADOR_SENTRA_PARTNERS.pdf` - Manual do programador

### Scripts Úteis
- `test-db-connection.js` - Testar conexão com banco de dados
- `list-all-tables.js` - Listar todas as tabelas
- `make-admin.ts` - Criar usuário administrador
- `seed-data.ts` - Popular dados de teste

---

## ✅ Status da Configuração

| Item | Status |
|------|--------|
| Repositório clonado | ✅ Concluído |
| Dependências instaladas | ✅ Concluído |
| Banco de dados conectado | ✅ Concluído |
| Arquivo .env criado | ✅ Concluído |
| Estrutura analisada | ✅ Concluído |
| Integrações configuradas | ⏳ Pendente |
| Testes realizados | ⏳ Pendente |
| Deploy realizado | ⏳ Pendente |

---

**Desenvolvido com ❤️ pela equipe Sentra Partners**
