//+------------------------------------------------------------------+
//|                                      SentraPartners_Slave_MT5.mq5 |
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "4.00"

//====================================================
// SISTEMA DE LICENCIAMENTO
//====================================================
#define LICENSE_EXPIRY_DATE D'2025.12.31'
#define ALLOWED_ACCOUNTS ""

//====================================================
// PARÂMETROS
//====================================================
input string UserEmail = "";                    // Email da conta Slave
input string MasterAccountNumber = "";          // Número da conta Master
input string SlaveServer = "https://sentrapartners.com/api/mt/copy";
input int CheckInterval = 1;                    // Intervalo de verificação (segundos)
input int HeartbeatInterval = 30;               // Intervalo de heartbeat (segundos)
input double LotMultiplier = 1.0;               // Multiplicador de lote
input bool MasterIsCent = false;                // Master é conta Cent?
input bool SlaveIsCent = false;                 // Slave é conta Cent?
input int Slippage = 3;                         // Slippage
input int MagicNumber = 888888;                 // Magic Number
input bool EnableLogs = true;                   // Logs

//====================================================
// ESTRUTURAS
//====================================================
struct MasterPosition {
    string ticket;
    string symbol;
    int type;
    double lots;
    double open_price;
    double stop_loss;
    double take_profit;
    datetime open_time;
};

struct SlavePosition {
    ulong ticket;
    string master_ticket;
    string symbol;
};

struct CopySettings {
    // Gestão de Lote
    string lotMode;              // 'exact', 'multiplier', 'fixed', 'risk_percent'
    double lotMultiplier;
    double lotFixed;
    double lotRiskPercent;
    
    // Stop Loss
    string slMode;               // 'copy', 'custom', 'none'
    int slPips;
    
    // Take Profit
    string tpMode;               // 'copy', 'custom', 'none'
    int tpPips;
    
    // Filtros
    string allowedSymbols;
    string blockedSymbols;
    string tradingStartTime;
    string tradingEndTime;
    
    // Gestão de Risco
    int maxTrades;
    double maxRiskPerTrade;
    double maxDailyLoss;
    bool invertSignals;
    
    bool isActive;
};

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastCheckTime = 0;
datetime lastHeartbeatTime = 0;
datetime lastMasterHeartbeat = 0;
SlavePosition slavePositions[];
int slavePositionsCount = 0;
MasterPosition masterPositions[];
int masterPositionsCount = 0;

// Configurações do servidor
CopySettings serverSettings;
bool settingsLoaded = false;
double dailyLoss = 0;
int dailyTradesCount = 0;
datetime lastDayReset = 0;

#include <Trade\Trade.mqh>
CTrade trade;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Slave MT5 v4.0");
    Print("===========================================");
    Print("Slave Email: ", UserEmail);
    Print("Master Account: ", MasterAccountNumber);
    Print("Servidor: ", SlaveServer);
    Print("Check Interval: ", CheckInterval, "s");
    Print("Heartbeat Interval: ", HeartbeatInterval, "s");
    Print("Lot Multiplier: ", LotMultiplier);
    Print("Master Tipo: ", MasterIsCent ? "CENT" : "STANDARD");
    Print("Slave Tipo: ", SlaveIsCent ? "CENT" : "STANDARD");
    Print("===========================================");
    
    if(!ValidateLicense()) {
        Alert("❌ LICENÇA INVÁLIDA!");
        return(INIT_FAILED);
    }
    
    if(UserEmail == "" || MasterAccountNumber == "") {
        Alert("❌ Configure UserEmail e MasterAccountNumber!");
        return(INIT_FAILED);
    }
    
    trade.SetDeviationInPoints(Slippage);
    trade.SetExpertMagicNumber(MagicNumber);
    
    // Carregar configurações do servidor
    Print("🔄 Carregando configurações do servidor...");
    if(LoadServerSettings()) {
        Print("✅ Configurações carregadas com sucesso!");
        PrintSettings();
    } else {
        Print("⚠️ Usando configurações padrão (servidor não respondeu)");
    }
    
    // Auto-registrar relação Master/Slave
    Print("🔄 Registrando relação Master/Slave...");
    if(AutoRegisterRelation()) {
        Print("✅ Relação registrada com sucesso!");
    } else {
        Print("⚠️ Falha ao registrar relação (continuará funcionando)");
    }
    
    EventSetTimer(1);  // Timer de 1 segundo
    
    Print("✅ Slave EA inicializado!");
    Print("Aguardando sinais do Master...");
    return(INIT_SUCCEEDED);
}

//====================================================
// TIMER
//====================================================
void OnTimer() {
    datetime now = TimeCurrent();
    
    // Verificar sinais do Master
    if(now - lastCheckTime >= CheckInterval) {
        CheckMasterSignals();
        lastCheckTime = now;
    }
    
    // Enviar heartbeat do Slave
    if(now - lastHeartbeatTime >= HeartbeatInterval) {
        SendSlaveHeartbeat();
        lastHeartbeatTime = now;
    }
    
    // Verificar se Master está vivo
    if(lastMasterHeartbeat > 0 && now - lastMasterHeartbeat > 60) {
        if(EnableLogs) Print("⚠️ Master sem heartbeat há ", (now - lastMasterHeartbeat), "s");
    }
}

//====================================================
// VERIFICAR SINAIS DO MASTER
//====================================================
void CheckMasterSignals() {
    string url = SlaveServer + "/slave-signals?master_account_id=" + MasterAccountNumber;
    if(UserEmail != "") {
        url += "&slave_email=" + UserEmail;
    }
    
    char post[];
    char result[];
    string headers = "Content-Type: application/json\r\n";
    string resultHeaders;
    
    int res = WebRequest(
        "GET",
        url,
        headers,
        5000,
        post,
        result,
        resultHeaders
    );
    
    if(res == -1) {
        if(EnableLogs) Print("❌ Erro WebRequest: ", GetLastError());
        return;
    }
    
    if(res != 200) {
        if(EnableLogs) Print("❌ HTTP Error: ", res);
        return;
    }
    
    string response = CharArrayToString(result);
    
    if(StringFind(response, "\"success\":true") < 0) {
        return;
    }
    
    // Atualizar timestamp do último heartbeat do Master
    lastMasterHeartbeat = TimeCurrent();
    
    // Processar resposta
    ProcessMasterSignals(response);
}

//====================================================
// PROCESSAR SINAIS DO MASTER
//====================================================
void ProcessMasterSignals(string json) {
    // Extrair action
    string action = ExtractValue(json, "action");
    
    if(action == "open") {
        ProcessOpenEvent(json);
    }
    else if(action == "close") {
        ProcessCloseEvent(json);
    }
    else if(action == "modify") {
        ProcessModifyEvent(json);
    }
    else if(action == "heartbeat") {
        ProcessHeartbeat(json);
    }
    else {
        // Formato antigo (compatibilidade)
        ProcessLegacyFormat(json);
    }
}

//====================================================
// PROCESSAR EVENTO DE ABERTURA
//====================================================
void ProcessOpenEvent(string json) {
    // DEBUG: Ver o JSON completo
    if(EnableLogs) Print("🔍 DEBUG ProcessOpenEvent - JSON recebido: ", json);
    
    string masterTicket = ExtractValue(json, "ticket");
    string symbol = ExtractValue(json, "symbol");
    
    // DEBUG: Ver o que foi extraído
    if(EnableLogs) Print("🔍 DEBUG - Ticket extraído: '", masterTicket, "'");
    if(EnableLogs) Print("🔍 DEBUG - Symbol extraído: '", symbol, "'");
    int type = (int)StringToInteger(ExtractValue(json, "type"));
    double lots = StringToDouble(ExtractValue(json, "lots"));
    double openPrice = StringToDouble(ExtractValue(json, "open_price"));
    double sl = StringToDouble(ExtractValue(json, "stop_loss"));
    double tp = StringToDouble(ExtractValue(json, "take_profit"));
    
    // Verificar se já copiou
    if(FindSlavePosition(masterTicket) >= 0) {
        if(EnableLogs) Print("⚠️ Trade já copiado: ", masterTicket);
        return;
    }
    
    // Validar trade (filtros e limites)
    if(!ValidateTrade(symbol, type)) {
        Print("❌ Trade bloqueado por filtros: ", symbol, " ", (type == 0 ? "BUY" : "SELL"));
        return;
    }
    
    // Normalizar símbolo (remover/adicionar sufixos)
    string slaveSymbol = NormalizeSymbol(symbol);
    if(slaveSymbol == "") {
        Print("❌ Símbolo não encontrado no Slave: ", symbol);
        return;
    }
    
    // Ajustar lote para conta Cent/Standard
    lots = AdjustLotForAccountType(lots);
    
    // Aplicar gestão de lote do servidor
    if(settingsLoaded) {
        if(serverSettings.lotMode == "multiplier") {
            lots = lots * serverSettings.lotMultiplier;
            if(EnableLogs) Print("🔄 Lot Multiplier: ", serverSettings.lotMultiplier, " -> ", lots);
        }
        else if(serverSettings.lotMode == "fixed") {
            lots = serverSettings.lotFixed;
            if(EnableLogs) Print("🔄 Lot Fixed: ", lots);
        }
        else if(serverSettings.lotMode == "risk_percent") {
            // TODO: Calcular lote baseado em % do saldo
            lots = serverSettings.lotFixed;
            if(EnableLogs) Print("🔄 Lot Risk %: ", serverSettings.lotRiskPercent, " -> ", lots);
        }
        // "exact" mantém o lote original
    } else {
        // Fallback para input manual
        lots = lots * LotMultiplier;
    }
    
    lots = NormalizeLot(slaveSymbol, lots);
    
    // Aplicar configurações de SL/TP
    if(settingsLoaded) {
        if(serverSettings.slMode == "custom" && serverSettings.slPips > 0) {
            // TODO: Calcular SL baseado em pips
            if(EnableLogs) Print("🔄 SL Custom: ", serverSettings.slPips, " pips");
        }
        else if(serverSettings.slMode == "none") {
            sl = 0;
            if(EnableLogs) Print("🔄 SL: None");
        }
        // "copy" mantém o SL original
        
        if(serverSettings.tpMode == "custom" && serverSettings.tpPips > 0) {
            // TODO: Calcular TP baseado em pips
            if(EnableLogs) Print("🔄 TP Custom: ", serverSettings.tpPips, " pips");
        }
        else if(serverSettings.tpMode == "none") {
            tp = 0;
            if(EnableLogs) Print("🔄 TP: None");
        }
        // "copy" mantém o TP original
    }
    
    // Inverter sinais se configurado
    if(settingsLoaded && serverSettings.invertSignals) {
        type = (type == 0) ? 1 : 0;
        if(EnableLogs) Print("🔄 Signal Inverted: ", (type == 0 ? "BUY" : "SELL"));
    }
    
    // Abrir ordem
    bool success = false;
    ulong slaveTicket = 0;
    
    if(type == 0) {  // BUY
        success = trade.Buy(lots, slaveSymbol, 0, sl, tp, "copy " + masterTicket);
        slaveTicket = trade.ResultOrder();
    } else {  // SELL
        success = trade.Sell(lots, slaveSymbol, 0, sl, tp, "copy " + masterTicket);
        slaveTicket = trade.ResultOrder();
    }
    
    if(success) {
        AddSlavePosition(slaveTicket, masterTicket, slaveSymbol);
        
        // TODO: Atualizar estatísticas diárias
        
        Print("✅ OPEN copiado: ", symbol, " ", (type == 0 ? "BUY" : "SELL"), " ", lots, " lotes (Master: ", masterTicket, " → Slave: ", slaveTicket, ")");
    } else {
        Print("❌ Erro ao copiar OPEN: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
    }
}

//====================================================
// PROCESSAR EVENTO DE FECHAMENTO
//====================================================
void ProcessCloseEvent(string json) {
    string masterTicket = ExtractValue(json, "ticket");
    
    int index = FindSlavePosition(masterTicket);
    if(index < 0) {
        if(EnableLogs) Print("⚠️ Trade não encontrado para fechar: ", masterTicket);
        return;
    }
    
    ulong slaveTicket = slavePositions[index].ticket;
    
    // Fechar posição
    if(PositionSelectByTicket(slaveTicket)) {
        bool success = trade.PositionClose(slaveTicket);
        
        if(success) {
            Print("✅ CLOSE executado: Slave ticket ", slaveTicket, " (Master: ", masterTicket, ")");
            RemoveSlavePosition(index);
        } else {
            Print("❌ Erro ao fechar: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
        }
    } else {
        // Posição já não existe, remover do registro
        RemoveSlavePosition(index);
    }
}

//====================================================
// PROCESSAR EVENTO DE MODIFICAÇÃO
//====================================================
void ProcessModifyEvent(string json) {
    string masterTicket = ExtractValue(json, "ticket");
    double sl = StringToDouble(ExtractValue(json, "stop_loss"));
    double tp = StringToDouble(ExtractValue(json, "take_profit"));
    
    int index = FindSlavePosition(masterTicket);
    if(index < 0) {
        if(EnableLogs) Print("⚠️ Trade não encontrado para modificar: ", masterTicket);
        return;
    }
    
    ulong slaveTicket = slavePositions[index].ticket;
    
    if(PositionSelectByTicket(slaveTicket)) {
        bool success = trade.PositionModify(slaveTicket, sl, tp);
        
        if(success) {
            Print("✅ MODIFY executado: Slave ticket ", slaveTicket, " SL:", sl, " TP:", tp);
        } else {
            Print("❌ Erro ao modificar: ", trade.ResultRetcode());
        }
    }
}

//====================================================
// PROCESSAR HEARTBEAT (SINCRONIZAÇÃO)
//====================================================
void ProcessHeartbeat(string json) {
    if(EnableLogs) Print("💓 Heartbeat recebido do Master");
    
    // Extrair array de posições
    int posStart = StringFind(json, "\"positions\":[");
    if(posStart < 0) {
        // Master não tem posições abertas, fechar todas do Slave
        CloseAllSlavePositions();
        return;
    }
    
    int posEnd = StringFind(json, "]", posStart);
    string positionsStr = StringSubstr(json, posStart + 13, posEnd - posStart - 13);
    
    if(positionsStr == "" || positionsStr == " ") {
        // Master não tem posições, fechar todas
        CloseAllSlavePositions();
        return;
    }
    
    // Parse posições do Master
    ParseMasterPositions(positionsStr);
    
    // Sincronizar: fechar posições que não existem mais no Master
    SyncPositions();
}

//====================================================
// PARSE POSIÇÕES DO MASTER
//====================================================
void ParseMasterPositions(string positionsStr) {
    masterPositionsCount = 0;
    ArrayResize(masterPositions, 0);
    
    string items[];
    int count = SplitString(positionsStr, "},{", items);
    
    for(int i = 0; i < count; i++) {
        string item = items[i];
        StringReplace(item, "{", "");
        StringReplace(item, "}", "");
        
        ArrayResize(masterPositions, masterPositionsCount + 1);
        
        masterPositions[masterPositionsCount].ticket = ExtractValue(item, "ticket");
        masterPositions[masterPositionsCount].symbol = ExtractValue(item, "symbol");
        masterPositions[masterPositionsCount].type = (int)StringToInteger(ExtractValue(item, "type"));
        masterPositions[masterPositionsCount].lots = StringToDouble(ExtractValue(item, "lots"));
        masterPositions[masterPositionsCount].stop_loss = StringToDouble(ExtractValue(item, "stop_loss"));
        masterPositions[masterPositionsCount].take_profit = StringToDouble(ExtractValue(item, "take_profit"));
        
        masterPositionsCount++;
    }
    
    if(EnableLogs) Print("📊 Master tem ", masterPositionsCount, " posições");
}

//====================================================
// SINCRONIZAR POSIÇÕES
//====================================================
void SyncPositions() {
    // 1. Fechar posições do Slave que não existem mais no Master
    for(int i = slavePositionsCount - 1; i >= 0; i--) {
        bool found = false;
        
        for(int j = 0; j < masterPositionsCount; j++) {
            if(slavePositions[i].master_ticket == masterPositions[j].ticket) {
                found = true;
                break;
            }
        }
        
        if(!found) {
            // Posição não existe mais no Master, fechar
            ulong slaveTicket = slavePositions[i].ticket;
            
            if(PositionSelectByTicket(slaveTicket)) {
                trade.PositionClose(slaveTicket);
                Print("🔄 Sincronização: Fechando posição órfã ", slaveTicket);
            }
            
            RemoveSlavePosition(i);
        }
    }
    
    // 2. Abrir posições do Master que não existem no Slave
    for(int j = 0; j < masterPositionsCount; j++) {
        bool exists = false;
        
        // Verificar se já existe no Slave
        for(int i = 0; i < slavePositionsCount; i++) {
            if(slavePositions[i].master_ticket == masterPositions[j].ticket) {
                exists = true;
                break;
            }
        }
        
        if(!exists) {
            // Posição não existe no Slave, abrir
            if(EnableLogs) Print("🔄 Sincronização: Abrindo posição nova do Master: ", masterPositions[j].ticket);
            
            // Normalizar símbolo
            string slaveSymbol = NormalizeSymbol(masterPositions[j].symbol);
            if(slaveSymbol == "") {
                Print("❌ Símbolo não encontrado no Slave: ", masterPositions[j].symbol);
                continue;
            }
            
            // Validar trade
            if(!ValidateTrade(slaveSymbol, masterPositions[j].type)) {
                Print("❌ Trade bloqueado por filtros: ", slaveSymbol);
                continue;
            }
            
            // Ajustar lote
            double lots = AdjustLotForAccountType(masterPositions[j].lots);
            lots = NormalizeLot(slaveSymbol, lots);
            if(lots < SymbolInfoDouble(slaveSymbol, SYMBOL_VOLUME_MIN)) {
                Print("❌ Lote muito pequeno: ", lots);
                continue;
            }
            
            // Abrir posição
            bool success = false;
            if(masterPositions[j].type == 0) {
                success = trade.Buy(lots, slaveSymbol, 0, masterPositions[j].stop_loss, masterPositions[j].take_profit, "copy " + masterPositions[j].ticket);
            } else {
                success = trade.Sell(lots, slaveSymbol, 0, masterPositions[j].stop_loss, masterPositions[j].take_profit, "copy " + masterPositions[j].ticket);
            }
            
            if(success) {
                ulong slaveTicket = trade.ResultOrder();
                AddSlavePosition(slaveTicket, masterPositions[j].ticket, slaveSymbol);
                Print("✅ Posição aberta via sincronização: ", slaveSymbol, " ", (masterPositions[j].type == 0 ? "BUY" : "SELL"), " ", lots, " lotes (Master: ", masterPositions[j].ticket, " → Slave: ", slaveTicket, ")");
            } else {
                Print("❌ Erro ao abrir posição via sincronização: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
            }
        }
    }
}

//====================================================
// ENVIAR HEARTBEAT DO SLAVE
//====================================================
void SendSlaveHeartbeat() {
    string data = "{";
    data += "\"slave_email\":\"" + UserEmail + "\",";
    data += "\"master_account_id\":\"" + MasterAccountNumber + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
    data += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    data += "\"positions_count\":" + IntegerToString(slavePositionsCount) + ",";
    data += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    data += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2);
    data += "}";
    
    string url = SlaveServer + "/slave-heartbeat";
    string headers = "Content-Type: application/json\r\n";
    
    char post[], result[];
    ArrayResize(post, StringToCharArray(data, post, 0, WHOLE_ARRAY, CP_UTF8) - 1);
    
    string resultHeaders;
    int res = WebRequest("POST", url, headers, 5000, post, result, resultHeaders);
    
    if(res == 200) {
        if(EnableLogs) Print("💓 Slave heartbeat enviado");
    }
}

//====================================================
// PROCESSAR FORMATO LEGADO (COMPATIBILIDADE)
//====================================================
void ProcessLegacyFormat(string json) {
    int posStart = StringFind(json, "\"positions\":[");
    if(posStart < 0) return;
    
    int posEnd = StringFind(json, "]", posStart);
    string positions = StringSubstr(json, posStart + 13, posEnd - posStart - 13);
    
    if(positions == "") return;
    
    string items[];
    int count = SplitString(positions, "},{", items);
    
    for(int i = 0; i < count; i++) {
        string item = items[i];
        StringReplace(item, "{", "");
        StringReplace(item, "}", "");
        
        ProcessOpenEvent(item);
    }
}

//====================================================
// FUNÇÕES AUXILIARES - POSIÇÕES
//====================================================
int FindSlavePosition(string masterTicket) {
    for(int i = 0; i < slavePositionsCount; i++) {
        if(slavePositions[i].master_ticket == masterTicket) {
            return i;
        }
    }
    return -1;
}

void AddSlavePosition(ulong ticket, string masterTicket, string symbol) {
    ArrayResize(slavePositions, slavePositionsCount + 1);
    slavePositions[slavePositionsCount].ticket = ticket;
    slavePositions[slavePositionsCount].master_ticket = masterTicket;
    slavePositions[slavePositionsCount].symbol = symbol;
    slavePositionsCount++;
}

void RemoveSlavePosition(int index) {
    for(int i = index; i < slavePositionsCount - 1; i++) {
        slavePositions[i] = slavePositions[i + 1];
    }
    slavePositionsCount--;
    ArrayResize(slavePositions, slavePositionsCount);
}

void CloseAllSlavePositions() {
    for(int i = slavePositionsCount - 1; i >= 0; i--) {
        ulong ticket = slavePositions[i].ticket;
        
        if(PositionSelectByTicket(ticket)) {
            trade.PositionClose(ticket);
            Print("🔄 Fechando posição (Master sem posições): ", ticket);
        }
        
        RemoveSlavePosition(i);
    }
}

//====================================================
// FUNÇÕES AUXILIARES - LOTE
//====================================================

// Ajustar lote baseado no tipo de conta (Cent/Standard)
double AdjustLotForAccountType(double lots) {
    // Se Master é Cent e Slave é Standard: dividir por 100
    if(MasterIsCent && !SlaveIsCent) {
        lots = lots / 100.0;
        if(EnableLogs) Print("🔄 Ajuste Cent→Standard: ", lots);
    }
    // Se Master é Standard e Slave é Cent: multiplicar por 100
    else if(!MasterIsCent && SlaveIsCent) {
        lots = lots * 100.0;
        if(EnableLogs) Print("🔄 Ajuste Standard→Cent: ", lots);
    }
    
    return lots;
}

// Normalizar símbolo (buscar no Slave o símbolo correspondente)
string NormalizeSymbol(string masterSymbol) {
    // 1. Tentar símbolo exato primeiro
    // IMPORTANTE: Adicionar ao Market Watch antes de verificar
    SymbolSelect(masterSymbol, true);
    if(SymbolInfoInteger(masterSymbol, SYMBOL_SELECT)) {
        if(EnableLogs) Print("✅ Símbolo encontrado (exato): ", masterSymbol);
        return masterSymbol;
    }
    
    // 2. Remover sufixos comuns do final do símbolo
    string baseSymbol = RemoveSuffix(masterSymbol);
    if(baseSymbol != masterSymbol) {
        // Tentar símbolo sem sufixo
        SymbolSelect(baseSymbol, true);
        if(SymbolInfoInteger(baseSymbol, SYMBOL_SELECT)) {
            if(EnableLogs) Print("✅ Símbolo encontrado (sem sufixo): ", baseSymbol, " <- ", masterSymbol);
            return baseSymbol;
        }
    }
    
    // 3. Tentar adicionar sufixos comuns ao símbolo base
    string suffixes[] = {"c", "m", ".a", ".b", "_i", "pro", "ecn", ".raw", ".lp"};
    for(int i = 0; i < ArraySize(suffixes); i++) {
        string testSymbol = baseSymbol + suffixes[i];
        SymbolSelect(testSymbol, true);
        if(SymbolInfoInteger(testSymbol, SYMBOL_SELECT)) {
            if(EnableLogs) Print("✅ Símbolo encontrado (com sufixo): ", testSymbol, " <- ", masterSymbol);
            return testSymbol;
        }
    }
    
    // 4. Listar símbolos similares disponíveis para diagnóstico
    Print("❌ Símbolo não encontrado: ", masterSymbol, " (base testada: ", baseSymbol, ")");
    Print("🔍 Procurando símbolos similares...");
    
    int totalSymbols = SymbolsTotal(false);
    int foundSimilar = 0;
    
    for(int i = 0; i < totalSymbols && foundSimilar < 10; i++) {
        string symbolName = SymbolName(i, false);
        // Procurar símbolos que contenham a base
        if(StringFind(symbolName, baseSymbol) >= 0) {
            Print("   📊 Similar encontrado: ", symbolName);
            foundSimilar++;
        }
    }
    
    if(foundSimilar == 0) {
        Print("   ⚠️ Nenhum símbolo similar encontrado. Listando primeiros 20 símbolos:");
        for(int i = 0; i < MathMin(20, totalSymbols); i++) {
            Print("   📊 ", SymbolName(i, false));
        }
    }
    
    return "";
}

// Função auxiliar para remover sufixos conhecidos do final do símbolo
string RemoveSuffix(string symbol) {
    string suffixes[] = {"c", "m", ".a", ".b", "_i", "pro", "ecn", ".raw", ".lp"};
    
    for(int i = 0; i < ArraySize(suffixes); i++) {
        int suffixLen = StringLen(suffixes[i]);
        int symbolLen = StringLen(symbol);
        
        // Verificar se o símbolo termina com este sufixo
        if(symbolLen > suffixLen) {
            string ending = StringSubstr(symbol, symbolLen - suffixLen, suffixLen);
            if(ending == suffixes[i]) {
                // Remover o sufixo
                return StringSubstr(symbol, 0, symbolLen - suffixLen);
            }
        }
    }
    
    return symbol; // Retorna inalterado se não encontrar sufixo
}

double NormalizeLot(string symbol, double lots) {
    double minLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
    double stepLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
    
    if(lots < minLot) lots = minLot;
    if(lots > maxLot) lots = maxLot;
    
    lots = MathFloor(lots / stepLot) * stepLot;
    lots = NormalizeDouble(lots, 2);
    
    return lots;
}

//====================================================
// FUNÇÕES AUXILIARES - STRING
//====================================================
string ExtractValue(string json, string key) {
    int start = StringFind(json, "\"" + key + "\":");
    if(start < 0) return "";
    
    start = StringFind(json, ":", start) + 1;
    
    // Pular espaços
    while(start < StringLen(json) && StringGetCharacter(json, start) == ' ') start++;
    
    // Verificar se o valor está entre aspas
    bool isString = (StringGetCharacter(json, start) == '\"');
    if(isString) start++; // Pular aspas de abertura
    
    int end = start;
    
    if(isString) {
        // Procurar aspas de fechamento
        while(end < StringLen(json) && StringGetCharacter(json, end) != '\"') {
            end++;
        }
    } else {
        // Procurar vírgula ou fecha chave
        while(end < StringLen(json)) {
            ushort ch = StringGetCharacter(json, end);
            if(ch == ',' || ch == '}' || ch == ' ') break;
            end++;
        }
    }
    
    string value = StringSubstr(json, start, end - start);
    StringTrimLeft(value);
    StringTrimRight(value);
    return value;
}

int SplitString(string str, string sep, string &result[]) {
    int count = 0;
    int pos = 0;
    int nextPos;
    
    while((nextPos = StringFind(str, sep, pos)) >= 0) {
        ArrayResize(result, count + 1);
        result[count] = StringSubstr(str, pos, nextPos - pos);
        count++;
        pos = nextPos + StringLen(sep);
    }
    
    if(pos < StringLen(str)) {
        ArrayResize(result, count + 1);
        result[count] = StringSubstr(str, pos);
        count++;
    }
    
    return count;
}

//====================================================
// AUTO-REGISTRAR RELAÇÃO MASTER/SLAVE
//====================================================
bool AutoRegisterRelation() {
    string url = SlaveServer + "/auto-register";
    
    string json = "{";
    json += "\"user_email\":\"" + UserEmail + "\",";
    json += "\"master_account_number\":\"" + MasterAccountNumber + "\",";
    json += "\"slave_account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\"";
    json += "}";
    
    char data[];
    StringToCharArray(json, data, 0, StringLen(json));
    
    char result[];
    string headers = "Content-Type: application/json\r\n";
    
    int timeout = 5000;
    int res = WebRequest(
        "POST",
        url,
        headers,
        timeout,
        data,
        result,
        headers
    );
    
    if(res == 200) {
        string response = CharArrayToString(result);
        Print("[Auto-Register] Resposta: ", response);
        return true;
    } else {
        Print("[Auto-Register] Erro HTTP: ", res);
        return false;
    }
}

//====================================================
// CARREGAR CONFIGURAÇÕES DO SERVIDOR
//====================================================
bool LoadServerSettings() {
    string url = SlaveServer + "/settings";
    url += "?user_email=" + UserEmail;
    url += "&master_account_id=" + MasterAccountNumber;
    url += "&slave_account_id=" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
    
    char data[];
    char result[];
    string headers = "Content-Type: application/json\r\n";
    
    int timeout = 5000;
    int res = WebRequest("GET", url, headers, timeout, data, result, headers);
    
    if(res != 200) {
        Print("⚠️ Erro ao carregar configurações: HTTP ", res);
        return false;
    }
    
    string response = CharArrayToString(result);
    if(EnableLogs) Print("📡 Response: ", response);
    
    // Parse JSON response
    if(StringFind(response, "\"success\":true") < 0) {
        Print("❌ Configurações não encontradas no servidor");
        return false;
    }
    
    // Extrair configurações
    serverSettings.lotMode = ExtractValue(response, "lotMode");
    serverSettings.lotMultiplier = StringToDouble(ExtractValue(response, "lotMultiplier"));
    serverSettings.lotFixed = StringToDouble(ExtractValue(response, "lotFixed"));
    serverSettings.lotRiskPercent = StringToDouble(ExtractValue(response, "lotRiskPercent"));
    
    serverSettings.slMode = ExtractValue(response, "slMode");
    serverSettings.slPips = (int)StringToInteger(ExtractValue(response, "slPips"));
    
    serverSettings.tpMode = ExtractValue(response, "tpMode");
    serverSettings.tpPips = (int)StringToInteger(ExtractValue(response, "tpPips"));
    
    serverSettings.allowedSymbols = ExtractValue(response, "allowedSymbols");
    serverSettings.blockedSymbols = ExtractValue(response, "blockedSymbols");
    serverSettings.tradingStartTime = ExtractValue(response, "tradingStartTime");
    serverSettings.tradingEndTime = ExtractValue(response, "tradingEndTime");
    
    serverSettings.maxTrades = (int)StringToInteger(ExtractValue(response, "maxTrades"));
    serverSettings.maxRiskPerTrade = StringToDouble(ExtractValue(response, "maxRiskPerTrade"));
    serverSettings.maxDailyLoss = StringToDouble(ExtractValue(response, "maxDailyLoss"));
    serverSettings.invertSignals = (ExtractValue(response, "invertSignals") == "true");
    
    serverSettings.isActive = (ExtractValue(response, "isActive") == "true");
    
    settingsLoaded = true;
    return true;
}

void PrintSettings() {
    Print("========== CONFIGURAÇÕES ===========");
    Print("Lot Mode: ", serverSettings.lotMode);
    Print("Lot Multiplier: ", serverSettings.lotMultiplier);
    Print("Lot Fixed: ", serverSettings.lotFixed);
    Print("SL Mode: ", serverSettings.slMode);
    Print("TP Mode: ", serverSettings.tpMode);
    Print("Allowed Symbols: ", serverSettings.allowedSymbols);
    Print("Blocked Symbols: ", serverSettings.blockedSymbols);
    Print("Trading Hours: ", serverSettings.tradingStartTime, " - ", serverSettings.tradingEndTime);
    Print("Max Trades: ", serverSettings.maxTrades);
    Print("Max Daily Loss: ", serverSettings.maxDailyLoss);
    Print("Invert Signals: ", serverSettings.invertSignals ? "YES" : "NO");
    Print("Status: ", serverSettings.isActive ? "ATIVO" : "INATIVO");
    Print("======================================");
}

bool ValidateTrade(string symbol, int type) {
    // Verificar se copy trading está ativo
    if(settingsLoaded && !serverSettings.isActive) {
        Print("⚠️ Copy Trading INATIVO nas configurações");
        return false;
    }
    
    // Filtro de símbolos permitidos
    if(settingsLoaded && serverSettings.allowedSymbols != "") {
        bool symbolAllowed = false;
        string allowed[];
        StringSplit(serverSettings.allowedSymbols, ',', allowed);
        
        for(int i = 0; i < ArraySize(allowed); i++) {
            string trimmed = allowed[i];
            StringTrimLeft(trimmed);
            StringTrimRight(trimmed);
            StringToUpper(trimmed);
            
            string symbolUpper = symbol;
            StringToUpper(symbolUpper);
            
            if(StringFind(symbolUpper, trimmed) >= 0) {
                symbolAllowed = true;
                break;
            }
        }
        
        if(!symbolAllowed) {
            Print("❌ Símbolo não permitido: ", symbol);
            return false;
        }
    }
    
    // Filtro de símbolos bloqueados
    if(settingsLoaded && serverSettings.blockedSymbols != "") {
        string blocked[];
        StringSplit(serverSettings.blockedSymbols, ',', blocked);
        
        for(int i = 0; i < ArraySize(blocked); i++) {
            string trimmed = blocked[i];
            StringTrimLeft(trimmed);
            StringTrimRight(trimmed);
            StringToUpper(trimmed);
            
            string symbolUpper = symbol;
            StringToUpper(symbolUpper);
            
            if(StringFind(symbolUpper, trimmed) >= 0) {
                Print("❌ Símbolo bloqueado: ", symbol);
                return false;
            }
        }
    }
    
    // Filtro de horário
    if(settingsLoaded && serverSettings.tradingStartTime != "" && serverSettings.tradingEndTime != "") {
        MqlDateTime dt;
        TimeToStruct(TimeCurrent(), dt);
        string currentTime = StringFormat("%02d:%02d", dt.hour, dt.min);
        
        if(currentTime < serverSettings.tradingStartTime || currentTime > serverSettings.tradingEndTime) {
            Print("❌ Fora do horário de trading: ", currentTime, " (permitido: ", serverSettings.tradingStartTime, " - ", serverSettings.tradingEndTime, ")");
            return false;
        }
    }
    
    // TODO: Implementar gerenciamento de risco (max daily loss, max trades)
    
    return true;
}

//====================================================
// VALIDAÇÃO DE LICENÇA
//====================================================
bool ValidateLicense() {
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em ", TimeToString(LICENSE_EXPIRY_DATE));
        return false;
    }
    
    string allowedAccounts = ALLOWED_ACCOUNTS;
    if(allowedAccounts != "") {
        string currentAccount = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
        if(StringFind(allowedAccounts, currentAccount) < 0) {
            Print("❌ Conta ", currentAccount, " não autorizada");
            return false;
        }
    }
    
    Print("✅ Licença válida até: ", TimeToString(LICENSE_EXPIRY_DATE));
    return true;
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    EventKillTimer();
    Print("Slave EA finalizado. Posições copiadas: ", slavePositionsCount);
}
//+------------------------------------------------------------------+
