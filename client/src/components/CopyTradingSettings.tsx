import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Filter,
  Save,
  Info,
  Clock,
  DollarSign,
  Target
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/_core/hooks/useAuth";

interface CopyTradingSettingsProps {
  selectedRelation: any;
  onRelationChange: (relation: any) => void;
  relations: any[];
}

interface Settings {
  // Gestão de Lote
  lotMode: 'exact' | 'multiplier' | 'fixed' | 'risk_percent';
  lotMultiplier: number;
  lotFixed: number;
  lotRiskPercent: number;
  
  // Stop Loss
  slMode: 'copy' | 'custom' | 'none';
  slPips: number;
  
  // Take Profit
  tpMode: 'copy' | 'custom' | 'none';
  tpPips: number;
  
  // Filtros
  allowedSymbols: string;
  blockedSymbols: string;
  tradingStartTime: string;
  tradingEndTime: string;
  
  // Gestão de Risco
  maxTrades: number;
  maxRiskPerTrade: number;
  maxDailyLoss: number;
  invertSignals: boolean;
  
  isActive: boolean;
}

export default function CopyTradingSettings({ selectedRelation, onRelationChange, relations }: CopyTradingSettingsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<Settings>({
    lotMode: 'exact',
    lotMultiplier: 1.00,
    lotFixed: 0.01,
    lotRiskPercent: 1.00,
    slMode: 'copy',
    slPips: 0,
    tpMode: 'copy',
    tpPips: 0,
    allowedSymbols: '',
    blockedSymbols: '',
    tradingStartTime: '00:00',
    tradingEndTime: '23:59',
    maxTrades: 10,
    maxRiskPerTrade: 5.00,
    maxDailyLoss: 0.00,
    invertSignals: false,
    isActive: true
  });

  // Carregar configurações
  useEffect(() => {
    if (!selectedRelation || !user?.email) return;
    
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/mt/copy/settings', {
          params: {
            user_email: user.email,
            master_account_id: selectedRelation.sourceAccountId,
            slave_account_id: selectedRelation.targetAccountId
          }
        });
        
        if (response.data.success && response.data.settings) {
          setSettings(response.data.settings);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [selectedRelation, user?.email]);

  // Salvar configurações
  const handleSave = async () => {
    if (!selectedRelation || !user?.email) {
      toast.error("Selecione uma relação Master/Slave primeiro");
      return;
    }
    
    try {
      setSaving(true);
      const response = await axios.post('/api/mt/copy/settings', {
        user_email: user.email,
        master_account_id: selectedRelation.sourceAccountId,
        slave_account_id: selectedRelation.targetAccountId,
        settings
      });
      
      if (response.data.success) {
        toast.success("Configurações salvas com sucesso!");
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedRelation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Copy Trading</CardTitle>
          <CardDescription>
            Selecione uma relação Master/Slave para configurar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Selecionar Relação</Label>
            <Select 
              value={selectedRelation?.id?.toString() || ""}
              onValueChange={(value) => {
                const relation = relations.find(r => r.id.toString() === value);
                onRelationChange(relation);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma relação Master/Slave" />
              </SelectTrigger>
              <SelectContent>
                {relations.map((relation) => (
                  <SelectItem key={relation.id} value={relation.id.toString()}>
                    {relation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Como configurar:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Selecione uma relação Master/Slave acima</li>
                  <li>Configure as opções de copy trading nas abas abaixo</li>
                  <li>Clique em "Salvar Configurações" para aplicar</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Copy Trading</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configurações de Copy Trading</CardTitle>
              <CardDescription>
                {selectedRelation.name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="active-switch">Ativo</Label>
              <Switch
                id="active-switch"
                checked={settings.isActive}
                onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lot" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="lot">
                <DollarSign className="h-4 w-4 mr-2" />
                Lote
              </TabsTrigger>
              <TabsTrigger value="sltp">
                <Target className="h-4 w-4 mr-2" />
                SL/TP
              </TabsTrigger>
              <TabsTrigger value="filters">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </TabsTrigger>
              <TabsTrigger value="time">
                <Clock className="h-4 w-4 mr-2" />
                Horário
              </TabsTrigger>
              <TabsTrigger value="risk">
                <Shield className="h-4 w-4 mr-2" />
                Risco
              </TabsTrigger>
            </TabsList>

            {/* Gestão de Lote */}
            <TabsContent value="lot" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Modo de Gestão de Lote</Label>
                  <Select
                    value={settings.lotMode}
                    onValueChange={(value: any) => setSettings({ ...settings, lotMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exact">Copiar Exato (100%)</SelectItem>
                      <SelectItem value="multiplier">Multiplicador</SelectItem>
                      <SelectItem value="fixed">Lote Fixo</SelectItem>
                      <SelectItem value="risk_percent">% do Saldo (Risco)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.lotMode === 'multiplier' && (
                  <div>
                    <Label>Multiplicador de Lote</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.lotMultiplier}
                      onChange={(e) => setSettings({ ...settings, lotMultiplier: parseFloat(e.target.value) || 1 })}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Ex: 0.5 = metade do lote, 2.0 = dobro do lote
                    </p>
                  </div>
                )}

                {settings.lotMode === 'fixed' && (
                  <div>
                    <Label>Lote Fixo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.lotFixed}
                      onChange={(e) => setSettings({ ...settings, lotFixed: parseFloat(e.target.value) || 0.01 })}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Sempre usar este lote, independente do Master
                    </p>
                  </div>
                )}

                {settings.lotMode === 'risk_percent' && (
                  <div>
                    <Label>% do Saldo para Risco</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.lotRiskPercent}
                      onChange={(e) => setSettings({ ...settings, lotRiskPercent: parseFloat(e.target.value) || 1 })}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Calcular lote baseado em % do saldo disponível
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Stop Loss e Take Profit */}
            <TabsContent value="sltp" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Stop Loss
                  </Label>
                  <Select
                    value={settings.slMode}
                    onValueChange={(value: any) => setSettings({ ...settings, slMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copy">Copiar do Master</SelectItem>
                      <SelectItem value="custom">Customizado (Pips)</SelectItem>
                      <SelectItem value="none">Sem Stop Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.slMode === 'custom' && (
                  <div>
                    <Label>Stop Loss em Pips</Label>
                    <Input
                      type="number"
                      value={settings.slPips}
                      onChange={(e) => setSettings({ ...settings, slPips: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}

                <Separator />

                <div>
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Take Profit
                  </Label>
                  <Select
                    value={settings.tpMode}
                    onValueChange={(value: any) => setSettings({ ...settings, tpMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copy">Copiar do Master</SelectItem>
                      <SelectItem value="custom">Customizado (Pips)</SelectItem>
                      <SelectItem value="none">Sem Take Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.tpMode === 'custom' && (
                  <div>
                    <Label>Take Profit em Pips</Label>
                    <Input
                      type="number"
                      value={settings.tpPips}
                      onChange={(e) => setSettings({ ...settings, tpPips: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Filtros de Símbolos */}
            <TabsContent value="filters" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Símbolos Permitidos</Label>
                  <Input
                    placeholder="Ex: EURUSD, GBPUSD, USDJPY (deixe vazio para todos)"
                    value={settings.allowedSymbols}
                    onChange={(e) => setSettings({ ...settings, allowedSymbols: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Separe por vírgula. Só estes símbolos serão copiados.
                  </p>
                </div>

                <div>
                  <Label>Símbolos Bloqueados</Label>
                  <Input
                    placeholder="Ex: XAUUSD, BTCUSD (deixe vazio para nenhum)"
                    value={settings.blockedSymbols}
                    onChange={(e) => setSettings({ ...settings, blockedSymbols: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Separe por vírgula. Estes símbolos NÃO serão copiados.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Horário de Trading */}
            <TabsContent value="time" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Defina o horário em que os trades devem ser copiados. Fora deste horário, nenhum trade será aberto.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horário Inicial</Label>
                    <Input
                      type="time"
                      value={settings.tradingStartTime}
                      onChange={(e) => setSettings({ ...settings, tradingStartTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Horário Final</Label>
                    <Input
                      type="time"
                      value={settings.tradingEndTime}
                      onChange={(e) => setSettings({ ...settings, tradingEndTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Gestão de Risco */}
            <TabsContent value="risk" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Máximo de Trades Simultâneos</Label>
                  <Input
                    type="number"
                    value={settings.maxTrades}
                    onChange={(e) => setSettings({ ...settings, maxTrades: parseInt(e.target.value) || 10 })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Número máximo de trades abertos ao mesmo tempo
                  </p>
                </div>

                <div>
                  <Label>Risco Máximo por Trade (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.maxRiskPerTrade}
                    onChange={(e) => setSettings({ ...settings, maxRiskPerTrade: parseFloat(e.target.value) || 5 })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Percentual máximo do saldo que pode ser arriscado por trade
                  </p>
                </div>

                <div>
                  <Label>Perda Máxima Diária ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.maxDailyLoss}
                    onChange={(e) => setSettings({ ...settings, maxDailyLoss: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Parar de copiar se atingir esta perda no dia (0 = desabilitado)
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Inverter Sinais</Label>
                    <p className="text-sm text-muted-foreground">
                      BUY vira SELL e SELL vira BUY
                    </p>
                  </div>
                  <Switch
                    checked={settings.invertSignals}
                    onCheckedChange={(checked) => setSettings({ ...settings, invertSignals: checked })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
