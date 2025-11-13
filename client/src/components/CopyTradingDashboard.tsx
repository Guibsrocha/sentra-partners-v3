import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCopyTradingAnalytics } from "@/hooks/useCopyTradingAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Wifi,
  WifiOff,
  ArrowRight,
  AlertCircle,
  Copy,
  BarChart3,
  PieChart,
  ChevronDown,
  Trash2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ConnectedAccount {
  accountId: string;
  accountName: string;
  type: 'master' | 'slave';
  status: 'online' | 'offline';
  lastHeartbeat: Date;
  balance: number;
  equity: number;
  userId: number;
}

interface LiveTrade {
  id: string;
  masterAccountId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  timestamp: Date;
  userId: number;
  slaveStatuses: {
    slaveAccountId: string;
    slaveAccountName: string;
    status: 'pending' | 'success' | 'failed';
    executionTime?: number;
    slippage?: number;
    error?: string;
  }[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CopyTradingDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Buscar analytics do backend
  const { analytics: backendAnalytics, loading: analyticsLoading } = useCopyTradingAnalytics();

  // Calcular estatísticas e dados para gráficos
  const analytics = useMemo(() => {
    // Se temos dados do backend, usar eles
    if (backendAnalytics && !analyticsLoading) {
      const masterPerformance = backendAnalytics.masterPerformance.map(m => ({
        accountId: m.accountId,
        name: `Master ${m.accountId}`,
        trades: 0, // TODO: buscar do histórico
        successRate: 0,
        avgLatency: '0',
        equity: m.equity
      }));
      
      const slavePerformance = backendAnalytics.slavePerformance.map(s => ({
        accountId: s.accountId,
        name: `Slave ${s.accountId}`,
        copies: s.dailyTradesCount,
        successRate: 0,
        avgLatency: '0',
        avgSlippage: 0
      }));
      
      return {
        masterCount: backendAnalytics.summary.totalMasters,
        masterOnline: backendAnalytics.summary.onlineMasters,
        slaveCount: backendAnalytics.summary.totalSlaves,
        slaveOnline: backendAnalytics.summary.onlineSlaves,
        tradesCount: 0,
        successRate: '0',
        pieData: [],
        barData: masterPerformance.map(m => ({
          name: m.name,
          'Taxa de Sucesso': m.successRate,
          'Trades': m.trades
        })),
        masterPerformance,
        slavePerformance
      };
    }
    
    // Fallback para dados do WebSocket
    const masterAccounts = connectedAccounts.filter(acc => acc.type === 'master');
    const slaveAccounts = connectedAccounts.filter(acc => acc.type === 'slave');
    
    // Estatísticas gerais
    const totalCopies = liveTrades.reduce((acc, trade) => 
      acc + trade.slaveStatuses.length, 0
    );
    
    const successfulCopies = liveTrades.reduce((acc, trade) => 
      acc + trade.slaveStatuses.filter(s => s.status === 'success').length, 0
    );
    
    const failedCopies = liveTrades.reduce((acc, trade) => 
      acc + trade.slaveStatuses.filter(s => s.status === 'failed').length, 0
    );
    
    const pendingCopies = liveTrades.reduce((acc, trade) => 
      acc + trade.slaveStatuses.filter(s => s.status === 'pending').length, 0
    );
    
    const successRate = totalCopies > 0 
      ? ((successfulCopies / totalCopies) * 100).toFixed(1) 
      : '0';

    // Performance por conta Master
    const masterPerformance = masterAccounts.map(master => {
      const masterTrades = liveTrades.filter(t => t.masterAccountId === master.accountId);
      const totalSlaveStatuses = masterTrades.reduce((acc, t) => acc + t.slaveStatuses.length, 0);
      const successCount = masterTrades.reduce((acc, t) => 
        acc + t.slaveStatuses.filter(s => s.status === 'success').length, 0
      );
      const avgLatency = masterTrades.reduce((acc, t) => {
        const latencies = t.slaveStatuses
          .filter(s => s.executionTime)
          .map(s => s.executionTime!);
        return acc + (latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0);
      }, 0) / (masterTrades.length || 1);

      return {
        name: master.accountName,
        accountId: master.accountId,
        trades: masterTrades.length,
        successRate: totalSlaveStatuses > 0 ? (successCount / totalSlaveStatuses * 100) : 0,
        avgLatency: avgLatency.toFixed(0),
        equity: master.equity
      };
    });

    // Performance por conta Slave
    const slavePerformance = slaveAccounts.map(slave => {
      const slaveStatuses = liveTrades.flatMap(t => 
        t.slaveStatuses.filter(s => s.slaveAccountId === slave.accountId)
      );
      const successCount = slaveStatuses.filter(s => s.status === 'success').length;
      const avgLatency = slaveStatuses
        .filter(s => s.executionTime)
        .reduce((acc, s) => acc + s.executionTime!, 0) / (slaveStatuses.length || 1);
      const avgSlippage = slaveStatuses
        .filter(s => s.slippage !== undefined)
        .reduce((acc, s) => acc + Math.abs(s.slippage!), 0) / (slaveStatuses.length || 1);

      return {
        name: slave.accountName,
        accountId: slave.accountId,
        copies: slaveStatuses.length,
        successRate: slaveStatuses.length > 0 ? (successCount / slaveStatuses.length * 100) : 0,
        avgLatency: avgLatency.toFixed(0),
        avgSlippage: avgSlippage.toFixed(1),
        equity: slave.equity
      };
    });

    // Dados para gráfico de pizza (status de cópias)
    const pieData = [
      { name: 'Sucesso', value: successfulCopies, color: '#10b981' },
      { name: 'Falha', value: failedCopies, color: '#ef4444' },
      { name: 'Pendente', value: pendingCopies, color: '#f59e0b' }
    ].filter(item => item.value > 0);

    // Dados para gráfico de barras (performance por Master)
    const barData = masterPerformance.map(m => ({
      name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
      'Taxa de Sucesso': m.successRate,
      'Trades': m.trades
    }));

    return {
      masterCount: masterAccounts.length,
      masterOnline: masterAccounts.filter(a => a.status === 'online').length,
      slaveCount: slaveAccounts.length,
      slaveOnline: slaveAccounts.filter(a => a.status === 'online').length,
      tradesCount: liveTrades.length,
      successRate,
      totalCopies,
      successfulCopies,
      failedCopies,
      pendingCopies,
      masterAccounts,
      slaveAccounts,
      masterPerformance,
      slavePerformance,
      pieData,
      barData
    };
  }, [connectedAccounts, liveTrades, backendAnalytics, analyticsLoading]);

  const connectWebSocket = () => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/copy-trading`;
    
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;

    websocket.onopen = () => {
      setWsStatus('connected');
      
      websocket.send(JSON.stringify({ 
        type: 'AUTHENTICATE',
        userId: user.id,
        email: user.email
      }));
      
      websocket.send(JSON.stringify({ 
        type: 'GET_CONNECTED_ACCOUNTS',
        userId: user.id
      }));
      
      websocket.send(JSON.stringify({ 
        type: 'GET_RECENT_TRADES',
        userId: user.id,
        limit: 50
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.userId && data.userId !== user.id) return;
      
      switch (data.type) {
        case 'CONNECTED_ACCOUNTS':
          setConnectedAccounts(data.accounts);
          break;
          
        case 'RECENT_TRADES':
          setLiveTrades(data.trades);
          break;
          
        case 'ACCOUNT_CONNECTED':
          setConnectedAccounts(prev => {
            const exists = prev.some(acc => acc.accountId === data.account.accountId);
            if (exists) return prev;
            return [...prev, data.account];
          });
          break;
          
        case 'ACCOUNT_DISCONNECTED':
          setConnectedAccounts(prev => 
            prev.filter(acc => acc.accountId !== data.accountId)
          );
          break;
          
        case 'NEW_TRADE':
          setLiveTrades(prev => {
            const exists = prev.some(t => t.id === data.trade.id);
            if (exists) return prev;
            return [data.trade, ...prev.slice(0, 49)];
          });
          break;
          
        case 'TRADE_COPIED':
          setLiveTrades(prev => prev.map(trade => {
            if (trade.id === data.tradeId) {
              return {
                ...trade,
                slaveStatuses: trade.slaveStatuses.map(status => 
                  status.slaveAccountId === data.slaveAccountId
                    ? { ...status, ...data.status }
                    : status
                )
              };
            }
            return trade;
          }));
          break;
      }
    };

    websocket.onerror = () => {
      setWsStatus('disconnected');
    };

    websocket.onclose = () => {
      setWsStatus('disconnected');
      wsRef.current = null;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isAuthenticated && user) {
          connectWebSocket();
        }
      }, 15 * 60 * 1000); // 15 minutos
    };
  };

  // Polling HTTP como fallback
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchAccounts = async () => {
      try {
        const response = await fetch(`/api/mt/copy/connected-accounts?email=${encodeURIComponent(user.email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.accounts) {
            setConnectedAccounts(data.accounts);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar contas via HTTP:', error);
      }
    };

    // Buscar imediatamente
    fetchAccounts();

    // Polling a cada 15 minutos (backup)
    const intervalId = setInterval(fetchAccounts, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, user]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Deletar conta Master
  const deleteMasterAccount = async (accountId: string) => {
    if (!user?.email) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log(`🛠️ Deletando conta Master: ${accountId}`);
    console.log(`📧 Email: ${user.email}`);
    
    try {
      const url = `/api/mt/copy/master/${accountId}?email=${encodeURIComponent(user.email)}`;
      console.log(`🔗 URL: ${url}`);
      
      const response = await fetch(url, { method: 'DELETE' });
      
      console.log(`📊 Status: ${response.status}`);
      
      const data = await response.json();
      console.log(`📝 Response:`, data);
      
      if (response.ok && data.success) {
        // Atualizar lista de contas
        setConnectedAccounts(prev => 
          prev.filter(acc => !(acc.accountId === accountId && acc.type === 'master'))
        );
        console.log(`✅ Conta Master ${accountId} deletada com sucesso`);
        alert(`✅ Conta Master ${accountId} deletada!`);
      } else {
        console.error('❌ Erro ao deletar:', data.error || 'Erro desconhecido');
        alert(`❌ Erro: ${data.error || 'Não foi possível deletar'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar conta Master:', error);
      alert(`❌ Erro: ${error}`);
    }
  };

  // Deletar conta Slave
  const deleteSlaveAccount = async (accountId: string) => {
    if (!user?.email) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log(`🛠️ Deletando conta Slave: ${accountId}`);
    console.log(`📧 Email: ${user.email}`);
    
    try {
      const url = `/api/mt/copy/slave/${accountId}?email=${encodeURIComponent(user.email)}`;
      console.log(`🔗 URL: ${url}`);
      
      const response = await fetch(url, { method: 'DELETE' });
      
      console.log(`📊 Status: ${response.status}`);
      
      const data = await response.json();
      console.log(`📝 Response:`, data);
      
      if (response.ok && data.success) {
        // Atualizar lista de contas
        setConnectedAccounts(prev => 
          prev.filter(acc => !(acc.accountId === accountId && acc.type === 'slave'))
        );
        console.log(`✅ Conta Slave ${accountId} deletada com sucesso`);
        alert(`✅ Conta Slave ${accountId} deletada!`);
      } else {
        console.error('❌ Erro ao deletar:', data.error || 'Erro desconhecido');
        alert(`❌ Erro: ${data.error || 'Não foi possível deletar'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar conta Slave:', error);
      alert(`❌ Erro: ${error}`);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Faça login para visualizar o dashboard de Copy Trading
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status de Conexão */}
      {wsStatus !== 'connected' && (
        <Alert variant={wsStatus === 'connecting' ? 'default' : 'destructive'}>
          <Activity className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            {wsStatus === 'connecting' 
              ? 'Conectando ao servidor em tempo real...' 
              : connectedAccounts.length > 0 
                ? 'Usando dados em cache. Próxima atualização em 15 minutos.'
                : 'Aguardando conexão com o servidor...'}
          </AlertDescription>
        </Alert>
      )}

      {/* Header com Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Minhas Contas Master
                </CardTitle>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.masterCount}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.masterOnline} online
                </p>
              </CardContent>
            </Card>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Selecione uma conta Master</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {connectedAccounts.filter(acc => acc.type === 'master').length === 0 ? (
              <DropdownMenuItem disabled>
                Nenhuma conta Master conectada
              </DropdownMenuItem>
            ) : (
              connectedAccounts
                .filter(acc => acc.type === 'master')
                .map((account) => (
                  <DropdownMenuItem key={account.accountId} onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {account.status === 'online' ? (
                          <Wifi className="h-3 w-3 text-green-500" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-gray-400" />
                        )}
                        <span>{account.accountId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={account.status === 'online' ? 'default' : 'secondary'}>
                          {account.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deletar conta Master ${account.accountId}?`)) {
                              deleteMasterAccount(account.accountId);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Minhas Contas Slave
                </CardTitle>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.slaveCount}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.slaveOnline} online
                </p>
              </CardContent>
            </Card>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Selecione uma conta Slave</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {connectedAccounts.filter(acc => acc.type === 'slave').length === 0 ? (
              <DropdownMenuItem disabled>
                Nenhuma conta Slave conectada
              </DropdownMenuItem>
            ) : (
              connectedAccounts
                .filter(acc => acc.type === 'slave')
                .map((account) => (
                  <DropdownMenuItem key={account.accountId} onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {account.status === 'online' ? (
                          <Wifi className="h-3 w-3 text-green-500" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-gray-400" />
                        )}
                        <span>{account.accountId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={account.status === 'online' ? 'default' : 'secondary'}>
                          {account.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deletar conta Slave ${account.accountId}?`)) {
                              deleteSlaveAccount(account.accountId);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Meus Trades Hoje
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.tradesCount}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Sucesso
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {analytics.successRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cópias bem-sucedidas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <Wifi className="h-4 w-4 mr-2" />
            Contas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de Pizza - Status de Cópias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Status de Cópias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={analytics.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trades em Tempo Real */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Trades em Tempo Real
                  {wsStatus === 'connected' && (
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {liveTrades.slice(0, 10).map((trade) => (
                      <div
                        key={trade.id}
                        className="border rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {trade.type === 'BUY' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <p className="font-semibold">{trade.symbol}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(trade.timestamp).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <Badge variant={trade.type === 'BUY' ? 'default' : 'destructive'}>
                            {trade.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trade.slaveStatuses.filter(s => s.status === 'success').length}/{trade.slaveStatuses.length} cópias bem-sucedidas
                        </div>
                      </div>
                    ))}
                    {liveTrades.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Aguardando trades...</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {/* Gráfico de Barras - Performance por Master */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance por Conta Master
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Taxa de Sucesso" fill="#10b981" />
                    <Bar dataKey="Trades" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Performance Detalhada - Masters */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Master</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {analytics.masterPerformance.map((master, index) => (
                      <div key={master.accountId} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <p className="font-semibold">{master.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Trades:</span>
                            <p className="font-medium">{master.trades}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Taxa:</span>
                            <p className="font-medium text-green-500">{master.successRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latência:</span>
                            <p className="font-medium">{master.avgLatency}ms</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Equity:</span>
                            <p className="font-medium">${master.equity.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {analytics.masterPerformance.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma conta Master conectada
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Performance Detalhada - Slaves */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Slave</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {analytics.slavePerformance.map((slave, index) => (
                      <div key={slave.accountId} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <p className="font-semibold">{slave.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cópias:</span>
                            <p className="font-medium">{slave.copies}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Taxa:</span>
                            <p className="font-medium text-green-500">{slave.successRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latência:</span>
                            <p className="font-medium">{slave.avgLatency}ms</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Slippage:</span>
                            <p className="font-medium">{slave.avgSlippage} pips</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {analytics.slavePerformance.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma conta Slave conectada
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Contas */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Minhas Contas Conectadas */}
            <Card>
              <CardHeader>
                <CardTitle>Contas Master</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Usuário: {user.email}
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {analytics.masterAccounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {account.status === 'online' ? (
                            <Wifi className="h-5 w-5 text-green-500" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-red-500" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{account.accountName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground font-mono">
                                ID: {account.accountId}
                              </p>
                              <button
                                onClick={() => copyToClipboard(account.accountId)}
                                className="text-xs text-blue-500 hover:text-blue-700"
                                title="Copiar ID da conta"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Configure seus Slaves com este ID
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ${account.equity.toFixed(2)}
                          </p>
                          <Badge 
                            variant={account.status === 'online' ? 'default' : 'secondary'}
                            className="text-xs mt-1"
                          >
                            {account.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {analytics.masterAccounts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <WifiOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma conta Master conectada</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Contas Slave */}
            <Card>
              <CardHeader>
                <CardTitle>Contas Slave</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {analytics.slaveAccounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {account.status === 'online' ? (
                            <Wifi className="h-5 w-5 text-green-500" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{account.accountName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {account.accountId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ${account.equity.toFixed(2)}
                          </p>
                          <Badge 
                            variant={account.status === 'online' ? 'default' : 'secondary'}
                            className="text-xs mt-1"
                          >
                            {account.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {analytics.slaveAccounts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <WifiOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma conta Slave conectada</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
