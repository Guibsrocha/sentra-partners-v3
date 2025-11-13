import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Bell, Plus, MessageSquare, Settings as SettingsIcon, Smartphone, RefreshCw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Alerts() {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();

  // Estados para configurações Telegram
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramTradesEnabled, setTelegramTradesEnabled] = useState(true);
  const [telegramDrawdownEnabled, setTelegramDrawdownEnabled] = useState(true);
  const [telegramConnectionEnabled, setTelegramConnectionEnabled] = useState(true);
  const [telegramCopyTradeEnabled, setTelegramCopyTradeEnabled] = useState(true);
  const [telegramVpsExpiringEnabled, setTelegramVpsExpiringEnabled] = useState(true);
  const [telegramSubscriptionExpiringEnabled, setTelegramSubscriptionExpiringEnabled] = useState(true);
  const [telegramEaExpiringEnabled, setTelegramEaExpiringEnabled] = useState(true);
  const [telegramDailyEnabled, setTelegramDailyEnabled] = useState(true);
  const [telegramWeeklyEnabled, setTelegramWeeklyEnabled] = useState(true);
  const [drawdownLimit, setDrawdownLimit] = useState("0.10");
  const [dailyTime, setDailyTime] = useState("19:00");
  const [weeklyTime, setWeeklyTime] = useState("08:00");
  const [telegramDailyTitle, setTelegramDailyTitle] = useState("📊 Relatório Diário");
  const [telegramWeeklyTitle, setTelegramWeeklyTitle] = useState("🎉 Relatório Semanal");
  const [telegramDailyIndividualTitle, setTelegramDailyIndividualTitle] = useState("💰 Conta {login} - Dia");
  const [telegramWeeklyIndividualTitle, setTelegramWeeklyIndividualTitle] = useState("📈 Conta {login} - Semana");
  const [telegramNotificationType, setTelegramNotificationType] = useState<"consolidated" | "individual">("consolidated");

  const { data: notificationHistoryData, refetch: refetchHistory } = trpc.telegram.getNotificationHistory.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  // Carregar configurações Telegram usando tRPC
  const { data: telegramSettings } = trpc.telegram.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: telegramTokenData, refetch: refetchToken } = trpc.telegram.getTopic.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: telegramStatus } = trpc.telegram.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations Telegram
  const utils = trpc.useUtils();
  
  const updateTelegramSettings = trpc.telegram.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("⚡ Configurações salvas!");
      // Invalida a query para recarregar os dados
      utils.telegram.getSettings.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });











  const generateToken = trpc.telegram.generateToken.useMutation({
    onSuccess: async (data) => {
      setTelegramToken(data.token);
      await refetchToken(); // Buscar token atualizado do servidor
      toast.success('✅ Novo token gerado! Vincule novamente no bot.');
    },
    onError: (error) => {
      toast.error('Erro ao gerar token: ' + error.message);
    },
  });



  const testDirectNotification = trpc.telegram.testDirectNotification.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('✅ Notificação enviada! Verifique seu Telegram.');
        console.log('[DEBUG] Dados do Telegram:', data.data);
      } else {
        toast.error('❌ ' + data.error + ': ' + data.details);
        console.error('[DEBUG] Erro:', data);
      }
    },
    onError: (error) => {
      toast.error('Erro ao testar: ' + error.message);
      console.error('[DEBUG] Erro na requisição:', error);
    },
  });

  // Atualizar estados quando os dados carregarem
  useEffect(() => {
    if (telegramSettings) {
      setTelegramEnabled(telegramSettings.telegramEnabled || false);
      setTelegramToken(telegramSettings.telegramToken || "");
      setTelegramTradesEnabled(telegramSettings.telegramTradesEnabled ?? true);
      setTelegramDrawdownEnabled(telegramSettings.telegramDrawdownEnabled ?? true);
      setTelegramConnectionEnabled(telegramSettings.telegramConnectionEnabled ?? true);
      setTelegramCopyTradeEnabled(telegramSettings.telegramCopyTradeEnabled ?? true);
      setTelegramVpsExpiringEnabled(telegramSettings.telegramVpsExpiringEnabled ?? true);
      setTelegramSubscriptionExpiringEnabled(telegramSettings.telegramSubscriptionExpiringEnabled ?? true);
      setTelegramEaExpiringEnabled(telegramSettings.telegramEaExpiringEnabled ?? true);
      setTelegramDailyEnabled(telegramSettings.telegramDailyEnabled ?? true);
      setTelegramWeeklyEnabled(telegramSettings.telegramWeeklyEnabled ?? true);
      setDrawdownLimit(String(telegramSettings.drawdownThreshold ?? 10));
      setDailyTime(telegramSettings.dailyTime || "19:00");
      setWeeklyTime(telegramSettings.weeklyTime || "08:00");
      setTelegramDailyTitle(telegramSettings.telegramDailyTitle || "📊 Relatório Diário");
      setTelegramWeeklyTitle(telegramSettings.telegramWeeklyTitle || "🎉 Relatório Semanal");
      setTelegramDailyIndividualTitle(telegramSettings.telegramDailyIndividualTitle || "💰 Conta {login} - Dia");
      setTelegramWeeklyIndividualTitle(telegramSettings.telegramWeeklyIndividualTitle || "📈 Conta {login} - Semana");
      setTelegramNotificationType(telegramSettings.telegramNotificationType || "consolidated");
    }
  }, [telegramSettings]);

  useEffect(() => {
    if (telegramTokenData?.topic) {
      setTelegramToken(telegramTokenData.topic);
    }
  }, [telegramTokenData]);

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    const interval = setInterval(() => refetchHistory(), 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loading, refetchHistory]);

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
          <p className="text-muted-foreground">Faça login para ver seus alertas</p>
        </div>
      </DashboardLayout>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      drawdown: "Drawdown",
      profit_target: "Meta de Lucro",
      loss_limit: "Limite de Perda",
      connection: "Conexão",
      custom: "Personalizado",
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "outline";
    }
  };



  const handleSaveSettings = () => {
    updateTelegramSettings.mutate({
      telegramEnabled,
      telegramTradesEnabled,
      telegramDrawdownEnabled,
      telegramConnectionEnabled,
      telegramCopyTradeEnabled,
      telegramVpsExpiringEnabled,
      telegramSubscriptionExpiringEnabled,
      telegramEaExpiringEnabled,
      telegramDailyEnabled,
      telegramWeeklyEnabled,
      drawdownThreshold: parseFloat(drawdownLimit),
      dailyTime,
      weeklyTime,
      telegramDailyTitle,
      telegramWeeklyTitle,
      telegramDailyIndividualTitle,
      telegramWeeklyIndividualTitle,
      telegramNotificationType,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alertas e Notificações</h1>
            <p className="text-muted-foreground">
              Configure notificações push e gerencie alertas do sistema
            </p>
          </div>
        </div>

        {/* Seção de Configuração de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configuração de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">Alertas de Drawdown</p>
                <p className="text-sm text-muted-foreground">
                  Receba notificações quando o drawdown atingir o limite
                </p>
              </div>
              <Button
                variant={telegramDrawdownEnabled ? "default" : "outline"}
                onClick={() => setTelegramDrawdownEnabled(!telegramDrawdownEnabled)}
                size="sm"
                className="w-full sm:w-auto"
              >
                {telegramDrawdownEnabled ? t("alerts.enabled") : t("alerts.disabled")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">Alertas de Trades</p>
                <p className="text-sm text-muted-foreground">
                  Notificações sobre abertura e fechamento de trades
                </p>
              </div>
              <Button
                variant={telegramTradesEnabled ? "default" : "outline"}
                onClick={() => setTelegramTradesEnabled(!telegramTradesEnabled)}
                size="sm"
                className="w-full sm:w-auto"
              >
                {telegramTradesEnabled ? t("alerts.enabled") : t("alerts.disabled")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">Alertas de Conexão</p>
                <p className="text-sm text-muted-foreground">
                  Avisos quando uma nova conta é conectada
                </p>
              </div>
              <Button
                variant={telegramConnectionEnabled ? "default" : "outline"}
                onClick={() => setTelegramConnectionEnabled(!telegramConnectionEnabled)}
                size="sm"
                className="w-full sm:w-auto"
              >
                {telegramConnectionEnabled ? t("alerts.enabled") : t("alerts.disabled")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">Alertas de Copy Trade</p>
                <p className="text-sm text-muted-foreground">
                  Notificações quando um copy trade é executado
                </p>
              </div>
              <Button
                variant={telegramCopyTradeEnabled ? "default" : "outline"}
                onClick={() => setTelegramCopyTradeEnabled(!telegramCopyTradeEnabled)}
                size="sm"
                className="w-full sm:w-auto"
              >
                {telegramCopyTradeEnabled ? t("alerts.enabled") : t("alerts.disabled")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">Alertas de VPS</p>
                <p className="text-sm text-muted-foreground">
                  Avisos quando seu VPS está próximo de expirar
                </p>
              </div>
              <Button
                variant={telegramVpsExpiringEnabled ? "default" : "outline"}
                onClick={() => setTelegramVpsExpiringEnabled(!telegramVpsExpiringEnabled)}
                size="sm"
                className="w-full sm:w-auto"
              >
                {telegramVpsExpiringEnabled ? t("alerts.enabled") : t("alerts.disabled")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">Alertas de Assinatura</p>
                <p className="text-sm text-muted-foreground">
                  Avisos quando sua assinatura está próxima de expirar
                </p>
              </div>
              <Button
                variant={telegramSubscriptionExpiringEnabled ? "default" : "outline"}
                onClick={() => setTelegramSubscriptionExpiringEnabled(!telegramSubscriptionExpiringEnabled)}
                size="sm"
                className="w-full sm:w-auto"
              >
                {telegramSubscriptionExpiringEnabled ? t("alerts.enabled") : t("alerts.disabled")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">Alertas de EA</p>
                <p className="text-sm text-muted-foreground">
                  Avisos quando sua licença de EA está próxima de expirar
                </p>
              </div>
              <Button
                variant={telegramEaExpiringEnabled ? "default" : "outline"}
                onClick={() => setTelegramEaExpiringEnabled(!telegramEaExpiringEnabled)}
                size="sm"
                className="w-full sm:w-auto"
              >
                {telegramEaExpiringEnabled ? t("alerts.enabled") : t("alerts.disabled")}
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium">Limite de Drawdown</p>
                  <p className="text-sm text-muted-foreground">
                    Percentual máximo de drawdown antes de alerta
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={drawdownLimit}
                    onChange={(e) => setDrawdownLimit(e.target.value)}
                    className="w-24 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                ⚠️ Você receberá no máximo 2 alertas por dia, espaçados em 12 horas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Notificações Telegram */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notificações Telegram (Android + iPhone)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Receba notificações push instantâneas no seu celular (Android ou iPhone) usando o Telegram.
              </p>
            </div>

            {!telegramToken ? (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">Carregando seu tópico único...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Seu token único:</p>
                  <code className="block p-2 bg-background rounded text-xs sm:text-sm font-mono break-all">
                    {telegramToken}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    <strong>Como configurar:</strong><br />
                    1. Abra o Telegram e busque por @SentraPartners_Bot<br />
                    2. Envie o comando /start<br />
                    3. Cole o token acima<br />
                    4. Pronto! Você receberá notificações
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2 w-full sm:w-auto"
                      onClick={() => window.open('https://t.me/SentraPartners_Bot', '_blank')}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Abrir Bot
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full sm:w-auto"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja gerar um novo token? O token atual será invalidado e você precisará vincular novamente.')) {
                          generateToken.mutate();
                        }
                      }}
                      disabled={generateToken.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 ${generateToken.isPending ? 'animate-spin' : ''}`} />
                      <span className="truncate">{generateToken.isPending ? 'Gerando...' : 'Gerar Novo Token'}</span>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      onClick={() => {
                        testDirectNotification.mutate();
                      }}
                      disabled={testDirectNotification.isPending}
                    >
                      <Bell className={`h-4 w-4 ${testDirectNotification.isPending ? 'animate-pulse' : ''}`} />
                      {testDirectNotification.isPending ? 'Testando...' : '🧪 Teste Direto'}
                    </Button>
                  </div>

                  {/* Configuração de Inatividade */}
                  {telegramStatus?.isActive && (
                    <>
                    <div className="flex flex-col gap-3 pt-4 border-t">
                      <p className="text-sm font-medium">Alerta de Inatividade</p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm">Notificar se não operar por</p>
                        </div>
                        <select
                          className="px-3 py-1.5 border rounded-md text-sm"
                          value={telegramSettings?.inactivityDays || 7}
                          onChange={(e) => {
                            const days = parseInt(e.target.value);
                            updateTelegramSettings.mutate({
                              inactivityDays: days,
                            });
                          }}
                        >
                          <option value="3">3 dias</option>
                          <option value="7">7 dias</option>
                          <option value="14">14 dias</option>
                          <option value="30">30 dias</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm">Ativar alerta de inatividade</p>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={telegramSettings?.inactivityAlertEnabled || false}
                          onChange={(e) => {
                            updateTelegramSettings.mutate({
                              inactivityAlertEnabled: e.target.checked,
                            });
                          }}
                        />
                      </div>
                    </div>
                    </>
                  )}

                  {/* Relatórios Personalizados */}
                  {telegramStatus?.isActive && (
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      <p className="text-sm font-medium">Relatórios Personalizados</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            trpc.telegram.sendCustomReport.mutate({ days: 7 }, {
                              onSuccess: () => toast.success('📈 Relatório de 7 dias enviado!'),
                              onError: (error) => toast.error('Erro: ' + error.message),
                            });
                          }}
                        >
                          📅 Últimos 7 dias
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            trpc.telegram.sendCustomReport.mutate({ days: 30 }, {
                              onSuccess: () => toast.success('📈 Relatório de 30 dias enviado!'),
                              onError: (error) => toast.error('Erro: ' + error.message),
                            });
                          }}
                        >
                          📅 Últimos 30 dias
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            trpc.telegram.sendCustomReport.mutate({ days: 90 }, {
                              onSuccess: () => toast.success('📈 Relatório de 90 dias enviado!'),
                              onError: (error) => toast.error('Erro: ' + error.message),
                            });
                          }}
                        >
                          📅 Últimos 90 dias
                        </Button>
                      </div>
                    </div>
                  )}



                </div>

                {/* Seletor de Moeda para Conversão - SEMPRE VISÍVEL */}
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <p className="text-sm font-medium">Moeda para Conversão</p>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Moeda exibida junto com USD nas notificações Telegram</p>
                    </div>
                    <select
                      className="px-3 py-1.5 border rounded-md text-sm min-w-[120px]"
                      value={telegramSettings?.displayCurrency || 'BRL'}
                      onChange={(e) => {
                        updateTelegramSettings.mutate({
                          displayCurrency: e.target.value,
                        });
                      }}
                    >
                      <option value="BRL">🇧🇷 Real (R$)</option>
                      <option value="EUR">🇪🇺 Euro (€)</option>
                      <option value="GBP">🇬🇧 Libra (£)</option>
                      <option value="JPY">🇯🇵 Iene (¥)</option>
                      <option value="CAD">🇨🇦 Dólar Canadense (C$)</option>
                      <option value="AUD">🇦🇺 Dólar Australiano (A$)</option>
                      <option value="CHF">🇨🇭 Franco Suíço (CHF)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="font-medium">Ativar Notificações</p>
                    <p className="text-sm text-muted-foreground">
                      Habilitar todas as notificações Telegram
                    </p>
                  </div>
                  <Button
                    variant={telegramEnabled ? "default" : "outline"}
                    onClick={() => setTelegramEnabled(!telegramEnabled)}
                    size="sm"
                  >
                    {telegramEnabled ? t("alerts.enabled") : t("alerts.disabled")}
                  </Button>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={updateTelegramSettings.isPending}
                    className="w-full"
                  >
                    {updateTelegramSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </DashboardLayout>
  );
}
