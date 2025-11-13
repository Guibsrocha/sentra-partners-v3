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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface VPS {
  id?: number;
  name: string;
  slug?: string;
  description: string;
  price: number;
  ram: string;
  cpu: string;
  storage: string;
  bandwidth: string;
  specifications?: any;
  billing_cycle: string;
  location: string;
  provider: string;
  max_mt4_instances: number;
  max_mt5_instances: number;
  is_available: boolean;
  stock_quantity: number;
  image_url?: string;
  sort_order: number;
}

interface EditVPSDialogProps {
  vps: VPS | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vps: VPS) => void;
}

export function EditVPSDialog({ vps, open, onOpenChange, onSave }: EditVPSDialogProps) {
  const [formData, setFormData] = useState<VPS>(
    vps || {
      name: "",
      slug: "",
      description: "",
      price: 0,
      ram: "2GB",
      cpu: "1 vCPU Intel",
      storage: "20GB SSD",
      bandwidth: "1TB",
      billing_cycle: "monthly",
      location: "São Paulo, Brasil",
      provider: "Sentra Partners",
      max_mt4_instances: 5,
      max_mt5_instances: 5,
      is_available: true,
      stock_quantity: 100,
      sort_order: 0
    }
  );

  const handleSave = () => {
    if (!formData.name || !formData.ram || !formData.cpu || !formData.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Gerar slug se não existir
    if (!formData.slug) {
      formData.slug = formData.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    // Criar specifications
    formData.specifications = {
      cpu: formData.cpu,
      ram: formData.ram,
      storage: formData.storage,
      bandwidth: formData.bandwidth
    };

    onSave(formData);
    toast.success("VPS salva com sucesso!");
    onOpenChange(false);
  };

  if (!vps && !open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vps?.id ? "Editar VPS" : "Nova VPS"}</DialogTitle>
          <DialogDescription>
            {vps?.id ? "Atualize as especificações do servidor VPS" : "Configure um novo servidor VPS"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da VPS *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: VPS Starter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="vps-starter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do servidor VPS..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço Mensal (R$) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="29.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ciclo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="São Paulo, Brasil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provedor</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="Sentra Partners"
              />
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ram">Memória RAM *</Label>
              <Input
                id="ram"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                placeholder="Ex: 2GB"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpu">CPU *</Label>
              <Input
                id="cpu"
                value={formData.cpu}
                onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                placeholder="Ex: 1 vCPU Intel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage">Armazenamento</Label>
              <Input
                id="storage"
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                placeholder="Ex: 20GB SSD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bandwidth">Largura de Banda</Label>
              <Input
                id="bandwidth"
                value={formData.bandwidth}
                onChange={(e) => setFormData({ ...formData, bandwidth: e.target.value })}
                placeholder="Ex: 1TB"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_mt4_instances">Máx. MT4</Label>
                <Input
                  id="max_mt4_instances"
                  type="number"
                  value={formData.max_mt4_instances}
                  onChange={(e) => setFormData({ ...formData, max_mt4_instances: parseInt(e.target.value) })}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_mt5_instances">Máx. MT5</Label>
                <Input
                  id="max_mt5_instances"
                  type="number"
                  value={formData.max_mt5_instances}
                  onChange={(e) => setFormData({ ...formData, max_mt5_instances: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Estoque</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordem</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
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
          </div>
        </div>

        {/* Status e Configurações */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
              <Label htmlFor="is_available">Disponível para venda</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {vps?.id ? "Salvar Alterações" : "Criar VPS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

