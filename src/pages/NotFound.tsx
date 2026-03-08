import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background parchment-texture p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 elvish-glow">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h1 className="font-display text-6xl font-bold text-primary mb-2">404</h1>
      <p className="font-display text-xl text-foreground mb-2">Page Not Found</p>
      <p className="font-body text-muted-foreground mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/"
        className="font-display text-sm tracking-wide text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      >
        Back to Home
      </a>
    </div>
  );
};

export default NotFound;
