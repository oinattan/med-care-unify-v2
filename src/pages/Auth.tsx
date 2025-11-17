import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Shield, Users, MessageSquare, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Auth = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  const { signIn, signUp, isAuthenticated, loading } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    await signIn(loginEmail, loginPassword);
    setIsLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignupLoading(true);
    
    await signUp(signupEmail, signupPassword, signupName);
    setIsSignupLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <div className="space-y-8 text-center lg:text-left">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4">
              MediConnect
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Sistema Omnichannel para Clínicas Médicas
            </p>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-sm">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Comunicação Unificada</h3>
                <p className="text-sm text-muted-foreground">WhatsApp, Email, Instagram</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-sm">
              <div className="p-2 bg-success/10 rounded-lg">
                <Activity className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Métricas em Tempo Real</h3>
                <p className="text-sm text-muted-foreground">Dashboard completo</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-sm">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Gestão de Equipe</h3>
                <p className="text-sm text-muted-foreground">Supervisão e distribuição</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-sm">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Segurança Total</h3>
                <p className="text-sm text-muted-foreground">Dados protegidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
            <p className="text-muted-foreground">Entre ou crie uma nova conta</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Cadastro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu.email@clinica.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoginLoading}
                  >
                    {isLoginLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu.email@clinica.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSignupLoading}
                  >
                    {isSignupLoading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Contas de demonstração:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">atendente@clinica.com</span>
                  <Badge variant="outline">Atendente</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">gerente@clinica.com</span>
                  <Badge className="bg-primary">Gerente</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Senha: 123456
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;