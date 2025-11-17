import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const { isAuthenticated, loading } = useAuth();

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

  // Redirect to dashboard if authenticated, otherwise show auth page
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/auth" replace />;
};

export default Login;