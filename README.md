# 🚀 Sentra Partners

**Plataforma completa de gerenciamento e monitoramento de contas de trading forex com alertas automáticos, calendário econômico e análise de performance em tempo real.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://reactjs.org/)

---

## 📋 Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API](#api)
- [Deploy](#deploy)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## 🎯 Sobre

**Sentra Partners** é uma solução profissional para traders forex que precisam monitorar múltiplas contas, receber alertas em tempo real e analisar performance de forma detalhada. A plataforma oferece integração nativa com MetaTrader 4/5, notificações via Telegram e email, e um calendário econômico completo com alertas automáticos.

### Por que Sentra Partners?

A plataforma foi desenvolvida para resolver problemas reais enfrentados por traders profissionais. O **monitoramento em tempo real** permite acompanhar todas as contas em um único dashboard com atualização automática. Os **alertas inteligentes** notificam sobre drawdown crítico, eventos econômicos de alto impacto e abertura/fechamento de trades importantes.

A **análise detalhada** oferece métricas de performance, gráficos interativos e histórico completo de trades. A **integração completa** funciona nativamente com MT4/MT5, Telegram Bot e email via Resend. O sistema é **multi-idioma** com suporte a português, inglês e espanhol.

---

## ✨ Funcionalidades

### Dashboard Principal

O dashboard oferece visão consolidada de todas as contas com saldo total, equity e P/L. Apresenta gráficos interativos de equity e drawdown, além de lista de contas com status e métricas individuais. Inclui indicadores de inatividade para contas sem trades recentes.

### Alertas Automáticos

O sistema de alertas monitora drawdown em tempo real com limite configurável por usuário e deduplicação inteligente (máximo 2 alertas/dia). Oferece alertas de calendário econômico para eventos de alto impacto com tempo de antecedência configurável. As notificações são enviadas via Telegram e email com templates profissionais.

### Calendário Econômico

O calendário apresenta eventos organizados por data e impacto, com filtros por moeda e nível de impacto. Oferece alertas automáticos para eventos HIGH impact e informações detalhadas de cada evento (anterior, previsto, atual).

### Análise de Performance

A análise inclui métricas detalhadas por conta (win rate, profit factor, drawdown), gráficos de evolução de equity e drawdown, histórico completo de trades com filtros e exportação para CSV/Excel.

### Integração MetaTrader

A integração permite sincronização automática de contas MT4/MT5, atualização em tempo real de saldo e equity, histórico de trades sincronizado e suporte para múltiplas contas simultâneas.

---

## 🛠️ Tecnologias

### Frontend

O frontend utiliza **React 19** com TypeScript para type safety, **Tailwind CSS 4** para estilização moderna, **shadcn/ui** para componentes reutilizáveis, **tRPC** para comunicação type-safe com backend, **Recharts** para visualizações de dados e **Wouter** para roteamento client-side.

### Backend

O backend é construído com **Node.js** e TypeScript, **Express.js** como framework web, **tRPC** para APIs type-safe, **Drizzle ORM** para gerenciamento de banco de dados, **node-cron** para tarefas agendadas e **Telegram Bot API** para notificações.

### Banco de Dados

Utiliza **MySQL 8.0+** para armazenamento relacional com **Drizzle ORM** para migrations e queries type-safe.

### Integrações

As integrações incluem **MetaTrader 4/5** via API personalizada, **Telegram Bot** para notificações instantâneas, **Resend** para envio de emails transacionais e **Manus Forge API** para dados de mercado.

---

## 📦 Instalação

### Requisitos

Para executar o projeto, você precisa de Node.js versão 18 ou superior, pnpm (gerenciador de pacotes), MySQL versão 8.0 ou superior e Git para controle de versão.

### Passo a Passo

Clone o repositório:

```bash
git clone https://github.com/sentrapartners-ctrl/Sentra-Partenrs.git
cd Sentra-Partenrs
```

Instale as dependências:

```bash
pnpm install
```

Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite .env com suas configurações
```

Execute as migrações do banco de dados:

```bash
pnpm db:push
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:5173` (frontend) e `http://localhost:3000` (backend).

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL=mysql://user:password@host:port/database

# Autenticação
JWT_SECRET=sua-chave-secreta-jwt
OAUTH_SERVER_URL=https://oauth.example.com
OWNER_OPEN_ID=seu-owner-id

# Telegram
TELEGRAM_BOT_TOKEN=seu-token-do-bot

# Email (Resend)
RESEND_API_KEY=sua-api-key-resend
RESEND_FROM_EMAIL=noreply@seudominio.com

# Frontend
VITE_APP_TITLE=Sentra Partners
VITE_APP_LOGO=https://url-do-logo.com/logo.png
VITE_FRONTEND_FORGE_API_KEY=sua-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge-api-url.com
```

### Configuração do Telegram Bot

Crie um bot via @BotFather no Telegram, obtenha o token e configure em TELEGRAM_BOT_TOKEN. Os usuários devem enviar `/start` para o bot e inserir o código de ativação na plataforma.

### Configuração do Resend

Crie uma conta em resend.com, verifique seu domínio de envio, gere uma API key e configure em RESEND_API_KEY e RESEND_FROM_EMAIL.

---

## 🚀 Uso

### Adicionar Conta MT4/MT5

Acesse a página "Minhas Contas", clique em "Adicionar Conta", insira número da conta, servidor e senha de investidor, salve e aguarde sincronização automática.

### Configurar Alertas

Acesse a página "Alertas", conecte seu Telegram seguindo as instruções, defina o limite de drawdown em porcentagem, ative alertas de calendário econômico e escolha o tempo de antecedência.

### Visualizar Performance

Acesse o Dashboard para visão geral, a página "Análise" para métricas detalhadas e "Calendário" para eventos econômicos.

---

## 📡 API

### tRPC Endpoints

#### User Router

**getAlertSettings**: Busca configurações de alertas do usuário.

```typescript
const settings = await trpc.user.getAlertSettings.useQuery();
```

**updateEconomicAlertSettings**: Atualiza alertas de calendário econômico.

```typescript
await trpc.user.updateEconomicAlertSettings.mutate({
  enabled: true,
  timeMinutes: 60,
  emailEnabled: true
});
```

**updateDrawdownSettings**: Atualiza alertas de drawdown.

```typescript
await trpc.user.updateDrawdownSettings.mutate({
  enabled: true,
  limitPercent: 10
});
```

#### Telegram Router

**getAccounts**: Lista contas do usuário.

```typescript
const accounts = await trpc.telegram.getAccounts.useQuery();
```

**getTrades**: Busca histórico de trades.

```typescript
const trades = await trpc.telegram.getTrades.useQuery({
  accountId: 123,
  limit: 50
});
```

### MetaTrader Integration

Endpoint para sincronização de dados:

```
POST /api/mt4/sync
Content-Type: application/json

{
  "accountNumber": "12345678",
  "balance": 10000.00,
  "equity": 9500.00,
  "openPositions": 2,
  "trades": [
    {
      "ticket": 123456,
      "symbol": "EURUSD",
      "type": "buy",
      "volume": 0.1,
      "openPrice": 1.1000,
      "openTime": "2025-11-06T10:00:00Z"
    }
  ]
}
```

---

## 🌐 Deploy

### Render.com (Recomendado)

Crie um novo Web Service no Render.com, conecte ao repositório GitHub, configure as variáveis de ambiente no painel e o deploy será automático a cada push.

**Build Command**: `pnpm install && pnpm build`  
**Start Command**: `pnpm start`

O Render executará automaticamente as migrações na inicialização.

### Docker

```bash
# Build da imagem
docker build -t sentra-partners .

# Executar container
docker run -p 3000:3000 --env-file .env sentra-partners
```

### Manual

```bash
# Build do projeto
pnpm build

# Executar migrações
pnpm db:push

# Iniciar servidor
pnpm start
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir, faça um fork do projeto, crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`), commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`), faça push para a branch (`git push origin feature/MinhaFeature`) e abra um Pull Request.

### Padrões de Código

Use TypeScript para type safety, siga o ESLint configurado no projeto, escreva testes para novas funcionalidades e documente APIs e componentes complexos.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

Para suporte técnico, entre em contato via email em suporte@sentrapartners.com, Telegram @sentrapartners_support ou abra uma issue no GitHub.

---

## 🙏 Agradecimentos

Agradecemos à comunidade open source pelas ferramentas incríveis, ao time da Manus AI pelo suporte e a todos os traders que testaram e forneceram feedback.

---

**Desenvolvido com ❤️ pela equipe Sentra Partners**

**© 2025 Sentra Partners. Todos os direitos reservados.**
