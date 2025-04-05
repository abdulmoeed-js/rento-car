
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CarFront, LogOut, User, Search, Upload, Clock, AlertTriangle, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    // If not authenticated, redirect to auth page
    window.location.href = "/auth";
    return null;
  }

  // Helper function to get status details
  const getStatusDetails = () => {
    switch (user.license_status) {
      case 'verified':
        return {
          icon: <BadgeCheck className="h-5 w-5" />,
          label: 'Verified',
          bgColor: 'bg-green-500',
          textColor: 'text-green-500',
          description: 'Your driver\'s license has been verified.'
        };
      case 'pending_verification':
        return {
          icon: <Clock className="h-5 w-5" />,
          label: 'Pending Verification',
          bgColor: 'bg-amber-500',
          textColor: 'text-amber-500',
          description: 'Your license is being reviewed. This can take 1-2 business days.'
        };
      case 'rejected':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          label: 'Verification Failed',
          bgColor: 'bg-red-500',
          textColor: 'text-red-500',
          description: 'Your license verification failed. Please contact support.'
        };
      case 'pending_reupload':
        return {
          icon: <Upload className="h-5 w-5" />,
          label: 'Reupload Required',
          bgColor: 'bg-orange-500',
          textColor: 'text-orange-500',
          description: 'Please upload a clearer image of your driver\'s license.'
        };
      default:
        return {
          icon: <Upload className="h-5 w-5" />,
          label: 'Not Uploaded',
          bgColor: 'bg-gray-500',
          textColor: 'text-gray-500',
          description: 'Please upload your driver\'s license to rent a car.'
        };
    }
  };

  const statusDetails = getStatusDetails();

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
              
              {/* KYC Status Badge */}
              {user.license_status === 'pending_verification' && (
                <Badge variant="outline" className="ml-1 bg-amber-100 text-amber-800 border-amber-200">
                  <Clock className="h-3 w-3 mr-1" /> KYC Pending
                </Badge>
              )}
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
          Welcome to Rento {user.user_role === 'host' ? 'Host Dashboard' : ''}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rento-gray p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">License Status</h2>
            
            <div className="flex items-center gap-3 p-3 rounded-md bg-white">
              <div className={`rounded-full w-3 h-3 ${statusDetails.bgColor}`} />
              
              <div>
                <p className="font-medium flex items-center">
                  {statusDetails.label}
                  {user.license_status === 'pending_verification' && (
                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {statusDetails.description}
                </p>
              </div>
            </div>
            
            {(user.license_status === 'not_uploaded' || user.license_status === 'pending_reupload') && (
              <Button className="w-full mt-4" asChild>
                <Link to="/upload-license">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload License
                </Link>
              </Button>
            )}
          </div>
          
          <div className="bg-rento-gray p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              {user.user_role === 'host' ? 'Manage Your Listings' : 'Find a Car'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {user.user_role === 'host' 
                ? 'List your car and start earning money today.'
                : 'Ready to hit the road? Browse our selection of cars available for rent.'}
            </p>
            <Button asChild className="w-full sm:w-auto" size="lg">
              <Link to={user.user_role === 'host' ? "/host/listings" : "/cars"} className="flex items-center">
                {user.user_role === 'host' 
                  ? <CarFront className="mr-2 h-5 w-5" />
                  : <Search className="mr-2 h-5 w-5" />
                }
                {user.user_role === 'host' ? 'Manage Listings' : 'Browse Cars'}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
