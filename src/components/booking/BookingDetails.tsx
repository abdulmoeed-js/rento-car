
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import TimeSelector from "./TimeSelector";

interface BookingDetailsProps {
  location: string;
  pickupTime: string;
  returnTime: string;
  onLocationChange: (location: string) => void;
  onPickupTimeChange?: (time: string) => void;
  onReturnTimeChange?: (time: string) => void;
  onMessageChange?: (message: string) => void;
  onWhatsAppPreferenceChange?: (prefer: boolean) => void;
  onSubmit: (pickupTime: string, returnTime: string, location: string, message?: string, preferWhatsApp?: boolean) => void;
  onBack: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  location,
  pickupTime,
  returnTime,
  onLocationChange,
  onPickupTimeChange,
  onReturnTimeChange,
  onMessageChange,
  onWhatsAppPreferenceChange,
  onSubmit,
  onBack
}) => {
  const [message, setMessage] = useState("");
  const [preferWhatsApp, setPreferWhatsApp] = useState(false);
  const [pickupTimeState, setPickupTimeState] = useState(pickupTime);
  const [returnTimeState, setReturnTimeState] = useState(returnTime);
  const [locationState, setLocationState] = useState(location);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocationState(newLocation);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  const handlePickupTimeChange = (time: string) => {
    setPickupTimeState(time);
    if (onPickupTimeChange) {
      onPickupTimeChange(time);
    }
  };

  const handleReturnTimeChange = (time: string) => {
    setReturnTimeState(time);
    if (onReturnTimeChange) {
      onReturnTimeChange(time);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    if (onMessageChange) {
      onMessageChange(newMessage);
    }
  };

  const handleWhatsAppChange = (checked: boolean) => {
    setPreferWhatsApp(checked);
    if (onWhatsAppPreferenceChange) {
      onWhatsAppPreferenceChange(checked);
    }
  };

  const handleSubmit = () => {
    onSubmit(pickupTimeState, returnTimeState, locationState, message, preferWhatsApp);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickup-location">Pickup Location</Label>
            <Input
              id="pickup-location"
              placeholder="Enter pickup location"
              value={locationState}
              onChange={handleLocationChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup-time">Pickup Time</Label>
              <TimeSelector 
                time={pickupTimeState}
                onChange={handlePickupTimeChange}
                id="pickup-time"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="return-time">Return Time</Label>
              <TimeSelector 
                time={returnTimeState}
                onChange={handleReturnTimeChange}
                id="return-time"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message to Host (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Any special requests or information for the host?"
              value={message}
              onChange={handleMessageChange}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="whatsapp"
              checked={preferWhatsApp}
              onCheckedChange={handleWhatsAppChange}
            />
            <Label
              htmlFor="whatsapp"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Send booking information to my WhatsApp
            </Label>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookingDetails;
