import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CarListing from "./pages/CarListing";
import CarDetail from "./pages/CarDetail";
import UploadLicense from "./pages/UploadLicense";
import OwnerPortal from "./pages/OwnerPortal";
import Admin from "./pages/Admin";
import { hasRole } from "@/utils/supabaseHelpers";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import Chat from "./pages/Chat";

// Add this import for the Wheelationship page
import Wheelationship from "./pages/Wheelationship";

const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) => {
  const { user, loading } = useAuth();
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
    }
  }, [user, requiredRole]);

  if (loading || !roleCheckComplete) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (requiredRole && !hasRequiredRole) {
    return <div>Unauthorized</div>;
  }

  return children;
};

const App = () => {
  const { authInitialized } = useAuth();
  
  if (!authInitialized) {
    return <div>Loading...</div>;
  }
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
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
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              }
            />
             <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
