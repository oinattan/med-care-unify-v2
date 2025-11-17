import { useState } from "react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, MessageSquare, Star, Edit } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type QuickReply = {
  id: string | number;
  title: string;
  message: string;
  category: string;
  usage: number;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  onUse?: (message: string) => void;
};

const QuickReplies = ({ onUse }: Props) => {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

  const categories = ["Geral", "Agendamento", "Informações", "Consulta"];

  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newReply, setNewReply] = useState<{ title: string; message: string; category: string }>({ title: '', message: '', category: categories[0] });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Geral":
        return "bg-primary/10 text-primary";
      case "Agendamento":
        return "bg-success/10 text-success";
      case "Informações":
        return "bg-warning/10 text-warning";
      case "Consulta":
        return "bg-accent/10 text-accent";
      default:
        return "bg-muted";
    }
  };

  const handleUse = (reply: QuickReply) => {
    // optimistic local increment
    setQuickReplies((prev) => prev.map((r) => (r.id === reply.id ? { ...r, usage: r.usage + 1 } : r)));

    const isLocal = typeof reply.id === 'string' && String(reply.id).startsWith('local-');

    if (!supabaseAvailable) {
      // DB not available, just perform optimistic update
      if (onUse) onUse(reply.message);
      return;
    }

    (async () => {
      try {
        const newUsage = (typeof reply.usage === 'number' ? reply.usage : 0) + 1;
        if (isLocal) {
          // create record in DB for this local reply
          const payload = { title: reply.title, message: reply.message, category: reply.category, usage: newUsage };
          const { data: inserted, error: insErr } = await supabase.from('quick_replies').insert([payload]).select();
          if (insErr) throw insErr;
          if (inserted && inserted.length > 0) {
            const r = inserted[0] as any;
            const normalized = {
              id: r.id,
              title: r.title,
              message: r.message,
              category: r.category || '',
              usage: (r.usage ?? r.usage_count ?? 0),
              created_at: r.created_at,
              updated_at: r.updated_at,
            } as QuickReply;
            // replace local item with inserted item
            setQuickReplies((prev) => prev.map((p) => (p.id === reply.id ? normalized : p)));
          }
        } else {
          const { error } = await supabase.from('quick_replies').update({ usage: newUsage, updated_at: new Date().toISOString() }).eq('id', String(reply.id));
          if (error) throw error;
        }
      } catch (err) {
        console.error('Failed to update quick reply usage', err);
        // mark supabase as unavailable to avoid repeated errors
        setSupabaseAvailable(false);
      }
    })();

    if (onUse) onUse(reply.message);
  };

  const handleOpenEdit = (reply: QuickReply) => {
    setEditingReply(reply);
    setIsEditOpen(true);
  };

  useEffect(() => {
    const loadQuickReplies = async () => {
      try {
        const { data, error } = await supabase
          .from('quick_replies')
          .select('*')
          .order('usage', { ascending: false });
        if (error) {
          console.error('Error loading quick replies from supabase', error);
          // fallback to local samples so UI is usable even if DB access is blocked
          const localSamples: QuickReply[] = [
            { id: 'local-1', title: 'Saudação', message: 'Olá! Como posso ajudá-lo hoje?', category: 'Geral', usage: 0 },
            { id: 'local-2', title: 'Agendamento', message: 'Para agendar uma consulta, preciso verificar nossa agenda. Qual especialidade você procura?', category: 'Agendamento', usage: 0 },
            { id: 'local-3', title: 'Horário Funcionamento', message: 'Nosso horário de funcionamento é de segunda a sexta das 8h às 18h, e aos sábados das 8h às 12h.', category: 'Informações', usage: 0 }
          ];
          setQuickReplies(localSamples);
          setSupabaseAvailable(false);
          return;
        }

        if (data && data.length > 0) {
          const normalized = (data as any[]).map((r) => ({
            id: r.id,
            title: r.title,
            message: r.message,
            category: r.category || '',
            usage: (r.usage ?? r.usage_count ?? 0),
            created_at: r.created_at,
            updated_at: r.updated_at,
          } as QuickReply));
          setQuickReplies(normalized);
          setSupabaseAvailable(true);
          return;
        }

        // If table empty, fallback to local samples and try seeding the DB, but show UI regardless
        const samples: QuickReply[] = [
          { id: 'local-1', title: 'Saudação', message: 'Olá! Como posso ajudá-lo hoje?', category: 'Geral', usage: 0 },
          { id: 'local-2', title: 'Agendamento', message: 'Para agendar uma consulta, preciso verificar nossa agenda. Qual especialidade você procura?', category: 'Agendamento', usage: 0 },
          { id: 'local-3', title: 'Horário Funcionamento', message: 'Nosso horário de funcionamento é de segunda a sexta das 8h às 18h, e aos sábados das 8h às 12h.', category: 'Informações', usage: 0 }
        ];
        setQuickReplies(samples);
        try {
          const { data: inserted, error: insErr } = await supabase.from('quick_replies').insert(samples.map(s => ({ title: s.title, message: s.message, category: s.category, usage: s.usage }))).select();
          if (insErr) throw insErr;
          if (inserted && inserted.length > 0) {
            const normalizedInserted = (inserted as any[]).map((r) => ({
              id: r.id,
              title: r.title,
              message: r.message,
              category: r.category || '',
              usage: (r.usage ?? r.usage_count ?? 0),
              created_at: r.created_at,
              updated_at: r.updated_at,
            } as QuickReply));
            setQuickReplies(normalizedInserted);
          }
        } catch (err) {
          console.error('Error seeding quick replies', err);
          setSupabaseAvailable(false);
        }
      } catch (err: any) {
        console.error('Error loading quick replies', err);
        toast({ title: 'Erro', description: 'Não foi possível carregar respostas rápidas', variant: 'destructive' });
      }
    };

    loadQuickReplies();
  }, []);

  const handleSaveEdit = () => {
    if (!editingReply) return;
    (async () => {
      try {
        const payload = {
          title: editingReply.title,
          message: editingReply.message,
          category: editingReply.category,
          updated_at: new Date().toISOString()
        };

        if (typeof editingReply.id === 'string' && editingReply.id.startsWith('local-') && supabaseAvailable) {
          // create new record instead of updating local placeholder
          const { data: inserted, error: insErr } = await supabase.from('quick_replies').insert([{ title: payload.title, message: payload.message, category: payload.category, usage: editingReply.usage }]).select();
          if (insErr) throw insErr;
          if (inserted && inserted.length > 0) {
            const r = inserted[0] as any;
            const normalized = {
              id: r.id,
              title: r.title,
              message: r.message,
              category: r.category || '',
              usage: ((r.usage ?? r.usage_count ?? editingReply.usage) || 0),
              created_at: r.created_at,
              updated_at: r.updated_at,
            } as QuickReply;
            setQuickReplies((prev) => prev.map((p) => (p.id === editingReply.id ? normalized : p)));
          }
        } else if (supabaseAvailable) {
          const { data: updated, error } = await supabase.from('quick_replies').update(payload).eq('id', String(editingReply.id)).select();
          if (error) throw error;
          if (updated && updated.length > 0) {
            const r = updated[0] as any;
            const normalized = {
              id: r.id,
              title: r.title,
              message: r.message,
              category: r.category || '',
              usage: ((r.usage ?? r.usage_count ?? editingReply.usage) || 0),
              created_at: r.created_at,
              updated_at: r.updated_at,
            } as QuickReply;
            setQuickReplies((prev) => prev.map((p) => (p.id === editingReply.id ? normalized : p)));
          }
        } else {
          // supabase not available: update local state only
          setQuickReplies((prev) => prev.map((r) => (r.id === editingReply.id ? { ...r, title: payload.title, message: payload.message, category: payload.category, updated_at: payload.updated_at } as QuickReply : r)));
        }

        setIsEditOpen(false);
        setEditingReply(null);
        toast({ title: 'Salvo', description: 'Resposta rápida atualizada.' });
      } catch (err: any) {
        console.error('Error saving quick reply', err);
        toast({ title: 'Erro', description: err.message || String(err), variant: 'destructive' });
      }
    })();
  };

  const handleChangeEdit = (field: keyof QuickReply, value: any) => {
    if (!editingReply) return;
    setEditingReply({ ...editingReply, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Respostas Rápidas
          </CardTitle>
          <div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Resposta Rápida</DialogTitle>
                  <DialogDescription>Preencha o título, categoria e mensagem.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3">
                  <Label>Título</Label>
                  <Input value={newReply.title} onChange={(e) => setNewReply({ ...newReply, title: e.target.value })} />
                  <Label>Categoria</Label>
                  <select className="p-2 border rounded" value={newReply.category} onChange={(e) => setNewReply({ ...newReply, category: e.target.value })}>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Label>Mensagem</Label>
                  <Input value={newReply.message} onChange={(e) => setNewReply({ ...newReply, message: e.target.value })} />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" onClick={() => { setIsAddOpen(false); setNewReply({ title: '', message: '', category: categories[0] }); }}>Cancelar</Button>
                    <Button onClick={async () => {
                      if (!newReply.title.trim() || !newReply.message.trim()) {
                        toast({ title: 'Erro', description: 'Título e mensagem são obrigatórios', variant: 'destructive' });
                        return;
                      }
                      // optimistic UI: add local item first
                      const localId = `local-${Date.now()}`;
                      const localItem: QuickReply = { id: localId, title: newReply.title, message: newReply.message, category: newReply.category, usage: 0 };
                      setQuickReplies((prev) => [localItem, ...prev]);
                      setIsAddOpen(false);
                      setNewReply({ title: '', message: '', category: categories[0] });
                      // persist to supabase if available
                      if (!supabaseAvailable) return;
                      try {
                        const { data: inserted, error: insErr } = await supabase.from('quick_replies').insert([{ title: localItem.title, message: localItem.message, category: localItem.category, usage: 0 }]).select();
                        if (insErr) throw insErr;
                        if (inserted && inserted.length > 0) {
                          const r = inserted[0] as any;
                          const normalized: QuickReply = { id: r.id, title: r.title, message: r.message, category: r.category || '', usage: (r.usage ?? r.usage_count ?? 0), created_at: r.created_at, updated_at: r.updated_at };
                          setQuickReplies((prev) => prev.map((p) => (p.id === localId ? normalized : p)));
                          toast({ title: 'Criado', description: 'Resposta rápida criada.' });
                        }
                      } catch (err: any) {
                        console.error('Error creating quick reply', err);
                        setSupabaseAvailable(false);
                        toast({ title: 'Aviso', description: 'Resposta criada localmente (sem persistência).' });
                      }
                    }}>Criar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="cursor-pointer">
              Todas
            </Badge>
            {categories.map((category) => (
              <Badge key={category} variant="outline" className="cursor-pointer hover:bg-primary/10">
                {category}
              </Badge>
            ))}
          </div>

          {/* Quick Reply List */}
          <div className="space-y-3">
            {quickReplies.map((reply) => (
              <div key={reply.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{reply.title}</h4>
                    <Badge variant="outline" className={getCategoryColor(reply.category)}>
                      {reply.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-3 h-3" />
                    {reply.usage}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{reply.message}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUse(reply)}>
                    <Clock className="w-3 h-3 mr-1" />
                    Usar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(reply)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <Dialog open={isEditOpen} onOpenChange={(v) => setIsEditOpen(v)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Resposta Rápida</DialogTitle>
            <DialogDescription>Altere o título, categoria ou mensagem.</DialogDescription>
          </DialogHeader>
          {editingReply && (
            <div className="grid grid-cols-1 gap-3">
              <Label>Título</Label>
              <Input value={editingReply.title} onChange={(e) => handleChangeEdit('title', e.target.value)} />
              <Label>Categoria</Label>
              <select className="p-2 border rounded" value={editingReply.category} onChange={(e) => handleChangeEdit('category', e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Label>Mensagem</Label>
              <Input value={editingReply.message} onChange={(e) => handleChangeEdit('message', e.target.value)} />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingReply(null); }}>Cancelar</Button>
                <Button onClick={handleSaveEdit}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuickReplies;