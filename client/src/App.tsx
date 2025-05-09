import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Analytics from "@/pages/Analytics";
import Documents from "@/pages/Documents";
import Settings from "@/pages/Settings";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

function Router() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <Header currentPath={location} />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/documents" component={Documents} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
