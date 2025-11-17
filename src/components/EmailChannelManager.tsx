import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import EmailQueue from "@/components/EmailQueue";
import { toast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  type: string;
  config?: any;
  is_active?: boolean;
}

export const EmailChannelManager = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    type: "email",
    config: {},
    is_active: true,
  });
  const [originalConfig, setOriginalConfig] = useState<any>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from("channels")
      .select("id, name, type, config, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os canais",
        variant: "destructive",
      });
      return;
    }

    setChannels((data || []) as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure config uses `smtp_password` key and preserve original password when editing and user didn't change it
    const cfg = typeof formData.config === 'object' ? { ...formData.config } : (formData.config ? JSON.parse(formData.config) : {});
    if (editingChannel && originalConfig && originalConfig.smtp_password && !cfg.smtp_password) {
      cfg.smtp_password = originalConfig.smtp_password;
    }

    const payload = { name: formData.name, type: formData.type, config: cfg, is_active: formData.is_active } as any;

    if (editingChannel) {
      const { error } = await supabase
        .from("channels")
        .update(payload)
        .eq("id", editingChannel.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o canal",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Canal atualizado com sucesso",
      });
    } else {
      const { error } = await supabase
        .from("channels")
        .insert([payload]);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar o canal",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Canal criado com sucesso",
      });
    }

    setIsDialogOpen(false);
    resetForm();
    fetchChannels();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("channels")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o canal",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Canal excluído com sucesso",
    });
    fetchChannels();
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    // keep original config to preserve sensitive fields like smtp_password
    setOriginalConfig(channel.config || null);
    // don't prefill password in the editable form - leave empty so user must retype to change
    const cfg = (channel.config && typeof channel.config === 'object') ? { ...channel.config } : (channel.config || {});
    if (cfg && cfg.smtp_password) {
      // clear displayed password so it's not visible
      cfg.smtp_password = '';
    }
    setFormData({
      name: channel.name,
      type: channel.type,
      config: cfg,
      is_active: channel.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingChannel(null);
    setFormData({
      name: "",
      type: "email",
      config: {},
      is_active: true,
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Canais</h2>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Canal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingChannel ? "Editar Canal" : "Novo Canal"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Canal</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <select id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="p-2 border rounded">
                      <option value="email">Email (SMTP)</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                </div>

                {formData.type === 'email' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_host">Servidor SMTP</Label>
                        <Input
                          id="smtp_host"
                          value={(formData.config && typeof formData.config === 'object' && formData.config.smtp_host) || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...(typeof formData.config === 'object' ? formData.config : {}), smtp_host: e.target.value } })}
                          placeholder="smtp.example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_port">Porta SMTP</Label>
                        <Input
                          id="smtp_port"
                          type="number"
                          value={(formData.config && typeof formData.config === 'object' && formData.config.smtp_port) || 587}
                          onChange={(e) => setFormData({ ...formData, config: { ...(typeof formData.config === 'object' ? formData.config : {}), smtp_port: parseInt(e.target.value || '0') } })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_user">Usuário SMTP</Label>
                        <Input
                          id="smtp_user"
                          value={(formData.config && typeof formData.config === 'object' && formData.config.smtp_user) || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...(typeof formData.config === 'object' ? formData.config : {}), smtp_user: e.target.value } })}
                          placeholder="user@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_password">Senha SMTP</Label>
                        <Input
                          id="smtp_password"
                          type="password"
                          value={(formData.config && typeof formData.config === 'object' && formData.config.smtp_password) || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...(typeof formData.config === 'object' ? formData.config : {}), smtp_password: e.target.value } })}
                          placeholder="*** oculto ***"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from_email">From (email)</Label>
                        <Input
                          id="from_email"
                          value={(formData.config && typeof formData.config === 'object' && formData.config.from_email) || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...(typeof formData.config === 'object' ? formData.config : {}), from_email: e.target.value } })}
                          placeholder="no-reply@example.com"
                        />
                      </div>
                      <div className="space-y-2 flex items-center">
                        <div className="flex items-center space-x-2">
                          <Switch id="use_tls" checked={!!(formData.config && typeof formData.config === 'object' && formData.config.use_tls)} onCheckedChange={(checked) => setFormData({ ...formData, config: { ...(typeof formData.config === 'object' ? formData.config : {}), use_tls: checked } })} />
                          <Label htmlFor="use_tls">Usar TLS</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Config (JSON) - Avançado</Label>
                      <textarea
                        className="w-full p-2 border rounded"
                        value={typeof formData.config === 'string' ? formData.config : JSON.stringify((() => {
                          const cfg = typeof formData.config === 'object' ? { ...formData.config } : (formData.config || {});
                          if (cfg && cfg.smtp_password) {
                            // mask displayed password
                            cfg.smtp_password = '***hidden***';
                          }
                          return cfg;
                        })(), null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setFormData({ ...formData, config: parsed });
                          } catch (err) {
                            setFormData({ ...formData, config: e.target.value });
                          }
                        }}
                        rows={6}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Config (JSON)</Label>
                    <textarea className="w-full p-2 border rounded" value={JSON.stringify(formData.config || {}, null, 2)} onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, config: parsed });
                      } catch (err) {
                        // keep raw until valid
                        setFormData({ ...formData, config: e.target.value });
                      }
                    }} rows={6} />
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                    <Label htmlFor="is_active">Canal Ativo</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>Cancelar</Button>
                  <Button type="submit">{editingChannel ? "Atualizar" : "Criar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="outline" onClick={() => setShowQueue(v => !v)}>{showQueue ? 'Esconder Fila' : 'Mostrar Fila'}</Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Config</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum canal cadastrado</TableCell>
              </TableRow>
            ) : (
              channels.map((channel) => (
              <TableRow key={channel.id}>
                <TableCell className="font-medium">{channel.name}</TableCell>
                <TableCell>{channel.type}</TableCell>
                <TableCell className="max-w-sm truncate">{typeof channel.config === 'string' ? channel.config : JSON.stringify((() => {
                  try {
                    const c = { ...(channel.config || {}) };
                    if (c && c.smtp_password) c.smtp_password = '***hidden***';
                    return c;
                  } catch (e) { return channel.config || {}; }
                })())}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${channel.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {channel.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(channel)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(channel.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {showQueue && (
        <div className="mt-4"><EmailQueue /></div>
      )}
    </div>
  );
};

