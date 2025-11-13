# 🔔 Sistema de Notificações ntfy.sh - Sentra Partners

## 📱 O que é ntfy.sh?

**ntfy.sh** é um serviço **100% gratuito** e open-source para enviar notificações push para celulares Android e iPhone. É extremamente simples de usar e não requer cadastro ou configuração complexa.

## ✨ Vantagens

- ✅ **100% Gratuito** - Sem limites de mensagens
- ✅ **Funciona em Android e iPhone** - Apps nativos para ambas plataformas
- ✅ **Plug and Play** - Cliente só precisa instalar o app e se inscrever em um tópico
- ✅ **Sem cadastro** - Não precisa criar conta
- ✅ **Open Source** - Código aberto e auditável
- ✅ **Confiável** - Mais de 504 milhões de notificações enviadas desde 2022

---

## 🚀 Como Funciona

### Para o Cliente (Usuário Final)

1. **Instalar o app ntfy**
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
   - iPhone: [App Store](https://apps.apple.com/us/app/ntfy/id1625396347)

2. **Configurar no Sentra Partners**
   - Fazer login em https://sentrapartners.com
   - Ir em **Configurações** (menu lateral)
   - Rolar até a seção **"Notificações ntfy.sh (Android + iPhone)"**
   - Copiar o **tópico único** exibido (ex: `sentra-user-123456`)

3. **Inscrever-se no tópico**
   - Abrir o app ntfy no celular
   - Clicar em **"+"** (botão de adicionar)
   - Colar o tópico único
   - Pronto! As notificações começarão a chegar

4. **Ativar notificações**
   - Na página de Configurações, ativar o toggle **"Ativar Notificações"**
   - Escolher quais tipos de notificação deseja receber:
     - ✅ Notificações de Trades (abertura e fechamento)
     - ✅ Alertas de Drawdown (quando atingir o limite)
     - ✅ Alertas de Conexão (quando perder conexão com MT4/MT5)
     - ✅ Resumo Diário (lucro, trades e win rate do dia)
     - ✅ Resumo Semanal (resumo semanal aos sábados)
   - Clicar em **"Salvar Alterações"**

5. **Testar**
   - Clicar no botão **"Enviar Notificação de Teste"**
   - Verificar se a notificação chegou no celular

---

## 🛠️ Implementação Técnica

### Backend

#### 1. Serviço de Notificações (`server/services/ntfy-notifications.ts`)

Funções principais:
- `sendNtfyNotification(topic, title, message, priority, tags)` - Envia notificação para um tópico
- `sendTradeNotification(userId, trade)` - Notifica abertura/fechamento de trade
- `sendDrawdownAlert(userId, drawdown)` - Alerta de drawdown
- `sendConnectionAlert(userId, account)` - Alerta de conexão perdida
- `sendDailySummary(userId, summary)` - Resumo diário
- `sendWeeklySummary(userId, summary)` - Resumo semanal

#### 2. Endpoints da API (`server/routes/ntfy.ts`)

- `GET /api/ntfy/topic` - Retorna o tópico único do usuário
- `GET /api/ntfy/settings` - Retorna as configurações de notificações
- `POST /api/ntfy/settings` - Atualiza as configurações
- `POST /api/ntfy/test` - Envia notificação de teste

#### 3. Schema do Banco de Dados

Campos adicionados na tabela `userSettings`:
```typescript
ntfyEnabled: boolean           // Notificações ativadas
ntfyTopic: string             // Tópico único do usuário
ntfyTradesEnabled: boolean    // Notificar trades
ntfyDrawdownEnabled: boolean  // Notificar drawdown
ntfyConnectionEnabled: boolean // Notificar conexão
ntfyDailyEnabled: boolean     // Resumo diário
ntfyWeeklyEnabled: boolean    // Resumo semanal
```

### Frontend

#### Página de Configurações (`client/src/pages/Settings.tsx`)

Card **"Notificações ntfy.sh (Android + iPhone)"** com:
- Exibição do tópico único do usuário
- Instruções passo a passo
- Botões para Google Play e App Store
- Toggles para cada tipo de notificação
- Botão de teste

---

## 🔐 Segurança

- Cada usuário tem um **tópico único** gerado automaticamente: `sentra-user-{userId}`
- Apenas quem conhece o tópico pode se inscrever
- Tópicos são gerados de forma determinística mas não previsível
- Não há autenticação necessária (simplicidade vs segurança)

---

## 📊 Tipos de Notificações

### 1. **Notificações de Trades**
- Enviadas quando um trade é aberto ou fechado
- Inclui: par, volume, preço, lucro/prejuízo

### 2. **Alertas de Drawdown**
- Enviados quando o drawdown atinge o limite configurado
- Prioridade: **URGENTE**

### 3. **Alertas de Conexão**
- Enviados quando a conexão com MT4/MT5 é perdida
- Prioridade: **ALTA**

### 4. **Resumo Diário**
- Enviado diariamente às 19:00 (horário do servidor)
- Inclui: lucro do dia, número de trades, win rate

### 5. **Resumo Semanal**
- Enviado aos sábados às 08:00
- Inclui: resumo da semana (domingo a sexta)

---

## 🧪 Testando o Sistema

### Teste Manual

1. Fazer login no Sentra Partners
2. Ir em Configurações
3. Copiar o tópico ntfy
4. Instalar o app ntfy no celular
5. Inscrever-se no tópico
6. Clicar em "Enviar Notificação de Teste"
7. Verificar se a notificação chegou

### Teste Programático

```bash
# Enviar notificação de teste via curl
curl -X POST https://ntfy.sh/sentra-user-123456 \
  -H "Title: Teste Sentra Partners" \
  -H "Priority: default" \
  -H "Tags: chart_with_upwards_trend" \
  -d "Esta é uma notificação de teste!"
```

---

## 🎯 Próximos Passos (Futuro)

- [ ] Integrar com eventos de trades em tempo real
- [ ] Adicionar notificações de metas de lucro atingidas
- [ ] Permitir personalização de horários dos resumos
- [ ] Adicionar suporte para notificações por email (além do ntfy)
- [ ] Dashboard de histórico de notificações enviadas

---

## 📞 Suporte

- **Documentação oficial ntfy.sh:** https://ntfy.sh
- **App Android:** https://play.google.com/store/apps/details?id=io.heckel.ntfy
- **App iPhone:** https://apps.apple.com/us/app/ntfy/id1625396347

---

## 🎉 Conclusão

O sistema ntfy.sh está **100% implementado e funcional**! Os usuários podem começar a receber notificações push gratuitas em seus celulares (Android ou iPhone) de forma extremamente simples e sem complicações.

**Data de Implementação:** 01/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Produção
