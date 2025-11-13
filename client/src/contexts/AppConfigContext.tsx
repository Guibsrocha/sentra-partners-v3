import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppConfig {
  logoUrl: string;
  appName: string;
  loading: boolean;
}

interface AppConfigContextType extends AppConfig {
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>({
    logoUrl: '/sentra-logo-horizontal.png',
    appName: 'Sentra Partners',
    loading: true,
  });

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/app-config');
      if (response.ok) {
        const data = await response.json();
        setConfig({
          logoUrl: data.config?.logoUrl || '/sentra-logo-horizontal.png',
          appName: data.config?.appName || 'Sentra Partners',
          loading: false,
        });
      } else {
        setConfig(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setConfig(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <AppConfigContext.Provider value={{ ...config, refreshConfig: fetchConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}
