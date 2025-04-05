
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Clock } from "lucide-react";

const LicensePending: React.FC = () => {
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
};

export default LicensePending;
