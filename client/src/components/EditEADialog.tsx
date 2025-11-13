import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface EA {
  id?: number;
  name: string;
  slug?: string;
  description: string;
  long_description?: string;
  price: number;
  platform: string;
  license_type: string;
  rental_period?: number;
  features?: string[] | any;
  strategy?: string;
  version: string;
  image_url?: string;
  demo_url?: string;
  video_url?: string;
  is_exclusive: boolean;
  rating: number;
  review_count: number;
  sort_order: number;
  active: boolean;
}

interface EditEADialogProps {
  ea: EA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ea: EA) => void;
}

export function EditEADialog({ ea, open, onOpenChange, onSave }: EditEADialogProps) {
  const [formData, setFormData] = useState<EA>(
    ea || {
      name: "",
      slug: "",
      description: "",
      long_description: "",
      price: 0,
      platform: "MT5",
      license_type: "single",
      rental_period: 0,
      features: [],
      strategy: "",
      version: "1.0.0",
      is_exclusive: false,
      rating: 4000,
      review_count: 0,
      sort_order: 0,
      active: true
    }
  );

  const handleSave = () => {
    if (!formData.name || !formData.description || formData.price <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Gerar slug se não existir
    if (!formData.slug) {
      formData.slug = formData.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    // Garantir que features é um array
    if (!Array.isArray(formData.features)) {
      formData.features = [];
    }

    onSave(formData);
    toast.success("Expert Advisor atualizado com sucesso!");
    onOpenChange(false);
  };

  if (!ea && !open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ea?.id ? "Editar EA" : "Novo EA"}</DialogTitle>
          <DialogDescription>
            {ea?.id ? "Atualize as informações do Expert Advisor" : "Configure um novo Expert Advisor"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Coluna 1 - Informações Básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do EA *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Sentra Scalper Pro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="sentra-scalper-pro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição breve do EA..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="long_description">Descrição Detalhada</Label>
              <Textarea
                id="long_description"
                value={formData.long_description || ""}
                onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                placeholder="Descrição detalhada com recursos e benefícios..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  placeholder="299.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MT4">MT4</SelectItem>
                    <SelectItem value="MT5">MT5</SelectItem>
                    <SelectItem value="MT4/MT5">MT4/MT5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_type">Tipo de Licença</Label>
                <Select
                  value={formData.license_type}
                  onValueChange={(value) => setFormData({ ...formData, license_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de licença" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Única</SelectItem>
                    <SelectItem value="unlimited">Ilimitada</SelectItem>
                    <SelectItem value="rental">Aluguel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rental_period">Período Aluguel (dias)</Label>
                <Input
                  id="rental_period"
                  type="number"
                  value={formData.rental_period || 0}
                  onChange={(e) => setFormData({ ...formData, rental_period: parseInt(e.target.value) })}
                  placeholder="30"
                  min="0"
                  disabled={formData.license_type !== 'rental'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Estratégia</Label>
              <Input
                id="strategy"
                value={formData.strategy || ""}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                placeholder="Ex: Scalping de Alta Frequência"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Versão</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0.0"
              />
            </div>
          </div>

          {/* Coluna 2 - Recursos e URLs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="features">Recursos (um por linha)</Label>
              <Textarea
                id="features"
                value={Array.isArray(formData.features) ? formData.features.join('\n') : ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  features: e.target.value.split('\n').filter(f => f.trim())
                })}
                placeholder="Recurso 1&#10;Recurso 2&#10;Recurso 3"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={formData.image_url || ""}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="demo_url">URL da Demonstração</Label>
              <Input
                id="demo_url"
                value={formData.demo_url || ""}
                onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">URL do Vídeo</Label>
              <Input
                id="video_url"
                value={formData.video_url || ""}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Avaliação (0-5000)</Label>
                <Input
                  id="rating"
                  type="number"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  placeholder="4500"
                  min="0"
                  max="5000"
                />
                <p className="text-xs text-muted-foreground">
                  Valor atual: {(formData.rating / 100).toFixed(1)} estrelas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_count">Total de Avaliações</Label>
                <Input
                  id="review_count"
                  type="number"
                  value={formData.review_count}
                  onChange={(e) => setFormData({ ...formData, review_count: parseInt(e.target.value) })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Ordem de Exibição</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Status e Configurações */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_exclusive"
                checked={formData.is_exclusive}
                onCheckedChange={(checked) => setFormData({ ...formData, is_exclusive: checked })}
              />
              <Label htmlFor="is_exclusive">Edição Exclusiva</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">EA Ativo</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {ea?.id ? "Salvar Alterações" : "Criar EA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

