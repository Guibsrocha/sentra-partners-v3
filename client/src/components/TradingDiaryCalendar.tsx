import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DrawdownChart } from "./DrawdownChart";


interface Trade {
  id: number;
  closeTime: string | null;
  profit: number;
  accountId: number;
}

interface TradingDiaryCalendarProps {
  account: any;
  trades: Trade[];
}

interface DayData {
  date: Date;
  profit: number;
  tradeCount: number;
}

interface DrawdownData {
  daily: {
    drawdownPercent: number;
    drawdownAmount: number;
  } | null;
  weekly: {
    drawdownPercent: number;
    drawdownAmount: number;
  } | null;
  monthly: {
    drawdownPercent: number;
    drawdownAmount: number;
  } | null;
}

export function TradingDiaryCalendar({ account, trades }: TradingDiaryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Buscar dados de drawdown em tempo real
  const { data: drawdownData } = trpc.analytics.getDrawdownHistory.useQuery(
    { accountId: account.id },
    { 
      enabled: !!account?.id,
      refetchInterval: 5 * 60 * 1000 // Atualizar a cada 5 minutos
    }
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Extrair dados de drawdown
  const drawdown = drawdownData?.drawdown || { daily: null, weekly: null, monthly: null };

  // Agrupar trades por dia
  const dailyData = useMemo(() => {
    const data: Record<string, DayData> = {};
    
    trades
      .filter(t => t.closeTime !== null)
      .forEach(trade => {
        const closeDate = new Date(trade.closeTime!);
        const dateKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}-${String(closeDate.getDate()).padStart(2, '0')}`;
        
        if (!data[dateKey]) {
          data[dateKey] = {
            date: new Date(closeDate.getFullYear(), closeDate.getMonth(), closeDate.getDate()),
            profit: 0,
            tradeCount: 0,

          };
        }
        
        // Aplicar divisão por 100 para contas CENT
        const profitValue = trade.profit || 0;
        const adjustedProfit = account.accountType === 'CENT' ? profitValue / 100 : profitValue;
        data[dateKey].profit += adjustedProfit;
        data[dateKey].tradeCount += 1;
      });
    
    return data;
  }, [trades, account.accountType]);

  // Calcular totais do mês
  const monthlyTotals = useMemo(() => {
    let totalProfit = 0;
    let totalTrades = 0;
    
    Object.values(dailyData).forEach(day => {
      if (day.date.getMonth() === month && day.date.getFullYear() === year) {
        totalProfit += day.profit;
        totalTrades += day.tradeCount;
      }
    });
    
    return { totalProfit, totalTrades };
  }, [dailyData, month, year]);

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [year, month]);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayData = dailyData[dateKey] || {
      date,
      profit: 0,
      tradeCount: 0
    };
    setSelectedDay(dayData);
  };



  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendário */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{monthNames[month]} De {year}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const dayData = dailyData[dateKey];
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = selectedDay?.date.toDateString() === date.toDateString();
                
                return (
                  <button
                    key={dateKey}
                    onClick={() => handleDayClick(date)}
                    className={`
                      aspect-square p-2 rounded-lg border transition-all
                      ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                      ${dayData ? 'bg-muted/50' : ''}
                    `}
                  >
                    <div className="text-sm font-medium">{date.getDate()}</div>
                    {dayData && (
                      <div className={`text-xs mt-1 font-semibold ${dayData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dayData.profit >= 0 ? '+' : ''}${dayData.profit.toFixed(2)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Gráfico de Drawdown */}
            {drawdownData?.balanceData && drawdownData.balanceData.length > 0 && (
              <div className="mt-6">
                <DrawdownChart data={drawdownData.balanceData} />
              </div>
            )}
            
            {/* Totais do mês */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Lucro Total do Mês</div>
                <div className={`text-2xl font-bold ${monthlyTotals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyTotals.totalProfit >= 0 ? '+' : ''}${monthlyTotals.totalProfit.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">USD 0.00</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Drawdown Total do Mês</div>
                <div className={`text-2xl font-bold ${drawdown.monthly && drawdown.monthly.drawdownPercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {drawdown.monthly ? `${drawdown.monthly.drawdownPercent.toFixed(2)}%` : '0.00%'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {drawdown.monthly && drawdown.monthly.drawdownAmount ? 
                    `$${(drawdown.monthly.drawdownAmount / (account.accountType === 'CENT' ? 100 : 1)).toFixed(2)}` : 
                    '$0.00'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Painel lateral - Detalhes do dia selecionado */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Selecione um dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDay ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-6xl font-bold mb-2">
                    {selectedDay.date.getDate()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {monthNames[selectedDay.date.getMonth()]} {selectedDay.date.getFullYear()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Lucro do dia:</span>
                    <span className={`font-bold ${selectedDay.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedDay.profit >= 0 ? '+' : ''}${selectedDay.profit.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trades:</span>
                    <span className="font-bold">{selectedDay.tradeCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Clique em um dia no calendário para ver detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
