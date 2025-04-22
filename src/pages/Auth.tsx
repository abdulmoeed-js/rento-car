
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import AuthTabs from "@/components/AuthTabs";
import { CarFront } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Auth: React.FC = () => {
  const { isLoading, user, authInitialized } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // If authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (authInitialized && user) {
      console.log("Auth page: User authenticated, redirecting", user);
      setIsRedirecting(true);
      
      const timer = setTimeout(() => {
        if (user.user_role === 'host') {
          navigate("/owner-portal");
        } else {
          navigate("/cars");
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, authInitialized, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rento-lightblue to-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md mb-6 flex flex-col items-center">
        <div className="bg-rento-blue text-white p-3 rounded-full mb-3">
          <CarFront className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-rento-dark">Rento</h1>
        <p className="text-muted-foreground mt-1">Drive anywhere, anytime</p>
      </div>
      
      {isLoading ? (
        <Card className="w-full max-w-md p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </Card>
      ) : isRedirecting ? (
        <Card className="w-full max-w-md p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </Card>
      ) : (
        <AuthTabs />
      )}
      
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>©{new Date().getFullYear()} Rento. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Auth;
