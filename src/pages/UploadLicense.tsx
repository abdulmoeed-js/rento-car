
import React from "react";
import { useAuth } from "@/context/AuthContext";
import LicenseUpload from "@/components/LicenseUpload";
import { CarFront, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const UploadLicense: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = "/auth";
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
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
      <main className="container mx-auto p-4 mt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-rento-dark mb-2">
            Driver's License Verification
          </h1>
          <p className="text-gray-600">
            Please upload your driver's license to verify your identity before renting a car.
          </p>
        </div>
        
        <LicenseUpload />
      </main>
    </div>
  );
};

export default UploadLicense;
