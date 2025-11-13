//+------------------------------------------------------------------+
//|                                      SentraConnectorLite_MT4.mq4  |
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "4.00"
#property description "Conector Lite - Envia notificações de trades abertos/fechados"
#property strict

//====================================================
// PARÂMETROS DE ENTRADA
//====================================================
input string UserEmail = "";                        // ⚠️ SEU EMAIL CADASTRADO
input int HeartbeatInterval = 10;                   // Intervalo de heartbeat (segundos)
input int CopyTradeMagicNumber = 888888;            // Magic Number do Copy Trade (0 = desabilitado)
input bool EnableLogs = true;                       // Habilitar logs

//====================================================
// ESTRUTURAS
//====================================================
struct OrderSnapshot {
    int ticket;
    string symbol;
    int type;
    double lots;
    double open_price;
    double stop_loss;
    double take_profit;
    datetime open_time;
    string comment;
};

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastHeartbeatTime = 0;
OrderSnapshot orderSnapshots[];
int snapshotsCount = 0;
int lastOrdersTotal = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit() {
    if(UserEmail == "") {
        Alert("❌ ERRO: Configure seu email no parâmetro UserEmail!");
        return INIT_FAILED;
    }
    
    Print("✅ Conector Lite MT4 iniciado - Email: ", UserEmail);
    Print("📡 Endpoint: https://sentrapartners.com/api/mt/trade-event");
    Print("⚠️ IMPORTANTE: Adicione 'https://sentrapartners.com' nas URLs permitidas:");
    Print("   Ferramentas → Opções → Expert Advisors → Permitir WebRequest para URL listada");
    
    // Criar snapshot inicial das ordens abertas
    UpdateOrderSnapshots();
    lastOrdersTotal = OrdersTotal();
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
    Print("❌ Conector Lite MT4 finalizado");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick() {
    // Enviar heartbeat periodicamente
    if(TimeCurrent() - lastHeartbeatTime >= HeartbeatInterval) {
        SendHeartbeat();
        lastHeartbeatTime = TimeCurrent();
    }
    
    // Detectar mudanças nas ordens
    int currentOrdersTotal = OrdersTotal();
    
    // Nova ordem aberta
    if(currentOrdersTotal > lastOrdersTotal) {
        CheckForNewOrders();
    }
    // Ordem fechada
    else if(currentOrdersTotal < lastOrdersTotal) {
        CheckForClosedOrders();
    }
    
    lastOrdersTotal = currentOrdersTotal;
}

//====================================================
// VERIFICAR NOVAS ORDENS
//====================================================
void CheckForNewOrders() {
    bool foundNew = false;
    
    for(int i = 0; i < OrdersTotal(); i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            int ticket = OrderTicket();
            
            // Verificar se já existe no snapshot
            bool exists = false;
            for(int j = 0; j < snapshotsCount; j++) {
                if(orderSnapshots[j].ticket == ticket) {
                    exists = true;
                    break;
                }
            }
            
            // Nova ordem detectada
            if(!exists && (OrderType() == OP_BUY || OrderType() == OP_SELL)) {
                if(EnableLogs) Print("🔔 Nova ordem detectada: ", ticket);
                SendOpenEvent(ticket);
                foundNew = true;
            }
        }
    }
    
    // Atualizar snapshot apenas uma vez no final
    if(foundNew) {
        UpdateOrderSnapshots();
    }
}

//====================================================
// VERIFICAR ORDENS FECHADAS
//====================================================
void CheckForClosedOrders() {
    bool foundClosed = false;
    
    // Verificar quais ordens do snapshot não existem mais
    for(int i = 0; i < snapshotsCount; i++) {
        int ticket = orderSnapshots[i].ticket;
        
        // Verificar se ordem ainda está aberta
        bool stillOpen = false;
        for(int j = 0; j < OrdersTotal(); j++) {
            if(OrderSelect(j, SELECT_BY_POS, MODE_TRADES)) {
                if(OrderTicket() == ticket) {
                    stillOpen = true;
                    break;
                }
            }
        }
        
        // Ordem foi fechada
        if(!stillOpen) {
            if(EnableLogs) Print("🔔 Ordem fechada detectada: ", ticket);
            SendCloseEvent(ticket, orderSnapshots[i]);
            foundClosed = true;
        }
    }
    
    // Atualizar snapshot apenas uma vez no final
    if(foundClosed) {
        UpdateOrderSnapshots();
    }
}

//====================================================
// ATUALIZAR SNAPSHOTS DAS ORDENS
//====================================================
void UpdateOrderSnapshots() {
    int total = OrdersTotal();
    ArrayResize(orderSnapshots, total);
    snapshotsCount = 0;
    
    for(int i = 0; i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            // Apenas ordens de mercado (BUY/SELL)
            if(OrderType() == OP_BUY || OrderType() == OP_SELL) {
                orderSnapshots[snapshotsCount].ticket = OrderTicket();
                orderSnapshots[snapshotsCount].symbol = OrderSymbol();
                orderSnapshots[snapshotsCount].type = OrderType();
                orderSnapshots[snapshotsCount].lots = OrderLots();
                orderSnapshots[snapshotsCount].open_price = OrderOpenPrice();
                orderSnapshots[snapshotsCount].stop_loss = OrderStopLoss();
                orderSnapshots[snapshotsCount].take_profit = OrderTakeProfit();
                orderSnapshots[snapshotsCount].open_time = OrderOpenTime();
                orderSnapshots[snapshotsCount].comment = OrderComment();
                snapshotsCount++;
            }
        }
    }
}

//====================================================
// ENVIAR EVENTO DE ABERTURA
//====================================================
void SendOpenEvent(int ticket) {
    if(!OrderSelect(ticket, SELECT_BY_TICKET, MODE_TRADES)) return;
    
    // Detectar copy trade
    bool isCopyTrade = false;
    string sourceTicket = "";
    
    if(CopyTradeMagicNumber > 0 && OrderMagicNumber() == CopyTradeMagicNumber) {
        isCopyTrade = true;
        sourceTicket = OrderComment();  // Ticket do Master está no comentário
    }
    
    string notifData = "{";
    notifData += "\"email\":\"" + UserEmail + "\",";
    notifData += "\"accountNumber\":\"" + IntegerToString(AccountNumber()) + "\",";
    notifData += "\"ticket\":" + IntegerToString(ticket) + ",";
    notifData += "\"eventType\":\"opened\",";
    notifData += "\"symbol\":\"" + OrderSymbol() + "\",";
    notifData += "\"type\":\"" + (OrderType() == OP_BUY ? "BUY" : "SELL") + "\",";
    notifData += "\"volume\":" + DoubleToString(OrderLots(), 2) + ",";
    notifData += "\"openPrice\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
    notifData += "\"sl\":" + DoubleToString(OrderStopLoss(), 5) + ",";
    notifData += "\"tp\":" + DoubleToString(OrderTakeProfit(), 5) + ",";
    notifData += "\"openTime\":" + IntegerToString(OrderOpenTime()) + ",";
    notifData += "\"comment\":\"" + OrderComment() + "\",";
    notifData += "\"isCopyTrade\":" + (isCopyTrade ? "true" : "false");
    if(isCopyTrade && sourceTicket != "") {
        notifData += ",\"sourceTicket\":\"" + sourceTicket + "\"";
    }
    notifData += "}";
    
    if(EnableLogs && isCopyTrade) {
        Print("✅ OPEN (COPY TRADE): ticket=", ticket, " source=", sourceTicket);
    }
    
    SendTradeNotification(notifData);
}

//====================================================
// ENVIAR EVENTO DE FECHAMENTO
//====================================================
void SendCloseEvent(int ticket, OrderSnapshot &snapshot) {
    // Buscar ordem no histórico
    double profit = 0.0;
    double close_price = 0.0;
    datetime close_time = TimeCurrent();
    
    // Selecionar do histórico
    if(OrderSelect(ticket, SELECT_BY_TICKET, MODE_HISTORY)) {
        profit = OrderProfit() + OrderSwap() + OrderCommission();
        close_price = OrderClosePrice();
        close_time = OrderCloseTime();
    }
    
    string notifData = "{";
    notifData += "\"email\":\"" + UserEmail + "\",";
    notifData += "\"accountNumber\":\"" + IntegerToString(AccountNumber()) + "\",";
    notifData += "\"ticket\":" + IntegerToString(ticket) + ",";
    notifData += "\"eventType\":\"closed\",";
    notifData += "\"symbol\":\"" + snapshot.symbol + "\",";
    notifData += "\"type\":\"" + (snapshot.type == OP_BUY ? "BUY" : "SELL") + "\",";
    notifData += "\"volume\":" + DoubleToString(snapshot.lots, 2) + ",";
    notifData += "\"closePrice\":" + DoubleToString(close_price, 5) + ",";
    notifData += "\"profit\":" + DoubleToString(profit, 2) + ",";
    notifData += "\"closeTime\":" + IntegerToString(close_time) + ",";
    notifData += "\"comment\":\"" + snapshot.comment + "\"";
    notifData += "}";
    
    if(EnableLogs) {
        Print("✅ CLOSE: ticket=", ticket, 
              " symbol=", snapshot.symbol,
              " type=", (snapshot.type == OP_BUY ? "BUY" : "SELL"),
              " volume=", snapshot.lots,
              " profit=", profit, 
              " close_price=", close_price,
              " comment=\"", snapshot.comment, "\"");
    }
    
    SendTradeNotification(notifData);
}

//====================================================
// ENVIAR HEARTBEAT
//====================================================
void SendHeartbeat() {
    int total = OrdersTotal();
    if(EnableLogs) Print("💓 Heartbeat: ", total, " ordens abertas");
}

//====================================================
// ENVIAR NOTIFICAÇÃO DE TRADE
//====================================================
void SendTradeNotification(string data) {
    string url = "https://sentrapartners.com/api/mt/trade-event";
    string headers = "Content-Type: application/json\r\n";
    
    char post[], result[];
    ArrayResize(post, StringToCharArray(data, post, 0, WHOLE_ARRAY, CP_UTF8) - 1);
    
    string resultHeaders;
    int timeout = 5000;
    int res = WebRequest("POST", url, headers, timeout, post, result, resultHeaders);
    
    if(res == 200) {
        if(EnableLogs) Print("✅ Notificação de trade enviada");
    } else if(res == -1) {
        if(EnableLogs) Print("❌ Erro: URL não permitida. Adicione 'https://sentrapartners.com' nas URLs permitidas!");
    } else {
        if(EnableLogs) Print("❌ Erro ao enviar notificação (código ", res, ")");
    }
}
