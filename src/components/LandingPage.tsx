import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Users, 
  Activity, 
  Shield, 
  Clock, 
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Phone,
  Mail,
  Instagram,
  Zap,
  BarChart3,
  HeartHandshake
} from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Comunicação Unificada",
      description: "Integre WhatsApp, Instagram, Facebook, Email e Chat do site em uma única plataforma",
      color: "text-primary"
    },
    {
      icon: Activity,
      title: "Métricas em Tempo Real",
      description: "Acompanhe KPIs, tempo de resposta e performance da equipe instantaneamente",
      color: "text-success"
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Distribua atendimentos, monitore produtividade e otimize recursos",
      color: "text-warning"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Dados protegidos com criptografia e compliance com LGPD",
      color: "text-accent"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Redução de 60% no Tempo de Resposta",
      description: "Respostas automáticas e templates otimizam o atendimento"
    },
    {
      icon: TrendingUp,
      title: "Aumento de 40% na Satisfação",
      description: "Experiência unificada melhora a percepção dos pacientes"
    },
    {
      icon: BarChart3,
      title: "Visibilidade Completa do Negócio",
      description: "Relatórios detalhados para tomada de decisões estratégicas"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Maria Santos",
      role: "Diretora Clínica - CliniSaúde",
      content: "O MediConnect revolucionou nossa comunicação. Agora conseguimos atender 3x mais pacientes com a mesma equipe.",
      rating: 5
    },
    {
      name: "João Silva",
      role: "Gerente Operacional - MedCenter",
      content: "A visibilidade que temos agora dos nossos atendimentos é impressionante. ROI positivo em apenas 2 meses.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">MediConnect</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#funcionalidades" className="text-muted-foreground hover:text-primary transition-colors">
                Funcionalidades
              </a>
              <a href="#beneficios" className="text-muted-foreground hover:text-primary transition-colors">
                Benefícios
              </a>
              <a href="#depoimentos" className="text-muted-foreground hover:text-primary transition-colors">
                Depoimentos
              </a>
              <Link to="/auth">
                <Button variant="outline">Fazer Login</Button>
              </Link>
              <Link to="/auth">
                <Button>Começar Grátis</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-medical-light via-background to-primary/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="w-fit">
                  <Zap className="w-3 h-3 mr-1" />
                  Plataforma Omnichannel #1
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Unifique Toda
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {" "}Comunicação
                  </span>
                  <br />da sua Clínica
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Integre WhatsApp, Instagram, Email e mais canais em uma única plataforma. 
                  Aumente a eficiência da equipe e a satisfação dos pacientes.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Agendar Demo
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-8 border-t border-border/40">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Clínicas Ativas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1M+</div>
                  <div className="text-sm text-muted-foreground">Mensagens/Mês</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-success rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Sistema Online</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                        <Phone className="w-5 h-5 text-primary" />
                        <span className="text-sm">WhatsApp Business conectado</span>
                        <CheckCircle className="w-4 h-4 text-success ml-auto" />
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-lg">
                        <Instagram className="w-5 h-5 text-accent" />
                        <span className="text-sm">Instagram Direct ativo</span>
                        <CheckCircle className="w-4 h-4 text-success ml-auto" />
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-warning/5 rounded-lg">
                        <Mail className="w-5 h-5 text-warning" />
                        <span className="text-sm">Email sincronizado</span>
                        <CheckCircle className="w-4 h-4 text-success ml-auto" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/40">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Mensagens hoje</span>
                        <span className="font-semibold text-primary">1,247</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="w-fit mx-auto">Funcionalidades</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Tudo que sua Clínica Precisa
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Uma plataforma completa para revolucionar a comunicação da sua clínica médica
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="w-fit">Resultados Comprovados</Badge>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Transforme sua Clínica com Dados Reais
                </h2>
                <p className="text-lg text-muted-foreground">
                  Nossas clínicas parceiras alcançaram resultados extraordinários em apenas 30 dias de uso
                </p>
              </div>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-3xl"></div>
              <div className="relative bg-card border border-border/50 rounded-2xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Dashboard em Tempo Real</h3>
                    <p className="text-sm text-muted-foreground">Acompanhe todos os KPIs importantes</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg">
                      <span className="text-sm text-foreground">Tempo Médio de Resposta</span>
                      <span className="font-semibold text-success">2.3 min</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                      <span className="text-sm text-foreground">Satisfação do Paciente</span>
                      <span className="font-semibold text-primary">94.7%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent/5 rounded-lg">
                      <span className="text-sm text-foreground">Atendimentos Hoje</span>
                      <span className="font-semibold text-accent">342</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="w-fit mx-auto">Depoimentos</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              O que Nossos Clientes Dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-accent">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Pronto para Revolucionar sua Clínica?
              </h2>
              <p className="text-xl text-white/90">
                Junte-se a mais de 500 clínicas que já transformaram seu atendimento
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Começar Teste Grátis de 14 Dias
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
                Falar com Especialista
              </Button>
            </div>

            <p className="text-sm text-white/70">
              Sem compromisso • Configuração em 5 minutos • Suporte dedicado
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-foreground">MediConnect</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma omnichannel para clínicas médicas de médio e grande porte.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Produto</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Funcionalidades</div>
                <div>Preços</div>
                <div>Integrações</div>
                <div>API</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Documentação</div>
                <div>Tutoriais</div>
                <div>Suporte Técnico</div>
                <div>Status</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Sobre Nós</div>
                <div>Blog</div>
                <div>Carreiras</div>
                <div>Contato</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-12 pt-8 text-center text-sm text-muted-foreground">
            © 2024 MediConnect. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;