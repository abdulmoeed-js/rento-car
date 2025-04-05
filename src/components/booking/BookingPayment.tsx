
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookingFormData } from "@/types/car";
import { CreditCard, AppleIcon, CreditCardIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackUserActivity, ActivityType } from "@/services/UserActivityService";

interface BookingPaymentProps {
  bookingData: BookingFormData;
  onBack: () => void;
  onSuccess: () => void;
}

export const BookingPayment: React.FC<BookingPaymentProps> = ({
  bookingData,
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Calculate booking details
  const { totalDays, totalPrice } = bookingData;
  const serviceFee = Math.round(totalPrice * 0.10); // 10% service fee
  const taxRate = 0.08; // 8% tax rate
  const taxAmount = Math.round((totalPrice + serviceFee) * taxRate);
  const totalAmount = totalPrice + serviceFee + taxAmount;
  
  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to complete this booking");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Track payment initiation
      await trackUserActivity(ActivityType.PAYMENT_INITIATED, {
        booking_details: {
          car_id: bookingData.car.id,
          amount: totalAmount,
          days: totalDays,
        }
      });
      
      // Call Stripe checkout function
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: totalAmount,
          currency: 'usd',
          booking: {
            car_id: bookingData.car.id,
            start_date: bookingData.startDate.toISOString(),
            end_date: bookingData.endDate.toISOString(),
            total_days: totalDays,
            pickup_time: bookingData.pickupTime,
            return_time: bookingData.returnTime,
            location: bookingData.location,
            message: bookingData.message,
          }
        }
      });
      
      if (error) throw error;
      
      // In a real implementation, redirect to Stripe checkout page
      // window.location.href = data.url;
      
      // For demo, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Track payment completion
      await trackUserActivity(ActivityType.PAYMENT_COMPLETED, {
        booking_details: {
          car_id: bookingData.car.id,
          amount: totalAmount,
          days: totalDays,
        }
      });
      
      toast.success("Payment processed successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Complete your booking by providing payment details
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            {bookingData.car.brand} {bookingData.car.model}
          </h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              {new Date(bookingData.startDate).toLocaleDateString()} - 
              {new Date(bookingData.endDate).toLocaleDateString()}
            </p>
            <p>
              {totalDays} {totalDays === 1 ? "day" : "days"} · {bookingData.location}
            </p>
          </div>
        </div>
        
        {/* Price Breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold">Price Details</h3>
          
          <div className="flex justify-between text-sm">
            <span>
              ${bookingData.car.price_per_day} x {totalDays} {totalDays === 1 ? "day" : "days"}
            </span>
            <span>${totalPrice}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Service fee</span>
            <span>${serviceFee}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Taxes (8%)</span>
            <span>${taxAmount}</span>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex justify-between font-semibold">
            <span>Total (USD)</span>
            <span>${totalAmount}</span>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            <p>Your card will only be pre-authorized. Payment will be processed after the host confirms your booking.</p>
          </div>
        </div>
        
        {/* Payment Methods */}
        <div className="space-y-3">
          <h3 className="font-semibold">Payment Method</h3>
          
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start text-left h-auto py-3">
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Credit or Debit Card
            </Button>
            
            {/* Apple Pay button */}
            <Button variant="outline" className="justify-start text-left h-auto py-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M9 7c-3 0-4 3-4 5.5 0 3 2 7.5 5 7.5 1.5 0 4-1 5-3"/><path d="M12 19V5c0-2.5-2-3-4-2s-3 2-3 6"/></svg>
              Apple Pay
            </Button>
            
            {/* Google Pay button */}
            <Button variant="outline" className="justify-start text-left h-auto py-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M2 7V5c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v2"/><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/></svg>
              Google Pay
            </Button>
          </div>
        </div>
        
        {/* Terms and Conditions */}
        <div className="flex items-start space-x-2 pt-4">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="terms"
              className="text-sm font-normal leading-snug text-muted-foreground"
            >
              I agree to the rental terms, cancellation policy, and acknowledge that I will be charged only after the host confirms my booking.
            </Label>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="w-full sm:w-auto"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button 
          onClick={handlePayment} 
          className="w-full sm:w-auto"
          disabled={!agreedToTerms || isLoading}
        >
          {isLoading ? "Processing..." : `Pre-authorize $${totalAmount}`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookingPayment;
