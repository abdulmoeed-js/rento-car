
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeSelectorProps {
  pickupTime: string;
  returnTime: string;
  onPickupTimeChange: (value: string) => void;
  onReturnTimeChange: (value: string) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  pickupTime,
  returnTime,
  onPickupTimeChange,
  onReturnTimeChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="pickup-time">Pickup Time</Label>
        <Input
          id="pickup-time"
          type="time"
          value={pickupTime}
          onChange={(e) => onPickupTimeChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="return-time">Return Time</Label>
        <Input
          id="return-time"
          type="time"
          value={returnTime}
          onChange={(e) => onReturnTimeChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default TimeSelector;
