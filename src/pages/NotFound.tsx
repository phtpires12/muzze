import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Detectar URLs com query strings codificadas incorretamente
    // Ex: /shot-list/record%3FscriptId=xxx → /shot-list/record?scriptId=xxx
    const decodedPath = decodeURIComponent(location.pathname);
    
    if (decodedPath !== location.pathname && decodedPath.includes('?')) {
      console.log("[NotFound] URL codificada incorretamente detectada");
      console.log("[NotFound] Original:", location.pathname);
      console.log("[NotFound] Decodificada:", decodedPath);
      
      // Separar o path da query string
      const [path, queryString] = decodedPath.split('?');
      const correctUrl = queryString ? `${path}?${queryString}` : path;
      
      // Redirecionar para URL correta
      navigate(correctUrl, { replace: true });
      return;
    }
    
    console.error("404 Error: Rota não encontrada:", location.pathname);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <a href="/" className="text-primary underline hover:text-primary/80">
          Voltar para o início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
