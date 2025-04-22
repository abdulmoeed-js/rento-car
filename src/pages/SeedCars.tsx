
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CarFront, CheckCircle2 } from "lucide-react";

// Fixed seed data for the cars
const seedCars = [
  {
    brand: "Toyota",
    model: "Corolla",
    year: 2020,
    transmission: "automatic",
    fuel_type: "hybrid",
    car_type: "sedan",
    doors: 4,
    has_ac: true,
    license_plate: "ABC123",
    price_per_day: 45,
    multi_day_discount: 10,
    cancellation_policy: "moderate",
    location: "New York City, NY",
    description: "Reliable and fuel-efficient Toyota Corolla, perfect for city driving.",
    image_url: "/lovable-uploads/8ad6646a-ed6c-403f-8418-7147ed499ca7.png"
  },
  {
    brand: "Ford",
    model: "Mustang",
    year: 2022,
    transmission: "automatic",
    fuel_type: "gasoline",
    car_type: "sports",
    doors: 2,
    has_ac: true,
    license_plate: "FAST42",
    price_per_day: 89,
    multi_day_discount: 5,
    cancellation_policy: "strict",
    location: "Los Angeles, CA",
    description: "Experience the thrill of driving a Ford Mustang with powerful engine and stylish design.",
    image_url: "/lovable-uploads/c5b96ea5-bb51-49f4-a371-d60c2e57c514.png"
  },
  {
    brand: "Tesla",
    model: "Model 3",
    year: 2021,
    transmission: "automatic",
    fuel_type: "electric",
    car_type: "sedan",
    doors: 4,
    has_ac: true,
    license_plate: "ELCTR1",
    price_per_day: 95,
    multi_day_discount: 15,
    cancellation_policy: "flexible",
    location: "San Francisco, CA",
    description: "Zero-emission Tesla Model 3 with cutting-edge technology and impressive driving range.",
    image_url: "/lovable-uploads/8ad6646a-ed6c-403f-8418-7147ed499ca7.png"
  }
];

const SeedCars = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const navigate = useNavigate();

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
  };

  const seedDatabase = async () => {
    setIsLoading(true);
    addLog("Starting database seeding process...");

    try {
      // Find a host user to associate the cars with
      addLog("Looking for a host user...");
      
      // First check in profiles table for a user with user_role = 'host'
      const { data: hostProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_role', 'host')
        .limit(1);

      if (profilesError) {
        throw new Error(`Error fetching host profiles: ${profilesError.message}`);
      }

      let hostId;
      
      if (hostProfiles && hostProfiles.length > 0) {
        hostId = hostProfiles[0].id;
        addLog(`Found existing host with ID: ${hostId}`);
      } else {
        // If no host found, create a new user
        addLog("No host found. Creating a new host user...");
        
        // Create a new host user
        const { data: newUser, error: createUserError } = await supabase.auth.signUp({
          email: `host-${Date.now()}@example.com`,
          password: 'password123',
          options: {
            data: {
              user_role: 'host'
            }
          }
        });

        if (createUserError) {
          throw new Error(`Error creating host user: ${createUserError.message}`);
        }

        if (!newUser.user) {
          throw new Error("Failed to create host user");
        }

        hostId = newUser.user.id;
        
        // Create profile for the new host
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: hostId,
            user_role: 'host',
            full_name: 'Demo Host',
            license_status: 'verified'
          });

        if (profileError) {
          throw new Error(`Error creating host profile: ${profileError.message}`);
        }
        
        addLog(`Created new host with ID: ${hostId}`);
      }

      // Insert cars one by one
      addLog("Adding cars to the database...");
      
      for (const car of seedCars) {
        // Insert car data
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .insert({
            host_id: hostId,
            brand: car.brand,
            model: car.model,
            year: car.year,
            transmission: car.transmission,
            fuel_type: car.fuel_type,
            car_type: car.car_type,
            doors: car.doors,
            has_ac: car.has_ac,
            license_plate: car.license_plate,
            price_per_day: car.price_per_day,
            multi_day_discount: car.multi_day_discount,
            cancellation_policy: car.cancellation_policy,
            location: car.location,
            description: car.description
          })
          .select('id')
          .single();

        if (carError) {
          throw new Error(`Error inserting car data for ${car.brand} ${car.model}: ${carError.message}`);
        }

        if (!carData) {
          throw new Error(`Failed to insert car data for ${car.brand} ${car.model}`);
        }

        // Add car image
        const { error: imageError } = await supabase
          .from('car_images')
          .insert({
            car_id: carData.id,
            is_primary: true,
            image_path: car.image_url
          });

        if (imageError) {
          throw new Error(`Error inserting car image for ${car.brand} ${car.model}: ${imageError.message}`);
        }

        addLog(`Added ${car.brand} ${car.model} with image`);
      }

      addLog("Seeding completed successfully!");
      setIsComplete(true);
      toast.success("Demo cars added successfully!");
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      toast.error(`Failed to seed database: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CarFront className="h-6 w-6 text-rento-blue" />
            Seed Cars Database
          </CardTitle>
          <CardDescription>
            Add demo cars to the database for development and testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium mb-2">This tool will:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Find or create a host user</li>
                <li>Add 3 sample cars with different characteristics</li>
                <li>Link the cars to the host user</li>
                <li>Add sample images to each car</li>
              </ul>
            </div>

            {log.length > 0 && (
              <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm overflow-auto max-h-60">
                {log.map((entry, index) => (
                  <div key={index} className="leading-relaxed">
                    &gt; {entry}
                  </div>
                ))}
              </div>
            )}

            {isComplete && (
              <div className="bg-green-50 text-green-800 p-4 rounded-md flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Database seeded successfully!</p>
                  <p className="text-sm mt-1">You can now browse the cars in the car listing page.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate("/cars")}
          >
            Go to Car Listing
          </Button>
          
          <Button 
            disabled={isLoading || isComplete} 
            onClick={seedDatabase}
          >
            {isLoading ? "Seeding Database..." : isComplete ? "Completed" : "Seed Database"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SeedCars;
