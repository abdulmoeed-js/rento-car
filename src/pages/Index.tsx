
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CarFront, LogOut, User, Search } from "lucide-react";
import { Link } from "react-router-dom";

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
          Welcome to Rento
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rento-gray p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">License Status</h2>
            
            <div className="flex items-center gap-3 p-3 rounded-md bg-white">
              <div className={`rounded-full w-3 h-3 ${
                user.licenseStatus === 'verified' 
                  ? 'bg-green-500' 
                  : user.licenseStatus === 'pending_verification' 
                    ? 'bg-amber-500' 
                    : 'bg-red-500'
              }`} />
              
              <div>
                <p className="font-medium">
                  {user.licenseStatus === 'verified' 
                    ? 'Verified' 
                    : user.licenseStatus === 'pending_verification' 
                      ? 'Pending Verification' 
                      : 'Not Uploaded'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.licenseStatus === 'verified' 
                    ? 'Your driver\'s license has been verified.' 
                    : user.licenseStatus === 'pending_verification' 
                      ? 'Your license is being reviewed. This can take 1-2 business days.' 
                      : 'Please upload your driver\'s license to rent a car.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-rento-gray p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Find a Car</h2>
            <p className="text-muted-foreground mb-4">
              Ready to hit the road? Browse our selection of cars available for rent.
            </p>
            <Button asChild className="w-full sm:w-auto" size="lg">
              <Link to="/cars" className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Browse Cars
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
