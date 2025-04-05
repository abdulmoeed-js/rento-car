
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface OtpFormProps {
  onBack: () => void;
}

const OtpForm: React.FC<OtpFormProps> = ({ onBack }) => {
  const { verifyOtp, isLoading } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(30);
  
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1); // Take only the first character
    setOtp(newOtp);
    
    // Auto-focus next input if we entered a digit
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    
    // Check if pasted content is a valid 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtp = [...otp];
      
      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus the last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    // Clear any previous errors
    setError(null);
    
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits of the OTP");
      return;
    }
    
    try {
      const { error } = await verifyOtp(otpString);
      if (error) {
        setError(error);
      } else {
        toast.success("Verification successful");
      }
    } catch (error: any) {
      setError(error.message || "OTP verification failed. Please try again.");
      console.error("OTP verification error:", error);
    }
  };

  const resendOtp = () => {
    setTimer(30);
    toast.info("OTP resent to your phone number");
    // In a real app, this would call an API to resend the OTP
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle>Verify Your Phone</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your phone
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, index) => (
            <Input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={(el) => (inputRefs.current[index] = el)}
              className="w-12 h-12 text-center text-lg"
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        <Button 
          onClick={handleVerify} 
          className="w-full" 
          disabled={otp.join("").length !== 6 || isLoading}
        >
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            {timer > 0 ? (
              <>Resend code in {timer}s</>
            ) : (
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm"
                onClick={resendOtp}
              >
                Resend code
              </Button>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OtpForm;
