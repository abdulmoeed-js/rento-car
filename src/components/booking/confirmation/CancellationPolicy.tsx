
import React from "react";
import { Separator } from "@/components/ui/separator";

export const CancellationPolicy: React.FC = () => {
  return (
    <>
      <Separator />

      <div className="text-sm">
        <h4 className="font-medium mb-2">Cancellation policy</h4>
        <p>Free cancellation up to 24 hours before the trip starts. After that, a fee equivalent to one day's rental may apply.</p>
      </div>
    </>
  );
};
