
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, FileCheck, X, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CameraCapture from "./CameraCapture";

const LicenseUpload: React.FC = () => {
  const { uploadLicense, user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleCapture = async (imageData: string) => {
    setShowCamera(false);
    setIsUploading(true);
    
    try {
      await uploadLicense(imageData);
      toast({
        title: "License uploaded",
        description: "Your license has been submitted for verification."
      });
    } catch (error) {
      console.error("Error uploading license:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your license. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      
      try {
        await uploadLicense(imageData);
        toast({
          title: "License uploaded",
          description: "Your license has been submitted for verification."
        });
      } catch (error) {
        console.error("Error uploading license:", error);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your license. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  if (user?.licenseStatus === 'pending_verification') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">License Verification Pending</CardTitle>
          <CardDescription className="text-center">
            Your driver's license has been uploaded and is being reviewed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-4">
          <div className="bg-amber-100 text-amber-800 rounded-full p-4">
            <Clock className="h-8 w-8" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          This process typically takes 1-2 business days. We'll notify you once verified.
        </CardFooter>
      </Card>
    );
  }

  if (user?.licenseStatus === 'verified') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">License Verified</CardTitle>
          <CardDescription className="text-center">
            Your driver's license has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-4">
          <div className="bg-green-100 text-green-700 rounded-full p-4">
            <FileCheck className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user?.licenseStatus === 'rejected') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">License Rejected</CardTitle>
          <CardDescription className="text-center">
            Your driver's license verification failed. Please contact support for assistance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-4">
          <div className="bg-red-100 text-red-700 rounded-full p-4">
            <X className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Using String() to ensure proper type comparison
  if (String(user?.licenseStatus) === 'pending_reupload') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Reupload Required</CardTitle>
          <CardDescription className="text-center">
            We need a clearer image of your driver's license. Please upload it again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <Button 
              className="flex items-center gap-2 w-full py-6" 
              onClick={() => setShowCamera(true)}
              disabled={isUploading}
            >
              <Camera className="h-5 w-5" /> Take a New Photo
            </Button>
            
            <div className="relative">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 w-full py-6"
                disabled={isUploading}
              >
                <Upload className="h-5 w-5" /> Upload New Image
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Upload Driver's License</CardTitle>
          <CardDescription className="text-center">
            Please upload a clear photo of your driver's license
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <Button 
              className="flex items-center gap-2 w-full py-6" 
              onClick={() => setShowCamera(true)}
              disabled={isUploading}
            >
              <Camera className="h-5 w-5" /> Take a Photo
            </Button>
            
            <div className="relative">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 w-full py-6"
                disabled={isUploading}
              >
                <Upload className="h-5 w-5" /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground text-center">
          We only use your license for verification purposes. Your data is securely stored.
        </CardFooter>
      </Card>
      
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onCancel={() => setShowCamera(false)} 
        />
      )}
    </>
  );
};

export default LicenseUpload;
