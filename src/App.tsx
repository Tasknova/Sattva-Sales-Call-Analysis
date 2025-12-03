import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AnalysisDetail from "./pages/AnalysisDetail";
import CallDetails from "./pages/CallDetails";
import CallDetail from "./pages/CallDetail";
import NotFound from "./pages/NotFound";
import GroupPage from "./pages/GroupPage";
import AuthCallback from "./pages/AuthCallback";
import TestSignup from "./components/auth/TestSignup";
import ClientsPage from "./components/ClientsPage";
import JobsPage from "./components/JobsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/test-signup" element={<TestSignup />} />
            <Route path="/analysis/:id" element={<AnalysisDetail />} />
            <Route path="/call/:callId" element={<CallDetails />} />
            <Route path="/call-details" element={<CallDetail />} />
            <Route path="/group/:groupId" element={<GroupPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
