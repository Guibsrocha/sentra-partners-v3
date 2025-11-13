# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [2.0.0] - 2025-11-06

### Adicionado

- **Sistema completo de alertas de calendário econômico**
  - Alertas automáticos para eventos HIGH impact
  - Notificações via Telegram e Email (Resend)
  - Tempo de antecedência configurável por usuário (15min a 4h)
  - Cron job executando a cada 15 minutos
  - Suporte multi-idioma (PT-BR, EN-US, ES-ES)
  - Interface de configuração na página do Calendário

- **Sistema de alertas de drawdown com deduplicação inteligente**
  - Monitoramento automático via cron job
  - Deduplicação: máximo 2 alertas por dia, espaçados 12 horas
  - Alertas individuais por conta
  - Alertas consolidados (todas as contas)
  - Tabela `drawdown_alert_history` para rastreamento
  - Notificações via Telegram e Email

- **Integração com Resend para envio de emails**
  - Templates HTML profissionais
  - Email para alertas econômicos
  - Email para alertas de drawdown
  - Branding consistente da Sentra Partners

- **Novos campos no userSettings**
  - `ntfyEconomicNewsEnabled` - Ativar/desativar alertas econômicos
  - `ntfyEconomicNewsTime` - Minutos de antecedência
  - `ntfyEconomicNewsEmail` - Enviar por email também
  - `ntfyDrawdownLimit` - Limite de drawdown para alertas

- **Migrações automáticas**
  - `add-economic-news-fields.ts` - Campos de alertas econômicos
  - `create-drawdown-alert-history-table.ts` - Tabela de histórico

### Corrigido

- **Cálculo de inatividade de contas**
  - Agora considera trades abertos como atividade
  - Contas com posições abertas mostram "Inativo: 0 dias"
  - Corrigido SQL para usar `openPositions` na lógica

- **Logs detalhados para debug**
  - Logs super detalhados em `saveNotificationHistory`
  - Captura completa de erros com stack trace
  - Facilita identificação de problemas

### Removido

- **Limpeza de interface**
  - Removido NotificationBell component (ícone 🔔 do header)
  - Removido Card "Histórico de Alertas" (visual)
  - Removido botões "Testar" (calendário e drawdown)
  - Removido mutations de teste do backend
  - ~200 linhas de código de teste removidas

### Melhorado

- **Código mais limpo e focado**
  - Apenas funcionalidades essenciais
  - Sem código de teste em produção
  - Redução de ~33% de código desnecessário
  - Melhor organização de serviços

---

## [1.5.0] - 2025-10-20

### Adicionado

- **Calendário Econômico**
  - Visualização de eventos por data
  - Filtros por moeda e impacto
  - Integração com Manus Forge API

- **Análise de Performance**
  - Métricas detalhadas por conta
  - Gráficos de equity e drawdown
  - Exportação de dados

### Corrigido

- Sincronização de trades MT4/MT5
- Performance de queries no banco de dados

---

## [1.0.0] - 2025-10-01

### Adicionado

- **Dashboard Principal**
  - Visão consolidada de contas
  - Gráficos interativos
  - Lista de contas com métricas

- **Integração MetaTrader**
  - Suporte MT4/MT5
  - Sincronização automática
  - Histórico de trades

- **Notificações Telegram**
  - Alertas de trades
  - Comandos via bot
  - Configuração de chat

- **Sistema de Autenticação**
  - Login com JWT
  - Gerenciamento de usuários
  - Controle de acesso

- **Banco de Dados**
  - Schema completo com Drizzle ORM
  - Migrações automáticas
  - 11 tabelas principais

---

## Tipos de Mudanças

- `Adicionado` para novas funcionalidades
- `Alterado` para mudanças em funcionalidades existentes
- `Obsoleto` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades corrigidas
- `Melhorado` para melhorias de performance ou código

---

**© 2025 Sentra Partners. Todos os direitos reservados.**
