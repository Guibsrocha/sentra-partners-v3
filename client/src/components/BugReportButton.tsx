import { useState } from "react";
import { Bug, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBugReport = trpc.bugReports.create.useMutation({
    onSuccess: () => {
      toast.success("Bug reportado com sucesso! Obrigado pelo feedback.");
      setDescription("");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao reportar bug: ${error.message}`);
    },
  });

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      toast.error("Por favor, descreva o bug com mais detalhes (mínimo 10 caracteres)");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBugReport.mutateAsync({
        description: description.trim(),
        page: window.location.href,
        userAgent: navigator.userAgent,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        size="icon"
        variant="destructive"
        title="Reportar Bug"
      >
        <Bug className="h-6 w-6" />
      </Button>

      {/* Dialog para reportar bug */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-destructive" />
              Reportar Bug
            </DialogTitle>
            <DialogDescription>
              Encontrou algum problema? Descreva o bug abaixo e nossa equipe irá investigar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição do Bug *
              </label>
              <Textarea
                id="description"
                placeholder="Descreva o problema que você encontrou..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 10 caracteres. Seja específico sobre o que aconteceu.
              </p>
            </div>

            <div className="bg-muted p-3 rounded-md text-xs space-y-1">
              <p><strong>Página:</strong> {window.location.pathname}</p>
              <p><strong>Navegador:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || description.trim().length < 10}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Enviando..." : "Enviar Bug"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
