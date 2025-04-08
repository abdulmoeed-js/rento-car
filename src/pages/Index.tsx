
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CarFront, LogOut, User, Search, Plus, Calendar } from "lucide-react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

const Index = () => {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Ensure the user has a role and redirect accordingly
      const userRole = user.user_role || 'renter';
      
      if (userRole === 'renter') {
        navigate("/cars");
      } else if (userRole === 'host') {
        navigate("/owner-portal");
      }
    }
  }, [user, navigate]);

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <CarFront className="h-8 w-8 text-rento-blue" />
            <span className="font-bold text-2xl text-rento-blue">Rento</span>
          </div>
          <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // This will only render briefly before redirecting
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-rento-blue text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CarFront className="h-6 w-6" />
            <span className="font-bold text-xl">Rento</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline">
                {user.email || user.phone}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content - This will briefly show before redirecting */}
      <div className="container mx-auto p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
      </div>
    </div>
  );
};

export default Index;
