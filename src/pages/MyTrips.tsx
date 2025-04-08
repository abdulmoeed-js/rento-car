
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CarFront, LogOut, User, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const MyTrips = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-rento-blue text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <CarFront className="h-6 w-6" />
            <span className="font-bold text-xl">Rento</span>
          </Link>
          
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

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-rento-dark">My Trips</h1>
          <Button asChild>
            <Link to="/cars">Find a Car</Link>
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>You don't have any upcoming trips.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/cars">Browse Cars</Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="text-center py-8 text-muted-foreground">
              <CarFront className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>You don't have any active trips.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/cars">Browse Cars</Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>You don't have any completed trips.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/cars">Browse Cars</Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="cancelled">
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>You don't have any cancelled trips.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/cars">Browse Cars</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyTrips;
