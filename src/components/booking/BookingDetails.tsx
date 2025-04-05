
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import TimeSelector from "./TimeSelector";
import { MessageSquare } from "lucide-react";

interface BookingDetailsProps {
  location: string;
  pickupTime: string;
  returnTime: string;
  message?: string;
  preferWhatsApp?: boolean;
  onLocationChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onWhatsAppPreferenceChange: (checked: boolean) => void;
  onSubmit: (pickupTime: string, returnTime: string, location: string, message?: string, preferWhatsApp?: boolean) => void;
  onBack: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  location,
  pickupTime,
  returnTime,
  message = "",
  preferWhatsApp = false,
  onLocationChange,
  onMessageChange,
  onWhatsAppPreferenceChange,
  onSubmit,
  onBack
}) => {
  const [pickupTimeState, setPickupTime] = useState(pickupTime);
  const [returnTimeState, setReturnTime] = useState(returnTime);
  const [locationState, setLocationState] = useState(location);
  const [messageState, setMessageState] = useState(message);
  const [preferWhatsAppState, setPreferWhatsApp] = useState(preferWhatsApp);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationState(e.target.value);
    onLocationChange(e.target.value);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageState(e.target.value);
    onMessageChange(e.target.value);
  };

  const handleWhatsAppPreferenceChange = (checked: boolean) => {
    setPreferWhatsApp(checked);
    onWhatsAppPreferenceChange(checked);
  };

  const handleSubmit = () => {
    onSubmit(
      pickupTimeState,
      returnTimeState,
      locationState,
      messageState,
      preferWhatsAppState
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Booking Details</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup-time">Pickup Time</Label>
              <TimeSelector
                value={pickupTimeState}
                onChange={setPickupTime}
                id="pickup-time"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="return-time">Return Time</Label>
              <TimeSelector
                value={returnTimeState}
                onChange={setReturnTime}
                id="return-time"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Pickup/Return Location</Label>
            <Input
              id="location"
              value={locationState}
              onChange={handleLocationChange}
              placeholder="Enter pickup/return location"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message to Host (Optional)</Label>
            <Textarea
              id="message"
              value={messageState}
              onChange={handleMessageChange}
              placeholder="Any special requests or questions for the host?"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="whatsapp"
              checked={preferWhatsAppState}
              onCheckedChange={handleWhatsAppPreferenceChange}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="whatsapp"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <MessageSquare className="h-4 w-4 mr-1 text-green-600" />
                Receive updates via WhatsApp
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
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
