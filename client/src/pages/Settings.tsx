import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Settings as SettingsIcon, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Settings() {
  const { isAuthenticated, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'pt-BR');
  const [selectedTimezone, setSelectedTimezone] = useState('America/Sao_Paulo');

  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateLanguage = trpc.user.updateLanguage.useMutation({
    onSuccess: () => {
      toast.success("Idioma alterado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao alterar idioma: " + error.message);
    },
  });

  const updateTimezone = trpc.settings.updateTimezone.useMutation({
    onSuccess: () => {
      toast.success("Fuso horário alterado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao alterar fuso horário: " + error.message);
    },
  });

  useEffect(() => {
    if (settings?.language) {
      setSelectedLanguage(settings.language);
      i18n.changeLanguage(settings.language);
    }
    if (settings?.timezone) {
      setSelectedTimezone(settings.timezone);
    }
  }, [settings, i18n]);

  const handleLanguageChange = async (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    await i18n.changeLanguage(newLanguage);
    
    try {
      await updateLanguage.mutateAsync({ language: newLanguage });
    } catch (error) {
      console.error("Erro ao salvar idioma:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">
            {t('settings.loginRequired')}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.general')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.language')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.languageDesc')}
                </p>
              </div>
              <Select 
                value={selectedLanguage} 
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">🇧🇷 Português (BR)</SelectItem>
                  <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                  <SelectItem value="es-ES">🇪🇸 Español (ES)</SelectItem>
                  <SelectItem value="fr-FR">🇫🇷 Français (FR)</SelectItem>
                  <SelectItem value="de-DE">🇩🇪 Deutsch (DE)</SelectItem>
                  <SelectItem value="it-IT">🇮🇹 Italiano (IT)</SelectItem>
                  <SelectItem value="ja-JP">🇯🇵 日本語 (JP)</SelectItem>
                  <SelectItem value="zh-CN">🇨🇳 中文 (CN)</SelectItem>
                  <SelectItem value="ko-KR">🇰🇷 한국어 (KR)</SelectItem>
                  <SelectItem value="ru-RU">🇷🇺 Русский (RU)</SelectItem>
                  <SelectItem value="ar-SA">🇸🇦 العربية (SA)</SelectItem>
                  <SelectItem value="hi-IN">🇮🇳 हिंदी (IN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Fuso Horário</p>
                <p className="text-sm text-muted-foreground">
                  Escolha o fuso horário para exibição de eventos
                </p>
              </div>
              <Select 
                value={selectedTimezone} 
                onValueChange={(tz) => {
                  setSelectedTimezone(tz);
                  updateTimezone.mutate({ timezone: tz });
                }}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Selecione o fuso horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">🇧🇷 Brasil (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">🇺🇸 Nova York (GMT-5)</SelectItem>
                  <SelectItem value="America/Chicago">🇺🇸 Chicago (GMT-6)</SelectItem>
                  <SelectItem value="America/Los_Angeles">🇺🇸 Los Angeles (GMT-8)</SelectItem>
                  <SelectItem value="Europe/London">🇬🇧 Londres (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">🇫🇷 Paris (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Berlin">🇩🇪 Berlim (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Moscow">🇷🇺 Moscou (GMT+3)</SelectItem>
                  <SelectItem value="Asia/Dubai">🇦🇪 Dubai (GMT+4)</SelectItem>
                  <SelectItem value="Asia/Tokyo">🇯🇵 Tóquio (GMT+9)</SelectItem>
                  <SelectItem value="Asia/Shanghai">🇨🇳 Xangai (GMT+8)</SelectItem>
                  <SelectItem value="Asia/Hong_Kong">🇭🇰 Hong Kong (GMT+8)</SelectItem>
                  <SelectItem value="Asia/Singapore">🇸🇬 Singapura (GMT+8)</SelectItem>
                  <SelectItem value="Australia/Sydney">🇦🇺 Sydney (GMT+11)</SelectItem>
                  <SelectItem value="Pacific/Auckland">🇳🇿 Auckland (GMT+13)</SelectItem>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>


          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
