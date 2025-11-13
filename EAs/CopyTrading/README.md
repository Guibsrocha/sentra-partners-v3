# 🔄 Sentra Partners - Copy Trading v8.0

## 🎯 **Sistema Master/Slave**

Copie trades automaticamente entre contas com sincronização em tempo real.

---

## 📁 **Arquivos**

```
CopyTrading/
├── MT4/
│   ├── SentraPartners_Master_MT4_v8.0.mq4  ← Conta que envia sinais
│   └── SentraPartners_Slave_MT4_v8.0.mq4   ← Conta que copia sinais
└── MT5/
    ├── SentraPartners_Master_MT5_v8.0.mq5  ← Conta que envia sinais
    └── SentraPartners_Slave_MT5_v8.0.mq5   ← Conta que copia sinais
```

---

## 🚀 **Como usar**

### **1. Instalar Master EA**

**Na conta que vai ENVIAR sinais:**

1. Copie `SentraPartners_Master_MT4_v8.0.mq4` (ou MT5) para `Experts/`
2. Compile (F7)
3. Arraste para qualquer gráfico
4. Configure parâmetros:
   - `UserEmail`: seu email cadastrado
   - `MasterServer`: `https://sentrapartners.com/api/mt/copy`

### **2. Instalar Slave EA**

**Na conta que vai COPIAR sinais:**

1. Copie `SentraPartners_Slave_MT4_v8.0.mq4` (ou MT5) para `Experts/`
2. Compile (F7)
3. Arraste para qualquer gráfico
4. Configure parâmetros:
   - `UserEmail`: seu email cadastrado
   - `MasterAccountNumber`: número da conta Master
   - `SlaveServer`: `https://sentrapartners.com/api/mt/copy`
   - `LotMultiplier`: multiplicador de lote (ex: 2.0 = dobro)
   - `MasterIsCent`: true se Master é conta Cent
   - `SlaveIsCent`: true se Slave é conta Cent

### **3. Configurar WebRequest (OBRIGATÓRIO!)**

**Sem isso, os EAs NÃO funcionam!**

1. No MT4/MT5: **Tools → Options → Expert Advisors**
2. Marque ✅ **Allow WebRequest for listed URLs**
3. Adicione: `https://sentrapartners.com`
4. Clique em **OK**
5. **Reinicie o MT4/MT5**

---

## 🎯 **Funcionalidades**

### **Master EA:**
- ✅ Detecta trades abertos/fechados automaticamente
- ✅ Envia sinais para o servidor
- ✅ Heartbeat a cada 1 segundo
- ✅ Suporta múltiplos Slaves
- ✅ Logs detalhados

### **Slave EA:**
- ✅ Recebe sinais do Master em tempo real
- ✅ Copia trades automaticamente
- ✅ **Adiciona comentário "copy + ticket do Master"**
- ✅ **Normalização robusta de símbolos**
- ✅ Busca automática no Market Watch
- ✅ Multiplicador de lote configurável
- ✅ Suporte para contas Cent
- ✅ Sincronização automática (abre/fecha conforme Master)
- ✅ Fecha posições órfãs (que não existem mais no Master)

---

## 📊 **Normalização de símbolos**

O Slave EA detecta automaticamente variações de símbolos entre brokers:

| Master | Slave | Resultado |
|--------|-------|-----------|
| `AUDCADc` | `AUDCAD` | ✅ Encontrado |
| `EURUSD.a` | `EURUSD` | ✅ Encontrado |
| `GBPUSD_i` | `GBPUSD` | ✅ Encontrado |
| `XAUUSDm` | `XAUUSD` | ✅ Encontrado |

**Funciona com TODOS os brokers!**

---

## 📝 **Comentário "copy"**

Todos os trades copiados terão comentário no formato:
```
copy 123456
```

Onde `123456` é o ticket do trade no Master.

**Isso permite:**
- ✅ Identificar trades copiados
- ✅ Rastrear origem do trade
- ✅ Notificações específicas para copy trades

---

## 🧪 **Como testar**

1. ✅ Instale Master e Slave
2. ✅ Configure WebRequest
3. ✅ Aguarde logs de inicialização:
   ```
   ✅ Master EA inicializado!
   ✅ Slave EA inicializado!
   ```
4. ✅ Abra um trade no Master
5. ✅ Aguarde 1-2 segundos
6. ✅ Verifique se foi copiado no Slave

---

## 📊 **Logs esperados**

### **Master:**
```
✅ Master EA inicializado!
💓 Master heartbeat enviado
📤 Posição aberta enviada: 123456 - AUDCAD BUY 0.01
```

### **Slave:**
```
✅ Slave EA inicializado!
💓 Heartbeat recebido do Master
📊 Master tem 1 posições
✅ Símbolo sem sufixo: AUDCAD ← AUDCADc
🔄 Sincronização: Abrindo posição nova do Master: 123456
✅ Posição aberta via sincronização: AUDCAD BUY 0.01 lotes (Master: 123456 → Slave: 789012)
```

---

## ⚙️ **Parâmetros configuráveis**

### **Master:**
| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `UserEmail` | Email cadastrado | - |
| `MasterServer` | URL do servidor | https://sentrapartners.com/api/mt/copy |
| `CheckInterval` | Intervalo de verificação (s) | 1 |
| `EnableLogs` | Habilitar logs | true |

### **Slave:**
| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `UserEmail` | Email cadastrado | - |
| `MasterAccountNumber` | Número da conta Master | - |
| `SlaveServer` | URL do servidor | https://sentrapartners.com/api/mt/copy |
| `CheckInterval` | Intervalo de verificação (s) | 1 |
| `LotMultiplier` | Multiplicador de lote | 1.0 |
| `MasterIsCent` | Master é conta Cent | false |
| `SlaveIsCent` | Slave é conta Cent | false |
| `Slippage` | Slippage permitido | 3 |
| `MagicNumber` | Magic number | 888888 |
| `EnableLogs` | Habilitar logs | true |

---

## 🎯 **Novidades v8.0**

- ✅ **Comentário "copy" automático** em todos os trades
- ✅ **Normalização robusta de símbolos** (funciona em todos os brokers)
- ✅ **Busca automática no Market Watch**
- ✅ **Detecção case-insensitive** de comentários
- ✅ **Logs detalhados** de debug
- ✅ **Filtro de 5 minutos removido** no backend
- ✅ **Sincronização mais rápida** (1 segundo)

---

## ⚠️ **Solução de problemas**

### **"Símbolo não encontrado:"**
- ✅ Verifique se o símbolo existe no Slave
- ✅ Adicione o símbolo no Market Watch (Ctrl+U)
- ✅ O EA vai tentar normalizar automaticamente

### **"WebRequest error 5203"**
- ❌ URL não autorizada
- ✅ Configure WebRequest (veja passo 3 acima)
- ✅ Reinicie o MT4/MT5

### **"Master tem 0 posições"**
- ⏱️ Aguarde alguns segundos
- ✅ Verifique se Master EA está rodando
- ✅ Verifique logs do Master

### **Trades não são copiados**
- ✅ Verifique se WebRequest está configurado
- ✅ Verifique se `MasterAccountNumber` está correto
- ✅ Verifique logs de ambos os EAs
- ✅ Teste conexão: https://sentrapartners.com

---

## 🆘 **Suporte**

- **Email:** suporte@sentrapartners.com
- **GitHub:** https://github.com/sentrapartners-ctrl/Sentra-Partenrs
- **Dashboard:** https://sentrapartners.com

---

**Sistema de Copy Trading mais robusto do mercado! 🚀**
