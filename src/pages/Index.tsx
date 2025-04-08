
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CarFront, LogOut, User, Search, Plus, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    // If not authenticated, redirect to auth page
    window.location.href = "/auth";
    return null;
  }

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
      
      {/* Main Content */}
      <main className="container mx-auto p-4 mt-8">
        <h1 className="text-2xl font-bold text-rento-dark mb-4">
          Welcome to Rento {user.user_role === 'host' ? 'Owner Portal' : 'Dashboard'}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user.user_role === 'host' ? (
            // Car Owner Portal UI
            <>
              <div className="bg-rento-gray p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Manage Your Vehicles</h2>
                <p className="text-muted-foreground mb-4">
                  Add, edit, and manage your car listings to start earning money.
                </p>
                <Button asChild className="w-full sm:w-auto" size="lg">
                  <Link to="/owner-portal/cars" className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
                    Add New Car
                  </Link>
                </Button>
              </div>
              
              <div className="bg-rento-gray p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Booking Requests</h2>
                <p className="text-muted-foreground mb-4">
                  View and manage booking requests for your vehicles.
                </p>
                <Button asChild variant="outline" className="w-full sm:w-auto" size="lg">
                  <Link to="/owner-portal/bookings" className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    View Bookings
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            // Renter Dashboard UI
            <>
              <div className="bg-rento-gray p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Find a Car</h2>
                <p className="text-muted-foreground mb-4">
                  Browse available cars and find the perfect vehicle for your next trip.
                </p>
                <Button asChild className="w-full sm:w-auto" size="lg">
                  <Link to="/cars" className="flex items-center">
                    <Search className="mr-2 h-5 w-5" />
                    Browse Cars
                  </Link>
                </Button>
              </div>
              
              <div className="bg-rento-gray p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">My Trips</h2>
                <p className="text-muted-foreground mb-4">
                  View your upcoming, active, and past bookings.
                </p>
                <Button asChild variant="outline" className="w-full sm:w-auto" size="lg">
                  <Link to="/trips" className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    View My Trips
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
