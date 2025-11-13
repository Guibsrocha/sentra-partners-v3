import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export default function CompleteLandingEditor() {
  const [config, setConfig] = useState<any>(null);
  const [vpsProducts, setVpsProducts] = useState<any[]>([]);
  const [expertAdvisors, setExpertAdvisors] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const res = await fetch("/api/landing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Configuração salva!");
      } else {
        toast.error("Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro ao salvar");
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
        body: JSON.stringify(plan),
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

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!config) return <div className="p-8">Erro ao carregar configuração</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Editor Completo da Landing Page</h1>

      <Tabs defaultValue="textos" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="textos">Textos</TabsTrigger>
          <TabsTrigger value="vps">VPS ({vpsProducts.length})</TabsTrigger>
          <TabsTrigger value="eas">EAs ({expertAdvisors.length})</TabsTrigger>
          <TabsTrigger value="planos">Planos ({subscriptionPlans.length})</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        {/* ABA TEXTOS */}
        <TabsContent value="textos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seção Hero (Topo)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={config.heroTitle || ""}
                  onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Destaque (texto colorido)</label>
                <Input
                  value={config.heroHighlight || ""}
                  onChange={(e) => setConfig({ ...config, heroHighlight: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subtítulo</label>
                <Textarea
                  value={config.heroSubtitle || ""}
                  onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Texto do Botão CTA</label>
                <Input
                  value={config.heroCtaText || ""}
                  onChange={(e) => setConfig({ ...config, heroCtaText: e.target.value })}
                />
              </div>
              <Button onClick={saveConfig}><Save className="mr-2 h-4 w-4" /> Salvar Hero</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Títulos de Seções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">VPS - Título</label>
                <Input
                  value={config.vpsSectionTitle || ""}
                  onChange={(e) => setConfig({ ...config, vpsSectionTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">VPS - Descrição</label>
                <Input
                  value={config.vpsSectionDescription || ""}
                  onChange={(e) => setConfig({ ...config, vpsSectionDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">EAs - Título</label>
                <Input
                  value={config.easSectionTitle || ""}
                  onChange={(e) => setConfig({ ...config, easSectionTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">EAs - Descrição</label>
                <Input
                  value={config.easSectionDescription || ""}
                  onChange={(e) => setConfig({ ...config, easSectionDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Planos - Título</label>
                <Input
                  value={config.plansSectionTitle || ""}
                  onChange={(e) => setConfig({ ...config, plansSectionTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Planos - Descrição</label>
                <Input
                  value={config.plansSectionDescription || ""}
                  onChange={(e) => setConfig({ ...config, plansSectionDescription: e.target.value })}
                />
              </div>
              <Button onClick={saveConfig}><Save className="mr-2 h-4 w-4" /> Salvar Títulos</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA VPS */}
        <TabsContent value="vps" className="space-y-6">
          {vpsProducts.map((vps, index) => (
            <Card key={vps.id || index}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  VPS #{index + 1}
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
                      placeholder="2GB"
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
                      placeholder="1 vCPU"
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
                      placeholder="20GB SSD"
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
                      placeholder="1TB"
                    />
                  </div>
                </div>
                <Button onClick={() => saveVPS(vps)}><Save className="mr-2 h-4 w-4" /> Salvar VPS</Button>
              </CardContent>
            </Card>
          ))}
          <Button onClick={() => setVpsProducts([...vpsProducts, { name: "", description: "", price: 0, ram: "", cpu: "", storage: "", bandwidth: "", eas_limit: 3, active: true }])}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar VPS
          </Button>
        </TabsContent>

        {/* ABA EAs */}
        <TabsContent value="eas" className="space-y-6">
          {expertAdvisors.map((ea, index) => (
            <Card key={ea.id || index}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  EA #{index + 1}
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
                <Button onClick={() => saveEA(ea)}><Save className="mr-2 h-4 w-4" /> Salvar EA</Button>
              </CardContent>
            </Card>
          ))}
          <Button onClick={() => setExpertAdvisors([...expertAdvisors, { name: "", description: "", price: 0, platform: "MT4/MT5", strategy: "", timeframe: "", active: true }])}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar EA
          </Button>
        </TabsContent>

        {/* ABA PLANOS */}
        <TabsContent value="planos" className="space-y-6">
          {subscriptionPlans.map((plan, index) => (
            <Card key={plan.id || index}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Plano #{index + 1}
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
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
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
                      placeholder="4700"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Features (um por linha)</label>
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
                    <span className="text-sm font-medium">Popular</span>
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
                <Button onClick={() => savePlan(plan)}><Save className="mr-2 h-4 w-4" /> Salvar Plano</Button>
              </CardContent>
            </Card>
          ))}
          <Button onClick={() => setSubscriptionPlans([...subscriptionPlans, { name: "", slug: "", price: 0, features: [], popular: false, active: true }])}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Plano
          </Button>
        </TabsContent>

        {/* ABA OUTROS */}
        <TabsContent value="outros" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Stat 1 - Valor</label>
                  <Input
                    value={config.stat1Value || ""}
                    onChange={(e) => setConfig({ ...config, stat1Value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stat 1 - Label</label>
                  <Input
                    value={config.stat1Label || ""}
                    onChange={(e) => setConfig({ ...config, stat1Label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stat 2 - Valor</label>
                  <Input
                    value={config.stat2Value || ""}
                    onChange={(e) => setConfig({ ...config, stat2Value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stat 2 - Label</label>
                  <Input
                    value={config.stat2Label || ""}
                    onChange={(e) => setConfig({ ...config, stat2Label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stat 3 - Valor</label>
                  <Input
                    value={config.stat3Value || ""}
                    onChange={(e) => setConfig({ ...config, stat3Value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stat 3 - Label</label>
                  <Input
                    value={config.stat3Label || ""}
                    onChange={(e) => setConfig({ ...config, stat3Label: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={saveConfig}><Save className="mr-2 h-4 w-4" /> Salvar Estatísticas</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTA Final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={config.footerCtaTitle || ""}
                  onChange={(e) => setConfig({ ...config, footerCtaTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={config.footerCtaDescription || ""}
                  onChange={(e) => setConfig({ ...config, footerCtaDescription: e.target.value })}
                  rows={2}
                />
              </div>
              <Button onClick={saveConfig}><Save className="mr-2 h-4 w-4" /> Salvar CTA</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
