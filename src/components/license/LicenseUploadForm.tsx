
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

interface LicenseUploadFormProps {
  onTakePhoto: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

const LicenseUploadForm: React.FC<LicenseUploadFormProps> = ({ 
  onTakePhoto, 
  onFileUpload, 
  isUploading 
}) => {
  return (
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
            onClick={onTakePhoto}
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
                onChange={onFileUpload}
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
  );
};

export default LicenseUploadForm;
