import { useState, useEffect } from "react";
import { Switch, Route, useLocation, useRoute, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MathJaxContext } from 'better-react-mathjax';
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Analytics from "@/pages/Analytics";
import Documents from "@/pages/Documents";
import Conversations from "@/pages/Conversations";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import DocumentRewrite from "@/pages/DocumentRewrite";
import RewriteHistory from "@/pages/RewriteHistory";
import TextToSpeech from "@/pages/TextToSpeech";
import Graphs from "@/pages/Graphs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Protected route component that redirects to login if not authenticated
function ProtectedRoute({ component: Component, ...rest }: any) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
    
    // Re-check when user updates
    window.addEventListener('user-updated', checkAuth);
    return () => window.removeEventListener('user-updated', checkAuth);
  }, []);
  
  if (isAuthenticated === null) {
    // Still loading
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component {...rest} />;
}

function Router() {
  const [location] = useLocation();
  const [onLoginPage] = useRoute("/login");
  
  return (
    <div className="flex flex-col min-h-screen">
      {!onLoginPage && <Header currentPath={location} />}
      <div className="flex-grow">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={() => <ProtectedRoute component={Home} />} />
          <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
          <Route path="/documents" component={() => <ProtectedRoute component={Documents} />} />
          <Route path="/conversations" component={() => <ProtectedRoute component={Conversations} />} />
          <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
          <Route path="/document-rewrite" component={() => <ProtectedRoute component={DocumentRewrite} />} />
          <Route path="/rewrite-history" component={() => <ProtectedRoute component={RewriteHistory} />} />
          <Route path="/text-to-speech" component={() => <ProtectedRoute component={TextToSpeech} />} />
          <Route path="/graphs" component={() => <ProtectedRoute component={Graphs} />} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {!onLoginPage && <Footer />}
    </div>
  );
}

// MathJax configuration for LaTeX rendering - SINGLE DOLLAR SIGNS DISABLED
const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    // STRICT delimiter configuration - NO single dollar signs to prevent currency confusion
    inlineMath: [['\\(', '\\)']],  // Only \( \) for inline math
    displayMath: [['\\[', '\\]'], ['$$', '$$']],  // Only \[ \] and $$ $$ for display math
    processEscapes: true,
    processEnvironments: true,
    // Disable single $ delimiters completely
    processRefs: true,
    packages: {'[+]': ['noerrors']},
    // Enhanced error handling
    formatError: (jax: any, err: any) => {
      console.warn('MathJax rendering error:', err);
      return jax;
    }
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    // Prevent processing of currency-like patterns
    ignoreHtmlClass: 'currency|money|price|cost'
  },
  startup: {
    ready: () => {
      console.log('🧮 MathJax ready with strict delimiter configuration');
      (window as any).MathJax.startup.defaultReady();
    }
  }
};

function App() {
  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </MathJaxContext>
  );
}

export default App;
