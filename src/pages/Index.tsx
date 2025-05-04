
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CarFront, LogOut, User, Search, Plus, Calendar, MessageSquare, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useChat } from "@/context/ChatContext";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Index = () => {
  const { user, signOut, isLoading } = useAuth();
  const { unreadCount } = useChat();
  const navigate = useNavigate();
  const [isCheckingCars, setIsCheckingCars] = useState(false);

  useEffect(() => {
    // Check if we have cars in the database
    const checkCars = async () => {
      try {
        setIsCheckingCars(true);
        const { data: cars, error } = await fetch('https://tzawsihjrndgmaartefg.supabase.co/rest/v1/cars?select=id&limit=1', {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YXdzaWhqcm5kZ21hYXJ0ZWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Njc2NDYsImV4cCI6MjA1OTQ0MzY0Nn0.zLo_YNOQka-PB-ndxi0Nvv960Z4j7mtp9qMdpgKJ_fE',
          }
        }).then(res => res.json());
        
        if (!cars || cars.length === 0) {
          toast.info("Please seed the database with demo cars to fully experience the app", {
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error checking cars:", error);
      } finally {
        setIsCheckingCars(false);
      }
    };

    if (user) {
      checkCars();
    }
  }, [user]);

  // Loading state
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

  // Not authenticated: show login options
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6 px-4 max-w-md w-full">
          <div className="flex items-center gap-2">
            <CarFront className="h-12 w-12 text-rento-blue" />
            <span className="font-bold text-3xl text-rento-blue">Rento</span>
          </div>
          <p className="text-muted-foreground mb-4">Drive anywhere, anytime</p>

          <div className="flex flex-col w-full gap-4">
            {/* Direct user to auth page for login/sign up */}
            <Button size="lg" className="gap-2 w-full" asChild>
              <Link to="/auth">
                <User className="h-5 w-5" />
                Sign In / Sign Up
              </Link>
            </Button>

            {/* Also allow to browse cars as guest */}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/cars">
                <Search className="h-5 w-5 mr-2" />
                Browse Cars
              </Link>
            </Button>

            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 hover:shadow-md transition-all cursor-pointer">
              <Link to="/wheelationship" className="block p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-100 text-pink-600 p-2 rounded-full">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Find your perfect car match!</h3>
                    <p className="text-sm text-muted-foreground">Try our car matching quiz</p>
                  </div>
                </div>
              </Link>
            </Card>

            {/* Seed cars link for testing */}
            <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
              <Link to="/seed-cars">
                <Plus className="h-4 w-4 mr-2" />
                Seed Demo Cars
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated - show dashboard
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-8">Welcome, {user.full_name || 'User'}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
          {/* Main Actions */}
          <Card className="p-6 hover:shadow-md transition-all border-2 border-rento-blue/10">
            <h2 className="font-semibold mb-4">Find Your Car</h2>
            <div className="space-y-3">
              <Button className="w-full gap-2" onClick={() => navigate("/cars")}>
                <Search className="h-4 w-4" />
                Browse All Cars
              </Button>
              
              <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/wheelationship")}>
                <Sparkles className="h-4 w-4" />
                Car Matching Quiz
              </Button>
            </div>
          </Card>
          
          {/* Host Actions or User Actions */}
          <Card className="p-6 hover:shadow-md transition-all">
            <h2 className="font-semibold mb-4">
              {user.user_role === 'host' ? 'Host Dashboard' : 'My Bookings'}
            </h2>
            <div className="space-y-3">
              {user.user_role === 'host' ? (
                <Button className="w-full gap-2" onClick={() => navigate("/owner-portal")}>
                  <Plus className="h-4 w-4" />
                  Manage My Cars
                </Button>
              ) : (
                <Button className="w-full gap-2" onClick={() => navigate("/cars")}>
                  <Calendar className="h-4 w-4" />
                  Find Cars
                </Button>
              )}
              
              <Button variant="outline" className="w-full gap-2 relative" onClick={() => navigate("/chat")}>
                <MessageSquare className="h-4 w-4" />
                Chat Support
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Testing Tools with more prominent Seed Demo Cars button */}
        <div className="mt-8">
          <Button 
            variant="default" 
            className="flex items-center gap-2"
            onClick={() => navigate("/seed-cars")}
          >
            <Plus className="h-4 w-4" />
            Seed Demo Cars
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
            Add sample cars to browse and test the app's features
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
