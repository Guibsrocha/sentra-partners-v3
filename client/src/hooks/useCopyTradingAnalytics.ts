import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

interface MasterPerformance {
  accountId: string;
  broker: string;
  balance: number;
  equity: number;
  slaveCount: number;
  status: 'online' | 'offline';
  lastHeartbeat: Date;
}

interface SlavePerformance {
  accountId: string;
  broker: string;
  balance: number;
  equity: number;
  masterAccountId: string;
  dailyLoss: number;
  dailyTradesCount: number;
  status: 'online' | 'offline';
  lastHeartbeat: Date;
}

interface Analytics {
  summary: {
    totalMasters: number;
    totalSlaves: number;
    onlineMasters: number;
    onlineSlaves: number;
    totalEquity: number;
  };
  masterPerformance: MasterPerformance[];
  slavePerformance: SlavePerformance[];
}

export function useCopyTradingAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/mt/copy/analytics?email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) {
          throw new Error('Erro ao buscar analytics');
        }

        const data = await response.json();
        
        if (data.success) {
          setAnalytics(data.analytics);
          setError(null);
        } else {
          setError(data.error || 'Erro desconhecido');
        }
      } catch (err: any) {
        console.error('Erro ao buscar analytics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Buscar imediatamente
    fetchAnalytics();

    // Atualizar a cada 30 segundos
    const intervalId = setInterval(fetchAnalytics, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, user]);

  return { analytics, loading, error };
}
