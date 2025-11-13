import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, MousePointerClick, BarChart3, Check, TrendingUp, Users, Shield, Globe, DollarSign, Menu, X } from "lucide-react";
import { LanguagePopup } from "@/components/LanguagePopup";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();
  
  useEffect(() => {
    if (isIntersecting) {
      setIsVisible(true);
    }
  }, [isIntersecting]);
  
  return (
    <div 
      ref={ref} 
      className={`${className} transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {children}
    </div>
  );
}

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();
  
  useEffect(() => {
    if (isIntersecting) {
      setTimeout(() => setIsVisible(true), delay);
    }
  }, [isIntersecting, delay]);
  
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      {children}
    </div>
  );
}

function CounterCard({ end, label, prefix = "" }: { end: number; label: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const [ref, isIntersecting] = useIntersectionObserver();
  
  useEffect(() => {
    if (isIntersecting) {
      let start = 0;
      const increment = end / 50;
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 50);
      
      return () => clearInterval(timer);
    }
  }, [isIntersecting, end]);
  
  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gradient mb-2 sm:mb-4">
        {prefix}{count.toLocaleString()}+
      </div>
      <p className="text-sm sm:text-base md:text-xl text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function useIntersectionObserver() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  const ref = (node: any) => {
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => setIsIntersecting(entry.isIntersecting),
        { threshold: 0.1 }
      );
      observer.observe(node);
    }
  };
  
  return [ref, isIntersecting] as const;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estados para dados da API
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [vpsPlans, setVpsPlans] = useState<any[]>([]);
  const [expertAdvisors, setExpertAdvisors] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const handleStartNow = () => {
    const plansSection = document.getElementById('planos');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBuyPlan = async (planName: string) => {
    try {
      const planPrice = getPlanPrice(planName);
      
      // Create payment request with nowPayments - REAL PUBLIC API KEY
      const response = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'P3TJTZ6-G81M1AQ-NDZER1K-E2VZ8GD'
        },
        body: JSON.stringify({
          price_amount: planPrice,
          price_currency: 'usd',
          order_id: `sentra_${Date.now()}`,
          order_description: `Sentra Partners - ${planName}`,
          ipn_callback_url: `${window.location.origin}/api/webhook/nowpayments`,
          success_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`
        })
      });

      const paymentData = await response.json();
      console.log('Payment response:', paymentData);
      
      if (paymentData.invoice_url) {
        window.location.href = paymentData.invoice_url;
      } else if (paymentData.pay_address) {
        window.location.href = paymentData.pay_url;
      } else {
        console.error('No payment URL found:', paymentData);
        alert('Erro ao processar pagamento. Tente novamente mais tarde.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const getPlanPrice = (planName: string): number => {
    // Para planos dinâmicos, vamos buscar o preço do array carregado
    const allPlans = [...subscriptionPlans, ...vpsPlans, ...expertAdvisors];
    const foundPlan = allPlans.find(plan => plan.name === planName || plan.title === planName);
    return foundPlan ? Number(foundPlan.price) || 47 : 47;
  };

  // Funções para carregar dados da API
  const loadSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      const data = await response.json();
      if (data.success && data.plans) {
        // Filtrar apenas planos ativos/disponíveis
        const activePlans = data.plans.filter((plan: any) => {
          // Verificar se o plano está ativo baseado em diferentes possíveis campos
          return plan.active !== false && 
                 plan.is_active !== false && 
                 plan.status !== 'inactive' && 
                 plan.status !== 'disabled';
        });
        setSubscriptionPlans(activePlans || []);
      } else {
        setSubscriptionPlans([]);
      }
    } catch (error) {
      console.error('Erro ao carregar planos de assinatura:', error);
      setSubscriptionPlans([]);
    }
  };

  const loadVpsPlans = async () => {
    try {
      const response = await fetch('/api/vps-products');
      const data = await response.json();
      if (data.success && data.products) {
        // Filtrar apenas VPSs disponíveis/ativas
        const activeVpsPlans = data.products.filter((vps: any) => {
          // Verificar se o VPS está ativo baseado em diferentes possíveis campos
          return (vps.is_available !== false && vps.is_available !== 0) &&
                 vps.active !== false && 
                 vps.is_active !== false && 
                 vps.status !== 'inactive' && 
                 vps.status !== 'disabled' &&
                 (vps.stock_quantity === null || vps.stock_quantity > 0);
        });
        setVpsPlans(activeVpsPlans || []);
      } else {
        setVpsPlans([]);
      }
    } catch (error) {
      console.error('Erro ao carregar planos VPS:', error);
      setVpsPlans([]);
    }
  };

  const loadExpertAdvisors = async () => {
    try {
      const response = await fetch('/api/expert-advisors');
      const data = await response.json();
      if (data.success && data.eas) {
        // Filtrar apenas EAs ativos
        const activeEas = data.eas.filter((ea: any) => {
          // Verificar se o EA está ativo baseado em diferentes possíveis campos
          return ea.active !== false && 
                 ea.is_active !== false && 
                 ea.status !== 'inactive' && 
                 ea.status !== 'disabled' &&
                 ea.available !== false;
        });
        setExpertAdvisors(activeEas || []);
      } else {
        setExpertAdvisors([]);
      }
    } catch (error) {
      console.error('Erro ao carregar EAs:', error);
      setExpertAdvisors([]);
    }
  };

  // Carregar todos os dados na inicialização
  useEffect(() => {
    const loadAllData = async () => {
      setLoadingData(true);
      await Promise.all([
        loadSubscriptionPlans(),
        loadVpsPlans(),
        loadExpertAdvisors()
      ]);
      setLoadingData(false);
    };
    
    loadAllData();
  }, []);

  // Currency conversion function
  const convertCurrency = (amount: number, fromCurrency: string = 'USD', toCurrency: string = selectedCurrency): string => {
    // Exchange rates (approximate, would use a real API in production)
    const exchangeRates: { [key: string]: number } = {
      'USD': 1.0,
      'BRL': 5.2,
      'EUR': 0.85,
      'GBP': 0.73,
      'JPY': 110.0,
      'CAD': 1.25,
      'AUD': 1.35,
      'CHF': 0.88,
      'CNY': 6.45,
      'INR': 74.5,
      'MXN': 20.1,
      'ARS': 98.5,
      'CLP': 800.0,
      'COP': 3750.0,
      'PEN': 3.58,
      'UYU': 43.5
    };

    if (fromCurrency === toCurrency) return amount.toString();
    
    const convertedAmount = amount * (exchangeRates[toCurrency] / exchangeRates[fromCurrency]);
    return Math.round(convertedAmount * 100) / 100;
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'BRL': 'R$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'Fr',
      'CNY': '¥',
      'INR': '₹',
      'MXN': '$',
      'ARS': '$',
      'CLP': '$',
      'COP': '$',
      'PEN': 'S/',
      'UYU': '$'
    };
    return symbols[currency] || currency;
  };

  const faqItems = [
    {
      question: t('landing.faq.items.0.question'),
      answer: t('landing.faq.items.0.answer')
    },
    {
      question: t('landing.faq.items.1.question'),
      answer: t('landing.faq.items.1.answer')
    },
    {
      question: t('landing.faq.items.2.question'),
      answer: t('landing.faq.items.2.answer')
    },
    {
      question: t('landing.faq.items.3.question'),
      answer: t('landing.faq.items.3.answer')
    },
    {
      question: t('landing.faq.items.4.question'),
      answer: t('landing.faq.items.4.answer')
    }
  ];



  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header/Navegação */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2">
              <img src="/sentra-logo-horizontal.png" alt="Sentra Partners" className="h-8 sm:h-12" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-8">
              <a href="#inicio" className="text-sm hover:text-primary transition-colors">{t('landing.nav.home')}</a>
              <a href="#recursos" className="text-sm hover:text-primary transition-colors">{t('landing.nav.features')}</a>
              <a href="#como-funciona" className="text-sm hover:text-primary transition-colors">{t('landing.nav.howItWorks')}</a>
              <a href="#planos" className="text-sm hover:text-primary transition-colors">{t('landing.nav.plans')}</a>
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2">
              <button
                className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/40">
              <nav className="px-4 py-4 space-y-4">
                <a href="#inicio" className="block py-2 text-lg hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.home')}</a>
                <a href="#recursos" className="block py-2 text-lg hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.features')}</a>
                <a href="#como-funciona" className="block py-2 text-lg hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.howItWorks')}</a>
                <a href="#planos" className="block py-2 text-lg hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.plans')}</a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4">
        <div className="container mx-auto text-center">
          <AnimatedSection>
            <div className="mb-4 sm:mb-6 border border-primary/50 text-primary inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm">
              <Zap className="w-3 h-3 mr-2" />
              {t('landing.hero.badge')}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              {t('landing.hero.title.part1')}
              <br />
              <span className="text-gradient">{t('landing.hero.title.part2')}</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto px-2">
              {t('landing.hero.subtitle')}
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <Button onClick={handleStartNow} className="gradient-primary text-white font-semibold text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-6 rounded-lg">
              {t('landing.cta.getStarted')}
            </Button>
          </AnimatedSection>

          {/* Mockup Dashboard */}
          <AnimatedSection delay={400} className="mt-8 sm:mt-12 md:mt-16 relative">
            <div className="glass-card glow-border rounded-xl sm:rounded-2xl p-3 sm:p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-2 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">+$127K</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{t('landing.hero.dashboard.totalProfit')}</div>
                </div>
                <div className="p-2 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500">2,847</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{t('landing.hero.dashboard.trades')}</div>
                </div>
                <div className="p-2 sm:p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-500">73%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{t('landing.hero.dashboard.winRate')}</div>
                </div>
                <div className="p-2 sm:p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-500">1.8</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{t('landing.hero.dashboard.profitFactor')}</div>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t('landing.hero.dashboard.caption')}</div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient">{t('landing.results.title')}</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              {t('landing.results.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <AnimatedCard delay={100}>
              <CounterCard end={1200} label={t('landing.stats.tradesJournaled')} prefix="" />
            </AnimatedCard>
            <AnimatedCard delay={200}>
              <CounterCard end={50000} label={t('landing.stats.backtestedSessions')} />
            </AnimatedCard>
            <AnimatedCard delay={300}>
              <CounterCard end={2500000} label={t('landing.stats.sharedOperations')} />
            </AnimatedCard>
            <AnimatedCard delay={400}>
              <CounterCard end={12000} label={t('landing.stats.tradersOnBoard')} />
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient">{t('landing.resources.title')}</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              {t('landing.resources.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 gap-6 md:gap-8 lg:gap-12 max-w-4xl lg:max-w-6xl mx-auto">
            <AnimatedCard>
              <Card className="h-full border-0 shadow-lg sm:shadow-2xl">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">{t('landing.copyTrading.title')}</CardTitle>
                  <CardDescription className="text-sm sm:text-base md:text-lg">{t('landing.copyTrading.description')}</CardDescription>
                </CardHeader>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={200}>
              <Card className="h-full border-0 shadow-lg sm:shadow-2xl">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">{t('landing.analytics.title')}</CardTitle>
                  <CardDescription className="text-sm sm:text-base md:text-lg">{t('landing.analytics.description')}</CardDescription>
                </CardHeader>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* VPS Plans */}
      <section id="vps" className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient">{t('landing.vps.title')}</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              {t('landing.vps.subtitle')}
            </p>
          </AnimatedSection>

          {/* Container com scroll horizontal invisível para VPS */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 sm:gap-6 min-w-max justify-center">
              {loadingData ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-72 sm:w-80 md:w-96">
                    <Card className="h-full min-h-[420px] bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="animate-pulse">
                          <div className="h-6 bg-blue-200 rounded mb-2"></div>
                          <div className="h-8 bg-blue-300 rounded mb-2"></div>
                          <div className="h-4 bg-blue-100 rounded"></div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="animate-pulse">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-4 bg-blue-100 rounded mb-2"></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : vpsPlans.length === 0 ? (
                <div className="text-center py-8 w-full">
                  <p className="text-muted-foreground">Nenhum plano VPS disponível no momento.</p>
                </div>
              ) : (
                vpsPlans.map((plan, index) => (
              <AnimatedCard key={index} delay={index * 100}>
                <Card className="h-full min-h-[420px] bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg text-blue-900 leading-tight break-words">{plan.name}</CardTitle>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                      $ USD {plan.price}
                      <span className="text-sm sm:text-base font-normal"> {t('landing.footer.perMonth')}</span>
                      {selectedCurrency !== 'USD' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {getCurrencySymbol(selectedCurrency)}{convertCurrency(plan.price, 'USD', selectedCurrency)} {selectedCurrency} {t('landing.footer.perMonth')}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-4 sm:mb-6">
                      {(plan.features || []).map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm sm:text-base text-blue-800">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleBuyPlan(plan.name)} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base py-2 sm:py-3"
                    >
                      {t('landing.vps.cta')}
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedCard>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Conversar Section */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <AnimatedSection>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              {t('landing.conversar.vps')}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Expert Advisors */}
      <section id="eas" className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient">{t('landing.eas.title')}</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              {t('landing.eas.subtitle')}
            </p>
          </AnimatedSection>

          {/* Container com scroll horizontal invisível para EAs */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 sm:gap-6 min-w-max justify-center">
              {loadingData ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-72 sm:w-80 md:w-96">
                    <Card className="h-full min-h-[420px]">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-100 rounded mb-2"></div>
                          <div className="h-8 bg-gray-300 rounded mb-3"></div>
                          <div className="h-4 bg-gray-100 rounded"></div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="animate-pulse">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-4 bg-gray-100 rounded mb-2"></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : expertAdvisors.length === 0 ? (
                <div className="text-center py-8 w-full">
                  <p className="text-muted-foreground">Nenhum Expert Advisor disponível no momento.</p>
                </div>
              ) : (
                expertAdvisors.map((ea, index) => (
              <AnimatedCard key={index} delay={index * 100}>
                <Card className="h-full min-h-[420px]">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg leading-tight break-words">{ea.name}</CardTitle>
                    <div className="text-xs sm:text-sm text-gray-600 mb-2">{ea.stats}</div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                      $ USD {ea.price}
                      <span className="text-sm sm:text-base font-normal"> {t('landing.eas.plans.oneTimePayment')}</span>
                      {selectedCurrency !== 'USD' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {getCurrencySymbol(selectedCurrency)}{convertCurrency(ea.price, 'USD', selectedCurrency)} {selectedCurrency} {t('landing.eas.plans.oneTimePayment')}
                        </div>
                      )}
                    </div>
                    {ea.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{ea.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-4 sm:mb-6">
                      {(ea.features || []).map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm sm:text-base">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleBuyPlan(ea.name)} 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-3"
                    >
                      {t('landing.eas.cta')}
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedCard>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Conversar Section */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <AnimatedSection>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              {t('landing.conversar.eas')}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="planos" className="py-12 sm:py-16 md:py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient">{t('landing.plans.title')}</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              {t('landing.plans.subtitle')}
            </p>
          </AnimatedSection>

          {/* Container com scroll horizontal invisível para Subscription Plans */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 sm:gap-6 min-w-max justify-center">
              {loadingData ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-72 sm:w-80 md:w-96">
                    <Card className="h-full min-h-[420px]">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded mb-2"></div>
                          <div className="h-8 bg-gray-300 rounded mb-2"></div>
                          <div className="h-4 bg-gray-100 rounded"></div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="animate-pulse">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-4 bg-gray-100 rounded mb-2"></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : subscriptionPlans.length === 0 ? (
                <div className="text-center py-8 w-full">
                  <p className="text-muted-foreground">Nenhum plano de assinatura disponível no momento.</p>
                </div>
              ) : (
                subscriptionPlans.map((plan, index) => (
              <AnimatedCard key={index} delay={index * 100}>
                <Card className={`h-full min-h-[420px] ${plan.popular ? 'border-2 border-blue-500 relative' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-blue-500 text-white text-xs sm:text-sm">{t('landing.plans.popularBadge')}</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg leading-tight break-words">{plan.name}</CardTitle>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                      $ USD {plan.price}
                      <span className="text-sm sm:text-base font-normal"> {t('landing.footer.perMonth')}</span>
                      {selectedCurrency !== 'USD' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {getCurrencySymbol(selectedCurrency)}{convertCurrency(plan.price, 'USD', selectedCurrency)} {selectedCurrency} {t('landing.footer.perMonth')}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-4 sm:mb-6">
                      {(plan.features || []).map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm sm:text-base">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleBuyPlan(plan.name)} 
                      className={`w-full text-sm sm:text-base py-2 sm:py-3 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {t('landing.plans.cta')}
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedCard>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Conversar Section */}
      <section className="py-8 sm:py-10 md:py-12 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <AnimatedSection>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              {t('landing.conversar.plans')}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl px-2">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient">{t('landing.faq.title')}</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              {t('landing.faq.subtitle')}
            </p>
          </AnimatedSection>

          <div className="space-y-3 sm:space-y-4 w-full">
            {faqItems.map((item, index) => (
              <AnimatedCard key={index} delay={index * 50}>
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <Button
                      variant="ghost"
                      className="justify-between w-full text-left h-auto p-3 sm:p-4 hover:bg-blue-50 rounded-lg transition-colors break-all"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    >
                      <span className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg pr-2 leading-tight break-all">{item.question}</span>
                      <MousePointerClick className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 flex-shrink-0 ml-2 ${openFaq === index ? 'rotate-180' : ''} ${openFaq === index ? 'text-blue-600' : 'text-muted-foreground'}`} />
                    </Button>
                  </CardHeader>
                  {openFaq === index && (
                    <CardContent className="pt-2 sm:pt-3 pb-4 sm:pb-6">
                      <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed break-all">{item.answer}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t('landing.footerCta.title')}
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto px-4">
              {t('landing.footerCta.description')}
            </p>
            <Button 
              onClick={handleStartNow}
              className="bg-white text-blue-600 hover:bg-gray-100 text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-6 rounded-lg"
            >
              {t('landing.cta.getStarted')}
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 border-t border-border/40">
        <div className="container mx-auto text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">{t('landing.footer.language')}:</span>
            </div>
            <select 
              value={i18n.language} 
              onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                localStorage.setItem('landing_language', e.target.value);
              }}
              className="text-xs sm:text-sm bg-transparent border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary min-w-[100px]"
            >
              <option value="pt-BR">🇧🇷 PT-BR</option>
              <option value="en-US">🇺🇸 EN-US</option>
              <option value="es-ES">🇪🇸 ES-ES</option>
              <option value="fr-FR">🇫🇷 FR-FR</option>
              <option value="de-DE">🇩🇪 DE-DE</option>
              <option value="it-IT">🇮🇹 IT-IT</option>
              <option value="ja-JP">🇯🇵 JA-JP</option>
              <option value="zh-CN">🇨🇳 ZH-CN</option>
              <option value="ko-KR">🇰🇷 KO-KR</option>
              <option value="ru-RU">🇷🇺 RU-RU</option>
              <option value="ar-SA">🇸🇦 AR-SA</option>
              <option value="hi-IN">🇮🇳 HI-IN</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('landing.footer.currency')}:</span>
            </div>
            <select 
              value={selectedCurrency} 
              onChange={(e) => {
                setSelectedCurrency(e.target.value);
                localStorage.setItem('landing_currency', e.target.value);
              }}
              className="text-xs sm:text-sm bg-transparent border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary min-w-[80px]"
            >
              <option value="USD">USD $</option>
              <option value="BRL">BRL R$</option>
              <option value="EUR">EUR €</option>
              <option value="GBP">GBP £</option>
              <option value="JPY">JPY ¥</option>
              <option value="CAD">CAD $</option>
              <option value="AUD">AUD $</option>
              <option value="CHF">CHF Fr</option>
              <option value="CNY">CNY ¥</option>
              <option value="INR">INR ₹</option>
              <option value="MXN">MXN $</option>
              <option value="ARS">ARS $</option>
              <option value="CLP">CLP $</option>
              <option value="COP">COP $</option>
              <option value="PEN">PEN S/</option>
              <option value="UYU">UYU $</option>
            </select>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            © 2025 Sentra Partners. {t('landing.footer.copyright')}
          </p>
        </div>
      </footer>
      
      {/* Language and Currency Selection Popup */}
      <LanguagePopup 
        onLanguageSelect={(language) => {
          i18n.changeLanguage(language);
        }}
        onCurrencySelect={setSelectedCurrency}
      />
    </div>
  );
}
