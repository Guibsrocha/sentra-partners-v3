# 📦 Sentra Partners - Expert Advisors v8.0

## 🎯 **Visão Geral**

Coleção completa de Expert Advisors para MetaTrader 4 e 5, incluindo:
- ✅ **Conectores** - Enviam dados de trades para o dashboard
- ✅ **Copy Trading** - Sistema Master/Slave para copiar trades
- ✅ **Lite** - Versão simplificada dos conectores

---

## 📁 **Estrutura**

```
EAs/
├── Conectores/          ← Conectores completos
│   ├── MT4/
│   │   └── SentraPartners_Conector_MT4_v8.0.mq4
│   └── MT5/
│       └── SentraPartners_Conector_MT5_v8.0.mq5
│
├── CopyTrading/         ← Sistema de Copy Trading
│   ├── MT4/
│   │   ├── SentraPartners_Master_MT4_v8.0.mq4
│   │   └── SentraPartners_Slave_MT4_v8.0.mq4
│   └── MT5/
│       ├── SentraPartners_Master_MT5_v8.0.mq5
│       └── SentraPartners_Slave_MT5_v8.0.mq5
│
└── Lite/                ← Conectores simplificados
    ├── MT4/
    │   └── SentraConnectorLite_MT4_v8.0.mq4
    └── MT5/
        └── SentraConnectorLite_MT5_v8.0.mq5
```

---

## 🔧 **1. Conectores**

### **Descrição:**
Enviam dados de trades, saldo, equity e profit para o dashboard Sentra Partners.

### **Funcionalidades:**
- ✅ Envia trades abertos/fechados
- ✅ Atualiza saldo e equity em tempo real
- ✅ Suporta múltiplas contas
- ✅ Notificações via Telegram

### **Como usar:**
1. Copie para `MQL4/Experts/` ou `MQL5/Experts/`
2. Compile (F7)
3. Arraste para qualquer gráfico
4. Configure `UserEmail` e `AccountNumber`

---

## 🔄 **2. Copy Trading**

### **Descrição:**
Sistema Master/Slave para copiar trades automaticamente entre contas.

### **Master EA:**
- ✅ Detecta trades abertos/fechados
- ✅ Envia sinais para o servidor
- ✅ Heartbeat a cada 1 segundo

### **Slave EA:**
- ✅ Recebe sinais do Master
- ✅ Copia trades automaticamente
- ✅ Adiciona comentário "copy + ticket"
- ✅ Normalização robusta de símbolos
- ✅ Multiplicador de lote configurável
- ✅ Suporte para contas Cent

### **Como usar:**

#### **Master:**
1. Instale na conta que envia sinais
2. Configure:
   - `UserEmail`: seu email
   - `MasterServer`: https://sentrapartners.com/api/mt/copy

#### **Slave:**
1. Instale na conta que copia sinais
2. Configure:
   - `UserEmail`: seu email
   - `MasterAccountNumber`: número da conta Master
   - `SlaveServer`: https://sentrapartners.com/api/mt/copy
   - `LotMultiplier`: multiplicador de lote (padrão: 1.0)

#### **WebRequest (IMPORTANTE!):**
1. Tools → Options → Expert Advisors
2. Marque ✅ Allow WebRequest for listed URLs
3. Adicione: `https://sentrapartners.com`
4. Reinicie o MT4/MT5

---

## 📱 **3. Lite**

### **Descrição:**
Versão simplificada dos conectores, focada em enviar notificações de trades.

### **Funcionalidades:**
- ✅ Notificações de trades abertos/fechados
- ✅ Detecção automática de copy trades
- ✅ Integração com Telegram
- ✅ Leve e rápido

### **Como usar:**
1. Copie para `MQL4/Experts/` ou `MQL5/Experts/`
2. Compile (F7)
3. Arraste para qualquer gráfico
4. Configure `UserEmail` e `AccountNumber`

---

## 🎯 **Novidades v8.0**

### **Copy Trading:**
- ✅ Comentário "copy" automático em todos os trades
- ✅ Normalização robusta de símbolos (funciona em todos os brokers)
- ✅ Busca automática no Market Watch
- ✅ Detecção case-insensitive de comentários
- ✅ Logs detalhados de debug

### **Conectores:**
- ✅ Detecção robusta de copy trades
- ✅ Suporte para múltiplos formatos de comentário
- ✅ Notificações agrupadas por provider
- ✅ Buffer de notificações para evitar spam

### **Backend:**
- ✅ Filtro de 5 minutos removido
- ✅ Função `detectCopyTrade()` robusta
- ✅ Suporte para todos os formatos de comentário

---

## 📊 **Formatos de comentário detectados**

| Comentário | Detectado | Provider Name |
|------------|-----------|---------------|
| `copy 123456` | ✅ | `Master #123456` |
| `Copy 123456` | ✅ | `Master #123456` |
| `COPY 123456` | ✅ | `Master #123456` |
| `copy123456` | ✅ | `Master #123456` |
| `copy: 123456` | ✅ | `Master #123456` |
| `Copy: ProviderName` | ✅ | `ProviderName` |
| `copy:ProviderName` | ✅ | `ProviderName` |
| `copy` | ✅ | `Unknown Provider` |

---

## 🔧 **Requisitos**

- ✅ MetaTrader 4 build 1320+ ou MetaTrader 5 build 3200+
- ✅ Conexão com internet
- ✅ WebRequest habilitado para `https://sentrapartners.com`
- ✅ Conta ativa no Sentra Partners

---

## 📝 **Changelog**

### **v8.0 (05/11/2025)**
- ✅ Estrutura organizada por categoria
- ✅ Normalização robusta de símbolos
- ✅ Detecção robusta de copy trades
- ✅ Comentário "copy" automático
- ✅ Logs detalhados de debug
- ✅ Filtro de 5 minutos removido
- ✅ Busca automática no Market Watch
- ✅ Notificações agrupadas

---

## 🆘 **Suporte**

- **Email:** suporte@sentrapartners.com
- **GitHub:** https://github.com/sentrapartners-ctrl/Sentra-Partenrs
- **Dashboard:** https://sentrapartners.com

---

## 📄 **Licença**

© 2025 Sentra Partners. Todos os direitos reservados.
