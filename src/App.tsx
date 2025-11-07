import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import Dashboard from "./pages/Dashboard";
import Scripts from "./pages/Scripts";
import Stats from "./pages/Stats";
import CalendarioEditorial from "./pages/CalendarioEditorial";
import Ideias from "./pages/Ideias";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background pb-20">
    <main className="h-full overflow-auto">{children}</main>
    <BottomNav />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/scripts" element={<Layout><Scripts /></Layout>} />
          <Route path="/calendario" element={<Layout><CalendarioEditorial /></Layout>} />
          <Route path="/ideias" element={<Layout><Ideias /></Layout>} />
          <Route path="/stats" element={<Layout><Stats /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
