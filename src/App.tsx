
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CarListing from "./pages/CarListing";
import CarDetail from "./pages/CarDetail";
import UploadLicense from "./pages/UploadLicense";
import OwnerPortal from "./pages/OwnerPortal";
import { hasRole } from "@/utils/supabaseHelpers";
import { useEffect, useState } from "react";
import Wheelationship from "./pages/Wheelationship";
import { Layout } from "@/components/Layout";
import { Toaster } from "sonner";

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

      <Route
        path="/owner-portal"
        element={
          <ProtectedRoute requiredRole="host">
            <OwnerPortal />
          </ProtectedRoute>
        }
      />
      {/* Temporarily commented out Admin route until we create the component
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Admin />
          </ProtectedRoute>
        }
      />
      */}
      {/* Temporarily commented out Chat route until we create the component
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      */}
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AppContent />
          <Toaster position="top-center" />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
