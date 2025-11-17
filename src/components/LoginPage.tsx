import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Activity, Shield, Users, MessageSquare } from "lucide-react";

interface LoginPageProps {
  onLogin: (role: "attendant" | "manager") => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      // Mock role selection based on email
      const role = email.includes("gerente") || email.includes("admin") ? "manager" : "attendant";
      onLogin(role);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-white to-primary/5 flex items-center justify-center p-4">
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

        {/* Right Side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Fazer Login</CardTitle>
            <p className="text-muted-foreground">Acesse sua conta para continuar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;