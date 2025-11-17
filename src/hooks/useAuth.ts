import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'attendant' | 'manager' | 'admin';
  avatar_url?: string;
  is_active: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching profile:', error);
              toast({
                title: "Erro ao carregar perfil",
                description: "Não foi possível carregar suas informações.",
                variant: "destructive"
              });
            }

            setProfile(profileData);
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile for existing session
        setTimeout(async () => {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching profile:', error);
              toast({
                title: "Erro ao carregar perfil",
                description: "Não foi possível carregar suas informações.",
                variant: "destructive"
              });
            }

            setProfile(profileData);
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, autoConfirm = false) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            ...(autoConfirm && { email_confirmed: true })
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Conta já existe",
            description: "Este e-mail já está cadastrado. Tente fazer login.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive"
          });
        }
        return { error };
      }

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu e-mail para confirmar a conta.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (res.error) {
        console.error('signInWithPassword error object:', res.error);
      }

      const { error } = res;

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Credenciais inválidas",
            description: "E-mail ou senha incorretos.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive"
          });
        }
        return { error };
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao MediConnect.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('signIn exception:', error);
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user
  };
};