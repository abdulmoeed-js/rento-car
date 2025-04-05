
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

interface LicenseReuploadProps {
  onTakePhoto: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

const LicenseReupload: React.FC<LicenseReuploadProps> = ({ 
  onTakePhoto, 
  onFileUpload, 
  isUploading 
}) => {
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
            onClick={onTakePhoto}
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
                onChange={onFileUpload}
                disabled={isUploading}
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseReupload;
