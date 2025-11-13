import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Settings, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ForexEvent {
  date: string;
  time: string;
  country: string;
  impact: string;
  title: string;
  forecast?: string;
  previous?: string;
}

function AlertSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: settings, refetch } = trpc.user.getAlertSettings.useQuery(undefined, {
    enabled: open,
  });
  
  const updateEconomicAlerts = trpc.user.updateEconomicAlertSettings.useMutation({
    onSuccess: () => {
      toast.success("✅ Configurações de alertas econômicos atualizadas!");
      refetch();
    },
    onError: (error) => {
      toast.error("❌ Erro ao atualizar configurações: " + error.message);
    },
  });
  

  
  const [economicEnabled, setEconomicEnabled] = useState(true);
  const [economicTime, setEconomicTime] = useState("60");
  const [economicEmail, setEconomicEmail] = useState(true);

  // Atualizar estados quando dados carregarem
  useEffect(() => {
    if (settings) {
      setEconomicEnabled(settings.ntfyEconomicNewsEnabled ?? true);
      setEconomicTime(String(settings.ntfyEconomicNewsTime ?? 60));
      setEconomicEmail(settings.ntfyEconomicNewsEmail ?? true);
    }
  }, [settings]);

  const handleSaveEconomic = () => {
    updateEconomicAlerts.mutate({
      enabled: economicEnabled,
      timeMinutes: parseInt(economicTime),
      emailEnabled: economicEmail,
    });
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Alertas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alertas Econômicos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas de Calendário Econômico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar Alertas</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações de eventos HIGH impact
                  </p>
                </div>
                <Switch
                  checked={economicEnabled}
                  onCheckedChange={setEconomicEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo de Antecedência</Label>
                <Select value={economicTime} onValueChange={setEconomicTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                    <SelectItem value="120">2 horas antes</SelectItem>
                    <SelectItem value="240">4 horas antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enviar por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Além do Telegram, enviar também por email
                  </p>
                </div>
                <Switch
                  checked={economicEmail}
                  onCheckedChange={setEconomicEmail}
                />
              </div>

              <Button
                onClick={handleSaveEconomic}
                disabled={updateEconomicAlerts.isPending}
                className="w-full"
              >
                {updateEconomicAlerts.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>


        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Calendar() {
  const { isAuthenticated, loading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  
  const { data: events, isLoading } = trpc.calendar.getEvents.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5 * 60 * 1000, // 5 minutos - atualização frequente
  });

  // Funções de navegação do calendário
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obter dias do mês
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Adicionar dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Contar eventos por dia
  const getEventsForDate = (date: Date) => {
    if (!events) {
      console.log('[Calendar] No events loaded');
      return [];
    }
    const dateStr = date.toISOString().split('T')[0];
    const filtered = events.filter(e => e.date === dateStr);
    console.log(`[Calendar] Events for ${dateStr}:`, filtered.length, 'total events:', events.length);
    return filtered;
  };

  // Verificar se evento já ocorreu
  const hasOccurred = (date: string, time: string): boolean => {
    try {
      const eventDate = new Date(date + ' ' + time);
      return eventDate < new Date();
    } catch {
      return false;
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">
            Faça login para ver o calendário econômico
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendário Econômico</h1>
            <p className="text-muted-foreground">
              Eventos econômicos importantes do Forex Factory
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlertSettings(true)}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Configurar Alertas
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button onClick={goToPreviousMonth} variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl capitalize">{monthName}</CardTitle>
              <Button onClick={goToNextMonth} variant="ghost" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando eventos...</p>
              </div>
            ) : (
              <>
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Dias do mês */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dayEvents = getEventsForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    const hasEvents = dayEvents.length > 0;
                    const highImpactCount = dayEvents.filter(e => e.impact === 'High').length;

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-2 rounded-lg border transition-all
                          ${isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-border'}
                          ${hasEvents ? 'hover:bg-accent cursor-pointer' : 'cursor-default'}
                          ${day.getMonth() !== currentDate.getMonth() ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex flex-col h-full">
                          <span className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {day.getDate()}
                          </span>
                          {hasEvents && (
                            <div className="flex-1 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="text-xs font-semibold">{dayEvents.length}</div>
                                {highImpactCount > 0 && (
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legenda */}
                <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Alto Impacto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500" />
                    <span>Hoje</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {/* Dialog de configurações de alertas */}
        <AlertSettingsDialog
          open={showAlertSettings}
          onOpenChange={setShowAlertSettings}
        />

        {/* Dialog de detalhes do dia */}
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Eventos de {selectedDate?.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </DialogTitle>
            </DialogHeader>
            
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum evento econômico neste dia
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event, index) => {
                  const occurred = hasOccurred(event.date, event.time);

                  return (
                    <Card key={index} className={occurred ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={occurred ? "secondary" : "default"}>
                                {occurred ? '✓ Ocorreu' : '⏰ Pendente'}
                              </Badge>
                              <Badge
                                variant={
                                  event.impact === 'High' ? 'destructive' :
                                  event.impact === 'Medium' ? 'default' : 'secondary'
                                }
                              >
                                {event.impact}
                              </Badge>
                              <span className="text-lg font-semibold">{event.country}</span>
                            </div>
                            
                            <h3 className="font-semibold text-base">{event.title}</h3>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{event.time || '--:--'}</span>
                            </div>

                            {(event.forecast || event.previous) && (
                              <div className="flex gap-4 text-sm">
                                {event.forecast && (
                                  <div>
                                    <span className="text-muted-foreground">Previsão:</span>{' '}
                                    <span className="font-medium">{event.forecast}</span>
                                  </div>
                                )}
                                {event.previous && (
                                  <div>
                                    <span className="text-muted-foreground">Anterior:</span>{' '}
                                    <span className="font-medium">{event.previous}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

