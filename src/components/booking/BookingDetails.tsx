
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface BookingDetailsProps {
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
  onBack,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(pickupTime, returnTime, location, message, preferWhatsApp);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="location">Pickup/Return Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Preferred location"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message to Host</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Any special requests or information for the host..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch 
          id="whatsapp-preference" 
          checked={preferWhatsApp} 
          onCheckedChange={onWhatsAppPreferenceChange} 
        />
        <Label htmlFor="whatsapp-preference">Send booking notifications via WhatsApp</Label>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Continue
        </Button>
      </div>
    </form>
  );
};

export default BookingDetails;
