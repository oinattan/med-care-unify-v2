import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import QuickReplies from "@/components/QuickReplies";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EmailChannelManager } from "@/components/EmailChannelManager";
import EmailQueue from "@/components/EmailQueue";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Send,
  Settings
} from "lucide-react";

interface Conversation {
  id: string;
  patient: {
    name: string;
    email?: string;
    phone?: string;
  };
  channel: {
    name: string;
    type: string;
  };
  status: string;
  priority: number;
  subject?: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  unread_count: number;
}

interface DashboardStats {
  total_conversations: number;
  resolved_conversations: number;
  avg_response_time: string;
  satisfaction_rate: number;
}

const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(profile?.role === "attendant" ? "inbox" : "dashboard");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_conversations: 0,
    resolved_conversations: 0,
    avg_response_time: "0min",
    satisfaction_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inboxMode, setInboxMode] = useState<'conversations' | 'emails'>('conversations');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [isNewEmailOpen, setIsNewEmailOpen] = useState(false);

  const [newConv, setNewConv] = useState({ patientName: '', patientEmail: '', patientPhone: '', subject: '', initialMessage: '', channelId: '' });
  const [channelsList, setChannelsList] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState({ toEmail: '', conversationId: '', message: '' });
  const [emailConversations, setEmailConversations] = useState<any[]>([]);
  const [attendants, setAttendants] = useState<Array<{ id: string; full_name: string }>>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignTargetConversationId, setAssignTargetConversationId] = useState<string | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    loadEmails();
    loadEmailConversations();
    loadChannels();
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load conversations with patient and channel data
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          patients(name, email, phone),
          channels(name, type)
        `)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (conversationsError) throw conversationsError;

      // Transform data for UI
      const transformedConversations: Conversation[] = conversationsData?.map(conv => ({
        id: conv.id,
        patient: {
          name: conv.patients?.name || 'Paciente desconhecido',
          email: conv.patients?.email,
          phone: conv.patients?.phone
        },
        channel: {
          name: conv.channels?.name || '—',
          type: conv.channels?.type || 'unknown'
        },
        status: conv.status,
        priority: conv.priority,
        subject: conv.subject,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        assigned_to: conv.assigned_to,
        unread_count: 0 // TODO: Calculate from messages
      })) || [];

      setConversations(transformedConversations);

      // Calculate stats
      const totalConversations = transformedConversations.length;
      const resolvedConversations = transformedConversations.filter(c => c.status === 'resolved').length;
      
      setStats({
        total_conversations: totalConversations,
        resolved_conversations: resolvedConversations,
        avg_response_time: "2.5min",
        satisfaction_rate: Math.round((resolvedConversations / totalConversations) * 100) || 0
      });

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, name, type')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChannelsList(data || []);
    } catch (err) {
      console.error('Error loading channels', err);
    }
  };

  const loadEmails = async () => {
    try {
      // Load recent messages of type 'email' (don't rely on joined conversation.channel existing)
      const { data: emailMessages, error } = await supabase
        .from('messages')
        .select(`*, conversations(*, channels(*)), sender_id`)
        .eq('message_type', 'email')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const messagesList = (emailMessages || []) as any[];
      setEmails(messagesList);

      // Calculate unread (simple heuristic: messages from patient or not read)
      const unread = messagesList.filter((m: any) => m.is_from_patient && m.status !== 'read').length;
      setUnreadCount(unread);
    } catch (error: any) {
      console.error('Error loading emails', error);
      toast({ title: 'Erro ao carregar emails', description: error?.message || String(error), variant: 'destructive' });
    }
  };

  const loadEmailConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`id, subject, patients!inner(id, name, email), channels!inner(id, name, type)`)
        .eq('channels.type', 'email')
        .order('updated_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setEmailConversations(data || []);
    } catch (err) {
      console.error('Error loading email conversations', err);
    }
  };

  const handleSendMessage = async (messageToSend?: string) => {
    const content = (messageToSend ?? newMessage) || "";
    if (!content.trim()) return;

    try {
      if (inboxMode === 'emails' && selectedEmail) {
        // send as email message (insert into messages, backend should handle SMTP)
        const convId = selectedEmail.conversation_id;
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            conversation_id: convId,
            content,
            sender_id: profile?.id,
            is_from_patient: false,
            message_type: 'email',
            status: 'sent',
            metadata: { to: selectedEmail.metadata?.from || selectedEmail.conversations?.patients?.email }
          }])
          .select()
          .single();

        if (error) throw error;

        // append to messages if currently viewing the same conversation
        if (convId && selectedEmail && convId === selectedEmail.conversation_id) {
          setMessages((prev) => [...prev, data]);
        }

        setNewMessage("");
        toast({ title: 'Email enviado', description: 'Email inserido na fila de envio.' });
        // reload emails
        loadEmails();
      } else if (selectedConversation) {
        const convId = selectedConversation.id;
        const { data, error } = await supabase
          .from('messages')
          .insert([{ conversation_id: convId, content, sender_id: profile?.id, is_from_patient: false, message_type: 'text' }])
          .select()
          .single();

        if (error) throw error;

        // append to messages shown in UI
        setMessages((prev) => [...prev, data]);

        setNewMessage("");
        toast({ title: 'Mensagem enviada', description: 'A mensagem foi enviada com sucesso.' });
      }
    } catch (error: any) {
      toast({ title: 'Erro ao enviar mensagem', description: error.message, variant: 'destructive' });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages', err);
      setMessages([]);
    }
  };

  const markEmailRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('id', messageId);

      if (error) throw error;
      loadEmails();
    } catch (err) {
      console.error('Error marking read', err);
    }
  };

  const handleArchiveConversation = async (convId?: string) => {
    try {
      const id = convId || selectedConversation?.id;
      if (!id) return;
      // Execute update first and confirm
      const { data, error } = await supabase.from('conversations').update({ status: 'closed' }).eq('id', String(id)).select();
      if (error) {
        throw error;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast({ title: 'Arquivar falhou', description: 'Nenhuma conversa encontrada ou sem permissão.', variant: 'destructive' });
        return;
      }

      // update UI after success
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast({ title: 'Conversa arquivada', description: 'A conversa foi arquivada.' });
    } catch (err: any) {
      // If we previously removed optimistically, consider reloading list
      toast({ title: 'Erro ao arquivar', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const handleDeleteConversation = async (convId?: string) => {
    try {
      const id = convId || selectedConversation?.id;
      if (!id) return;
      // perform delete and confirm
      const { data, error } = await supabase.from('conversations').delete().eq('id', String(id)).select();
      if (error) {
        console.error('Supabase error deleting conversation', error);
        toast({ title: 'Erro ao excluir', description: error.message || String(error), variant: 'destructive' });
        return;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        // No rows returned - could be RLS or not found
        console.warn('Delete returned no rows for conversation', id, data);
        toast({ title: 'Excluir falhou', description: 'Nenhuma conversa encontrada ou sem permissão (verifique políticas RLS).', variant: 'destructive' });
        return;
      }

      // update UI after success
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast({ title: 'Conversa excluída', description: 'A conversa foi removida.' });
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const handleAssignConversation = (convId?: string) => {
    const id = convId || selectedConversation?.id;
    if (!id) return;
    setAssignTargetConversationId(id);
    setSelectedAssigneeId(null);
    setIsAssignDialogOpen(true);
  };

  const submitAssignConversation = async () => {
    try {
      const id = assignTargetConversationId;
      if (!id || !selectedAssigneeId) return;
      const assignee = attendants.find(a => a.id === selectedAssigneeId);
      const { data, error } = await supabase.from('conversations').update({ assignee_id: selectedAssigneeId, assignee_name: assignee?.full_name } as any).eq('id', String(id)).select().single();
      if (error) throw error;
      if (!data) {
        toast({ title: 'Atribuição falhou', description: 'Nenhuma conversa encontrada ou sem permissão.', variant: 'destructive' });
        return;
      }

      // Update UI using returned row
      const assigneeName = (data as any)?.assignee_name || assignee?.full_name;
      setConversations((prev) => prev.map((c) => c.id === id ? { ...c, assigned_to: assigneeName } : c));
      if (selectedConversation?.id === id) {
        setSelectedConversation((s) => s ? { ...s, assigned_to: assigneeName } : s);
      }

      toast({ title: 'Conversa atribuída', description: `Atribuída a ${assigneeName}` });
      setIsAssignDialogOpen(false);
      setAssignTargetConversationId(null);
      setSelectedAssigneeId(null);
    } catch (err: any) {
      toast({ title: 'Erro ao atribuir', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'email': return <Mail className="w-4 h-4 text-gray-600" />;
      case 'phone': return <Phone className="w-4 h-4 text-primary" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-primary">Ativo</Badge>;
      case 'waiting': return <Badge variant="secondary">Aguardando</Badge>;
      case 'resolved': return <Badge className="bg-success">Resolvido</Badge>;
      default: return <Badge variant="outline">Novo</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-medical-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-light">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">MediConnect</h1>
            <p className="text-muted-foreground">Sistema Omnichannel</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {profile?.full_name || "Usuário"}
            </Badge>
            <Badge className="bg-primary">
              {profile?.role === "attendant" ? "Atendente" : 
               profile?.role === "manager" ? "Gerente" : "Admin"}
            </Badge>
            <Button variant="outline" onClick={signOut}>Sair</Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${profile?.role === 'manager' || profile?.role === 'admin' ? 'grid-cols-4' : 'grid-cols-3'} sticky top-0 z-10`}>
            <TabsTrigger value="inbox">
              Caixa de Entrada
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            {(profile?.role === 'manager' || profile?.role === 'admin') && (
              <TabsTrigger value="smtp">
                <Settings className="w-4 h-4 mr-2" />
                Canais
              </TabsTrigger>
            )}
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-4 lg:grid-cols-3">
              {/* Conversation List */}
              <div className="xl:col-span-1 lg:col-span-1">
                <Card className="h-[calc(100vh-200px)] overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <MessageSquare className="w-5 h-5" />
                          {inboxMode === 'conversations' ? `Conversas (${conversations.length})` : `Emails (${emails.length})`}
                        </CardTitle>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="inbox-mode" className="text-sm">Conv.</Label>
                            <Switch id="inbox-mode" checked={inboxMode === 'emails'} onCheckedChange={(v) => setInboxMode(v ? 'emails' : 'conversations')} />
                            <Label className="text-sm">Email</Label>
                          </div>
                      </div>
                      {inboxMode === 'emails' ? (
                        <>
                          <Dialog open={isNewEmailOpen} onOpenChange={setIsNewEmailOpen}>
                            <DialogTrigger asChild>
                              <Button type="button" size="sm">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Novo Email</DialogTitle>
                              <DialogDescription>Crie um novo email para enviar ao paciente.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={async (e) => { e.preventDefault();
                              try {
                                let convId = newEmail.conversationId;
                                if (!convId) {
                                  // create patient & conversation
                                  const { data: patientData, error: pErr } = await supabase.from('patients').insert([{ name: newEmail.toEmail, email: newEmail.toEmail }]).select().limit(1).single();
                                  if (pErr) throw pErr;
                                  const { data: convData, error: cErr } = await supabase.from('conversations').insert([{ patient_id: patientData.id, subject: '' }]).select().limit(1).single();
                                  if (cErr) throw cErr;
                                  convId = convData.id;
                                }
                                const { error: mErr } = await supabase.from('messages').insert([{ conversation_id: convId, content: newEmail.message, sender_id: profile?.id, is_from_patient: false, message_type: 'email', status: 'sent', metadata: { to: newEmail.toEmail } }]);
                                if (mErr) throw mErr;
                                setIsNewEmailOpen(false);
                                setNewEmail({ toEmail: '', conversationId: '', message: '' });
                                loadEmails();
                                toast({ title: 'Email criado', description: 'Email adicionado à fila.' });
                              } catch (err: any) {
                                toast({ title: 'Erro', description: err.message || String(err), variant: 'destructive' });
                              } }}>
                              <div className="grid grid-cols-1 gap-3">
                                <Label>Para (email)</Label>
                                <Input value={newEmail.toEmail} onChange={(e) => setNewEmail({ ...newEmail, toEmail: e.target.value })} required />
                                <Label>Conversa Existente (opcional)</Label>
                                <select className="p-2 border rounded" value={newEmail.conversationId} onChange={(e) => setNewEmail({ ...newEmail, conversationId: e.target.value })}>
                                  <option value="">-- Nova conversa --</option>
                                  {emailConversations.map((c) => (
                                    <option key={c.id} value={c.id}>{c.patients.name} - {c.subject || 'Sem assunto'}</option>
                                  ))}
                                </select>
                                <Label>Mensagem</Label>
                                <Input value={newEmail.message} onChange={(e) => setNewEmail({ ...newEmail, message: e.target.value })} required />
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button type="button" variant="outline" onClick={() => setIsNewEmailOpen(false)}>Cancelar</Button>
                                  <Button type="submit">Criar Email</Button>
                                </div>
                              </div>
                            </form>
                          </DialogContent>
                          </Dialog>
                          {/* 'Mostrar Fila' moved to card footer to avoid header clutter */}
                        </>
                      ) : (
                        <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Nova Conversa</DialogTitle>
                              <DialogDescription>Crie uma nova conversa iniciando um paciente.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={async (e) => { e.preventDefault();
                              try {
                                // create patient
                                const { data: patientData, error: pErr } = await supabase.from('patients').insert([{ name: newConv.patientName, email: newConv.patientEmail, phone: newConv.patientPhone }]).select().single();
                                if (pErr) throw pErr;
                                const patientId = patientData.id;
                                // create conversation
                                const { data: convData, error: cErr } = await supabase.from('conversations').insert([{ patient_id: patientId, subject: newConv.subject }]).select().single();
                                if (cErr) throw cErr;
                                const convId = convData.id;
                                if (newConv.initialMessage) {
                                  const { error: mErr } = await supabase.from('messages').insert([{ conversation_id: convId, content: newConv.initialMessage, sender_id: profile?.id, is_from_patient: false }]);
                                  if (mErr) throw mErr;
                                }
                                setIsNewConversationOpen(false);
                                setNewConv({ patientName: '', patientEmail: '', patientPhone: '', subject: '', initialMessage: '', channelId: '' });
                                loadDashboardData();
                                toast({ title: 'Conversa criada', description: 'Nova conversa criada com sucesso.' });
                              } catch (err: any) {
                                toast({ title: 'Erro', description: err.message || String(err), variant: 'destructive' });
                              } }}>
                              <div className="grid grid-cols-1 gap-3">
                                <Label>Nome do Paciente</Label>
                                <Input value={newConv.patientName} onChange={(e) => setNewConv({ ...newConv, patientName: e.target.value })} required />
                                <Label>E-mail</Label>
                                <Input value={newConv.patientEmail} onChange={(e) => setNewConv({ ...newConv, patientEmail: e.target.value })} />
                                <Label>Telefone</Label>
                                <Input value={newConv.patientPhone} onChange={(e) => setNewConv({ ...newConv, patientPhone: e.target.value })} />
                                <Label>Canal</Label>
                                <select className="p-2 border rounded" value={newConv.channelId} onChange={(e) => setNewConv({ ...newConv, channelId: e.target.value })}>
                                  <option value="">-- Selecionar canal --</option>
                                  {channelsList.map((ch) => (
                                    <option key={ch.id} value={ch.id}>{ch.name} ({ch.type})</option>
                                  ))}
                                </select>
                                <Label>Assunto</Label>
                                <Input value={newConv.subject} onChange={(e) => setNewConv({ ...newConv, subject: e.target.value })} />
                                <Label>Mensagem Inicial</Label>
                                <Input value={newConv.initialMessage} onChange={(e) => setNewConv({ ...newConv, initialMessage: e.target.value })} />
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button type="button" variant="outline" onClick={() => setIsNewConversationOpen(false)}>Cancelar</Button>
                                  <Button type="submit">Criar</Button>
                                </div>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  {/* Assign Dialog */}
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Atribuir atendente</DialogTitle>
                        <DialogDescription>Selecione o atendente para esta conversa.</DialogDescription>
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
                          <Button onClick={submitAssignConversation} disabled={!selectedAssigneeId}>Atribuir</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                    <CardContent className="space-y-2 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-300px)] min-h-0">
                      {inboxMode === 'conversations' ? (
                        filteredConversations.map((conv) => (
                          <div 
                              key={conv.id}
                              className={`p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors min-w-0 w-full ${
                                selectedConversation?.id === conv.id ? 'bg-primary/10 border-primary' : ''
                              }`}
                            onClick={async () => { setSelectedConversation(conv); setSelectedEmail(null); await loadMessages(conv.id); }}
                          >
                              <div className="flex items-start justify-between w-full min-w-0">
                                <div className="flex items-center gap-2 min-w-0 flex-1 w-full">
                                  {getChannelIcon(conv.channel.type)}
                                  <div className="min-w-0 flex-1 w-full overflow-hidden">
                                    <p className="font-medium text-xs truncate">{conv.patient.name}</p>
                                    <p className="text-[12px] text-muted-foreground truncate break-words">
                                      {conv.subject || "Sem assunto"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                <p className="text-[12px] text-muted-foreground">
                                  {new Date(conv.updated_at).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                                {conv.unread_count > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              {getStatusBadge(conv.status)}
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  conv.priority === 1 ? 'bg-destructive' : 
                                  conv.priority === 2 ? 'bg-warning' : 'bg-success'
                                }`} />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Emails list
                        emails.map((m: any) => (
                          <div key={m.id} className={`p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors min-w-0 w-full ${selectedEmail?.id === m.id ? 'bg-primary/10 border-primary' : ''}`} onClick={async () => { await markEmailRead(m.id); setSelectedEmail(m); setSelectedConversation(null); await loadMessages(m.conversation_id); }}>
                            <div className="flex items-start justify-between w-full min-w-0">
                              <div className="min-w-0 overflow-hidden w-full">
                                <p className="font-medium text-xs truncate">{m.metadata?.from || m.conversations?.patients?.name || 'Remetente desconhecido'}</p>
                                <p className="text-[12px] text-muted-foreground truncate break-words">{String(m.content ?? '').slice(0, 120)}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-[12px] text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                {m.status !== 'read' && (
                                  <Badge variant="destructive" className="text-xs">N</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {inboxMode === 'conversations' && filteredConversations.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma conversa encontrada</p>
                        </div>
                      )}

                      {inboxMode === 'emails' && emails.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum email encontrado</p>
                        </div>
                      )}
                    </CardContent>
                </Card>
              </div>

              {/* Chat Area */}
              <div className="xl:col-span-2 lg:col-span-2">
                <Card className="h-[calc(100vh-200px)] flex flex-col">
                  <CardHeader className="pb-4">
                    {selectedConversation ? (
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {getChannelIcon(selectedConversation.channel.type)}
                          {selectedConversation.patient.name} - {selectedConversation.channel.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(selectedConversation.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAssignConversation()}>
                                  Atribuir conversa
                                </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchiveConversation()}>
                                Arquivar conversa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteConversation()} className="text-destructive">
                                Excluir conversa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ) : (
                      <CardTitle className="text-center text-muted-foreground">
                        Selecione uma conversa
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0">
                    {selectedConversation || selectedEmail ? (
                      <>
                        <div className="flex-1 bg-muted/50 rounded-lg p-4 pb-20 mb-0 overflow-y-auto overflow-x-hidden min-h-0">
                          <div className="space-y-4">
                              {messages && messages.length > 0 ? (
                              messages.map((m: any) => (
                                <div key={m.id} className={m.is_from_patient ? 'flex justify-start w-full min-w-0 pr-4' : 'flex justify-end w-full min-w-0 pr-4'}>
                                  <div className={`${m.is_from_patient ? 'bg-card text-card-foreground' : 'bg-primary text-primary-foreground'} p-3 rounded-lg max-w-[65%] break-words whitespace-pre-wrap ${m.is_from_patient ? 'shadow-sm' : ''}`}>
                                    <p className="text-sm break-words whitespace-pre-wrap">{m.content}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{m.created_at ? new Date(m.created_at).toLocaleTimeString('pt-BR') : ''}</p>
                                  </div>
                                </div>
                              ))
                            ) : selectedEmail ? (
                              <div>
                                <div className="mb-4">
                                  <p className="text-sm font-medium">De: {selectedEmail.metadata?.from || selectedEmail.conversations?.patients?.email}</p>
                                  <p className="text-xs text-muted-foreground">Recebido: {new Date(selectedEmail.created_at).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="prose max-w-none">
                                  <p>{selectedEmail.content}</p>
                                </div>
                              </div>
                            ) : selectedConversation ? (
                              <div className="text-sm text-muted-foreground">Sem mensagens nesta conversa</div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder={inboxMode === 'emails' ? "Digite a resposta por email..." : "Digite sua mensagem..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                          />
                          <Button onClick={() => handleSendMessage()} disabled={!newMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>Selecione uma conversa para começar</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Replies & Info */}
              <div className="xl:col-span-1 hidden xl:block">
                <div className="space-y-4">
                  <QuickReplies onUse={(message) => handleSendMessage(message)} />
                  {selectedConversation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Informações do Paciente</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Nome</p>
                          <p className="text-sm font-medium">{selectedConversation.patient.name}</p>
                        </div>
                        {selectedConversation.patient.email && (
                          <div>
                            <p className="text-xs text-muted-foreground">E-mail</p>
                            <p className="text-sm">{selectedConversation.patient.email}</p>
                          </div>
                        )}
                        {selectedConversation.patient.phone && (
                          <div>
                            <p className="text-xs text-muted-foreground">Telefone</p>
                            <p className="text-sm">{selectedConversation.patient.phone}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Canal</p>
                          <p className="text-sm capitalize">{selectedConversation.channel.name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{stats.total_conversations}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Conversas Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{stats.resolved_conversations}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Resolvidas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{stats.avg_response_time}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Tempo Médio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{stats.satisfaction_rate}%</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Satisfação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversations Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Conversas Recentes</CardTitle>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    <Button size="sm" variant="outline">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead className="hidden sm:table-cell">Canal</TableHead>
                        <TableHead className="hidden md:table-cell">Assunto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Atribuído</TableHead>
                        <TableHead className="hidden sm:table-cell">Atualizado</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConversations.slice(0, 10).map((conv) => (
                        <TableRow key={conv.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{conv.patient.name}</p>
                              <p className="text-xs text-muted-foreground">{conv.patient.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              {getChannelIcon(conv.channel.type)}
                              <span className="capitalize">{conv.channel.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <p className="truncate max-w-[200px]">{conv.subject || "Sem assunto"}</p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(conv.status)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {conv.assigned_to ? (
                              <Badge variant="outline">Atribuído</Badge>
                            ) : (
                              <Badge variant="secondary">Não atribuído</Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <p className="text-sm text-muted-foreground">
                              {new Date(conv.updated_at).toLocaleDateString('pt-BR')}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredConversations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma conversa encontrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Channel Performance */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Atendimentos por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span>WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-600" />
                        <span>Instagram</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-pink-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-600" />
                        <span>Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-gray-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipe Online</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{profile?.full_name || "Usuário"}</p>
                          <p className="text-sm text-muted-foreground">{conversations.length} conversas</p>
                        </div>
                      </div>
                      <Badge className="bg-success">Online</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Desempenho</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.total_conversations}</p>
                          <p className="text-sm text-muted-foreground">Total de Conversas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-success/10 rounded-lg">
                          <CheckCircle2 className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.resolved_conversations}</p>
                          <p className="text-sm text-muted-foreground">Conversas Resolvidas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-warning/10 rounded-lg">
                          <Clock className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.avg_response_time}</p>
                          <p className="text-sm text-muted-foreground">Tempo Médio de Resposta</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                

                <div className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversas por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['open', 'resolved', 'pending'].map((status) => {
                          const count = conversations.filter(c => c.status === status).length;
                          const percentage = conversations.length > 0 ? Math.round((count / conversations.length) * 100) : 0;
                          
                          return (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(status)}
                                <span className="capitalize">{status === 'open' ? 'Abertas' : status === 'resolved' ? 'Resolvidas' : 'Pendentes'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-muted rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      status === 'open' ? 'bg-primary' : 
                                      status === 'resolved' ? 'bg-success' : 'bg-warning'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-12 text-right">{count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMTP Channels Tab */}
          {(profile?.role === 'manager' || profile?.role === 'admin') && (
            <TabsContent value="smtp" className="space-y-6">
              <EmailChannelManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;