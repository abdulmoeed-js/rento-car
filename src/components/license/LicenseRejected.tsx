
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

const LicenseRejected: React.FC = () => {
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
};

export default LicenseRejected;
