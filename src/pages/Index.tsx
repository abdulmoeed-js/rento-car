
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CarFront, LogOut, User, Search, Plus, Calendar, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useChat } from "@/context/ChatContext";
import RentoHeader from "@/components/layout/RentoHeader";

const Index = () => {
  const { user, signOut, isLoading } = useAuth();
  const { unreadCount } = useChat();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only attempt to redirect if authentication check is complete and user is logged in
    if (!isLoading && user) {
      setIsRedirecting(true);
      
      // Redirect based on user role
      const redirectTimer = setTimeout(() => {
        const userRole = user.user_role || 'renter';
        
        if (userRole === 'renter') {
          navigate("/cars");
        } else if (userRole === 'host') {
          navigate("/owner-portal");
        }
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, isLoading, navigate]);

  // If still checking authentication, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <CarFront className="h-8 w-8 text-rento-blue" />
            <span className="font-bold text-2xl text-rento-blue">Rento</span>
          </div>
          <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login option
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
          
          <Button variant="outline" className="mt-2" asChild>
            <Link to="/cars">
              <Search className="h-5 w-5 mr-2" />
              Browse Cars
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show redirecting state when about to navigate away
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

  // Default dashboard content (fallback, if redirection doesn't happen)
  return (
    <div className="min-h-screen bg-white">
      <RentoHeader />
      
      <div className="container mx-auto p-8 flex flex-col items-center justify-center">
        <Button 
          className="mb-4 gap-2" 
          onClick={() => user.user_role === 'host' ? navigate("/owner-portal") : navigate("/cars")}
        >
          {user.user_role === 'host' ? <Plus className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          {user.user_role === 'host' ? 'Go to Owner Portal' : 'Find Cars'}
        </Button>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate("/trips")}
          >
            <Calendar className="h-5 w-5" />
            My Trips
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2 relative"
            onClick={() => navigate("/chat")}
          >
            <MessageSquare className="h-5 w-5" />
            Chat
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
