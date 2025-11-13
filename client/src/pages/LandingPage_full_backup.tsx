import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Bot, MousePointerClick, BarChart3, Check, TrendingUp, Users, Shield, Globe, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useCountUp } from "@/hooks/useCountUp";
import { LanguagePopup } from "@/components/LanguagePopup";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isIntersecting } = useIntersectionObserver();
  
  return (
    <div 
      ref={ref} 
      className={`${className} ${isIntersecting ? 'animate-fade-in-up opacity-0' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isIntersecting } = useIntersectionObserver();
  const delayClass = delay === 100 ? 'animation-delay-100' : delay === 200 ? 'animation-delay-200' : delay === 300 ? 'animation-delay-300' : '';
  
  return (
    <div 
      ref={ref} 
      className={`${isIntersecting ? `animate-scale-in ${delayClass} opacity-0` : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}

function CounterCard({ end, label, prefix = "" }: { end: number; label: string; prefix?: string }) {
  // Simplificado para evitar problemas de animação
  return (
    <div className="text-center">
      <div className="text-6xl md:text-8xl font-bold text-gradient mb-4">
        {prefix}{end.toLocaleString()}+
      </div>
      <p className="text-xl text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [language, setLanguage] = useState('pt-BR');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState({
    logoUrl: "/sentra-logo-horizontal.png",
    paymentGateway: "stripe",
    heroTitle: "Tudo que você sempre quis",
    heroHighlight: "saber sobre trading",
    heroSubtitle: "...mas suas planilhas nunca te contaram.",
    heroDescription: "A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com copy trading, expert advisors e análise avançada.",
    heroMetricProfit: "+$127K",
    heroMetricTrades: "2,847",
    heroMetricWinRate: "73%",
    heroMetricProfitFactor: "1.8",
    statTradesJournaled: "1.2B+",
    statBacktestedSessions: "50K+",
    statTradesShared: "2.5M+",
    statTradersOnBoard: "12K+",
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
    resourceCards: [],
    howItWorksSectionTitle: "Com a Sentra Partners, trading fica simples",
    howItWorksSectionDescription: "Veja o passo a passo abaixo",
    howItWorksSteps: [],
    resultsSectionTitle: "Nossos Resultados",
    resultsSectionDescription: "Confira alguns de nossos números",
    faqSectionTitle: "Perguntas Frequentes",
    faqSectionDescription: "Tire suas dúvidas com as perguntas mais frequentes sobre a Sentra Partners",
    faqItems: [
      {
        question: "Como funciona o copy trading?",
        answer: "O copy trading permite que você copie automaticamente as operações de traders profissionais, replicando suas estratégias em sua própria conta."
      },
      {
        question: "Posso cancelar minha assinatura a qualquer momento?",
        answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento ou fidelidade."
      },
      {
        question: "Os Expert Advisors são seguros?",
        answer: "Todos os nossos EAs passam por testes rigorosos e são verificados por nossa equipe técnica antes de serem disponibilizados."
      },
      {
        question: "Qual suporte técnico está disponível?",
        answer: "Oferecemos suporte por email para todos os planos, suporte prioritário para o plano Profissional e suporte 24/7 para o plano Enterprise."
      },
      {
        question: "Posso usar minha própria VPS?",
        answer: "Sim, você pode usar sua própria VPS ou contratar uma de nossos planos. Oferecemos desconto para clientes do plano Enterprise."
      }
    ],
    vpsPlans: [
      { name: "VPS Starter", price: 15, features: ["1GB RAM", "1 CPU Core", "10GB SSD", "Suporte 24/7"] },
      { name: "VPS Professional", price: 25, features: ["2GB RAM", "2 CPU Cores", "20GB SSD", "Backup automático"] },
      { name: "VPS Enterprise", price: 45, features: ["4GB RAM", "4 CPU Cores", "40GB SSD", "Monitoreamento avançado"] }
    ],
    expertAdvisors: [
      { name: "Scalp Pro", price: 97, features: ["Scalping automatizado", "Risco baixo", "ROI 15%"], description: "EA especializado em operações de scalping" },
      { name: "Trend Master", price: 147, features: ["Análise de tendência", "Stop loss inteligente", "ROI 22%"], description: "EA para acompanhar tendências" },
      { name: "Grid Bot", price: 197, features: ["Estratégia grid", "Mercados laterais", "ROI 18%"], description: "Bot para mercados em consolidação" }
    ],
    subscriptionPlans: [
      { name: "Básico", price: 47, features: ["Copy Trading (1 conta master)", "Dashboard básico", "Suporte por email", "Atualizações mensais"], popular: false },
      { name: "Profissional", price: 97, features: ["Copy Trading (ilimitado)", "Dashboard avançado", "Todos os EAs inclusos", "Suporte prioritário 24/7", "Análise de risco avançada"], popular: true },
      { name: "Enterprise", price: 197, features: ["Tudo do Profissional", "VPS Starter incluído", "Consultoria mensal 1h", "EA customizado", "API access"], popular: false },
    ]
  });

  const { translate, translateObject } = useTranslation(language);
  const { formatWithConversion } = useCurrencyConversion(currency);
  const [, setLocation] = useLocation();

  const handleStartNow = () => {
    // Rolar suavemente até a seção de planos
    const plansSection = document.getElementById('planos');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBuyPlan = (planName: string) => {
    // Redirecionar para checkout com plano selecionado
    setLocation(`/checkout?plan=${encodeURIComponent(planName)}`);
  };

  useEffect(() => {
    // Função para carregar todos os dados
    const loadAllData = async () => {
      setIsLoading(true);
      
      try {
        // Carregar configuração e produtos em paralelo
        const [configRes, productsRes] = await Promise.all([
          fetch("/api/landing-config"),
          fetch("/api/landing-products")
        ]);
        
        const [configData, productsData] = await Promise.all([
          configRes.json(),
          productsRes.json()
        ]);
        
        // Processar configuração com dados de fallback
        let finalConfig = {
          faqItems: [
            {
              question: "Como funciona o copy trading?",
              answer: "O copy trading permite que você copie automaticamente as operações de traders profissionais, replicando suas estratégias em sua própria conta."
            },
            {
              question: "Posso cancelar minha assinatura a qualquer momento?",
              answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento ou fidelidade."
            },
            {
              question: "Os Expert Advisors são seguros?",
              answer: "Todos os nossos EAs passam por testes rigorosos e são verificados por nossa equipe técnica antes de serem disponibilizados."
            },
            {
              question: "Qual suporte técnico está disponível?",
              answer: "Oferecemos suporte por email para todos os planos, suporte prioritário para o plano Profissional e suporte 24/7 para o plano Enterprise."
            },
            {
              question: "Posso usar minha própria VPS?",
              answer: "Sim, você pode usar sua própria VPS ou contratar uma de nossos planos. Oferecemos desconto para clientes do plano Enterprise."
            }
          ],
          vpsPlans: [
            { name: "VPS Starter", price: 15, features: ["1GB RAM", "1 CPU Core", "10GB SSD", "Suporte 24/7"] },
            { name: "VPS Professional", price: 25, features: ["2GB RAM", "2 CPU Cores", "20GB SSD", "Backup automático"] },
            { name: "VPS Enterprise", price: 45, features: ["4GB RAM", "4 CPU Cores", "40GB SSD", "Monitoreamento avançado"] }
          ],
          expertAdvisors: [
            { name: "Scalp Pro", price: 97, features: ["Scalping automatizado", "Risco baixo", "ROI 15%"], winRate: "76%", timeframe: "M1-M5", description: "EA especializado em operações de scalping" },
            { name: "Trend Master", price: 147, features: ["Análise de tendência", "Stop loss inteligente", "ROI 22%"], winRate: "82%", timeframe: "H1-H4", description: "EA para acompanhar tendências" },
            { name: "Grid Bot", price: 197, features: ["Estratégia grid", "Mercados laterais", "ROI 18%"], winRate: "79%", timeframe: "H1-D1", description: "Bot para mercados em consolidação" }
          ],
          subscriptionPlans: [
            { name: "Básico", price: 47, features: ["Copy Trading (1 conta master)", "Dashboard básico", "Suporte por email", "Atualizações mensais"], popular: false },
            { name: "Profissional", price: 97, features: ["Copy Trading (ilimitado)", "Dashboard avançado", "Todos os EAs inclusos", "Suporte prioritário 24/7", "Análise de risco avançada"], popular: true },
            { name: "Enterprise", price: 197, features: ["Tudo do Profissional", "VPS Starter incluído", "Consultoria mensal 1h", "EA customizado", "API access"], popular: false },
          ]
        };

        // Se a API retornar dados válidos, mesclar com os dados de fallback
        if (configData.success && configData.config) {
          finalConfig = {
            ...finalConfig,
            ...configData.config
          };
          
          // Se não for português, traduzir
          if (language !== 'pt-BR') {
            const translated = await translateObject(finalConfig, language);
            finalConfig = translated;
          }
          
          // Adicionar produtos aos dados da configuração
          if (productsData.success && productsData.data) {
            finalConfig = {
              ...finalConfig,
              vpsPlans: productsData.data.vpsProducts?.length > 0 ? productsData.data.vpsProducts : finalConfig.vpsPlans,
              expertAdvisors: productsData.data.expertAdvisors?.length > 0 ? productsData.data.expertAdvisors : finalConfig.expertAdvisors,
              subscriptionPlans: productsData.data.subscriptionPlans?.length > 0 ? productsData.data.subscriptionPlans : finalConfig.subscriptionPlans
            };
          }
          
          setConfig(finalConfig);
        }
        
      } catch (err) {
        console.error("Erro ao carregar dados da landing page:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, []); // Carregar dados apenas uma vez

  // Traduzir produtos quando idioma mudar
  useEffect(() => {
    const translateProducts = async () => {
      if (language === 'pt-BR') return; // Não precisa traduzir se for português
      
      // Traduzir VPS
      if (config.vpsPlans && config.vpsPlans.length > 0) {
        const translatedVps = await Promise.all(
          config.vpsPlans.map(async (vps: any) => {
            const translated = await translateObject(vps, language);
            return translated;
          })
        );
        
        // Traduzir EAs
        const translatedEas = await Promise.all(
          (config.expertAdvisors || []).map(async (ea: any) => {
            const translated = await translateObject(ea, language);
            return translated;
          })
        );
        
        // Traduzir Planos
        const translatedPlans = await Promise.all(
          (config.subscriptionPlans || []).map(async (plan: any) => {
            const translated = await translateObject(plan, language);
            return translated;
          })
        );
        
        setConfig(prev => ({
          ...prev,
          vpsPlans: translatedVps,
          expertAdvisors: translatedEas,
          subscriptionPlans: translatedPlans,
        }));
      }
    };
    
    translateProducts();
  }, [language, config.vpsPlans?.length, config.expertAdvisors?.length, config.subscriptionPlans?.length]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LanguagePopup 
        onLanguageSelect={setLanguage} 
        onCurrencySelect={setCurrency}
      />
      {/* Header/Navegação */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={config.logoUrl} alt="Sentra Partners" className="h-12" />
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-sm hover:text-primary transition-colors">Início</a>
              <a href="#recursos" className="text-sm hover:text-primary transition-colors">Recursos</a>
              <a href="#como-funciona" className="text-sm hover:text-primary transition-colors">Como Funciona</a>
              <a href="#planos" className="text-sm hover:text-primary transition-colors">Planos</a>
            </nav>

            <Button onClick={handleStartNow} className="gradient-primary text-white font-semibold">
              Começar Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary animate-fade-in">
            <Zap className="w-3 h-3 mr-2" />
            Copy Trading 3.0 está disponível
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up">
            {config.heroTitle}
            <br />
            <span className="text-gradient">{config.heroHighlight}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
            {config.heroDescription}
          </p>

          <Button onClick={handleStartNow} size="lg" className="gradient-primary text-white font-semibold text-lg px-8 py-6 animate-fade-in-up animation-delay-200">
            Começar Agora
          </Button>

          {/* Mockup Dashboard */}
          <div className="mt-16 relative animate-fade-in-up animation-delay-300">
            <div className="glass-card glow-border rounded-2xl p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">{config.heroMetricProfit}</div>
                  <div className="text-sm text-muted-foreground">Lucro Total</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-500">{config.heroMetricTrades}</div>
                  <div className="text-sm text-muted-foreground">Trades</div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-500">{config.heroMetricWinRate}</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-500">{config.heroMetricProfitFactor}</div>
                  <div className="text-sm text-muted-foreground">Profit Factor</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Dashboard de Trading em Tempo Real</div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção "Por que escolher a Sentra Partners?" */}
      <section id="recursos" className="py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{config.resourcesSectionTitle}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {config.resourcesSectionDescription}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {config.resourceCards?.map((card, index) => {
              const iconMap = {
                bot: Bot,
                chart: BarChart3,
                trending: TrendingUp,
                shield: Shield,
              };
              const Icon = iconMap[card.icon as keyof typeof iconMap] || Bot;
              const isGradient = card.icon === 'bot' || card.icon === 'shield';
              
              return (
                <AnimatedCard key={index} delay={index * 100}>
                  <Card className="glass-card glow-border hover:scale-105 transition-transform h-full">
                    <CardHeader>
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                        isGradient ? 'gradient-primary' : 'gradient-card border border-primary/30'
                      }`}>
                        <Icon className={`w-8 h-8 ${isGradient ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <CardTitle className="text-2xl">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {card.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Seção "Como Funciona" */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{config.howItWorksSectionTitle}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {config.howItWorksSectionDescription}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {config.howItWorksSteps?.map((item, index) => (
              <AnimatedCard key={index} delay={index * 100}>
                <Card className="glass-card glow-border text-center hover:scale-105 transition-transform h-full">
                  <CardHeader>
                    <Badge variant="outline" className="mx-auto mb-4 border-primary/50 text-primary">
                      {item.step}
                    </Badge>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Seção "Nossos Resultados" */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{config.resultsSectionTitle}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {config.resultsSectionDescription}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <CounterCard end={12000} label="Traders Ativos" prefix="" />
            <CounterCard end={2500000} label="Trades Compartilhados" prefix="" />
          </div>
        </div>
      </section>

      {/* Seção "VPS Plans" - ULTRA SIMPLES */}
      <section id="vps" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">VPS de Alta Performance</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Servidores otimizados para trading 24/7
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* VPS Starter */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-4">VPS Starter</h3>
              <div className="text-3xl font-bold mb-4">$15<span className="text-base font-normal">/mês</span></div>
              <ul className="space-y-2 mb-6">
                <li>1GB RAM</li>
                <li>1 CPU Core</li>
                <li>10GB SSD</li>
                <li>Suporte 24/7</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Contratar VPS
              </button>
            </div>

            {/* VPS Professional */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-4">VPS Professional</h3>
              <div className="text-3xl font-bold mb-4">$25<span className="text-base font-normal">/mês</span></div>
              <ul className="space-y-2 mb-6">
                <li>2GB RAM</li>
                <li>2 CPU Cores</li>
                <li>20GB SSD</li>
                <li>Backup automático</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Contratar VPS
              </button>
            </div>

            {/* VPS Enterprise */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-4">VPS Enterprise</h3>
              <div className="text-3xl font-bold mb-4">$45<span className="text-base font-normal">/mês</span></div>
              <ul className="space-y-2 mb-6">
                <li>4GB RAM</li>
                <li>4 CPU Cores</li>
                <li>40GB SSD</li>
                <li>Monitoreamento avançado</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Contratar VPS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção "Expert Advisors" - ULTRA SIMPLES */}
      <section id="eas" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Expert Advisors Profissionais</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Robôs de trading testados e otimizados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Scalp Pro */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-2">Scalp Pro</h3>
              <div className="text-sm text-gray-600 mb-4">Win Rate: 76% | Timeframe: M1-M5</div>
              <div className="text-3xl font-bold mb-4">$97<span className="text-base font-normal"> pagamento único</span></div>
              <ul className="space-y-2 mb-6">
                <li>Scalping automatizado</li>
                <li>Risco baixo</li>
                <li>ROI 15%</li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                Comprar EA
              </button>
            </div>

            {/* Trend Master */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-2">Trend Master</h3>
              <div className="text-sm text-gray-600 mb-4">Win Rate: 82% | Timeframe: H1-H4</div>
              <div className="text-3xl font-bold mb-4">$147<span className="text-base font-normal"> pagamento único</span></div>
              <ul className="space-y-2 mb-6">
                <li>Análise de tendência</li>
                <li>Stop loss inteligente</li>
                <li>ROI 22%</li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                Comprar EA
              </button>
            </div>

            {/* Grid Bot */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-2">Grid Bot</h3>
              <div className="text-sm text-gray-600 mb-4">Win Rate: 79% | Timeframe: H1-D1</div>
              <div className="text-3xl font-bold mb-4">$197<span className="text-base font-normal"> pagamento único</span></div>
              <ul className="space-y-2 mb-6">
                <li>Estratégia grid</li>
                <li>Mercados laterais</li>
                <li>ROI 18%</li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                Comprar EA
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção "Planos de Assinatura" - ULTRA SIMPLES */}
      <section id="planos" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Planos de Assinatura</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Acesso completo à plataforma de copy trading
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Plano Básico */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-2">Básico</h3>
              <div className="text-3xl font-bold mb-4">$47<span className="text-base font-normal">/mês</span></div>
              <ul className="space-y-2 mb-6">
                <li>Copy Trading (1 conta master)</li>
                <li>Dashboard básico</li>
                <li>Suporte por email</li>
                <li>Atualizações mensais</li>
              </ul>
              <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                Escolher Plano
              </button>
            </div>

            {/* Plano Profissional (Popular) */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">Mais Popular</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Profissional</h3>
              <div className="text-3xl font-bold mb-4">$97<span className="text-base font-normal">/mês</span></div>
              <ul className="space-y-2 mb-6">
                <li>Copy Trading (ilimitado)</li>
                <li>Dashboard avançado</li>
                <li>Todos os EAs inclusos</li>
                <li>Suporte prioritário 24/7</li>
                <li>Análise de risco avançada</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Escolher Plano
              </button>
            </div>

            {/* Plano Enterprise */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <div className="text-3xl font-bold mb-4">$197<span className="text-base font-normal">/mês</span></div>
              <ul className="space-y-2 mb-6">
                <li>Tudo do Profissional</li>
                <li>VPS Starter incluído</li>
                <li>Consultoria mensal 1h</li>
                <li>EA customizado</li>
                <li>API access</li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                Escolher Plano
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection>
            <Card className="glass-card glow-border max-w-4xl mx-auto text-center p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Pronto para Transformar <span className="text-gradient">Seu Trading?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Junte-se a milhares de traders profissionais que já estão usando nossa plataforma
              </p>
              <Button onClick={handleStartNow} size="lg" className="gradient-primary text-white font-semibold text-lg px-8 py-6">
                Começar Agora
              </Button>
              <p className="text-sm text-muted-foreground mt-6">
                ⚡️ 126 pessoas se inscreveram na Sentra Partners nas últimas 4 horas
              </p>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
              FAQ - Alguma Dúvida?
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{config.faqSectionTitle}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {config.faqSectionDescription}
            </p>
          </AnimatedSection>

          <div className="space-y-4">
            {config.faqItems?.map((faq, index) => (
              <AnimatedCard key={index} delay={index * 50}>
                <Card 
                  className="glass-card glow-border cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {faq.question}
                      <span className="text-2xl">{openFaq === index ? "−" : "+"}</span>
                    </CardTitle>
                  </CardHeader>
                  {openFaq === index && (
                    <CardContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  )}
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/40">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={config.logoUrl} alt="Sentra Partners" className="h-14" />
            </div>

            {/* Language & Currency Selectors */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    localStorage.setItem('preferred-language', e.target.value);
                  }}
                  className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pt-BR">🇧🇷 Português</option>
                  <option value="en-US">🇺🇸 English</option>
                  <option value="es-ES">🇪🇸 Español</option>
                  <option value="fr-FR">🇫🇷 Français</option>
                  <option value="de-DE">🇩🇪 Deutsch</option>
                  <option value="it-IT">🇮🇹 Italiano</option>
                  <option value="ru-RU">🇷🇺 Русский</option>
                  <option value="zh-CN">🇨🇳 中文</option>
                  <option value="ja-JP">🇯🇵 日本語</option>
                  <option value="ko-KR">🇰🇷 한국어</option>
                  <option value="hi-IN">🇮🇳 हिन्दी</option>
                  <option value="ar-SA">🇸🇦 العربية</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    localStorage.setItem('preferred-currency', e.target.value);
                  }}
                  className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USD">🇺🇸 USD</option>
                  <option value="BRL">🇧🇷 BRL</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="GBP">🇬🇧 GBP</option>
                  <option value="JPY">🇯🇵 JPY</option>
                  <option value="CNY">🇨🇳 CNY</option>
                  <option value="INR">🇮🇳 INR</option>
                  <option value="KRW">🇰🇷 KRW</option>
                  <option value="CAD">🇨🇦 CAD</option>
                  <option value="MXN">🇲🇽 MXN</option>
                  <option value="ARS">🇦🇷 ARS</option>
                  <option value="CLP">🇨🇱 CLP</option>
                  <option value="COP">🇨🇴 COP</option>
                  <option value="PEN">🇵🇪 PEN</option>
                  <option value="UYU">🇺🇾 UYU</option>
                  <option value="AUD">🇦🇺 AUD</option>
                  <option value="CHF">🇨🇭 CHF</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 Sentra Partners. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
