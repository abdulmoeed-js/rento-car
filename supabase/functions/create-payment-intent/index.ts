
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  car_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  pickup_time: string;
  return_time: string;
  location: string;
  message?: string;
}

interface PaymentRequestBody {
  amount: number;
  currency: string;
  booking: BookingRequest;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Get current Supabase user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Parse request body
    const { amount, currency, booking }: PaymentRequestBody = await req.json();

    // Get Stripe API key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe API key not configured');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Check if user already has a Stripe customer record
    let customerId;
    if (user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_id: user.id,
          },
        });
        customerId = customer.id;
      }
    } else {
      // Create anonymous customer
      const customer = await stripe.customers.create({
        metadata: {
          supabase_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create a payment intent (for pre-authorization)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      capture_method: 'manual', // This enables the pre-authorization (hold)
      setup_future_usage: 'off_session',
      metadata: {
        car_id: booking.car_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_days: booking.total_days.toString(),
      },
    });

    // Save booking with payment intent ID
    const { error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        car_id: booking.car_id,
        user_id: user.id,
        start_date: booking.start_date.split('T')[0],
        end_date: booking.end_date.split('T')[0],
        status: 'pending',
        payment_intent_id: paymentIntent.id,
        message: booking.message,
        pickup_time: booking.pickup_time,
        return_time: booking.return_time,
      });

    if (bookingError) {
      console.error('Error saving booking:', bookingError);
      // If there's an error saving the booking, cancel the payment intent
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw new Error('Failed to save booking information');
    }

    // Create a Stripe Checkout Session for the customer to complete the payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'us_bank_account'],
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Car Rental Pre-authorization',
              description: `${booking.total_days} day rental - Authorization only`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        capture_method: 'manual', // Pre-authorization only
        setup_future_usage: 'off_session',
      },
      success_url: `${req.headers.get('origin')}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/booking-cancelled`,
    });

    // Return checkout URL
    return new Response(
      JSON.stringify({
        url: session.url,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Supabase client for edge function
function createClient(supabaseUrl: string, supabaseKey: string) {
  return {
    auth: {
      getUser: async (token: string) => {
        try {
          const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: supabaseKey,
            },
          });
          
          const data = await response.json();
          
          if (response.ok) {
            return { data: { user: data }, error: null };
          } else {
            return { data: { user: null }, error: data };
          }
        } catch (error) {
          return { data: { user: null }, error };
        }
      },
    },
    from: (table: string) => ({
      insert: async (data: any) => {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            return { error: null };
          } else {
            const errorData = await response.json();
            return { error: errorData };
          }
        } catch (error) {
          return { error };
        }
      },
    }),
  };
}
