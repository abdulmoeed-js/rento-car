import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CarSeed {
  brand: string;
  model: string;
  year: number;
  location: string;
  price_per_day: number;
  car_type: string;
  fuel_type: string;
  transmission: string;
  doors: number;
  has_ac: boolean;
  license_plate: string;
  description: string;
  images: { url: string }[];
}

// Use some randomized/hardcoded values for demo
const demoCars: CarSeed[] = [
  {
    brand: "Honda",
    model: "City Aspire",
    year: 2022,
    location: "Karachi",
    price_per_day: 8000,
    car_type: "sedan",
    fuel_type: "gasoline",
    transmission: "automatic",
    doors: 4,
    has_ac: true,
    license_plate: "ABC-123",
    description: "Spacious Honda City Aspire 2022 auto. Immaculately maintained. Great city ride!",
    images: [{ url: "/public/lovable-uploads/c5b96ea5-bb51-49f4-a371-d60c2e57c514.png" }],
  },
  {
    brand: "Honda",
    model: "City Silver",
    year: 2023,
    location: "Lahore",
    price_per_day: 8500,
    car_type: "sedan",
    fuel_type: "gasoline",
    transmission: "automatic",
    doors: 4,
    has_ac: true,
    license_plate: "XYZ-789",
    description: "2023 Honda City in silver, smooth automatic and premium comfort, ideal for family trips.",
    images: [{ url: "/public/lovable-uploads/58943a57-48c0-8409-853692f63f3c.png" }],
  },
  {
    brand: "Honda",
    model: "City Blue",
    year: 2024,
    location: "Islamabad",
    price_per_day: 9500,
    car_type: "sedan",
    fuel_type: "gasoline",
    transmission: "automatic",
    doors: 4,
    has_ac: true,
    license_plate: "LMN-456",
    description: "Brand new 2024 Honda City Blue. Top model, city and highway friendly with advanced features.",
    images: [{ url: "/public/lovable-uploads/8ad6646a-ed6c-403f-8418-7147ed499ca7.png" }],
  },
];

// WARNING: This page should be accessible to devs/admins only! Remove after seeding.

const SeedCars = () => {
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Fetch any available host user to link as host_id, fallback to null.
  // You may want to use a real host id in your prod data!
  const getAnyHostId = async (): Promise<string | null> => {
    // Instead of using user_roles table with the enum type,
    // we'll check the profiles table where user_role is stored as text
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_role", "host")
      .limit(1)
      .single();
    
    if (error) {
      console.error("Error fetching host:", error);
      return null;
    }
    return data?.id || null;
  };

  const handleSeed = async () => {
    setLoading(true);
    setResultMessage(null);

    try {
      const host_id = await getAnyHostId();

      if (!host_id) {
        setResultMessage("No host found in the database. Assign a host role to a user first.");
        setLoading(false);
        return;
      }

      for (let i = 0; i < demoCars.length; i++) {
        const car = demoCars[i];

        // Check if car with same license plate exists for idempotency
        const { data: exists, error: existsError } = await supabase
          .from("cars")
          .select("id")
          .eq("license_plate", car.license_plate)
          .maybeSingle();

        let car_id = exists?.id;
        if (!car_id) {
          // Insert car
          const { data: insertCar, error: carError } = await supabase
            .from("cars")
            .insert({
              ...car,
              host_id,
              available_days: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
              available_hours: JSON.stringify({ start: "08:00", end: "20:00" }),
              cancellation_policy: "moderate",
              trust_rating: 4.6,
              multi_day_discount: 10,
              custom_availability: null,
              pickup_instructions: "Message host on arrival.",
              image_url: car.images[0].url,
            })
            .select("id")
            .single();
          if (carError || !insertCar) {
            throw new Error(
              `Failed to insert car ${car.brand} ${car.model}: ${
                carError?.message || "Unknown error"
              }`
            );
          }
          car_id = insertCar.id;
        }

        // Add image reference to car_images
        const { error: imageError } = await supabase.from("car_images").insert({
          car_id,
          image_path: car.images[0].url,
          is_primary: true,
        });
        if (imageError && !String(imageError.message).includes("duplicate")) {
          throw new Error("Failed to insert car image: " + imageError.message);
        }
      }
      setResultMessage("Seeded 3 demo cars successfully! Check your /cars listing.");
    } catch (error: any) {
      setResultMessage(`Something went wrong: ${error.message || error.toString()}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Seed Demo Cars</CardTitle>
          <p className="text-muted-foreground text-sm pt-2">
            Click the button below to insert 3 Honda City demo cars with seeded images (for test/dev).
          </p>
        </CardHeader>
        <CardContent>
          <Button disabled={loading} onClick={handleSeed} className="w-full mb-4">
            {loading ? "Seeding..." : "Seed Demo Cars"}
          </Button>
          {resultMessage && (
            <div
              className={`text-sm mt-2 ${
                resultMessage.startsWith("Seeded")
                  ? "text-green-600"
                  : "text-destructive"
              }`}
            >
              {resultMessage}
            </div>
          )}
          <div className="mt-6">
            <strong>Demo Images Used:</strong>
            <ul className="pt-2 space-y-1">
              <li>
                <img src="/public/lovable-uploads/c5b96ea5-bb51-49f4-a371-d60c2e57c514.png" alt="Car 1" className="h-14 rounded shadow" />
              </li>
              <li>
                <img src="/public/lovable-uploads/58943a57-48c0-8409-853692f63f3c.png" alt="Car 2" className="h-14 rounded shadow" />
              </li>
              <li>
                <img src="/public/lovable-uploads/8ad6646a-ed6c-403f-8418-7147ed499ca7.png" alt="Car 3" className="h-14 rounded shadow" />
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedCars;
