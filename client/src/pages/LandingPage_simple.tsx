export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/sentra-logo-horizontal.png" alt="Sentra Partners" className="h-12" />
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-sm hover:text-primary transition-colors">Início</a>
              <a href="#recursos" className="text-sm hover:text-primary transition-colors">Recursos</a>
              <a href="#como-funciona" className="text-sm hover:text-primary transition-colors">Como Funciona</a>
              <a href="#planos" className="text-sm hover:text-primary transition-colors">Planos</a>
            </nav>

            <button className="gradient-primary text-white font-semibold px-4 py-2 rounded">
              Começar Agora
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-6 border border-primary/50 text-primary inline-flex items-center px-3 py-1 rounded-md">
            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"/>
            </svg>
            Copy Trading 3.0 está disponível
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Tudo que você sempre quis
            <br />
            <span className="text-gradient">saber sobre trading</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com copy trading, expert advisors e análise avançada.
          </p>

          <button className="gradient-primary text-white font-semibold text-lg px-8 py-6 rounded">
            Começar Agora
          </button>

          {/* Mockup Dashboard */}
          <div className="mt-16 relative">
            <div className="glass-card glow-border rounded-2xl p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">+$127K</div>
                  <div className="text-sm text-muted-foreground">Lucro Total</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-500">2,847</div>
                  <div className="text-sm text-muted-foreground">Trades</div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-500">73%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-500">1.8</div>
                  <div className="text-sm text-muted-foreground">Profit Factor</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Dashboard de Trading em Tempo Real</div>
            </div>
          </div>
        </div>
      </section>

      {/* VPS Plans - VERSÃO BÁSICA */}
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

      {/* Expert Advisors - VERSÃO BÁSICA */}
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

      {/* Subscription Plans - VERSÃO BÁSICA */}
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

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/40">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 Sentra Partners. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
