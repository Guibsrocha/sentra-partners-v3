//+------------------------------------------------------------------+
//|                                      SentraConnectorLite_MT5.mq5  |
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "5.00"
#property description "Conector Lite - Envia notificações de trades abertos/fechados"
#property strict

//====================================================
// PARÂMETROS DE ENTRADA
//====================================================
input string UserEmail = "";                        // ⚠️ SEU EMAIL CADASTRADO
input int HeartbeatInterval = 10;                   // Intervalo de heartbeat (segundos)
input bool EnableLogs = true;                       // Habilitar logs

//====================================================
// ESTRUTURAS
//====================================================
struct PositionSnapshot {
    ulong ticket;
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
PositionSnapshot positionSnapshots[];
int snapshotsCount = 0;
ulong processedOpenPositions[];  // Cache de posições já notificadas (abertura)
ulong processedClosePositions[]; // Cache de posições já notificadas (fechamento)

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit() {
    if(UserEmail == "") {
        Alert("❌ ERRO: Configure seu email no parâmetro UserEmail!");
        return INIT_FAILED;
    }
    
    // Adicionar URLs permitidas para WebRequest
    string url1 = "https://sentrapartners.com";
    if(!TerminalInfoInteger(TERMINAL_CONNECTED)) {
        Print("⚠️ Terminal não conectado à internet");
    }
    
    Print("✅ Conector Lite iniciado - Email: ", UserEmail);
    Print("📡 Endpoint: https://sentrapartners.com/api/mt/trade-event");
    
    // Criar snapshot inicial das posições abertas
    UpdatePositionSnapshots();
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
    Print("❌ Conector Lite finalizado");
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
}

//+------------------------------------------------------------------+
//| Trade Transaction Event                                          |
//+------------------------------------------------------------------+
void OnTradeTransaction(
    const MqlTradeTransaction& trans,
    const MqlTradeRequest& request,
    const MqlTradeResult& result
) {
    // Detectar abertura de posição
    if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
        ulong deal_ticket = trans.deal;
        if(deal_ticket > 0 && HistoryDealSelect(deal_ticket)) {
            ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
            
            // DEAL_ENTRY_IN = Abertura de posição
            if(entry == DEAL_ENTRY_IN) {
                ulong position_ticket = HistoryDealGetInteger(deal_ticket, DEAL_POSITION_ID);
                if(position_ticket > 0 && !IsPositionProcessed(position_ticket, processedOpenPositions)) {
                    if(EnableLogs) Print("🔔 Nova posição detectada: ", position_ticket);
                    Sleep(100); // Aguardar posição estar disponível
                    SendOpenEvent(position_ticket);
                    AddProcessedPosition(position_ticket, processedOpenPositions);
                    UpdatePositionSnapshots();
                }
            }
            // DEAL_ENTRY_OUT = Fechamento de posição
            else if(entry == DEAL_ENTRY_OUT) {
                ulong position_ticket = HistoryDealGetInteger(deal_ticket, DEAL_POSITION_ID);
                if(position_ticket > 0 && !IsPositionProcessed(position_ticket, processedClosePositions)) {
                    if(EnableLogs) Print("🔔 Posição fechada detectada: ", position_ticket);
                    SendCloseEvent(position_ticket, deal_ticket);
                    AddProcessedPosition(position_ticket, processedClosePositions);
                    UpdatePositionSnapshots();
                }
            }
        }
    }
}

//====================================================
// ATUALIZAR SNAPSHOTS DAS POSIÇÕES
//====================================================
void UpdatePositionSnapshots() {
    int total = PositionsTotal();
    ArrayResize(positionSnapshots, total);
    snapshotsCount = 0;
    
    for(int i = 0; i < total; i++) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket)) {
            positionSnapshots[snapshotsCount].ticket = ticket;
            positionSnapshots[snapshotsCount].symbol = PositionGetString(POSITION_SYMBOL);
            positionSnapshots[snapshotsCount].type = (int)PositionGetInteger(POSITION_TYPE);
            positionSnapshots[snapshotsCount].lots = PositionGetDouble(POSITION_VOLUME);
            positionSnapshots[snapshotsCount].open_price = PositionGetDouble(POSITION_PRICE_OPEN);
            positionSnapshots[snapshotsCount].stop_loss = PositionGetDouble(POSITION_SL);
            positionSnapshots[snapshotsCount].take_profit = PositionGetDouble(POSITION_TP);
            positionSnapshots[snapshotsCount].open_time = (datetime)PositionGetInteger(POSITION_TIME);
            positionSnapshots[snapshotsCount].comment = PositionGetString(POSITION_COMMENT);
            snapshotsCount++;
        }
    }
}

//====================================================
// BUSCAR SNAPSHOT DA POSIÇÃO
//====================================================
bool GetPositionSnapshot(ulong ticket, PositionSnapshot &snapshot) {
    for(int i = 0; i < snapshotsCount; i++) {
        if(positionSnapshots[i].ticket == ticket) {
            snapshot = positionSnapshots[i];
            return true;
        }
    }
    return false;
}

//====================================================
// ENVIAR EVENTO DE ABERTURA
//====================================================
void SendOpenEvent(ulong ticket) {
    if(!PositionSelectByTicket(ticket)) return;
    
    string notifData = "{";
    notifData += "\"email\":\"" + UserEmail + "\",";
    notifData += "\"accountNumber\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    notifData += "\"ticket\":" + IntegerToString(ticket) + ",";
    notifData += "\"eventType\":\"opened\",";
    notifData += "\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\",";
    notifData += "\"type\":\"" + (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL") + "\",";
    notifData += "\"volume\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
    notifData += "\"openPrice\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
    notifData += "\"sl\":" + DoubleToString(PositionGetDouble(POSITION_SL), 5) + ",";
    notifData += "\"tp\":" + DoubleToString(PositionGetDouble(POSITION_TP), 5) + ",";
    notifData += "\"openTime\":" + IntegerToString(PositionGetInteger(POSITION_TIME)) + ",";
    notifData += "\"comment\":\"" + PositionGetString(POSITION_COMMENT) + "\"";
    notifData += "}";
    
    SendTradeNotification(notifData);
}

//====================================================
// ENVIAR EVENTO DE FECHAMENTO
//====================================================
void SendCloseEvent(ulong position_ticket, ulong deal_ticket) {
    // Buscar snapshot da posição (antes de fechar)
    PositionSnapshot snapshot;
    bool hasSnapshot = GetPositionSnapshot(position_ticket, snapshot);
    
    // Buscar dados do deal de fechamento
    double profit = 0.0;
    double close_price = 0.0;
    string comment = "";
    string symbol = "";
    string type = "";
    double volume = 0.0;
    
    if(HistoryDealSelect(deal_ticket)) {
        profit = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
        close_price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
        
        // Se temos snapshot, usar dados dele
        if(hasSnapshot) {
            symbol = snapshot.symbol;
            type = (snapshot.type == POSITION_TYPE_BUY ? "BUY" : "SELL");
            volume = snapshot.lots;
            comment = snapshot.comment;
        } else {
            // Tentar buscar do deal
            symbol = HistoryDealGetString(deal_ticket, DEAL_SYMBOL);
            long deal_type = HistoryDealGetInteger(deal_ticket, DEAL_TYPE);
            type = (deal_type == DEAL_TYPE_BUY ? "BUY" : "SELL");
            volume = HistoryDealGetDouble(deal_ticket, DEAL_VOLUME);
            comment = HistoryDealGetString(deal_ticket, DEAL_COMMENT);
        }
    }
    
    // Buscar comment do deal de ENTRADA (DEAL_ENTRY_IN) para copy trades
    if(HistorySelectByPosition(position_ticket)) {
        int total = HistoryDealsTotal();
        for(int i = 0; i < total; i++) {
            ulong dt = HistoryDealGetTicket(i);
            if(dt > 0) {
                ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dt, DEAL_ENTRY);
                if(entry == DEAL_ENTRY_IN) {
                    comment = HistoryDealGetString(dt, DEAL_COMMENT);
                    break;
                }
            }
        }
    }
    
    string notifData = "{";
    notifData += "\"email\":\"" + UserEmail + "\",";
    notifData += "\"accountNumber\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    notifData += "\"ticket\":" + IntegerToString(position_ticket) + ",";
    notifData += "\"eventType\":\"closed\",";
    notifData += "\"symbol\":\"" + symbol + "\",";
    notifData += "\"type\":\"" + type + "\",";
    notifData += "\"volume\":" + DoubleToString(volume, 2) + ",";
    notifData += "\"closePrice\":" + DoubleToString(close_price, 5) + ",";
    notifData += "\"profit\":" + DoubleToString(profit, 2) + ",";
    notifData += "\"closeTime\":" + IntegerToString(TimeCurrent()) + ",";
    notifData += "\"comment\":\"" + comment + "\"";
    notifData += "}";
    
    if(EnableLogs) {
        Print("✅ CLOSE: ticket=", position_ticket, 
              " symbol=", symbol,
              " type=", type,
              " volume=", volume,
              " profit=", profit, 
              " close_price=", close_price,
              " comment=\"", comment, "\"");
    }
    
    SendTradeNotification(notifData);
}

//====================================================
// ENVIAR HEARTBEAT
//====================================================
void SendHeartbeat() {
    int total = PositionsTotal();
    if(EnableLogs) Print("💓 Heartbeat enviado: ", total, " posições");
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
    } else {
        if(EnableLogs) Print("❌ Erro ao enviar notificação (", res, ")");
    }
}

//====================================================
// VERIFICAR SE POSIÇÃO JÁ FOI PROCESSADA
//====================================================
bool IsPositionProcessed(ulong ticket, ulong &cache[]) {
    int size = ArraySize(cache);
    for(int i = 0; i < size; i++) {
        if(cache[i] == ticket) {
            return true;
        }
    }
    return false;
}

//====================================================
// ADICIONAR POSIÇÃO AO CACHE
//====================================================
void AddProcessedPosition(ulong ticket, ulong &cache[]) {
    int size = ArraySize(cache);
    
    // Limitar cache a 1000 posições (evitar crescimento infinito)
    if(size >= 1000) {
        // Remover primeira metade do cache
        ArrayCopy(cache, cache, 0, 500, 500);
        ArrayResize(cache, 500);
        size = 500;
    }
    
    ArrayResize(cache, size + 1);
    cache[size] = ticket;
}
