
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CarFront, LogOut, User, Plus, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const OwnerPortal = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in or not a host
  React.useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.user_role !== 'host') {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.user_role !== 'host') {
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
          <h1 className="text-3xl font-bold text-rento-dark">Owner Portal</h1>
          <Button asChild>
            <Link to="/owner-portal/cars/new" className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Add New Car
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CarFront className="h-8 w-8 text-rento-blue mr-3" />
                <span className="text-3xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Active Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600 mr-3" />
                <span className="text-3xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-amber-600 mr-3" />
                <span className="text-3xl font-bold">$0</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Cars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CarFront className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p>You don't have any cars listed yet.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/owner-portal/cars/new">Add Your First Car</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Booking Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p>No booking requests yet.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OwnerPortal;
