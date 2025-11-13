import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

interface VPSPlan {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface ExpertAdvisor {
  name: string;
  price: number;
  winRate: string;
  timeframe: string;
  description: string;
}

interface SubscriptionPlan {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface ResourceCard {
  title: string;
  description: string;
  icon: string;
}

interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface LandingConfig {
  logoUrl: string;
  paymentGateway: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroDescription: string;
  heroMetricProfit: string;
  heroMetricTrades: string;
  heroMetricWinRate: string;
  heroMetricProfitFactor: string;
  statTradesJournaled: string;
  statBacktestedSessions: string;
  statTradesShared: string;
  statTradersOnBoard: string;
  vpsPlans: VPSPlan[];
  expertAdvisors: ExpertAdvisor[];
  subscriptionPlans: SubscriptionPlan[];
  copyTradingTitle: string;
  copyTradingDescription: string;
  analyticsTitle: string;
  analyticsDescription: string;
  footerCtaTitle: string;
  footerCtaDescription: string;
  vpsSectionTitle: string;
  vpsSectionDescription: string;
  easSectionTitle: string;
  easSectionDescription: string;
  plansSectionTitle: string;
  plansSectionDescription: string;
  resourcesSectionTitle: string;
  resourcesSectionDescription: string;
  resourceCards: ResourceCard[];
  howItWorksSectionTitle: string;
  howItWorksSectionDescription: string;
  howItWorksSteps: HowItWorksStep[];
  resultsSectionTitle: string;
  resultsSectionDescription: string;
  faqSectionTitle: string;
  faqSectionDescription: string;
  faqItems: FAQItem[];
}

export default function LandingPageEditor() {
  const [config, setConfig] = useState<LandingConfig>({
    logoUrl: "/sentra-logo-horizontal.png",
    paymentGateway: "stripe",
    heroTitle: "Tudo que você sempre",
    heroHighlight: "quis saber",
    heroSubtitle: "...mas suas planilhas nunca te contaram.",
    heroDescription: "A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com o poder do copy trading, expert advisors e análise avançada.",
    heroMetricProfit: "+$127K",
    heroMetricTrades: "2,847",
    heroMetricWinRate: "73%",
    heroMetricProfitFactor: "1.8",
    statTradesJournaled: "1.2B+",
    statBacktestedSessions: "50K+",
    statTradesShared: "2.5M+",
    statTradersOnBoard: "12K+",
    vpsPlans: [
      { name: "VPS Starter", price: 15, features: ["2 GB RAM", "1 vCPU", "30 GB SSD", "Uptime 99.9%", "Windows Server"], popular: false },
      { name: "VPS Pro", price: 35, features: ["4 GB RAM", "2 vCPU", "60 GB SSD", "Uptime 99.9%", "Windows Server"], popular: true },
      { name: "VPS Enterprise", price: 75, features: ["8 GB RAM", "4 vCPU", "120 GB SSD", "Uptime 99.99%", "Windows Server"], popular: false },
    ],
    expertAdvisors: [
      { name: "Scalper Pro", price: 199, winRate: "78%", timeframe: "M1, M5", description: "EA de scalping para operações rápidas" },
      { name: "Trend Master", price: 249, winRate: "72%", timeframe: "H1, H4, D1", description: "Segue tendências de médio prazo" },
      { name: "Grid Trader", price: 179, winRate: "68%", timeframe: "H1, H4", description: "Estratégia de grid avançada" },
      { name: "News Trader", price: 299, winRate: "75%", timeframe: "M5, M15", description: "Opera em eventos de notícias" },
    ],
    subscriptionPlans: [
      { name: "Básico", price: 47, features: ["Copy Trading (1 conta master)", "Dashboard básico", "Suporte por email", "Atualizações mensais"], popular: false },
      { name: "Profissional", price: 97, features: ["Copy Trading (ilimitado)", "Dashboard avançado", "Todos os EAs inclusos", "Suporte prioritário 24/7", "Análise de risco avançada"], popular: true },
      { name: "Enterprise", price: 197, features: ["Tudo do Profissional", "VPS Starter incluído", "Consultoria mensal 1h", "EA customizado", "API access"], popular: false },
    ],
    copyTradingTitle: "Copy Trading Poderoso e Automatizado",
    copyTradingDescription: "Você foca em operar enquanto nós focamos em te ajudar a melhorar. Com copy trading automatizado, fazemos o trabalho pesado por você.",
    analyticsTitle: "Analise suas estatísticas de trading",
    analyticsDescription: "Entenda quais erros você cometeu, se arriscou mais do que planejado e muito mais estatísticas específicas de cada trade.",
    footerCtaTitle: "Pronto para Transformar Seu Trading?",
    footerCtaDescription: "Junte-se a milhares de traders profissionais que já estão usando nossa plataforma",
    vpsSectionTitle: "VPS de Alta Performance",
    vpsSectionDescription: "Servidores otimizados para trading 24/7",
    easSectionTitle: "Expert Advisors Profissionais",
    easSectionDescription: "Robôs de trading testados e otimizados",
    plansSectionTitle: "Planos de Assinatura",
    plansSectionDescription: "Acesso completo à plataforma de copy trading",
    resourcesSectionTitle: "Por que escolher a Sentra Partners?",
    resourcesSectionDescription: "Tudo que você precisa para dominar o mercado",
    resourceCards: [
      { title: "Copy Trading Automatizado", description: "Configure em minutos e copie trades de traders profissionais para múltiplas contas simultaneamente", icon: "bot" },
      { title: "Análise Avançada", description: "Métricas detalhadas, histórico completo e monitoramento em tempo real de todas as suas operações", icon: "chart" },
      { title: "Expert Advisors Profissionais", description: "Robôs de trading desenvolvidos e testados por traders experientes com estratégias comprovadas", icon: "trending" },
      { title: "VPS de Alta Performance", description: "Execute seus EAs 24/7 com latência ultra-baixa e garantia de uptime de 99.9%", icon: "shield" },
    ],
    howItWorksSectionTitle: "Com a Sentra Partners, trading fica simples",
    howItWorksSectionDescription: "Veja o passo a passo abaixo",
    howItWorksSteps: [
      { step: "Etapa - 1", title: "Crie sua Conta", description: "Cadastre-se gratuitamente e configure suas preferências de trading" },
      { step: "Etapa - 2", title: "Conecte suas Contas", description: "Vincule suas contas MT4/MT5 de forma segura e rápida" },
      { step: "Etapa - 3", title: "Configure Copy Trading", description: "Escolha traders para copiar ou configure seus próprios EAs" },
      { step: "Etapa - 4", title: "Monitore Resultados", description: "Acompanhe métricas em tempo real e otimize sua estratégia" },
    ],
    resultsSectionTitle: "Nossos Resultados",
    resultsSectionDescription: "Confira alguns de nossos números",
    faqSectionTitle: "Perguntas Frequentes",
    faqSectionDescription: "Tire suas dúvidas com as perguntas mais frequentes sobre a Sentra Partners",
    faqItems: [
      { question: "O que é Copy Trading e como funciona?", answer: "Copy Trading é um sistema que permite copiar automaticamente as operações de traders experientes para sua conta. Na Sentra Partners, você configura em minutos e pode copiar para múltiplas contas simultaneamente, com suporte para MT4 e MT5." },
      { question: "Quais são os diferenciais da Sentra Partners?", answer: "Oferecemos uma solução completa: copy trading automatizado, análise avançada com métricas detalhadas, expert advisors profissionais, VPS de alta performance e suporte 24/7. Tudo integrado em uma única plataforma." },
      { question: "Como funciona a análise de trades?", answer: "Nossa plataforma fornece métricas detalhadas como win rate, profit factor, drawdown e muito mais. Você acompanha o histórico completo de todas as operações em tempo real, com filtros avançados para análise profunda." },
      { question: "O que está incluído nos planos?", answer: "Cada plano oferece diferentes níveis de recursos. O Básico inclui copy trading para 1 conta master, o Profissional oferece copy trading ilimitado com todos os EAs inclusos, e o Enterprise adiciona VPS, consultoria e EA customizado." },
      { question: "Como funciona o suporte?", answer: "Oferecemos suporte por email no plano Básico e suporte prioritário 24/7 nos planos Profissional e Enterprise. Nossa equipe está sempre pronta para ajudar você a maximizar seus resultados." },
    ],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar configuração do backend
    fetch("/api/landing-config")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setConfig(data.config);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar configuração:", err);
        toast.error("Erro ao carregar configuração da landing page");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/landing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        throw new Error("Erro ao salvar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const addVPSPlan = () => {
    setConfig({
      ...config,
      vpsPlans: [...config.vpsPlans, { name: "Novo Plano", price: 0, features: [], popular: false }],
    });
  };

  const removeVPSPlan = (index: number) => {
    setConfig({
      ...config,
      vpsPlans: config.vpsPlans.filter((_, i) => i !== index),
    });
  };

  const updateVPSPlan = (index: number, field: keyof VPSPlan, value: any) => {
    const updated = [...config.vpsPlans];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, vpsPlans: updated });
  };

  const addVPSFeature = (planIndex: number) => {
    const updated = [...config.vpsPlans];
    updated[planIndex].features.push("Nova feature");
    setConfig({ ...config, vpsPlans: updated });
  };

  const removeVPSFeature = (planIndex: number, featureIndex: number) => {
    const updated = [...config.vpsPlans];
    updated[planIndex].features = updated[planIndex].features.filter((_, i) => i !== featureIndex);
    setConfig({ ...config, vpsPlans: updated });
  };

  const updateVPSFeature = (planIndex: number, featureIndex: number, value: string) => {
    const updated = [...config.vpsPlans];
    updated[planIndex].features[featureIndex] = value;
    setConfig({ ...config, vpsPlans: updated });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Editor da Landing Page</h1>
          <p className="text-gray-600">Edite todas as informações da página inicial</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Logo Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Logo da Landing Page</CardTitle>
          <CardDescription>Configure a logo que aparecerá no header e footer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.logoUrl && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <img 
                  src={config.logoUrl} 
                  alt="Logo Preview" 
                  className="h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="text-sm text-muted-foreground">
                  Preview da logo atual
                </div>
              </div>
            )}
            <div>
              <Label>URL da Logo</Label>
              <Input
                value={config.logoUrl}
                onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                placeholder="/logo-full.png ou https://..."
              />
              <p className="text-sm text-muted-foreground mt-2">
                Insira o caminho local (ex: /logo-full.png) ou URL completa da logo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="vps">VPS</TabsTrigger>
          <TabsTrigger value="eas">EAs</TabsTrigger>
          <TabsTrigger value="pricing">Preços</TabsTrigger>
          <TabsTrigger value="sections">Seções</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="gateway">Gateway</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Seção Hero</CardTitle>
              <CardDescription>Edite o título, subtítulo e métricas da seção principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Título (parte 1)</Label>
                  <Input
                    value={config.heroTitle}
                    onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                    placeholder="Tudo que você sempre"
                  />
                </div>
                <div>
                  <Label>Título Destacado</Label>
                  <Input
                    value={config.heroHighlight}
                    onChange={(e) => setConfig({ ...config, heroHighlight: e.target.value })}
                    placeholder="quis saber"
                  />
                </div>
              </div>

              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={config.heroSubtitle}
                  onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                  placeholder="...mas suas planilhas nunca te contaram."
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={config.heroDescription}
                  onChange={(e) => setConfig({ ...config, heroDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Métricas do Dashboard</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label>Lucro Total</Label>
                    <Input
                      value={config.heroMetricProfit}
                      onChange={(e) => setConfig({ ...config, heroMetricProfit: e.target.value })}
                      placeholder="+$127K"
                    />
                  </div>
                  <div>
                    <Label>Trades</Label>
                    <Input
                      value={config.heroMetricTrades}
                      onChange={(e) => setConfig({ ...config, heroMetricTrades: e.target.value })}
                      placeholder="2,847"
                    />
                  </div>
                  <div>
                    <Label>Win Rate</Label>
                    <Input
                      value={config.heroMetricWinRate}
                      onChange={(e) => setConfig({ ...config, heroMetricWinRate: e.target.value })}
                      placeholder="73%"
                    />
                  </div>
                  <div>
                    <Label>Profit Factor</Label>
                    <Input
                      value={config.heroMetricProfitFactor}
                      onChange={(e) => setConfig({ ...config, heroMetricProfitFactor: e.target.value })}
                      placeholder="1.8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Section */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>Edite os números da seção de estatísticas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>Trades Registrados</Label>
                  <Input
                    value={config.statTradesJournaled}
                    onChange={(e) => setConfig({ ...config, statTradesJournaled: e.target.value })}
                    placeholder="1.2B+"
                  />
                </div>
                <div>
                  <Label>Sessões Backtestadas</Label>
                  <Input
                    value={config.statBacktestedSessions}
                    onChange={(e) => setConfig({ ...config, statBacktestedSessions: e.target.value })}
                    placeholder="50K+"
                  />
                </div>
                <div>
                  <Label>Trades Compartilhados</Label>
                  <Input
                    value={config.statTradesShared}
                    onChange={(e) => setConfig({ ...config, statTradesShared: e.target.value })}
                    placeholder="2.5M+"
                  />
                </div>
                <div>
                  <Label>Traders Ativos</Label>
                  <Input
                    value={config.statTradersOnBoard}
                    onChange={(e) => setConfig({ ...config, statTradersOnBoard: e.target.value })}
                    placeholder="12K+"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VPS Plans */}
        <TabsContent value="vps">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Planos VPS</h2>
                <p className="text-gray-600">Gerencie os planos de VPS</p>
              </div>
              <Button onClick={addVPSPlan} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Plano
              </Button>
            </div>

            {config.vpsPlans.map((plan, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Plano {index + 1}</CardTitle>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVPSPlan(index)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nome do Plano</Label>
                      <Input
                        value={plan.name}
                        onChange={(e) => updateVPSPlan(index, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Preço (USD)</Label>
                      <Input
                        type="number"
                        value={plan.price}
                        onChange={(e) => updateVPSPlan(index, "price", Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plan.popular || false}
                          onChange={(e) => updateVPSPlan(index, "popular", e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span>Mais Popular</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Features</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addVPSFeature(index)}
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar Feature
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {plan.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateVPSFeature(index, fIndex, e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVPSFeature(index, fIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other tabs would follow similar pattern */}
        <TabsContent value="eas">
          <Card>
            <CardHeader>
              <CardTitle>Expert Advisors</CardTitle>
              <CardDescription>Em desenvolvimento...</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Assinatura</CardTitle>
              <CardDescription>Em desenvolvimento...</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Textos das Seções</CardTitle>
              <CardDescription>Edite os textos das seções Copy Trading, Analytics, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Título Copy Trading</Label>
                <Input
                  value={config.copyTradingTitle}
                  onChange={(e) => setConfig({ ...config, copyTradingTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição Copy Trading</Label>
                <Textarea
                  value={config.copyTradingDescription}
                  onChange={(e) => setConfig({ ...config, copyTradingDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Título Analytics</Label>
                <Input
                  value={config.analyticsTitle}
                  onChange={(e) => setConfig({ ...config, analyticsTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição Analytics</Label>
                <Textarea
                  value={config.analyticsDescription}
                  onChange={(e) => setConfig({ ...config, analyticsDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Footer CTA</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={config.footerCtaTitle}
                      onChange={(e) => setConfig({ ...config, footerCtaTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={config.footerCtaDescription}
                      onChange={(e) => setConfig({ ...config, footerCtaDescription: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Títulos das Seções</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Título Seção VPS</Label>
                    <Input
                      value={config.vpsSectionTitle}
                      onChange={(e) => setConfig({ ...config, vpsSectionTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição Seção VPS</Label>
                    <Input
                      value={config.vpsSectionDescription}
                      onChange={(e) => setConfig({ ...config, vpsSectionDescription: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Título Seção EAs</Label>
                    <Input
                      value={config.easSectionTitle}
                      onChange={(e) => setConfig({ ...config, easSectionTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição Seção EAs</Label>
                    <Input
                      value={config.easSectionDescription}
                      onChange={(e) => setConfig({ ...config, easSectionDescription: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Título Seção Planos</Label>
                    <Input
                      value={config.plansSectionTitle}
                      onChange={(e) => setConfig({ ...config, plansSectionTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição Seção Planos</Label>
                    <Input
                      value={config.plansSectionDescription}
                      onChange={(e) => setConfig({ ...config, plansSectionDescription: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo Adicional */}
        <TabsContent value="content">
          <div className="space-y-6">
            {/* Seção Recursos */}
            <Card>
              <CardHeader>
                <CardTitle>Seção "Por que escolher?"</CardTitle>
                <CardDescription>Edite os cards de recursos da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título da Seção</Label>
                  <Input
                    value={config.resourcesSectionTitle}
                    onChange={(e) => setConfig({ ...config, resourcesSectionTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição da Seção</Label>
                  <Input
                    value={config.resourcesSectionDescription}
                    onChange={(e) => setConfig({ ...config, resourcesSectionDescription: e.target.value })}
                  />
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Cards de Recursos</h4>
                  {config.resourceCards.map((card, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Card {index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newCards = config.resourceCards.filter((_, i) => i !== index);
                            setConfig({ ...config, resourceCards: newCards });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={card.title}
                          onChange={(e) => {
                            const newCards = [...config.resourceCards];
                            newCards[index].title = e.target.value;
                            setConfig({ ...config, resourceCards: newCards });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={card.description}
                          onChange={(e) => {
                            const newCards = [...config.resourceCards];
                            newCards[index].description = e.target.value;
                            setConfig({ ...config, resourceCards: newCards });
                          }}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Ícone</Label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={card.icon}
                          onChange={(e) => {
                            const newCards = [...config.resourceCards];
                            newCards[index].icon = e.target.value;
                            setConfig({ ...config, resourceCards: newCards });
                          }}
                        >
                          <option value="bot">Bot (Copy Trading)</option>
                          <option value="chart">Gráfico (Análise)</option>
                          <option value="trending">Trending (EAs)</option>
                          <option value="shield">Escudo (VPS)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConfig({
                        ...config,
                        resourceCards: [...config.resourceCards, { title: "Novo Recurso", description: "Descrição do recurso", icon: "bot" }]
                      });
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Card
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Seção Como Funciona */}
            <Card>
              <CardHeader>
                <CardTitle>Seção "Como Funciona"</CardTitle>
                <CardDescription>Edite os passos do processo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título da Seção</Label>
                  <Input
                    value={config.howItWorksSectionTitle}
                    onChange={(e) => setConfig({ ...config, howItWorksSectionTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição da Seção</Label>
                  <Input
                    value={config.howItWorksSectionDescription}
                    onChange={(e) => setConfig({ ...config, howItWorksSectionDescription: e.target.value })}
                  />
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Passos</h4>
                  {config.howItWorksSteps.map((step, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">{step.step}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSteps = config.howItWorksSteps.filter((_, i) => i !== index);
                            setConfig({ ...config, howItWorksSteps: newSteps });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label>Label da Etapa</Label>
                        <Input
                          value={step.step}
                          onChange={(e) => {
                            const newSteps = [...config.howItWorksSteps];
                            newSteps[index].step = e.target.value;
                            setConfig({ ...config, howItWorksSteps: newSteps });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={step.title}
                          onChange={(e) => {
                            const newSteps = [...config.howItWorksSteps];
                            newSteps[index].title = e.target.value;
                            setConfig({ ...config, howItWorksSteps: newSteps });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => {
                            const newSteps = [...config.howItWorksSteps];
                            newSteps[index].description = e.target.value;
                            setConfig({ ...config, howItWorksSteps: newSteps });
                          }}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextNum = config.howItWorksSteps.length + 1;
                      setConfig({
                        ...config,
                        howItWorksSteps: [...config.howItWorksSteps, { step: `Etapa - ${nextNum}`, title: "Novo Passo", description: "Descrição do passo" }]
                      });
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Passo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Seção Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>Seção "Resultados"</CardTitle>
                <CardDescription>Edite os títulos da seção de resultados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título da Seção</Label>
                  <Input
                    value={config.resultsSectionTitle}
                    onChange={(e) => setConfig({ ...config, resultsSectionTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição da Seção</Label>
                  <Input
                    value={config.resultsSectionDescription}
                    onChange={(e) => setConfig({ ...config, resultsSectionDescription: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Seção FAQ</CardTitle>
                <CardDescription>Edite as perguntas frequentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título da Seção</Label>
                  <Input
                    value={config.faqSectionTitle}
                    onChange={(e) => setConfig({ ...config, faqSectionTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição da Seção</Label>
                  <Input
                    value={config.faqSectionDescription}
                    onChange={(e) => setConfig({ ...config, faqSectionDescription: e.target.value })}
                  />
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Perguntas e Respostas</h4>
                  {config.faqItems.map((faq, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">FAQ {index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newFaqs = config.faqItems.filter((_, i) => i !== index);
                            setConfig({ ...config, faqItems: newFaqs });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label>Pergunta</Label>
                        <Input
                          value={faq.question}
                          onChange={(e) => {
                            const newFaqs = [...config.faqItems];
                            newFaqs[index].question = e.target.value;
                            setConfig({ ...config, faqItems: newFaqs });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Resposta</Label>
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => {
                            const newFaqs = [...config.faqItems];
                            newFaqs[index].answer = e.target.value;
                            setConfig({ ...config, faqItems: newFaqs });
                          }}
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConfig({
                        ...config,
                        faqItems: [...config.faqItems, { question: "Nova pergunta?", answer: "Resposta da pergunta" }]
                      });
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar FAQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gateway de Pagamento */}
        <TabsContent value="gateway">
          <Card>
            <CardHeader>
              <CardTitle>Gateway de Pagamento</CardTitle>
              <CardDescription>Configure o processador de pagamentos da landing page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Gateway</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={config.paymentGateway}
                    onChange={(e) => setConfig({ ...config, paymentGateway: e.target.value })}
                  >
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="nowpayments">NOWPayments (Crypto)</option>
                  </select>
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecione o gateway de pagamento que será usado na landing page
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2 shadow-2xl">
          <Save className="h-5 w-5" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

