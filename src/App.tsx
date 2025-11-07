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
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import MyProgress from "./pages/MyProgress";
import Settings from "./pages/Settings";
import SendSuggestions from "./pages/SendSuggestions";
import Help from "./pages/Help";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
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
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/edit-profile" element={<Layout><EditProfile /></Layout>} />
          <Route path="/my-progress" element={<Layout><MyProgress /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/send-suggestions" element={<Layout><SendSuggestions /></Layout>} />
          <Route path="/help" element={<Layout><Help /></Layout>} />
          <Route path="/terms" element={<Layout><TermsOfUse /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
