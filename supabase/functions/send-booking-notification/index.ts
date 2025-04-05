
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingNotificationRequest {
  booking: {
    id: string;
    carName: string;
    startDate: string;
    endDate: string;
    pickupTime: string;
    returnTime: string;
    location: string;
    totalDays: number;
    totalPrice: number;
  };
  renter: {
    name: string;
    phone: string;
    email: string;
  };
  preferWhatsApp: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking, renter, preferWhatsApp } = await req.json() as BookingNotificationRequest;
    
    let notificationSent = false;
    let notificationMethod = 'none';
    let errorMessage = '';
    
    // Format the message content
    const bookingLink = `https://your-app-url.com/host/bookings/${booking.id}`;
    const message = `
      New booking request from ${renter.name}!
      
      Car: ${booking.carName}
      Pickup: ${booking.startDate} at ${booking.pickupTime}
      Return: ${booking.endDate} at ${booking.returnTime}
      Location: ${booking.location}
      Duration: ${booking.totalDays} days
      Total: $${booking.totalPrice.toFixed(2)}
      
      Review and respond to this request at: ${bookingLink}
    `;
    
    // Try to send WhatsApp notification if the user opted in
    if (preferWhatsApp && renter.phone) {
      try {
        // In a real implementation, integrate with WhatsApp Business API
        // For now, we'll simulate a successful WhatsApp send
        
        // Simulated WhatsApp API call would go here
        // const response = await fetch('https://whatsapp-api-url', {...});
        
        // For demo purposes, randomly simulate success/failure
        const whatsAppSuccessful = Math.random() > 0.3; // 70% success rate for demo
        
        if (whatsAppSuccessful) {
          notificationSent = true;
          notificationMethod = 'whatsapp';
          console.log(`WhatsApp notification sent to ${renter.phone}`);
        } else {
          throw new Error("WhatsApp API call failed");
        }
      } catch (error) {
        console.error("Error sending WhatsApp notification:", error);
        errorMessage = error.message;
        // Fall back to email if WhatsApp fails
      }
    }
    
    // Fall back to email if WhatsApp failed or wasn't chosen
    if (!notificationSent && renter.email) {
      try {
        // In a real implementation, integrate with an email service
        // For demo purposes, we'll simulate a successful email send
        
        // Simulated email API call would go here
        // const emailResponse = await fetch('https://email-api-url', {...});
        
        notificationSent = true;
        notificationMethod = 'email';
        console.log(`Email notification sent to ${renter.email}`);
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        errorMessage = errorMessage || emailError.message;
      }
    }
    
    // Return the result
    return new Response(
      JSON.stringify({
        success: notificationSent,
        method: notificationMethod,
        error: notificationSent ? null : errorMessage || "Failed to send notification",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: notificationSent ? 200 : 500,
      }
    );
    
  } catch (error) {
    console.error("Error in send-booking-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
