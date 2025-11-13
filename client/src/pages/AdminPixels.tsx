import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Target, Save } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminPixels() {
  const queryClient = useQueryClient();

  // Estados para cada pixel
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [facebookPixelEnabled, setFacebookPixelEnabled] = useState(false);
  const [googleAdsId, setGoogleAdsId] = useState("");
  const [googleAdsEnabled, setGoogleAdsEnabled] = useState(false);
  const [taboolaPixelId, setTaboolaPixelId] = useState("");
  const [taboolaPixelEnabled, setTaboolaPixelEnabled] = useState(false);
  const [kwaiPixelId, setKwaiPixelId] = useState("");
  const [kwaiPixelEnabled, setKwaiPixelEnabled] = useState(false);
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [tiktokPixelEnabled, setTiktokPixelEnabled] = useState(false);

  // Buscar pixels atuais
  const { data: pixels, isLoading } = useQuery({
    queryKey: ['/api/landing-page-pixels'],
  });

  // Carregar dados quando disponíveis
  useEffect(() => {
    if (pixels) {
      setFacebookPixelId(pixels.facebookPixelId || "");
      setFacebookPixelEnabled(pixels.facebookPixelEnabled || false);
      setGoogleAdsId(pixels.googleAdsId || "");
      setGoogleAdsEnabled(pixels.googleAdsEnabled || false);
      setTaboolaPixelId(pixels.taboolaPixelId || "");
      setTaboolaPixelEnabled(pixels.taboolaPixelEnabled || false);
      setKwaiPixelId(pixels.kwaiPixelId || "");
      setKwaiPixelEnabled(pixels.kwaiPixelEnabled || false);
      setTiktokPixelId(pixels.tiktokPixelId || "");
      setTiktokPixelEnabled(pixels.tiktokPixelEnabled || false);
    }
  }, [pixels]);

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/landing-page-pixels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao salvar pixels');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/landing-page-pixels'] });
      toast.success("Pixels salvos com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      facebookPixelId,
      facebookPixelEnabled,
      googleAdsId,
      googleAdsEnabled,
      taboolaPixelId,
      taboolaPixelEnabled,
      kwaiPixelId,
      kwaiPixelEnabled,
      tiktokPixelId,
      tiktokPixelEnabled,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Pixels de Tracking
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure os pixels de tracking para medir conversões de anúncios em toda a plataforma.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração de Pixels</CardTitle>
            <CardDescription>
              Os pixels serão carregados automaticamente na landing page e no app para todos os usuários.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Facebook Pixel */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">👥 Facebook Pixel</p>
                  <p className="text-sm text-muted-foreground">Meta Ads (Facebook e Instagram)</p>
                </div>
                <Switch 
                  checked={facebookPixelEnabled}
                  onCheckedChange={setFacebookPixelEnabled}
                />
              </div>
              <Input
                type="text"
                placeholder="Ex: 1234567890123456"
                value={facebookPixelId}
                onChange={(e) => setFacebookPixelId(e.target.value)}
                className="font-mono text-sm"
                disabled={!facebookPixelEnabled}
              />
            </div>

            {/* Google Ads */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">🔍 Google Ads</p>
                  <p className="text-sm text-muted-foreground">Google Ads / Analytics</p>
                </div>
                <Switch 
                  checked={googleAdsEnabled}
                  onCheckedChange={setGoogleAdsEnabled}
                />
              </div>
              <Input
                type="text"
                placeholder="Ex: AW-1234567890"
                value={googleAdsId}
                onChange={(e) => setGoogleAdsId(e.target.value)}
                className="font-mono text-sm"
                disabled={!googleAdsEnabled}
              />
            </div>

            {/* Taboola Pixel */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">📊 Taboola Pixel</p>
                  <p className="text-sm text-muted-foreground">Taboola Native Ads</p>
                </div>
                <Switch 
                  checked={taboolaPixelEnabled}
                  onCheckedChange={setTaboolaPixelEnabled}
                />
              </div>
              <Input
                type="text"
                placeholder="Ex: 1234567"
                value={taboolaPixelId}
                onChange={(e) => setTaboolaPixelId(e.target.value)}
                className="font-mono text-sm"
                disabled={!taboolaPixelEnabled}
              />
            </div>

            {/* Kwai Ads */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">🎵 Kwai Ads</p>
                  <p className="text-sm text-muted-foreground">Kwai Advertising</p>
                </div>
                <Switch 
                  checked={kwaiPixelEnabled}
                  onCheckedChange={setKwaiPixelEnabled}
                />
              </div>
              <Input
                type="text"
                placeholder="Ex: kwai_pixel_123456"
                value={kwaiPixelId}
                onChange={(e) => setKwaiPixelId(e.target.value)}
                className="font-mono text-sm"
                disabled={!kwaiPixelEnabled}
              />
            </div>

            {/* TikTok Pixel */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">🎥 TikTok Pixel</p>
                  <p className="text-sm text-muted-foreground">TikTok for Business</p>
                </div>
                <Switch 
                  checked={tiktokPixelEnabled}
                  onCheckedChange={setTiktokPixelEnabled}
                />
              </div>
              <Input
                type="text"
                placeholder="Ex: ABCDEFGHIJKLMNOP"
                value={tiktokPixelId}
                onChange={(e) => setTiktokPixelId(e.target.value)}
                className="font-mono text-sm"
                disabled={!tiktokPixelEnabled}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">📊 Eventos de Conversão Automáticos:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ <strong>PageView</strong> - Carregamento de páginas</li>
                <li>✅ <strong>CompleteRegistration</strong> - Cadastro concluído</li>
                <li>✅ <strong>AddPaymentInfo</strong> - Checkout iniciado</li>
                <li>✅ <strong>Purchase</strong> - Pagamento confirmado</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
