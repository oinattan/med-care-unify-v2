import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type MessageItem = {
  id: string;
  conversation_id?: string;
  content?: string;
  metadata?: any;
  status?: string;
  created_at?: string;
  sent_at?: string | null;
  error?: string | null;
};

export default function EmailQueue() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [attendants, setAttendants] = useState<Array<{ id: string; full_name: string }>>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignMessageId, setAssignMessageId] = useState<string | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  const setLoadingId = (id: string, v: boolean) => {
    setLoadingIds((s) => ({ ...s, [id]: v }));
  };

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, content, metadata, status, created_at, sent_at, error')
        .eq('message_type', 'email')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setMessages((data || []) as any);
    } catch (err) {
      console.error('Error loading email queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAttendants();
  }, []);

  const loadAttendants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'attendant')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setAttendants((data || []) as any);
    } catch (err) {
      console.error('Error loading attendants', err);
    }
  };

  const retry = async (id: string) => {
    setLoadingId(id, true);
    // If VITE_RETRY_ENDPOINT is configured, call RPC endpoint to trigger immediate processing
    const endpoint = import.meta.env.VITE_RETRY_ENDPOINT as string | undefined;
    const secret = import.meta.env.VITE_RETRY_SECRET as string | undefined;
    if (endpoint) {
      try {
        const res = await fetch(`${endpoint.replace(/\/$/, '')}/retry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(secret ? { 'x-retry-secret': secret } : {}),
          },
          body: JSON.stringify({ id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'retry failed');
        toast({ title: 'Retentativa iniciada', description: 'Tentativa de envio iniciada no servidor.' });
        load();
        return;
      } catch (err) {
        console.error('RPC retry failed', err);
        toast({ title: 'Erro ao retentar via RPC', description: String((err as any)?.message || err), variant: 'destructive' });
        return;
      } finally {
        setLoadingId(id, false);
      }
    }

    // Fallback: just requeue the message in the DB (existing behavior)
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'queued', error: null, attempts: 0, updated_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Retentativa agendada', description: 'A mensagem foi colocada na fila novamente.' });
      load();
    } catch (err) {
      console.error('Error retrying message', err);
      toast({ title: 'Erro ao retentar', description: String((err as any)?.message || err), variant: 'destructive' });
    } finally {
      setLoadingId(id, false);
    }
  };

  const cancel = async (id: string) => {
    try {
      const { error } = await supabase.from('messages').update({ status: 'cancelled', updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
      toast({ title: 'Mensagem cancelada', description: 'A mensagem foi marcada como cancelada.' });
      load();
    } catch (err) {
      console.error('Error cancelling message', err);
      toast({ title: 'Erro', description: 'Não foi possível cancelar a mensagem', variant: 'destructive' });
    }
  };

  const deleteMessage = async (id: string) => {
    const adminEndpoint = (import.meta.env.VITE_ADMIN_ENDPOINT as string | undefined)?.replace(/\/$/, '');
    const adminSecret = import.meta.env.VITE_ADMIN_SECRET as string | undefined;
    if (adminEndpoint) {
      try {
        const res = await fetch(`${adminEndpoint}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}),
          },
          body: JSON.stringify({ id }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error('Admin delete failed', json);
          toast({ title: 'Erro ao excluir mensagem', description: json?.error || 'Operação falhou', variant: 'destructive' });
          return;
        }
        toast({ title: 'Mensagem excluída', description: 'A mensagem foi removida pelo servidor.' });
        load();
        return;
      } catch (err) {
        console.error('Admin delete request failed', err);
        toast({ title: 'Erro', description: 'Falha ao comunicar com o endpoint de administração', variant: 'destructive' });
        return;
      }
    }

    // Fallback: attempt client-side delete (may fail due to RLS)
    try {
      const { data, error } = await supabase.from('messages').delete().eq('id', id).select();
      if (error) {
        console.error('Error deleting message', error);
        toast({ title: 'Erro ao excluir mensagem', description: error.message || String(error), variant: 'destructive' });
        return;
      }
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.warn('Delete returned no rows for message', id, data);
        toast({ title: 'Excluir falhou', description: 'Nenhuma mensagem encontrada ou sem permissão (verifique políticas RLS).', variant: 'destructive' });
        return;
      }
      toast({ title: 'Mensagem excluída', description: 'A mensagem foi removida.' });
      load();
    } catch (err) {
      console.error('Error deleting message', err);
      toast({ title: 'Erro', description: 'Não foi possível excluir a mensagem', variant: 'destructive' });
    }
  };

  const assignMessage = async (id: string) => {
    // open dialog
    setAssignMessageId(id);
    setSelectedAssigneeId(null);
    setIsAssignDialogOpen(true);
  };

  const submitAssignMessage = async () => {
    try {
      const id = assignMessageId;
      if (!id || !selectedAssigneeId) return;
      const assignee = attendants.find(a => a.id === selectedAssigneeId);
      const { data, error } = await supabase.from('messages').update({ assignee_id: selectedAssigneeId, assignee_name: assignee?.full_name } as any).eq('id', id).select().single();
      if (error) throw error;
      if (!data) {
        toast({ title: 'Atribuição falhou', description: 'Nenhuma mensagem encontrada ou sem permissão.', variant: 'destructive' });
        return;
      }
      const assigneeName = (data as any)?.assignee_name || assignee?.full_name;
      toast({ title: 'Mensagem atribuída', description: `Atribuída a ${assigneeName}` });
      setIsAssignDialogOpen(false);
      setAssignMessageId(null);
      setSelectedAssigneeId(null);
      load();
    } catch (err) {
      console.error('Error assigning message', err);
      toast({ title: 'Erro', description: 'Não foi possível atribuir a mensagem', variant: 'destructive' });
    }
  };

  const statusBadge = (s?: string) => {
    switch (s) {
      case 'queued': return <Badge>Fila</Badge>;
      case 'pending': return <Badge variant="secondary">Pendente</Badge>;
      case 'sending': return <Badge variant="outline">Enviando</Badge>;
      case 'sent': return <Badge className="bg-success">Enviado</Badge>;
      case 'failed': return <Badge className="bg-destructive">Falhou</Badge>;
      default: return <Badge variant="outline">{s || '—'}</Badge>;
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Fila de Emails</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* Assign Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir atendente</DialogTitle>
              <DialogDescription>Selecione o atendente para esta mensagem.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-2">
              <label className="text-sm text-muted-foreground">Atendente</label>
              <select className="p-2 border rounded" value={selectedAssigneeId || ''} onChange={(e) => setSelectedAssigneeId(e.target.value)}>
                <option value="">-- Selecionar atendente --</option>
                {attendants.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancelar</Button>
                <Button onClick={submitAssignMessage} disabled={!selectedAssigneeId}>Atribuir</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Para</TableHead>
              <TableHead className="hidden md:table-cell">Conteúdo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Criado</TableHead>
              <TableHead className="hidden lg:table-cell">Enviado</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="max-w-xs truncate">{m.id}</TableCell>
                <TableCell className="max-w-xs truncate">{m.metadata?.to || m.metadata?.from || '—'}</TableCell>
                <TableCell className="hidden md:table-cell max-w-sm truncate">{typeof m.content === 'string' ? m.content.slice(0, 120) : JSON.stringify(m.content)}</TableCell>
                <TableCell>{statusBadge(m.status)}</TableCell>
                <TableCell className="hidden lg:table-cell">{m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : '—'}</TableCell>
                <TableCell className="hidden lg:table-cell">{m.sent_at ? new Date(m.sent_at).toLocaleString('pt-BR') : '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {m.status === 'failed' && (
                      <Button size="sm" onClick={() => retry(m.id)} disabled={!!loadingIds[m.id]}>
                        {loadingIds[m.id] ? (
                          <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            Retentando...
                          </span>
                        ) : (
                          'Retentar'
                        )}
                      </Button>
                    )}
                    {(m.status === 'queued' || m.status === 'pending' || m.status === 'failed') && <Button size="sm" variant="outline" onClick={() => cancel(m.id)}>Cancelar</Button>}
                    <Button size="sm" variant="ghost" onClick={() => assignMessage(m.id)}>Atribuir</Button>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
