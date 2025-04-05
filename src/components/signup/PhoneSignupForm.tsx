
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { validatePhone } from "@/utils/formValidation";

interface PhoneSignupFormProps {
  onSubmit: (phone: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

const PhoneSignupForm: React.FC<PhoneSignupFormProps> = ({
  onSubmit,
  error,
  isLoading,
}) => {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone field
    const phoneValidationError = validatePhone(phone);
    setPhoneError(phoneValidationError);
    
    if (phoneValidationError) {
      return;
    }
    
    await onSubmit(phone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and restrict to a reasonable length
    if (/^\d*$/.test(value) && value.length <= 10) {
      setPhone(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="signup-phone">Phone Number</Label>
        <Input
          id="signup-phone"
          type="tel"
          placeholder="10-digit number"
          value={phone}
          onChange={handlePhoneChange}
          required
        />
        {phoneError && (
          <p className="text-sm text-destructive mt-1">{phoneError}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending OTP..." : "Send OTP"}
      </Button>
    </form>
  );
};

export default PhoneSignupForm;
