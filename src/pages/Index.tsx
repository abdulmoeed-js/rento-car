
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CarFront, LogOut, User, Search, Plus, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only attempt to redirect if authentication check is complete
    if (!isLoading && user) {
      setIsRedirecting(true);
      
      // Ensure the user has a role and redirect accordingly
      const userRole = user.user_role || 'renter';
      
      // Use a short timeout to prevent potential redirect loops
      const redirectTimer = setTimeout(() => {
        if (userRole === 'renter') {
          navigate("/cars");
        } else if (userRole === 'host') {
          navigate("/owner-portal");
        }
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, isLoading, navigate]);

  // If authentication is still loading, show loading state
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

  // If not authenticated, direct to auth page
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <CarFront className="h-12 w-12 text-rento-blue" />
            <span className="font-bold text-3xl text-rento-blue">Rento</span>
          </div>
          <p className="text-muted-foreground mb-4">Drive anywhere, anytime</p>
          
          <Button size="lg" className="gap-2" asChild>
            <Link to="/auth">
              <User className="h-5 w-5" />
              Sign In / Sign Up
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Showing a redirecting state to prevent flashing content
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <CarFront className="h-8 w-8 text-rento-blue" />
            <span className="font-bold text-2xl text-rento-blue">Rento</span>
          </div>
          <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Default content (fallback, should rarely be seen)
  return (
    <div className="min-h-screen bg-white">
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
      
      <div className="container mx-auto p-8 flex flex-col items-center justify-center">
        <Button 
          className="mb-4 gap-2" 
          onClick={() => user.user_role === 'host' ? navigate("/owner-portal") : navigate("/cars")}
        >
          {user.user_role === 'host' ? <Plus className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          {user.user_role === 'host' ? 'Go to Owner Portal' : 'Find Cars'}
        </Button>
        
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => navigate("/trips")}
        >
          <Calendar className="h-5 w-5" />
          My Trips
        </Button>
      </div>
    </div>
  );
};

export default Index;
