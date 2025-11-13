import { useState } from "react";
import { Bug, CheckCircle2, Clock, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
};

const statusLabels = {
  pending: "Pendente",
  in_progress: "Em Progresso",
  resolved: "Resolvido",
  closed: "Fechado",
};

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export default function BugReports() {
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "in_progress" | "resolved" | "closed">("all");

  const { data: reports, isLoading, refetch } = trpc.bugReports.list.useQuery({
    status: filterStatus,
    limit: 100,
  });

  const updateStatus = trpc.bugReports.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteBug = trpc.bugReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Bug report deletado!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleStatusChange = (id: number, status: "pending" | "in_progress" | "resolved" | "closed") => {
    updateStatus.mutate({ id, status });
  };

  const handlePriorityChange = (id: number, priority: "low" | "medium" | "high" | "critical") => {
    updateStatus.mutate({ id, status: reports?.find(r => r.id === id)?.status || "pending", priority });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este bug report?")) {
      deleteBug.mutate({ id });
    }
  };

  const stats = {
    total: reports?.length || 0,
    pending: reports?.filter(r => r.status === "pending").length || 0,
    inProgress: reports?.filter(r => r.status === "in_progress").length || 0,
    resolved: reports?.filter(r => r.status === "resolved").length || 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="h-8 w-8 text-destructive" />
            Bug Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os bugs reportados pelos usuários
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lista de Bug Reports */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Carregando...</p>
            </CardContent>
          </Card>
        ) : reports && reports.length > 0 ? (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Bug #{report.id}
                      <Badge className={priorityColors[report.priority]}>
                        {priorityLabels[report.priority]}
                      </Badge>
                      <Badge className={statusColors[report.status]}>
                        {statusLabels[report.status]}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {report.createdAt && formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                      {report.userId && ` • Usuário ID: ${report.userId}`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(report.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Descrição:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.description}
                  </p>
                </div>

                {report.page && (
                  <div>
                    <h4 className="font-medium mb-1 text-sm">Página:</h4>
                    <p className="text-xs text-muted-foreground font-mono">{report.page}</p>
                  </div>
                )}

                {report.userAgent && (
                  <div>
                    <h4 className="font-medium mb-1 text-sm">User Agent:</h4>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {report.userAgent}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Select
                    value={report.status}
                    onValueChange={(value: any) => handleStatusChange(report.id, value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={report.priority}
                    onValueChange={(value: any) => handlePriorityChange(report.id, value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Nenhum bug report encontrado
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
