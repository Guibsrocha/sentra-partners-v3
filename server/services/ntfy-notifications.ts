/**
 * Serviço de Notificações Push usando ntfy.sh
 * 
 * ntfy.sh é um serviço gratuito de notificações push que funciona em:
 * - Android (Google Play)
 * - iPhone (App Store)
 * - Web
 * - Desktop
 * 
 * Como funciona:
 * 1. Cada usuário tem um tópico único (ex: sentra-user-123)
 * 2. O backend envia notificações HTTP POST para https://ntfy.sh/{topico}
 * 3. O cliente instala o app ntfy e se inscreve no tópico dele
 * 4. Notificações chegam instantaneamente no celular
 */

interface NtfyNotification {
  title?: string;
  message: string;
  priority?: 'max' | 'urgent' | 'high' | 'default' | 'low' | 'min';
  tags?: string[];
  click?: string; // URL para abrir ao clicar
  actions?: Array<{
    action: 'view' | 'http';
    label: string;
    url: string;
    method?: 'GET' | 'POST' | 'PUT';
  }>;
  attach?: string; // URL de anexo (imagem, PDF, etc)
  icon?: string; // URL do ícone
  delay?: string; // Agendar notificação (ex: "30min", "9am")
}

class NtfyService {
  private baseUrl = 'https://ntfy.sh';
  
  /**
   * Busca o tópico do usuário no banco de dados
   * IMPORTANTE: O tópico deve ser buscado do banco, não gerado aqui!
   * Use getTopic do ntfy-router para obter/criar o tópico.
   */
  async getUserTopic(userId: number): Promise<string> {
    const { getDb } = await import("../db");
    const { userSettings } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [settings] = await database
      .select({ ntfyTopic: userSettings.ntfyTopic })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings?.ntfyTopic) {
      throw new Error(`Usuário ${userId} não tem tópico ntfy configurado`);
    }

    return settings.ntfyTopic;
  }

  /**
   * Envia uma notificação para um usuário específico
   */
  async sendToUser(userId: number, notification: NtfyNotification): Promise<boolean> {
    const topic = await this.getUserTopic(userId);
    return this.sendToTopic(topic, notification);
  }

  /**
   * Envia uma notificação para um tópico específico
   */
  async sendToTopic(topic: string, notification: NtfyNotification): Promise<boolean> {
    console.log('[ntfyService.sendToTopic] Tópico:', topic, 'Mensagem:', notification.message);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'text/plain; charset=utf-8',
      };

      // Adiciona título se fornecido
      if (notification.title) {
        headers['Title'] = notification.title;
      }

      // Adiciona prioridade
      if (notification.priority) {
        headers['Priority'] = notification.priority;
      }

      // Adiciona tags (emojis, categorias)
      if (notification.tags && notification.tags.length > 0) {
        headers['Tags'] = notification.tags.join(',');
      }

      // Adiciona URL para clicar
      if (notification.click) {
        headers['Click'] = notification.click;
      }

      // Adiciona anexo
      if (notification.attach) {
        headers['Attach'] = notification.attach;
      }

      // Adiciona ícone
      if (notification.icon) {
        headers['Icon'] = notification.icon;
      }

      // Adiciona delay (agendamento)
      if (notification.delay) {
        headers['Delay'] = notification.delay;
      }

      // Adiciona botões de ação
      if (notification.actions && notification.actions.length > 0) {
        headers['Actions'] = notification.actions
          .map(action => {
            if (action.action === 'view') {
              return `view, ${action.label}, ${action.url}`;
            } else if (action.action === 'http') {
              return `http, ${action.label}, ${action.url}, method=${action.method || 'POST'}`;
            }
            return '';
          })
          .filter(Boolean)
          .join('; ');
      }

      console.log('[ntfy] Enviando fetch para:', `${this.baseUrl}/${topic}`);
      console.log('[ntfy] Headers:', JSON.stringify(headers));
      console.log('[ntfy] Body:', notification.message);
      
      const response = await fetch(`${this.baseUrl}/${topic}`, {
        method: 'POST',
        headers,
        body: notification.message,
      });
      
      console.log('[ntfy] Response status:', response.status);
      console.log('[ntfy] Response ok:', response.ok);

      if (!response.ok) {
        console.error('[ntfy] Erro ao enviar notificação:', response.statusText);
        return false;
      }

      console.log(`[ntfy] Notificação enviada para tópico: ${topic}`);
      return true;
    } catch (error) {
      console.error('[ntfy] Erro ao enviar notificação:', error);
      return false;
    }
  }

  /**
   * Envia notificação de trade fechado
   */
  async notifyTradeClosed(
    userId: number,
    data: {
      symbol: string;
      type: 'BUY' | 'SELL';
      profit: number;
      volume: number;
      accountNumber: string;
    }
  ): Promise<boolean> {
    const profitFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(data.profit);

    const isProfit = data.profit > 0;
    const emoji = isProfit ? '💰' : '📉';
    const resultText = isProfit ? 'LUCRO' : 'PREJUÍZO';

    return this.sendToUser(userId, {
      title: `${emoji} Trade Fechado - ${data.symbol}`,
      message: `${resultText}: ${profitFormatted}\n${data.type} ${data.volume} lotes\nConta: ${data.accountNumber}`,
      priority: isProfit ? 'default' : 'high',
      tags: [isProfit ? 'money_with_wings' : 'chart_with_downwards_trend', 'trading'],
      click: 'https://sentrapartners.com/trades',
      actions: [
        {
          action: 'view',
          label: 'Ver Detalhes',
          url: 'https://sentrapartners.com/trades',
        },
      ],
    });
  }

  /**
   * Envia notificação de drawdown atingido
   */
  async notifyDrawdownAlert(
    userId: number,
    data: {
      currentDrawdown: number;
      limit: number;
      accountNumber: string;
    }
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '⚠️ ALERTA DE DRAWDOWN',
      message: `Drawdown atual: ${data.currentDrawdown.toFixed(2)}%\nLimite: ${data.limit.toFixed(2)}%\nConta: ${data.accountNumber}`,
      priority: 'urgent',
      tags: ['warning', 'rotating_light'],
      click: 'https://sentrapartners.com/accounts',
      actions: [
        {
          action: 'view',
          label: 'Ver Conta',
          url: 'https://sentrapartners.com/accounts',
        },
      ],
    });
  }

  /**
   * Envia notificação de conexão perdida
   */
  async notifyConnectionLost(
    userId: number,
    data: {
      accountNumber: string;
      broker: string;
    }
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '🔌 Conexão Perdida',
      message: `A conexão com sua conta foi perdida.\nConta: ${data.accountNumber}\nBroker: ${data.broker}`,
      priority: 'high',
      tags: ['warning', 'electric_plug'],
      click: 'https://sentrapartners.com/accounts',
    });
  }

  /**
   * Envia relatório diário
   */
  async sendDailyReport(
    userId: number,
    data: {
      totalTrades: number;
      winRate: number;
      profit: number;
      date: string;
    },
    currency: string = 'USD'
  ): Promise<boolean> {
    try {
      console.log('[sendDailyReport] Iniciando para user:', userId, 'data:', data);
      
      const { getRandomPhrase, getRandomTitle } = await import('./motivational-phrases');
      
      const profitFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency,
      }).format(data.profit);

      // Gerar título e mensagem aleatórios
      const title = getRandomTitle(data.profit);
      const message = getRandomPhrase(data.profit, profitFormatted);
      
      const isProfit = data.profit > 0;
      const emojiTag = isProfit ? 'chart_with_upwards_trend' : 'chart_with_downwards_trend';

      console.log('[sendDailyReport] Enviando notificação...');
      console.log('[sendDailyReport] Título:', title);
      console.log('[sendDailyReport] Mensagem:', message);
      
      const result = await this.sendToUser(userId, {
        title,
        message,
        priority: 'default',
        tags: [emojiTag, 'money_with_wings'],
        click: 'https://sentrapartners.com/analytics',
      });
      
      console.log('[sendDailyReport] Resultado:', result);
      return result;
    } catch (error) {
      console.error('[sendDailyReport] ERRO:', error);
      return false;
    }
  }

  /**
   * Envia relatório semanal
   */
  async sendWeeklyReport(
    userId: number,
    data: {
      totalTrades: number;
      winRate: number;
      profit: number;
      weekStart: string;
      weekEnd: string;
    },
    currency: string = 'USD'
  ): Promise<boolean> {
    try {
      console.log('[sendWeeklyReport] Iniciando para user:', userId, 'data:', data);
      
      const { getRandomPhrase } = await import('./motivational-phrases');
      
      const profitFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency,
      }).format(data.profit);

      // Gerar título e mensagem aleatórios
      const title = 'Resumo Semanal';
      const message = getRandomPhrase(data.profit, profitFormatted);
      
      const isProfit = data.profit > 0;
      const emojiTag = isProfit ? 'tada' : 'bar_chart';

      console.log('[sendWeeklyReport] Enviando notificação...');
      console.log('[sendWeeklyReport] Título:', title);
      console.log('[sendWeeklyReport] Mensagem:', message);
      
      const result = await this.sendToUser(userId, {
        title,
        message,
        priority: 'default',
        tags: [emojiTag, 'calendar'],
        click: 'https://sentrapartners.com/analytics',
      });
      
      console.log('[sendWeeklyReport] Resultado:', result);
      return result;
    } catch (error) {
      console.error('[sendWeeklyReport] ERRO:', error);
      return false;
    }
  }

  /**
   * Envia notificação de alerta genérico
   */
  async sendAlertNotification(
    userId: number,
    type: string,
    message: string
  ): Promise<boolean> {
    // Verificar se o usuário tem ntfy habilitado
    const { getUserSettings } = await import('../db');
    const settings = await getUserSettings(userId);
    
    if (!settings?.ntfyEnabled) {
      console.log(`[ntfy] Notificações desabilitadas para usuário ${userId}`);
      return false;
    }

    // Verificar se o tipo de alerta está habilitado
    if (type === 'drawdown' && !settings.ntfyDrawdown) {
      console.log(`[ntfy] Alertas de drawdown desabilitados para usuário ${userId}`);
      return false;
    }
    if (type === 'trade' && !settings.ntfyTrades) {
      console.log(`[ntfy] Alertas de trades desabilitados para usuário ${userId}`);
      return false;
    }
    if (type === 'connection' && !settings.ntfyConnection) {
      console.log(`[ntfy] Alertas de conexão desabilitados para usuário ${userId}`);
      return false;
    }

    // Mapear tipo de alerta para emoji e prioridade
    const alertConfig: Record<string, { emoji: string; priority: 'max' | 'urgent' | 'high' | 'default' | 'low' | 'min'; tags: string[] }> = {
      drawdown: { emoji: 'warning', priority: 'urgent', tags: ['warning', 'chart_with_downwards_trend'] },
      trade: { emoji: 'chart', priority: 'default', tags: ['chart', 'money_with_wings'] },
      connection: { emoji: 'electric_plug', priority: 'high', tags: ['warning', 'electric_plug'] },
      info: { emoji: 'information_source', priority: 'default', tags: ['information_source'] },
    };

    const config = alertConfig[type] || alertConfig.info;

    return this.sendToUser(userId, {
      title: `Alerta: ${type}`,
      message,
      priority: config.priority,
      tags: config.tags,
      click: 'https://sentrapartners.com/alerts',
    });
  }

  /**
   * Envia notificação de teste
   */
  async sendTestNotification(userId: number): Promise<boolean> {
    console.log('[ntfyService.sendTestNotification] Enviando notificação de teste para user:', userId);
    return this.sendToUser(userId, {
      title: 'Notificacao de Teste',
      message: 'Se voce recebeu esta notificacao, tudo esta funcionando perfeitamente!',
      priority: 'default',
      tags: ['white_check_mark', 'tada'],
      click: 'https://sentrapartners.com',
    });
  }

  /**
   * Envia notificação quando um trade é aberto
   */
  async sendTradeOpened(userId: number, accountId: number, tradeData: {
    ticket: string;
    symbol: string;
    type: string;
    volume: number;
    openPrice: number;
    sl: number;
    tp: number;
  }, language?: string): Promise<void> {
    try {
      const { getTradeOpenedPhrase } = await import("./motivational-phrases");
      const { getDb } = await import("../db");
      const { tradingAccounts } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const message = getTradeOpenedPhrase(language);
      
      // Buscar informações da conta
      const db = await getDb();
      const account = await db.select().from(tradingAccounts).where(eq(tradingAccounts.id, accountId)).limit(1);
      
      const accountNumber = account.length > 0 ? account[0].accountNumber : "N/A";
      
      await this.sendToUser(userId, {
        title: "Trade Aberto",
        message: `${message}\n${tradeData.symbol} ${tradeData.type} ${tradeData.volume} lotes @ ${tradeData.openPrice}\nConta: ${accountNumber}`,
        priority: 'default',
        tags: ['chart_with_upwards_trend'],
      });

      // Log da notificação
      await this.logNotification(userId, 'trade_opened', 'Trade Aberto', message, {
        ticket: tradeData.ticket,
        symbol: tradeData.symbol,
        type: tradeData.type,
        volume: tradeData.volume,
        accountNumber,
      });

      console.log(`[ntfy] Notificação de trade aberto enviada para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar notificação de trade aberto:`, error);
      throw error;
    }
  }

  /**
   * Envia notificação quando um copy trade é fechado
   */
  async sendCopyTradeClosed(userId: number, data: {
    providerName: string;
    symbol: string;
    profit: number;
    accountNumber: string;
    currency: string;
    language?: string;
  }): Promise<void> {
    try {
      const formattedProfit = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: data.currency || 'USD',
      }).format(data.profit / 100);
      
      const message = data.profit > 0 
        ? `Copy trade fechado com lucro!\n\nProvider: ${data.providerName}\n${data.symbol}\nLucro: ${formattedProfit}\nConta: ${data.accountNumber}`
        : `Copy trade fechado com prejuizo.\n\nProvider: ${data.providerName}\n${data.symbol}\nPrejuizo: ${formattedProfit}\nConta: ${data.accountNumber}`;
      
      await this.sendToUser(userId, {
        title: data.profit > 0 ? "Copy Trade Fechado!" : "Copy Trade Fechado",
        message,
        priority: data.profit > 0 ? 'high' : 'default',
        tags: data.profit > 0 ? ['repeat', 'moneybag'] : ['repeat', 'chart_with_downwards_trend'],
      });

      // Log da notificação
      await this.logNotification(userId, 'copy_trade_closed', data.profit > 0 ? 'Copy Trade Fechado!' : 'Copy Trade Fechado', message, {
        providerName: data.providerName,
        symbol: data.symbol,
        profit: data.profit,
        accountNumber: data.accountNumber,
      });

      console.log(`[ntfy] Notificação de copy trade fechado enviada para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar notificação de copy trade fechado:`, error);
      throw error;
    }
  }

  /**
   * Envia notificação quando um trade fecha no Take Profit
   */
  async sendTradeTakeProfit(userId: number, tradeData: {
    symbol: string;
    profit: number;
    accountNumber: string;
    accountName?: string;
    currency: string;
    language?: string;
  }): Promise<void> {
    try {
      const { getTradeTpPhrase } = await import("./motivational-phrases");
      
      const formattedProfit = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: tradeData.currency || 'USD',
      }).format(tradeData.profit / 100);
      
      const message = getTradeTpPhrase(formattedProfit, tradeData.language);
      
      await this.sendToUser(userId, {
        title: "Take Profit!",
        message: `${message}\n${tradeData.symbol}\nConta: ${tradeData.accountName || tradeData.accountNumber}`,
        priority: 'high',
        tags: ['moneybag', 'chart_with_upwards_trend'],
      });

      // Log da notificação
      await this.logNotification(userId, 'trade_closed_tp', 'Take Profit!', message, {
        symbol: tradeData.symbol,
        profit: tradeData.profit,
        accountNumber: tradeData.accountNumber,
      });

      console.log(`[ntfy] Notificação de TP enviada para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar notificação de TP:`, error);
      throw error;
    }
  }

  /**
   * Envia notificação quando um trade fecha no Stop Loss
   */
  async sendTradeStopLoss(userId: number, tradeData: {
    symbol: string;
    loss: number;
    accountNumber: string;
    accountName?: string;
    currency: string;
    language?: string;
  }): Promise<void> {
    try {
      const { getTradeSlPhrase } = await import("./motivational-phrases");
      
      const formattedLoss = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: tradeData.currency || 'USD',
      }).format(Math.abs(tradeData.loss) / 100);
      
      const message = getTradeSlPhrase(formattedLoss, tradeData.language);
      
      await this.sendToUser(userId, {
        title: "Stop Loss",
        message: `${message}\n${tradeData.symbol}\nConta: ${tradeData.accountName || tradeData.accountNumber}`,
        priority: 'default',
        tags: ['warning', 'chart_with_downwards_trend'],
      });

      // Log da notificação
      await this.logNotification(userId, 'trade_closed_sl', 'Stop Loss', message, {
        symbol: tradeData.symbol,
        loss: tradeData.loss,
        accountNumber: tradeData.accountNumber,
      });

      console.log(`[ntfy] Notificação de SL enviada para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar notificação de SL:`, error);
      throw error;
    }
  }

  /**
   * Envia alerta de drawdown atingido
   */
  async sendDrawdownAlert(userId: number, data: {
    accountNumber: string;
    currentDrawdown: number;
    threshold: number;
  }): Promise<void> {
    try {
      const message = `ALERTA! Drawdown de ${data.currentDrawdown.toFixed(2)}% atingido na conta ${data.accountNumber}!\n\nLimite configurado: ${data.threshold}%\n\nRevise sua estrategia e gerencie o risco!`;
      
      await this.sendToUser(userId, {
        title: "Alerta de Drawdown!",
        message,
        priority: 'urgent',
        tags: ['warning', 'rotating_light'],
      });

      await this.logNotification(userId, 'drawdown_alert', 'Alerta de Drawdown!', message, {
        accountNumber: data.accountNumber,
        currentDrawdown: data.currentDrawdown,
        threshold: data.threshold,
      });

      console.log(`[ntfy] Alerta de drawdown enviado para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar alerta de drawdown:`, error);
      throw error;
    }
  }

  /**
   * Envia notificação de nova conta conectada
   */
  async sendAccountConnected(userId: number, data: {
    accountNumber: string;
    broker: string;
    accountType: string;
  }): Promise<void> {
    try {
      const message = `Nova conta conectada com sucesso!\n\nConta: ${data.accountNumber}\nCorretora: ${data.broker}\nTipo: ${data.accountType}\n\nBoa sorte nos seus trades!`;
      
      await this.sendToUser(userId, {
        title: "Conta Conectada!",
        message,
        priority: 'default',
        tags: ['white_check_mark', 'link'],
      });

      await this.logNotification(userId, 'account_connected', 'Conta Conectada!', message, {
        accountNumber: data.accountNumber,
        broker: data.broker,
        accountType: data.accountType,
      });

      console.log(`[ntfy] Notificação de conta conectada enviada para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar notificação de conta conectada:`, error);
      throw error;
    }
  }

  /**
   * Envia notificação de copy trade executado
   */
  async sendCopyTradeExecuted(userId: number, data: {
    providerName: string;
    symbol: string;
    type: string;
    volume: number;
    accountNumber: string;
  }): Promise<void> {
    try {
      const message = `Copy trade executado!\n\nProvider: ${data.providerName}\n${data.symbol} ${data.type} ${data.volume} lotes\nConta: ${data.accountNumber}`;
      
      await this.sendToUser(userId, {
        title: "Copy Trade Executado",
        message,
        priority: 'default',
        tags: ['repeat', 'chart_with_upwards_trend'],
      });

      await this.logNotification(userId, 'copy_trade', 'Copy Trade Executado', message, {
        providerName: data.providerName,
        symbol: data.symbol,
        type: data.type,
        volume: data.volume,
        accountNumber: data.accountNumber,
      });

      console.log(`[ntfy] Notificação de copy trade enviada para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar notificação de copy trade:`, error);
      throw error;
    }
  }

  /**
   * Envia alerta de VPS expirando
   */
  async sendVpsExpiring(userId: number, data: {
    vpsName: string;
    daysRemaining: number;
    expirationDate: string;
  }): Promise<void> {
    try {
      const urgency = data.daysRemaining <= 1 ? 'urgent' : data.daysRemaining <= 3 ? 'high' : 'default';
      const message = `Seu VPS "${data.vpsName}" expira em ${data.daysRemaining} dia(s)!\n\nData de expiracao: ${data.expirationDate}\n\nRenove agora para evitar interrupcoes!`;
      
      await this.sendToUser(userId, {
        title: "VPS Expirando!",
        message,
        priority: urgency,
        tags: ['warning', 'hourglass'],
      });

      await this.logNotification(userId, 'vps_expiring', 'VPS Expirando!', message, {
        vpsName: data.vpsName,
        daysRemaining: data.daysRemaining,
        expirationDate: data.expirationDate,
      });

      console.log(`[ntfy] Alerta de VPS expirando enviado para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar alerta de VPS expirando:`, error);
      throw error;
    }
  }

  /**
   * Envia alerta de assinatura expirando
   */
  async sendSubscriptionExpiring(userId: number, data: {
    planName: string;
    daysRemaining: number;
    expirationDate: string;
  }): Promise<void> {
    try {
      const urgency = data.daysRemaining <= 1 ? 'urgent' : data.daysRemaining <= 3 ? 'high' : 'default';
      const message = `Sua assinatura "${data.planName}" expira em ${data.daysRemaining} dia(s)!\n\nData de expiracao: ${data.expirationDate}\n\nRenove agora para continuar usando a plataforma!`;
      
      await this.sendToUser(userId, {
        title: "Assinatura Expirando!",
        message,
        priority: urgency,
        tags: ['warning', 'credit_card'],
      });

      await this.logNotification(userId, 'subscription_expiring', 'Assinatura Expirando!', message, {
        planName: data.planName,
        daysRemaining: data.daysRemaining,
        expirationDate: data.expirationDate,
      });

      console.log(`[ntfy] Alerta de assinatura expirando enviado para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar alerta de assinatura expirando:`, error);
      throw error;
    }
  }

  /**
   * Envia alerta de EA expirando
   */
  async sendEaExpiring(userId: number, data: {
    eaName: string;
    daysRemaining: number;
    expirationDate: string;
  }): Promise<void> {
    try {
      const urgency = data.daysRemaining <= 1 ? 'urgent' : data.daysRemaining <= 3 ? 'high' : 'default';
      const message = `Sua licenca do EA "${data.eaName}" expira em ${data.daysRemaining} dia(s)!\n\nData de expiracao: ${data.expirationDate}\n\nRenove agora para continuar operando!`;
      
      await this.sendToUser(userId, {
        title: "EA Expirando!",
        message,
        priority: urgency,
        tags: ['warning', 'robot'],
      });

      await this.logNotification(userId, 'ea_expiring', 'EA Expirando!', message, {
        eaName: data.eaName,
        daysRemaining: data.daysRemaining,
        expirationDate: data.expirationDate,
      });

      console.log(`[ntfy] Alerta de EA expirando enviado para usuário ${userId}`);
    } catch (error) {
      console.error(`[ntfy] Erro ao enviar alerta de EA expirando:`, error);
      throw error;
    }
  }

  /**
   * Registra notificação no log
   */
  private async logNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { getDb } = await import("../db");
      const { notificationLog } = await import("../../drizzle/schema");
      
      const database = await getDb();
      if (!database) return;

      await database.insert(notificationLog).values({
        userId,
        type: type as any,
        title,
        message,
        metadata,
      });
    } catch (error) {
      console.error(`[ntfy] Erro ao registrar log de notificação:`, error);
      // Não propagar erro para não afetar o envio da notificação
    }
  }
}

// Exporta classe e instância única (singleton)
export { NtfyService };
export const ntfyService = new NtfyService();
