# 🔧 Otimizações de Performance - Sentra Partners

## 📊 **Problemas Identificados**

### 1. **Polling Excessivo**
- **Home/Dashboard**: Atualiza a cada 5s (muito frequente)
- **NotificationBell**: Atualiza a cada 30s
- **SupportChat**: 3-5s (demasiado frequente)
- **AdminSupport**: 3-5s (demasiado frequente)
- **Calendar**: 5 minutos (OK)
- **TradingDiaryCalendar**: 5 minutos (OK)
- **Accounts**: 10s (aceitável)

### 2. **Configuração Básica do React Query**
- QueryClient usa configurações padrão
- Falta de cache otimizado
- Sem staleTime configurado

### 3. **Queries Simultâneas**
- Múltiplas queries carregando simultaneamente
- Falta de paralelização otimizada

## ✅ **Soluções Propostas**

### 1. **Configurar QueryClient com Otimizações**

```typescript
// No arquivo main.tsx, substituir a configuração atual:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      cacheTime: 1000 * 60 * 30, // 30 minutos
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online'
    },
    mutations: {
      networkMode: 'online'
    }
  }
});
```

### 2. **Aumentar Intervalos de Polling**

```typescript
// Home.tsx - Aumentar de 5s para 30s
const { data: dashboardData } = trpc.dashboard.summary.useQuery(
  undefined,
  { 
    enabled: isAuthenticated && canAccessData, 
    refetchInterval: 30000 // 30 segundos
  }
);

// SupportChat.tsx - Aumentar de 3-5s para 15-30s
const { data: messages } = trpc.support.messages.useQuery(
  { ticketId: tickets?.[0]?.id || 0 },
  {
    enabled: !!tickets?.[0]?.id,
    refetchInterval: 15000 // 15 segundos
  }
);

// NotificationBell.tsx - Aumentar de 30s para 2min
const { data: notifications = [] } = trpc.notifications.list.useQuery(
  undefined,
  { 
    enabled: true,
    refetchInterval: 120000 // 2 minutos
  }
);
```

### 3. **Implementar Batch Loading**

```typescript
// Home.tsx - Carregar dados em paralelo otimizado
const queries = useQueries({
  queries: [
    {
      queryKey: ['dashboard-summary'],
      queryFn: () => trpc.dashboard.summary.query(),
      enabled: isAuthenticated && canAccessData
    },
    {
      queryKey: ['accounts-list'],
      queryFn: () => trpc.accounts.list.query(),
      enabled: isAuthenticated
    },
    {
      queryKey: ['trades-recent'],
      queryFn: () => trpc.trades.list.query({ limit: 10 }),
      enabled: isAuthenticated
    }
  ]
});

// Aguardar TODAS as queries carregarem antes de mostrar dados
const isLoading = queries.some(q => q.isLoading);
const hasError = queries.some(q => q.error);
```

### 4. **Lazy Loading por Página**

```typescript
// Dividir carregamento em componentes
export default function Home() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <LoginRedirect />;
  
  return (
    <DashboardLayout>
      {/* Carregar dados essenciais primeiro */}
      <QuickStatsSection />
      
      {/* Carregar dados secundários depois */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartsSection />
      </Suspense>
      
      <Suspense fallback={<TableSkeleton />}>
        <RecentTradesSection />
      </Suspense>
    </DashboardLayout>
  );
}
```

### 5. **Cache Inteligente com Invalidations**

```typescript
// No localStorage para dados estáticos
const useCachedData = (key: string, fetcher: () => Promise<any>, ttl: number) => {
  return useQuery(key, async () => {
    const cached = localStorage.getItem(key);
    const timestamp = localStorage.getItem(`${key}_timestamp`);
    
    if (cached && timestamp && (Date.now() - parseInt(timestamp)) < ttl) {
      return JSON.parse(cached);
    }
    
    const data = await fetcher();
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    
    return data;
  });
};

// Para dados dinâmicos, usar cache otimizado
const useDashboardData = () => {
  return trpc.dashboard.summary.useQuery(undefined, {
    staleTime: 30000, // Dados válidos por 30s
    refetchInterval: 60000, // Atualizar a cada 1min (não 5s)
    networkMode: 'online'
  });
};
```

### 6. **Suspense e Error Boundaries**

```typescript
// Implementar loading states mais eficientes
const DashboardContent = lazy(() => 
  import('./DashboardContent').then(module => ({
    default: module.DashboardContent
  }))
);

export default function Home() {
  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 7. **Debouncing para Searches**

```typescript
const useSearchAccounts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Debounce de 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  return trpc.accounts.search.useQuery(
    { term: debouncedSearchTerm },
    { enabled: debouncedSearchTerm.length > 2 }
  );
};
```

## 📈 **Resultados Esperados**

- **Redução de 60-80%** no número de requests
- **Melhoria de 3-5x** no tempo de carregamento inicial
- **Redução de 50-70%** no uso de CPU e rede
- **UX mais fluida** com loading states otimizados

## 🔄 **Implementação Gradual**

1. **Fase 1**: Configurar QueryClient otimizado
2. **Fase 2**: Aumentar intervalos de polling
3. **Fase 3**: Implementar lazy loading
4. **Fase 4**: Otimizar cache local
5. **Fase 5**: Implementar debouncing

## 📋 **Arquivos a Modificar**

- `client/src/main.tsx` - QueryClient otimizado
- `client/src/pages/Home.tsx` - Polling otimizado
- `client/src/components/NotificationBell.tsx` - Cache mais eficiente
- `client/src/components/SupportChat.tsx` - Intervalos maiores
- `client/src/pages/AdminSupport.tsx` - Polling otimizado
- `client/src/pages/Accounts.tsx` - Cache melhorado