import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Favourites from "./pages/Favourites";
import AddGame from "./pages/AddGame";
import FindGame from "./pages/FindGame";
import SpotDetails from "./pages/SpotDetails";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ComingSoon from "./pages/ComingSoon";
import CompanyEvents from "./pages/CompanyEvents";
import AdminGames from "./pages/AdminGames";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

function AppLayout({
  children,
  showPrimaryCTA = true,
}: {
  children: React.ReactNode;
  showPrimaryCTA?: boolean;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader showPrimaryCTA={showPrimaryCTA} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/forgot-password"
            element={
              <AppLayout showPrimaryCTA={false}>
                <ForgotPassword />
              </AppLayout>
            }
          />
          <Route
            path="/find-game"
            element={
              <ProtectedRoute>
                <AppLayout showPrimaryCTA={false}>
                  <FindGame />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-game"
            element={
              <ProtectedRoute>
                <AppLayout showPrimaryCTA={false}>
                  <AddGame />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/:id"
            element={
              <ProtectedRoute>
                <AppLayout showPrimaryCTA={false}>
                  <SpotDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/favourites"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Favourites />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Terms and Privacy Pages */}
          <Route
            path="/terms"
            element={
              <AppLayout>
                <Terms />
              </AppLayout>
            }
          />
          <Route
            path="/privacy"
            element={
              <AppLayout>
                <Privacy />
              </AppLayout>
            }
          />
          <Route
            path="/coming-soon"
            element={
              <AppLayout showPrimaryCTA={false}>
                <ComingSoon />
              </AppLayout>
            }
          />
          <Route
            path="/company-events"
            element={
              <AppLayout>
                <CompanyEvents />
              </AppLayout>
            }
          />
          <Route
            path="/admin/games"
            element={
              <ProtectedRoute>
                <AppLayout showPrimaryCTA={false}>
                  <AdminGames />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppLayout showPrimaryCTA={false}>
                  <Notifications />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
   
