
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileCheck } from "lucide-react";

const LicenseVerified: React.FC = () => {
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
};

export default LicenseVerified;
