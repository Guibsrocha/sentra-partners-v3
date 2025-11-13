import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export default function LandingPageEditor() {
  const [config, setConfig] = useState<any>(null);
  const [vpsProducts, setVpsProducts] = useState<any[]>([]);
  const [expertAdvisors, setExpertAdvisors] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      // Carregar config
      const configRes = await fetch("/api/landing-config");
      const configData = await configRes.json();
      if (configData.success) setConfig(configData.config);

      // Carregar VPS
      const vpsRes = await fetch("/api/admin/vps");
      const vpsData = await vpsRes.json();
      if (vpsData.success) setVpsProducts(vpsData.data);

      // Carregar EAs
      const easRes = await fetch("/api/admin/expert-advisors");
      const easData = await easRes.json();
      if (easData.success) setExpertAdvisors(easData.data);

      // Carregar Planos
      const plansRes = await fetch("/api/admin/subscription-plans");
      const plansData = await plansRes.json();
      if (plansData.success) {
        // Converter features de JSON string para array
        const plans = plansData.data.map((p: any) => ({
          ...p,
          features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
        }));
        setSubscriptionPlans(plans);
      }

      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/landing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Configuração salva!");
      } else {
        toast.error("Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const saveVPS = async (vps: any) => {
    try {
      const url = vps.id ? `/api/admin/vps/${vps.id}` : "/api/admin/vps";
      const method = vps.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vps),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(vps.id ? "VPS atualizado!" : "VPS criado!");
        loadAll();
      }
    } catch (error) {
      toast.error("Erro ao salvar VPS");
    }
  };

  const deleteVPS = async (id: number) => {
    if (!confirm("Deletar este VPS?")) return;
    try {
      const res = await fetch(`/api/admin/vps/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("VPS deletado!");
        loadAll();
      }
    } catch (error) {
      toast.error("Erro ao deletar");
    }
  };

  const saveEA = async (ea: any) => {
    try {
      const url = ea.id ? `/api/admin/expert-advisors/${ea.id}` : "/api/admin/expert-advisors";
      const method = ea.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ea),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ea.id ? "EA atualizado!" : "EA criado!");
        loadAll();
      }
    } catch (error) {
      toast.error("Erro ao salvar EA");
    }
  };

  const deleteEA = async (id: number) => {
    if (!confirm("Deletar este EA?")) return;
    try {
      const res = await fetch(`/api/admin/expert-advisors/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("EA deletado!");
        loadAll();
      }
    } catch (error) {
      toast.error("Erro ao deletar");
    }
  };

  const savePlan = async (plan: any) => {
    try {
      const url = plan.id ? `/api/admin/subscription-plans/${plan.id}` : "/api/admin/subscription-plans";
      const method = plan.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features : []
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(plan.id ? "Plano atualizado!" : "Plano criado!");
        loadAll();
      }
    } catch (error) {
      toast.error("Erro ao salvar plano");
    }
  };

  const deletePlan = async (id: number) => {
    if (!confirm("Deletar este plano?")) return;
    try {
      const res = await fetch(`/api/admin/subscription-plans/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Plano deletado!");
        loadAll();
      }
    } catch (error) {
      toast.error("Erro ao deletar");
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    </div>
  );

  if (!config) return (
    <div className="p-8 text-center">
      <p className="text-red-500">Erro ao carregar configuração</p>
      <Button onClick={loadAll} className="mt-4">Tentar Novamente</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Editor da Landing Page</h1>
            <p className="text-muted-foreground">Configure todos os elementos da sua página inicial</p>
          </div>
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Todas as Alterações"}
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="textos" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="textos">Textos & Hero</TabsTrigger>
            <TabsTrigger value="vps">VPS ({vpsProducts.length})</TabsTrigger>
            <TabsTrigger value="eas">Expert Advisors ({expertAdvisors.length})</TabsTrigger>
            <TabsTrigger value="planos">Planos ({subscriptionPlans.length})</TabsTrigger>
            <TabsTrigger value="outros">Estatísticas</TabsTrigger>
          </TabsList>

          {/* ABA TEXTOS */}
          <TabsContent value="textos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seção Hero (Topo da Página)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Título (Parte 1)</label>
                    <Input
                      value={config.heroTitle || ""}
                      onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                      placeholder="Tudo que você sempre"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Texto Destacado (colorido)</label>
                    <Input
                      value={config.heroHighlight || ""}
                      onChange={(e) => setConfig({ ...config, heroHighlight: e.target.value })}
                      placeholder="quis saber"
                      className="border-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Subtítulo</label>
                  <Textarea
                    value={config.heroSubtitle || ""}
                    onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                    rows={2}
                    placeholder="...mas suas planilhas nunca te contaram."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={config.heroDescription || ""}
                    onChange={(e) => setConfig({ ...config, heroDescription: e.target.value })}
                    rows={3}
                    placeholder="Descrição do produto/serviço"
                  />
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Métricas do Dashboard (Hero)</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Lucro Total</label>
                      <Input
                        value={config.heroMetricProfit || ""}
                        onChange={(e) => setConfig({ ...config, heroMetricProfit: e.target.value })}
                        placeholder="+$127K"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total de Trades</label>
                      <Input
                        value={config.heroMetricTrades || ""}
                        onChange={(e) => setConfig({ ...config, heroMetricTrades: e.target.value })}
                        placeholder="2,847"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Win Rate</label>
                      <Input
                        value={config.heroMetricWinRate || ""}
                        onChange={(e) => setConfig({ ...config, heroMetricWinRate: e.target.value })}
                        placeholder="73%"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Profit Factor</label>
                      <Input
                        value={config.heroMetricProfitFactor || ""}
                        onChange={(e) => setConfig({ ...config, heroMetricProfitFactor: e.target.value })}
                        placeholder="1.8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Títulos das Seções</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Título Seção VPS</label>
                    <Input
                      value={config.vpsSectionTitle || ""}
                      onChange={(e) => setConfig({ ...config, vpsSectionTitle: e.target.value })}
                      placeholder="VPS de Alta Performance"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição Seção VPS</label>
                    <Input
                      value={config.vpsSectionDescription || ""}
                      onChange={(e) => setConfig({ ...config, vpsSectionDescription: e.target.value })}
                      placeholder="Servidores otimizados para trading 24/7"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Título Seção EAs</label>
                    <Input
                      value={config.easSectionTitle || ""}
                      onChange={(e) => setConfig({ ...config, easSectionTitle: e.target.value })}
                      placeholder="Expert Advisors Profissionais"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição Seção EAs</label>
                    <Input
                      value={config.easSectionDescription || ""}
                      onChange={(e) => setConfig({ ...config, easSectionDescription: e.target.value })}
                      placeholder="Robôs de trading testados e otimizados"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Título Seção Planos</label>
                    <Input
                      value={config.plansSectionTitle || ""}
                      onChange={(e) => setConfig({ ...config, plansSectionTitle: e.target.value })}
                      placeholder="Planos de Assinatura"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição Seção Planos</label>
                    <Input
                      value={config.plansSectionDescription || ""}
                      onChange={(e) => setConfig({ ...config, plansSectionDescription: e.target.value })}
                      placeholder="Acesso completo à plataforma de copy trading"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call to Action Final</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    value={config.footerCtaTitle || ""}
                    onChange={(e) => setConfig({ ...config, footerCtaTitle: e.target.value })}
                    placeholder="Pronto para Transformar Seu Trading?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={config.footerCtaDescription || ""}
                    onChange={(e) => setConfig({ ...config, footerCtaDescription: e.target.value })}
                    rows={2}
                    placeholder="Junte-se a milhares de traders profissionais..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA VPS */}
          <TabsContent value="vps" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gerenciar VPS</h2>
              <Button onClick={() => setVpsProducts([...vpsProducts, { 
                name: "Novo VPS", 
                description: "", 
                price: 0, 
                ram: "2 GB", 
                cpu: "1 vCPU", 
                storage: "20 GB SSD", 
                bandwidth: "1 TB",
                active: true 
              }])}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar VPS
              </Button>
            </div>

            {vpsProducts.map((vps, index) => (
              <Card key={vps.id || index}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    VPS #{index + 1} - {vps.name}
                    <Button variant="destructive" size="sm" onClick={() => deleteVPS(vps.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input
                        value={vps.name || ""}
                        onChange={(e) => {
                          const updated = [...vpsProducts];
                          updated[index].name = e.target.value;
                          setVpsProducts(updated);
                        }}
                        placeholder="VPS Pro"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Preço (USD)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={vps.price || ""}
                        onChange={(e) => {
                          const updated = [...vpsProducts];
                          updated[index].price = parseFloat(e.target.value);
                          setVpsProducts(updated);
                        }}
                        placeholder="35.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={vps.description || ""}
                      onChange={(e) => {
                        const updated = [...vpsProducts];
                        updated[index].description = e.target.value;
                        setVpsProducts(updated);
                      }}
                      rows={2}
                      placeholder="Descrição do plano VPS"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">RAM</label>
                      <Input
                        value={vps.ram || ""}
                        onChange={(e) => {
                          const updated = [...vpsProducts];
                          updated[index].ram = e.target.value;
                          setVpsProducts(updated);
                        }}
                        placeholder="4 GB"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CPU</label>
                      <Input
                        value={vps.cpu || ""}
                        onChange={(e) => {
                          const updated = [...vpsProducts];
                          updated[index].cpu = e.target.value;
                          setVpsProducts(updated);
                        }}
                        placeholder="2 vCPU"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Storage</label>
                      <Input
                        value={vps.storage || ""}
                        onChange={(e) => {
                          const updated = [...vpsProducts];
                          updated[index].storage = e.target.value;
                          setVpsProducts(updated);
                        }}
                        placeholder="60 GB SSD"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bandwidth</label>
                      <Input
                        value={vps.bandwidth || ""}
                        onChange={(e) => {
                          const updated = [...vpsProducts];
                          updated[index].bandwidth = e.target.value;
                          setVpsProducts(updated);
                        }}
                        placeholder="2 TB"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={vps.active !== false}
                        onChange={(e) => {
                          const updated = [...vpsProducts];
                          updated[index].active = e.target.checked;
                          setVpsProducts(updated);
                        }}
                      />
                      <span className="text-sm font-medium">Ativo</span>
                    </label>
                  </div>
                  <Button onClick={() => saveVPS(vps)} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar VPS
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ABA EAs */}
          <TabsContent value="eas" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gerenciar Expert Advisors</h2>
              <Button onClick={() => setExpertAdvisors([...expertAdvisors, {
                name: "Novo EA",
                description: "",
                price: 0,
                platform: "MT4/MT5",
                strategy: "",
                timeframe: "",
                active: true
              }])}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar EA
              </Button>
            </div>

            {expertAdvisors.map((ea, index) => (
              <Card key={ea.id || index}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    EA #{index + 1} - {ea.name}
                    <Button variant="destructive" size="sm" onClick={() => deleteEA(ea.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input
                        value={ea.name || ""}
                        onChange={(e) => {
                          const updated = [...expertAdvisors];
                          updated[index].name = e.target.value;
                          setExpertAdvisors(updated);
                        }}
                        placeholder="Scalper Pro"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Preço (USD)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={ea.price || ""}
                        onChange={(e) => {
                          const updated = [...expertAdvisors];
                          updated[index].price = parseFloat(e.target.value);
                          setExpertAdvisors(updated);
                        }}
                        placeholder="199.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={ea.description || ""}
                      onChange={(e) => {
                        const updated = [...expertAdvisors];
                        updated[index].description = e.target.value;
                        setExpertAdvisors(updated);
                      }}
                      rows={2}
                      placeholder="Descrição do EA"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Plataforma</label>
                      <Input
                        value={ea.platform || ""}
                        onChange={(e) => {
                          const updated = [...expertAdvisors];
                          updated[index].platform = e.target.value;
                          setExpertAdvisors(updated);
                        }}
                        placeholder="MT4/MT5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Estratégia</label>
                      <Input
                        value={ea.strategy || ""}
                        onChange={(e) => {
                          const updated = [...expertAdvisors];
                          updated[index].strategy = e.target.value;
                          setExpertAdvisors(updated);
                        }}
                        placeholder="Scalping"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Timeframe</label>
                      <Input
                        value={ea.timeframe || ""}
                        onChange={(e) => {
                          const updated = [...expertAdvisors];
                          updated[index].timeframe = e.target.value;
                          setExpertAdvisors(updated);
                        }}
                        placeholder="M1, M5"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ea.active !== false}
                        onChange={(e) => {
                          const updated = [...expertAdvisors];
                          updated[index].active = e.target.checked;
                          setExpertAdvisors(updated);
                        }}
                      />
                      <span className="text-sm font-medium">Ativo</span>
                    </label>
                  </div>
                  <Button onClick={() => saveEA(ea)} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar EA
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ABA PLANOS */}
          <TabsContent value="planos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gerenciar Planos de Assinatura</h2>
              <Button onClick={() => setSubscriptionPlans([...subscriptionPlans, {
                name: "Novo Plano",
                slug: "",
                price: 0,
                features: [],
                popular: false,
                active: true
              }])}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Plano
              </Button>
            </div>

            {subscriptionPlans.map((plan, index) => (
              <Card key={plan.id || index}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Plano #{index + 1} - {plan.name}
                    <Button variant="destructive" size="sm" onClick={() => deletePlan(plan.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input
                        value={plan.name || ""}
                        onChange={(e) => {
                          const updated = [...subscriptionPlans];
                          updated[index].name = e.target.value;
                          setSubscriptionPlans(updated);
                        }}
                        placeholder="Básico"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Slug (URL)</label>
                      <Input
                        value={plan.slug || ""}
                        onChange={(e) => {
                          const updated = [...subscriptionPlans];
                          updated[index].slug = e.target.value;
                          setSubscriptionPlans(updated);
                        }}
                        placeholder="basico"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Preço/mês (centavos)</label>
                      <Input
                        type="number"
                        value={plan.price || ""}
                        onChange={(e) => {
                          const updated = [...subscriptionPlans];
                          updated[index].price = parseInt(e.target.value);
                          setSubscriptionPlans(updated);
                        }}
                        placeholder="4700 (R$ 47,00)"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Features (uma por linha)</label>
                    <Textarea
                      value={Array.isArray(plan.features) ? plan.features.join('\n') : ''}
                      onChange={(e) => {
                        const updated = [...subscriptionPlans];
                        updated[index].features = e.target.value.split('\n').filter(f => f.trim());
                        setSubscriptionPlans(updated);
                      }}
                      rows={5}
                      placeholder="Copy Trading (1 conta master)&#10;Dashboard básico&#10;Suporte por email"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={plan.popular || false}
                        onChange={(e) => {
                          const updated = [...subscriptionPlans];
                          updated[index].popular = e.target.checked;
                          setSubscriptionPlans(updated);
                        }}
                      />
                      <span className="text-sm font-medium">Mais Popular</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={plan.active !== false}
                        onChange={(e) => {
                          const updated = [...subscriptionPlans];
                          updated[index].active = e.target.checked;
                          setSubscriptionPlans(updated);
                        }}
                      />
                      <span className="text-sm font-medium">Ativo</span>
                    </label>
                  </div>
                  <Button onClick={() => savePlan(plan)} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ABA OUTROS */}
          <TabsContent value="outros" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Página</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Trades Journaled</label>
                    <Input
                      value={config.statTradesJournaled || ""}
                      onChange={(e) => setConfig({ ...config, statTradesJournaled: e.target.value })}
                      placeholder="1.2B+"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sessões Backtestadas</label>
                    <Input
                      value={config.statBacktestedSessions || ""}
                      onChange={(e) => setConfig({ ...config, statBacktestedSessions: e.target.value })}
                      placeholder="50K+"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trades Compartilhados</label>
                    <Input
                      value={config.statTradesShared || ""}
                      onChange={(e) => setConfig({ ...config, statTradesShared: e.target.value })}
                      placeholder="2.5M+"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Traders Ativos</label>
                    <Input
                      value={config.statTradersOnBoard || ""}
                      onChange={(e) => setConfig({ ...config, statTradersOnBoard: e.target.value })}
                      placeholder="12K+"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Botão flutuante para salvar */}
      <div className="fixed bottom-6 right-6">
        <Button onClick={saveConfig} disabled={saving} size="lg" className="shadow-2xl">
          <Save className="h-5 w-5 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}