
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CarListing from "./pages/CarListing";
import CarDetail from "./pages/CarDetail";
import UploadLicense from "./pages/UploadLicense";
import OwnerPortal from "./pages/OwnerPortal";
import { hasRole } from "@/utils/supabaseHelpers";
import { useEffect, useState } from "react";
import Wheelationship from "./pages/Wheelationship";
import SeedCars from "./pages/SeedCars";
import ChatPage from "./pages/ChatPage";
import { Layout } from "@/components/Layout";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) => {
  const { user, isLoading } = useAuth();
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (user && requiredRole) {
        const hasCorrectRole = await hasRole(user.id, requiredRole);
        setHasRequiredRole(hasCorrectRole);
      }
      setRoleCheckComplete(true);
    };

    if (user) {
      checkRole();
    } else {
      setRoleCheckComplete(true); // Ensure we complete the check even if no user
    }
  }, [user, requiredRole]);

  if (isLoading || !roleCheckComplete) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (requiredRole && !hasRequiredRole) {
    return <div className="p-4">Unauthorized: You don't have the required role.</div>;
  }

  return children;
};

const AppContent = () => {
  const { authInitialized, isLoading } = useAuth();
  
  if (!authInitialized || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/cars" element={<CarListing />} />
      <Route path="/cars/:carId" element={<CarDetail />} />
      <Route path="/upload-license" element={<UploadLicense />} />
      <Route path="/wheelationship" element={<Wheelationship />} />
      <Route path="/seed-cars" element={<SeedCars />} />
      <Route path="/chat" element={<ChatPage />} />

      <Route
        path="/owner-portal"
        element={
          <ProtectedRoute requiredRole="host">
            <OwnerPortal />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <Layout>
              <AppContent />
              <Toaster position="top-center" />
            </Layout>
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
