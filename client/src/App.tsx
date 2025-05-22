import { useState, useEffect } from "react";
import { Switch, Route, useLocation, useRoute, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Analytics from "@/pages/Analytics";
import Documents from "@/pages/Documents";
import Conversations from "@/pages/Conversations";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TextSelectionToolbar from "@/components/TextSelectionToolbar";

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
          <Route component={NotFound} />
        </Switch>
      </div>
      {!onLoginPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <TextSelectionToolbar />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
