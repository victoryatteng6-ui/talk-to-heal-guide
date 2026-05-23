import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { ReferralTracker } from "@/components/ReferralTracker";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import { Waveform } from "@/components/Waveform";

const Chat = lazy(() => import("./pages/Chat"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WellnessPage = lazy(() => import("./pages/WellnessPage"));
const Labs = lazy(() => import("./pages/Labs"));
const Admin = lazy(() => import("./pages/Admin"));
const AuthPage = lazy(() => import("./pages/Auth"));
const Clinics = lazy(() => import("./pages/Clinics"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8" role="status" aria-live="polite">
      <Waveform isActive barCount={6} color="primary" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ReferralTracker />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex flex-1 flex-col">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/wellness" element={<WellnessPage />} />
                  <Route path="/labs" element={<Labs />} />
                  <Route path="/clinics" element={<Clinics />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
