import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Database, Activity, Settings, Edit, Trash2, Power, PowerOff, CreditCard, Server, Bot, DollarSign, Eye, ArrowRightLeft, Globe, Target, Bug } from "lucide-react";
import { toast } from "sonner";
import { EditPlanDialog } from "@/components/EditPlanDialog";
import { EditVPSDialog } from "@/components/EditVPSDialog";
import { EditEADialog } from "@/components/EditEADialog";
import { EditCryptoAddressDialog } from "@/components/EditCryptoAddressDialog";
import { AccountReportDialog } from "@/components/AccountReportDialog";
import { TransferClientDialog } from "@/components/TransferClientDialog";
import { formatPrice } from "@/lib/formatPrice";
import AdminProviderEarnings from "@/components/AdminProviderEarnings";

import { ClientVMsSection } from "@/components/ClientVMsSection";

export default function Admin() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"users" | "accounts" | "system" | "subscriptions" | "vps" | "eas" | "payments" | "landing" | "pixels" | "commissions" | "bugs">("users");

  // Verificar se é admin ou manager
  if (user?.role !== "admin" && user?.role !== "manager") {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Acesso negado. Apenas administradores e gerentes podem acessar esta página.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários, contas e configurações do sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedTab === "users" ? "default" : "ghost"}
            onClick={() => setSelectedTab("users")}
            className="rounded-b-none"
          >
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </Button>
          <Button
            variant={selectedTab === "accounts" ? "default" : "ghost"}
            onClick={() => setSelectedTab("accounts")}
            className="rounded-b-none"
          >
            <Database className="h-4 w-4 mr-2" />
            Contas
          </Button>
          <Button
            variant={selectedTab === "system" ? "default" : "ghost"}
            onClick={() => setSelectedTab("system")}
            className="rounded-b-none"
          >
            <Settings className="h-4 w-4 mr-2" />
            Sistema
          </Button>
          <Button
            variant={selectedTab === "subscriptions" ? "default" : "ghost"}
            onClick={() => setSelectedTab("subscriptions")}
            className="rounded-b-none"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Assinaturas
          </Button>
          <Button
            variant={selectedTab === "vps" ? "default" : "ghost"}
            onClick={() => setSelectedTab("vps")}
            className="rounded-b-none"
          >
            <Server className="h-4 w-4 mr-2" />
            VPS
          </Button>
          <Button
            variant={selectedTab === "eas" ? "default" : "ghost"}
            onClick={() => setSelectedTab("eas")}
            className="rounded-b-none"
          >
            <Bot className="h-4 w-4 mr-2" />
            EAs
          </Button>
          <Button
            variant={selectedTab === "payments" ? "default" : "ghost"}
            onClick={() => setSelectedTab("payments")}
            className="rounded-b-none"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Pagamentos
          </Button>
          <Button
            variant={selectedTab === "landing" ? "default" : "ghost"}
            onClick={() => setSelectedTab("landing")}
            className="rounded-b-none"
          >
            <Globe className="h-4 w-4 mr-2" />
            Landing Page
          </Button>
          <Button
            variant={selectedTab === "pixels" ? "default" : "ghost"}
            onClick={() => setSelectedTab("pixels")}
            className="rounded-b-none"
          >
            <Target className="h-4 w-4 mr-2" />
            Pixels
          </Button>
          <Button
            variant={selectedTab === "commissions" ? "default" : "ghost"}
            onClick={() => setSelectedTab("commissions")}
            className="rounded-b-none"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Comissões
          </Button>
          <Button
            variant={selectedTab === "bugs" ? "default" : "ghost"}
            onClick={() => window.location.href = "/admin/bug-reports"}
            className="rounded-b-none"
          >
            <Bug className="h-4 w-4 mr-2" />
            Bug Reports
          </Button>
        </div>

        {/* Content */}
        {selectedTab === "users" && <UsersTab />}
        {selectedTab === "accounts" && <AccountsTab />}
        {selectedTab === "system" && <SystemTab />}
        {selectedTab === "subscriptions" && <SubscriptionsTab />}
        {selectedTab === "vps" && <VPSTab />}
        {selectedTab === "eas" && <EAsTab />}
        {selectedTab === "payments" && <PaymentsTab />}
        {selectedTab === "landing" && <LandingPageTab />}
        {selectedTab === "pixels" && (
          <Card>
            <CardHeader>
              <CardTitle>Pixels de Tracking</CardTitle>
              <CardDescription>
                Configure os pixels de tracking para medir conversões de anúncios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Acesse a página completa de configuração de pixels:
              </p>
              <Button onClick={() => window.location.href = "/admin/pixels"}>
                <Target className="mr-2 h-4 w-4" />
                Configurar Pixels
              </Button>
            </CardContent>
          </Card>
        )}
        {selectedTab === "commissions" && <ProviderEarningsTab />}
      </div>
    </DashboardLayout>
  );
}

function UsersTab() {
  const { data: allUsers, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateUserMutation = trpc.admin.updateUser.useMutation();
  const deleteUserMutation = trpc.admin.deleteUser.useMutation();

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user" });
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [transferringClient, setTransferringClient] = useState<any>(null);


  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({ name: user.name || "", email: user.email, role: user.role });
  };

  const handleSave = async () => {
    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        ...editForm,
      });
      toast.success("Usuário atualizado com sucesso");
      setEditingUser(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync({ userId: deletingUser.id });
      toast.success("Usuário excluído com sucesso");
      setDeletingUser(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir usuário");
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        isActive: !currentStatus,
      });
      toast.success(currentStatus ? "Usuário desativado" : "Usuário ativado");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const activeUsers = allUsers?.filter((u) => u.isActive) || [];
  const inactiveUsers = allUsers?.filter((u) => !u.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Usuários Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Ativos</CardTitle>
          <CardDescription>{activeUsers.length} usuários ativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
              >
                <div>
                  <div className="font-medium">{user.name || "Sem nome"}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{user.role}</Badge>
                  {user.role === 'client' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setTransferringClient(user)}
                      title="Transferir para outro gerente"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                  >
                    <PowerOff className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingUser(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usuários Inativos */}
      {inactiveUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usuários Desativados</CardTitle>
            <CardDescription>{inactiveUsers.length} usuários desativados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                >
                  <div>
                    <div className="font-medium">{user.name || "Sem nome"}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{user.role}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      Ativar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Editar Usuário */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Função</Label>
              <select
                className="w-full p-2 border rounded"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="client">Usuário</option>
                <option value="vip">VIP</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Transferir Cliente */}
      <TransferClientDialog
        client={transferringClient}
        open={!!transferringClient}
        onOpenChange={(open) => !open && setTransferringClient(null)}
        onSuccess={refetch}
      />



      {/* AlertDialog: Confirmar Exclusão */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário{" "}
              <strong>{deletingUser?.email}</strong> será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AccountsTab() {
  const { data: allAccounts, isLoading, refetch } = trpc.admin.listAccounts.useQuery();
  const { data: allUsers } = trpc.admin.listUsers.useQuery();
  const deleteAccountMutation = trpc.admin.deleteAccount.useMutation();
  const toggleAccountMutation = trpc.admin.toggleAccountActive.useMutation();

  const [deletingAccount, setDeletingAccount] = useState<any>(null);
  const [viewingAccount, setViewingAccount] = useState<any>(null);

  const getUserEmail = (userId: number) => {
    return allUsers?.find((u) => u.id === userId)?.email || "Desconhecido";
  };

  const handleDelete = async () => {
    try {
      await deleteAccountMutation.mutateAsync({ accountId: deletingAccount.id });
      toast.success("Conta excluída com sucesso");
      setDeletingAccount(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir conta");
    }
  };

  const handleToggleActive = async (accountId: number, currentStatus: boolean) => {
    try {
      await toggleAccountMutation.mutateAsync({
        accountId,
        isActive: !currentStatus,
      });
      toast.success(currentStatus ? "Conta desativada" : "Conta ativada");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const activeAccounts = allAccounts?.filter((a) => a.isActive) || [];
  const inactiveAccounts = allAccounts?.filter((a) => !a.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Contas Ativas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Ativas</CardTitle>
          <CardDescription>{activeAccounts.length} contas ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {account.broker} - {account.accountNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Usuário: {getUserEmail(account.userId)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{account.status}</Badge>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setViewingAccount(account)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Relatório
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(account.id, account.isActive)}
                  >
                    <PowerOff className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingAccount(account)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contas Desativadas */}
      {inactiveAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contas Desativadas</CardTitle>
            <CardDescription>{inactiveAccounts.length} contas desativadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                >
                  <div>
                    <div className="font-medium">
                      {account.broker} - {account.accountNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Usuário: {getUserEmail(account.userId)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{account.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(account.id, account.isActive)}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      Ativar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingAccount(account)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Ver Relatório */}
      <AccountReportDialog
        account={viewingAccount}
        open={!!viewingAccount}
        onOpenChange={(open) => !open && setViewingAccount(null)}
      />

      {/* AlertDialog: Confirmar Exclusão */}
      <AlertDialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta{" "}
              <strong>
                {deletingAccount?.broker} - {deletingAccount?.accountNumber}
              </strong>{" "}
              e todos os seus trades serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SystemTab() {
  const { data: stats, isLoading } = trpc.admin.getSystemStats.useQuery();
  const { data: allUsers } = trpc.admin.listUsers.useQuery();
  const { data: allAccounts } = trpc.admin.listAccounts.useQuery();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const activeUsers = allUsers?.filter(u => u.isActive).length || 0;
  const connectedAccounts = allAccounts?.filter(a => a.status === 'connected').length || 0;
  
  // Calcular balance e equity considerando tipo de conta
  const totalBalance = allAccounts?.reduce((sum, a) => {
    const balance = a.balance || 0;
    // CENT: dividir por 100, STANDARD: usar direto
    return sum + (a.accountType === 'CENT' ? balance / 100 : balance);
  }, 0) || 0;
  
  const totalEquity = allAccounts?.reduce((sum, a) => {
    const equity = a.equity || 0;
    // CENT: dividir por 100, STANDARD: usar direto
    return sum + (a.accountType === 'CENT' ? equity / 100 : equity);
  }, 0) || 0;
  
  const totalProfit = totalEquity - totalBalance;

  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  
  const formatCurrency = (value: number, accountType?: string) => {
    const finalValue = accountType === 'CENT' ? value / 100 : value;
    return formatCurrencyGlobal(finalValue);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{activeUsers} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAccounts || 0}</div>
            <p className="text-xs text-muted-foreground">{connectedAccounts} conectadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTrades || 0}</div>
            <p className="text-xs text-muted-foreground">Histórico completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Conectadas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedAccounts}</div>
            <p className="text-xs text-muted-foreground">Online agora</p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Balance Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>
            <p className="text-sm text-gray-500 mt-1">R${(totalBalance * 5.50).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-muted-foreground mt-2">Soma de todas as contas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equity Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>
            <p className="text-sm text-gray-500 mt-1">R${(totalEquity * 5.50).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-muted-foreground mt-2">Valor atual com posições</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lucro/Prejuízo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <p className="text-sm text-gray-500 mt-1">R${(totalProfit * 5.50).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {totalProfit >= 0 ? 'Lucro' : 'Prejuízo'} acumulado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Plataforma */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['MT4', 'MT5', 'cTrader'].map((platform) => {
              const count = allAccounts?.filter(a => a.platform === platform).length || 0;
              const percentage = stats?.totalAccounts ? (count / stats.totalAccounts) * 100 : 0;
              return (
                <div key={platform}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{platform}</span>
                    <span className="text-sm text-muted-foreground">{count} contas ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Contas por Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Contas por Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allAccounts
              ?.sort((a, b) => (b.balance || 0) - (a.balance || 0))
              .slice(0, 5)
              .map((account, index) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    <div>
                      <div className="font-medium">{account.broker} - {account.accountNumber}</div>
                      <div className="text-sm text-muted-foreground">{account.platform}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      ${(account.accountType === 'CENT' ? (account.balance || 0) / 100 : (account.balance || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(account.balance || 0, account.accountType)}
                    </div>
                    <Badge variant={account.status === 'connected' ? 'default' : 'secondary'} className="mt-1">
                      {account.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tab: Gerenciar Planos de Assinatura
function SubscriptionsTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deletingPlan, setDeletingPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    
    try {
      const response = await fetch(`/api/subscription-plans/${deletingPlan.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Plano excluído com sucesso!');
        setDeletingPlan(null);
        loadPlans();
      } else {
        toast.error(data.error || 'Erro ao excluir plano');
      }
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos de Assinatura</h2>
          <p className="text-muted-foreground">Gerencie os planos disponíveis</p>
        </div>
        <Button onClick={() => setEditingPlan({})}>
          <CreditCard className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={plan.active ? "default" : "secondary"}>
                  {plan.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <CardDescription>R$ {formatPrice(plan.price)}/mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Recursos:</p>
                <ul className="text-sm space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-muted-foreground">• {feature}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditingPlan(plan)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setDeletingPlan(plan)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Ativas</CardTitle>
          <CardDescription>Usuários com assinaturas ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma assinatura ativa no momento
          </div>
        </CardContent>
      </Card>

      <EditPlanDialog
        plan={editingPlan}
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        onSave={async (updatedPlan) => {
          try {
            const isNew = !updatedPlan.id || updatedPlan.id === 0;
            const url = isNew ? '/api/subscription-plans' : `/api/subscription-plans/${updatedPlan.id}`;
            const method = isNew ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedPlan)
            });
            
            const data = await response.json();
            if (data.success) {
              toast.success(isNew ? 'Plano criado com sucesso!' : 'Plano atualizado com sucesso!');
              loadPlans();
              setEditingPlan(null);
            } else {
              toast.error(data.error || 'Erro ao salvar plano');
            }
          } catch (error) {
            console.error('Erro ao salvar plano:', error);
            toast.error('Erro ao salvar plano');
          }
        }}
      />

      {/* AlertDialog: Confirmar Exclusão de Plano */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O plano{" "}
              <strong>{deletingPlan?.name}</strong> será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive">
              Excluir Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Tab: Gerenciar Produtos VPS
function VPSTab() {
  const [vpsProducts, setVpsProducts] = useState<any[]>([]);
  const [editingVPS, setEditingVPS] = useState<any>(null);
  const [deletingVPS, setDeletingVPS] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVPSProducts();
  }, []);

  const loadVPSProducts = async () => {
    try {
      const response = await fetch('/api/vps-products');
      const data = await response.json();
      if (data.success) {
        setVpsProducts(data.products);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos VPS:', error);
      toast.error('Erro ao carregar produtos VPS');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVPS = async () => {
    if (!deletingVPS) return;
    
    try {
      const response = await fetch(`/api/vps-products/${deletingVPS.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('VPS excluída com sucesso!');
        setDeletingVPS(null);
        loadVPSProducts();
      } else {
        toast.error(data.error || 'Erro ao excluir VPS');
      }
    } catch (error) {
      console.error('Erro ao excluir VPS:', error);
      toast.error('Erro ao excluir VPS');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produtos VPS</h2>
          <p className="text-muted-foreground">Gerencie os servidores VPS disponíveis</p>
        </div>
        <Button onClick={() => setEditingVPS({})}>
          <Server className="h-4 w-4 mr-2" />
          Nova VPS
        </Button>
      </div>

      {/* Container com scroll horizontal invisível para VPS */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {vpsProducts.map((vps) => (
          <Card key={vps.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vps.name}</CardTitle>
                {vps.free && <Badge className="bg-purple-500">Grátis</Badge>}
              </div>
              <CardDescription>
                {vps.free ? "Incluído no Premium" : `R$ ${formatPrice(vps.price)}/mês`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPU:</span>
                  <span className="font-medium">{vps.cpu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RAM:</span>
                  <span className="font-medium">{vps.ram}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={vps.active ? "default" : "secondary"}>
                    {vps.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditingVPS(vps)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setDeletingVPS(vps)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>VMs dos Clientes</CardTitle>
              <CardDescription>Gerencie as VMs contratadas pelos clientes</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Use o botão "Adicionar VM" abaixo para criar VMs manualmente
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ClientVMsSection />
        </CardContent>
      </Card>

      <EditVPSDialog
        vps={editingVPS}
        open={!!editingVPS}
        onOpenChange={(open) => !open && setEditingVPS(null)}
        onSave={async (updatedVPS) => {
          try {
            const isNew = !updatedVPS.id || updatedVPS.id === 0;
            const url = isNew ? '/api/vps-products' : `/api/vps-products/${updatedVPS.id}`;
            const method = isNew ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedVPS)
            });
            
            const data = await response.json();
            if (data.success) {
              toast.success(isNew ? 'Produto VPS criado com sucesso!' : 'Produto VPS atualizado com sucesso!');
              loadVPSProducts();
              setEditingVPS(null);
            } else {
              toast.error(data.error || 'Erro ao salvar produto VPS');
            }
          } catch (error) {
            console.error('Erro ao salvar produto VPS:', error);
            toast.error('Erro ao salvar produto VPS');
          }
        }}
      />

      {/* AlertDialog: Confirmar Exclusão de VPS */}
      <AlertDialog open={!!deletingVPS} onOpenChange={() => setDeletingVPS(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A VPS{" "}
              <strong>{deletingVPS?.name}</strong> será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVPS} className="bg-destructive">
              Excluir VPS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Tab: Gerenciar Expert Advisors
function EAsTab() {
  const [eas, setEas] = useState<any[]>([]);
  const [editingEA, setEditingEA] = useState<any>(null);
  const [deletingEA, setDeletingEA] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEAs();
  }, []);

  const loadEAs = async () => {
    try {
      const response = await fetch('/api/expert-advisors');
      const data = await response.json();
      if (data.success) {
        setEas(data.eas);
      }
    } catch (error) {
      console.error('Erro ao carregar EAs:', error);
      toast.error('Erro ao carregar EAs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEA = async () => {
    if (!deletingEA) return;
    
    try {
      const response = await fetch(`/api/expert-advisors/${deletingEA.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('EA excluído com sucesso!');
        setDeletingEA(null);
        loadEAs();
      } else {
        toast.error(data.error || 'Erro ao excluir EA');
      }
    } catch (error) {
      console.error('Erro ao excluir EA:', error);
      toast.error('Erro ao excluir EA');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expert Advisors</h2>
          <p className="text-muted-foreground">Gerencie os EAs disponíveis para venda</p>
        </div>
        <Button onClick={() => setEditingEA({})}>
          <Bot className="h-4 w-4 mr-2" />
          Novo EA
        </Button>
      </div>

      {/* Container com scroll horizontal invisível para EAs */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {eas.map((ea) => (
          <Card key={ea.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{ea.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <Badge variant="outline">{ea.platform}</Badge>
                  </CardDescription>
                </div>
                <Badge variant={ea.active ? "default" : "secondary"}>
                  {ea.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Preço</p>
                  <p className="font-bold text-lg">R$ {formatPrice(ea.price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Downloads</p>
                  <p className="font-bold text-lg">{ea.downloads}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditingEA(ea)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setDeletingEA(ea)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
          <CardDescription>Últimas vendas de Expert Advisors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma venda registrada
          </div>
        </CardContent>
      </Card>

      <EditEADialog
        ea={editingEA}
        open={!!editingEA}
        onOpenChange={(open) => !open && setEditingEA(null)}
        onSave={async (updatedEA) => {
          try {
            const isNew = !updatedEA.id || updatedEA.id === 0;
            const url = isNew ? '/api/expert-advisors' : `/api/expert-advisors/${updatedEA.id}`;
            const method = isNew ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedEA)
            });
            
            const data = await response.json();
            if (data.success) {
              toast.success(isNew ? 'EA criado com sucesso!' : 'EA atualizado com sucesso!');
              loadEAs();
              setEditingEA(null);
            } else {
              toast.error(data.error || 'Erro ao salvar EA');
            }
          } catch (error) {
            console.error('Erro ao salvar EA:', error);
            toast.error('Erro ao salvar EA');
          }
        }}
      />

      {/* AlertDialog: Confirmar Exclusão de EA */}
      <AlertDialog open={!!deletingEA} onOpenChange={() => setDeletingEA(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O EA{" "}
              <strong>{deletingEA?.name}</strong> será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEA} className="bg-destructive">
              Excluir EA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Tab: Pagamentos Cripto
function PaymentsTab() {
  const [cryptoAddresses, setCryptoAddresses] = useState([
    { id: 1, crypto: "Bitcoin", symbol: "BTC", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", active: true },
    { id: 2, crypto: "USDT (Ethereum)", symbol: "USDT", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", active: true },
    { id: 3, crypto: "USDT (Polygon)", symbol: "USDT", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", active: true },
    { id: 4, crypto: "Polygon", symbol: "MATIC", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", active: true },
    { id: 5, crypto: "Ethereum", symbol: "ETH", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", active: true },
  ]);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pagamentos Cripto</h2>
        <p className="text-muted-foreground">Gerencie endereços e transações de criptomoedas</p>
      </div>

      {/* Endereços de Recebimento */}
      <Card>
        <CardHeader>
          <CardTitle>Endereços de Recebimento</CardTitle>
          <CardDescription>Carteiras configuradas para receber pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cryptoAddresses.map((addr) => (
              <div key={addr.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{addr.crypto}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {addr.address.slice(0, 20)}...{addr.address.slice(-10)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{addr.symbol}</Badge>
                  <Badge variant={addr.active ? "default" : "secondary"}>
                    {addr.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingAddress(addr)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimos pagamentos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transação registrada
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">Todos os tempos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">0 transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Transações completas</p>
          </CardContent>
        </Card>
      </div>

      <EditCryptoAddressDialog
        cryptoAddress={editingAddress}
        open={!!editingAddress}
        onOpenChange={(open) => !open && setEditingAddress(null)}
        onSave={(updatedAddress) => {
          setCryptoAddresses(cryptoAddresses.map((a) => (a.id === updatedAddress.id ? updatedAddress : a)));
        }}
      />
    </div>
  );
}

// Tab: Editar Landing Page - Sistema Completo
function LandingPageTab() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('hero');
  const [plans, setPlans] = useState<any[]>([]);
  const [faq, setFaq] = useState<any[]>([]);

  useEffect(() => {
    loadContent();
    loadPlans();
    loadFAQ();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/landing-page');
      const data = await response.json();
      if (data.success && data.content) {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo da LP:', error);
      toast.error('Erro ao carregar conteúdo da LP');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadFAQ = async () => {
    try {
      const response = await fetch('/api/landing-page/faq');
      const data = await response.json();
      if (data.success) {
        setFaq(data.faq || []);
      }
    } catch (error) {
      console.error('Erro ao carregar FAQ:', error);
    }
  };

  const saveSection = async (section: string, sectionContent: any) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/landing-page/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sectionContent })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Seção atualizada com sucesso!');
        loadContent();
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar seção:', error);
      toast.error('Erro ao salvar seção');
    } finally {
      setSaving(false);
    }
  };

  const addFAQItem = () => {
    setFaq([...faq, { id: Date.now(), question: '', answer: '' }]);
  };

  const updateFAQItem = (id: number, field: string, value: string) => {
    setFaq(faq.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeFAQItem = (id: number) => {
    setFaq(faq.filter(item => item.id !== id));
  };

  const saveFAQ = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/landing-page/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('FAQ atualizado com sucesso!');
        loadFAQ();
      } else {
        toast.error(data.error || 'Erro ao salvar FAQ');
      }
    } catch (error) {
      console.error('Erro ao salvar FAQ:', error);
      toast.error('Erro ao salvar FAQ');
    } finally {
      setSaving(false);
    }
  };

  const previewSection = (section: string) => {
    const url = section === 'hero' ? '/' : `/#${section}`;
    window.open(url, '_blank');
  };

  const exportContent = () => {
    const dataStr = JSON.stringify(content, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `landing-page-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Backup exportado com sucesso!');
  };

  const importContent = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedContent = JSON.parse(e.target?.result as string);
        setContent(importedContent);
        toast.success('Conteúdo importado! Não se esqueça de salvar as alterações.');
      } catch (error) {
        toast.error('Erro ao importar arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const tabs = [
    { id: 'hero', name: 'Hero', icon: '🎯' },
    { id: 'stats', name: 'Estatísticas', icon: '📊' },
    { id: 'features', name: 'Recursos', icon: '⚡' },
    { id: 'plans', name: 'Planos', icon: '💰' },
    { id: 'faq', name: 'FAQ', icon: '❓' },
    { id: 'cta', name: 'CTA Final', icon: '🚀' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Editor de Landing Page</h2>
          <p className="text-muted-foreground">Personalize todo o conteúdo da página inicial</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportContent}>
            📦 Exportar Backup
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>📁 Importar</span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importContent}
              className="hidden"
            />
          </label>
          <Button variant="outline" onClick={() => previewSection('hero')}>
            👁️ Preview
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className="rounded-b-none whitespace-nowrap"
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </Button>
        ))}
      </div>

      {/* Content Tabs */}
      {activeTab === 'hero' && (
        <Card>
          <CardHeader>
            <CardTitle>Seção Hero (Topo da Página)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Título Principal</Label>
                <Input
                  value={content.hero?.title || ''}
                  onChange={(e) => setContent({...content, hero: {...content.hero, title: e.target.value}})}
                  placeholder="Ex: Tudo que você sempre quis saber"
                />
              </div>
              <div>
                <Label>Texto de Destaque (colorido)</Label>
                <Input
                  value={content.hero?.highlight || ''}
                  onChange={(e) => setContent({...content, hero: {...content.hero, highlight: e.target.value}})}
                  placeholder="Ex: sobre trading"
                />
              </div>
            </div>
            <div>
              <Label>Subtítulo/Descrição</Label>
              <textarea
                className="w-full p-2 border rounded"
                rows={4}
                value={content.hero?.subtitle || ''}
                onChange={(e) => setContent({...content, hero: {...content.hero, subtitle: e.target.value}})}
                placeholder="Descrição da empresa e serviços..."
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Texto do Botão Principal</Label>
                <Input
                  value={content.hero?.cta_text || ''}
                  onChange={(e) => setContent({...content, hero: {...content.hero, cta_text: e.target.value}})}
                  placeholder="Ex: Começar Agora Grátis"
                />
              </div>
              <div>
                <Label>Texto do Botão Secundário</Label>
                <Input
                  value={content.hero?.cta_secondary || ''}
                  onChange={(e) => setContent({...content, hero: {...content.hero, cta_secondary: e.target.value}})}
                  placeholder="Ex: Ver Demonstração"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveSection('hero', content.hero)} disabled={saving}>
                💾 Salvar Hero
              </Button>
              <Button variant="outline" onClick={() => previewSection('hero')}>
                👁️ Visualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'stats' && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas e Números</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Estatística {num}</h4>
                  <div className="space-y-2">
                    <div>
                      <Label>Valor/Número</Label>
                      <Input
                        value={content.stats?.[`stat${num}_value`] || ''}
                        onChange={(e) => setContent({
                          ...content, 
                          stats: {...content.stats, [`stat${num}_value`]: e.target.value}
                        })}
                        placeholder="Ex: 99.9%"
                      />
                    </div>
                    <div>
                      <Label>Label/Descrição</Label>
                      <Input
                        value={content.stats?.[`stat${num}_label`] || ''}
                        onChange={(e) => setContent({
                          ...content, 
                          stats: {...content.stats, [`stat${num}_label`]: e.target.value}
                        })}
                        placeholder="Ex: Uptime Garantido"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveSection('stats', content.stats)} disabled={saving}>
                💾 Salvar Estatísticas
              </Button>
              <Button variant="outline" onClick={() => previewSection('stats')}>
                👁️ Visualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'features' && (
        <div className="space-y-6">
          {[
            { key: 'copy_trading', name: 'Copy Trading', icon: '📈' },
            { key: 'analytics', name: 'Analytics', icon: '📊' },
            { key: 'vps', name: 'VPS', icon: '🖥️' },
            { key: 'eas', name: 'Expert Advisors', icon: '🤖' }
          ].map((section) => (
            <Card key={section.key}>
              <CardHeader>
                <CardTitle>{section.icon} {section.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={content[section.key]?.title || ''}
                      onChange={(e) => setContent({
                        ...content, 
                        [section.key]: {...content[section.key], title: e.target.value}
                      })}
                      placeholder={`Título da seção ${section.name}`}
                    />
                  </div>
                  <div>
                    <Label>Subtítulo</Label>
                    <Input
                      value={content[section.key]?.subtitle || ''}
                      onChange={(e) => setContent({
                        ...content, 
                        [section.key]: {...content[section.key], subtitle: e.target.value}
                      })}
                      placeholder={`Descrição da seção ${section.name}`}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveSection(section.key, content[section.key])} disabled={saving}>
                    💾 Salvar {section.name}
                  </Button>
                  <Button variant="outline" onClick={() => previewSection(section.key)}>
                    👁️ Visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'plans' && (
        <Card>
          <CardHeader>
            <CardTitle>💰 Planos de Preços</CardTitle>
            <CardDescription>
              Gerencie os planos de assinatura que aparecem na landing page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                {plans.length} planos configurados
              </p>
              <Button onClick={() => window.location.href = '/admin'} variant="outline">
                ⚙️ Gerenciar Planos
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4">
                  <h4 className="font-medium">{plan.name}</h4>
                  <p className="text-2xl font-bold text-primary">R$ {plan.price}/mês</p>
                  <p className="text-sm text-muted-foreground">{plan.features.length} recursos</p>
                  <Badge variant={plan.active ? 'default' : 'secondary'}>
                    {plan.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'faq' && (
        <Card>
          <CardHeader>
            <CardTitle>❓ Perguntas Frequentes (FAQ)</CardTitle>
            <CardDescription>
              Gerencie as perguntas e respostas que aparecem na landing page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {faq.length} perguntas configuradas
              </p>
              <Button onClick={addFAQItem} variant="outline" size="sm">
                ➕ Adicionar Pergunta
              </Button>
            </div>

            <div className="space-y-4">
              {faq.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Pergunta {index + 1}</h4>
                    <Button 
                      onClick={() => removeFAQItem(item.id)} 
                      variant="destructive" 
                      size="sm"
                    >
                      🗑️ Remover
                    </Button>
                  </div>
                  <div>
                    <Label>Pergunta</Label>
                    <Input
                      value={item.question}
                      onChange={(e) => updateFAQItem(item.id, 'question', e.target.value)}
                      placeholder="Digite a pergunta..."
                    />
                  </div>
                  <div>
                    <Label>Resposta</Label>
                    <textarea
                      className="w-full p-2 border rounded"
                      rows={3}
                      value={item.answer}
                      onChange={(e) => updateFAQItem(item.id, 'answer', e.target.value)}
                      placeholder="Digite a resposta..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {faq.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={saveFAQ} disabled={saving}>
                  💾 Salvar FAQ
                </Button>
                <Button variant="outline" onClick={() => previewSection('faq')}>
                  👁️ Visualizar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'cta' && (
        <Card>
          <CardHeader>
            <CardTitle>🚀 Call to Action Final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Título Principal</Label>
                <Input
                  value={content.cta_final?.title || ''}
                  onChange={(e) => setContent({...content, cta_final: {...content.cta_final, title: e.target.value}})}
                  placeholder="Ex: Pronto para Transformar Seu Trading?"
                />
              </div>
              <div>
                <Label>Texto do Botão</Label>
                <Input
                  value={content.cta_final?.cta_text || ''}
                  onChange={(e) => setContent({...content, cta_final: {...content.cta_final, cta_text: e.target.value}})}
                  placeholder="Ex: Começar Agora"
                />
              </div>
            </div>
            <div>
              <Label>Subtítulo/Descrição</Label>
              <textarea
                className="w-full p-2 border rounded"
                rows={3}
                value={content.cta_final?.subtitle || ''}
                onChange={(e) => setContent({...content, cta_final: {...content.cta_final, subtitle: e.target.value}})}
                placeholder="Descrição motivacional..."
              />
            </div>
            <div>
              <Label>Texto de Urgência (Rodapé)</Label>
              <Input
                value={content.cta_final?.footer_text || ''}
                onChange={(e) => setContent({...content, cta_final: {...content.cta_final, footer_text: e.target.value}})}
                placeholder="Ex: ⚡️ 126 pessoas se inscreveram nas últimas 4 horas"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveSection('cta_final', content.cta_final)} disabled={saving}>
                💾 Salvar CTA Final
              </Button>
              <Button variant="outline" onClick={() => previewSection('cta')}>
                👁️ Visualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Tab: Comissões de Provedores
function ProviderEarningsTab() {
  return <AdminProviderEarnings />;
}
