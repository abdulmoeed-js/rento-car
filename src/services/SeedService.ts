
import { supabase } from "@/integrations/supabase/client";
import { seedCarTags, applyTagsToCar } from "@/utils/carTagsSeeder";

// Updated seed car data with provided images
const seedCars = [
  {
    brand: "Honda",
    model: "City White",
    year: 2023,
    transmission: "automatic",
    fuel_type: "petrol",
    car_type: "sedan",
    doors: 4,
    has_ac: true,
    license_plate: "HONCITY1",
    price_per_day: 60,
    multi_day_discount: 10,
    cancellation_policy: "moderate",
    location: "Mumbai, India",
    description: "Reliable and modern Honda City in white.",
    image_url: "/lovable-uploads/131a7757-44a1-4dd4-91b6-fae86461ba97.png"
  },
  {
    brand: "Honda",
    model: "City Silver",
    year: 2022,
    transmission: "automatic",
    fuel_type: "petrol",
    car_type: "sedan",
    doors: 4,
    has_ac: true,
    license_plate: "HONCITY2",
    price_per_day: 65,
    multi_day_discount: 15,
    cancellation_policy: "flexible",
    location: "Delhi, India",
    description: "Honda City in silver, new and fuel efficient for city drives.",
    image_url: "/lovable-uploads/37ae671a-8785-4a32-a8cb-6c8c2a702045.png"
  },
  {
    brand: "Honda",
    model: "City Blue",
    year: 2023,
    transmission: "automatic",
    fuel_type: "petrol",
    car_type: "sedan",
    doors: 4,
    has_ac: true,
    license_plate: "HONCITY3",
    price_per_day: 70,
    multi_day_discount: 20,
    cancellation_policy: "strict",
    location: "Bangalore, India",
    description: "Blue Honda City with premium features and sporty look.",
    image_url: "/lovable-uploads/87228688-d8c5-4b5e-a804-c3ed3c810a88.png"
  },
  {
    brand: "Toyota",
    model: "Fortuner",
    year: 2022,
    transmission: "automatic",
    fuel_type: "diesel",
    car_type: "suv",
    doors: 5,
    has_ac: true,
    license_plate: "TOYSUV1",
    price_per_day: 120,
    multi_day_discount: 15,
    cancellation_policy: "strict",
    location: "Delhi, India",
    description: "Spacious and powerful SUV perfect for family road trips.",
    image_url: "/lovable-uploads/8ad6646a-ed6c-403f-8418-7147ed499ca7.png"
  },
  {
    brand: "Maruti Suzuki",
    model: "Swift",
    year: 2023,
    transmission: "manual",
    fuel_type: "petrol",
    car_type: "hatchback",
    doors: 5,
    has_ac: true,
    license_plate: "SWIFTX1",
    price_per_day: 45,
    multi_day_discount: 10,
    cancellation_policy: "flexible",
    location: "Mumbai, India",
    description: "Compact and fuel efficient, great for city driving.",
    image_url: "/lovable-uploads/c5b96ea5-bb51-49f4-a371-d60c2e57c514.png"
  }
];

export type LogCallback = (message: string) => void;

// Check if seeding was done before
export const checkSeedingStatus = async (): Promise<boolean> => {
  const { data } = await supabase.from('cars').select('id').limit(1);
  return !!(data && data.length > 0);
};

// Find or create a host user
export const findOrCreateHostUser = async (addLog: LogCallback) => {
  addLog("Looking for a host user...");

  // Fix: Update the lookup role string to match 'host'
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
    // If no host found, create a new host user...
    addLog("No host found. Creating a new host user...");
    
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

  return hostId;
};

// Add cars to the database
export const seedCarsToDatabase = async (hostId: string, addLog: LogCallback) => {
  addLog("Adding cars to the database...");

  for (const car of seedCars) {
    const { data: existingCar } = await supabase
      .from('cars')
      .select('id')
      .eq('license_plate', car.license_plate)
      .single();
      
    if (existingCar) {
      addLog(`Car with license plate ${car.license_plate} already exists, skipping...`);
      continue;
    }

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

    // Apply tags to the car
    const tagResult = await applyTagsToCar(carData.id, car);
    if (!tagResult.success) {
      addLog(`Warning: Failed to apply tags to ${car.brand} ${car.model}`);
    }

    addLog(`Added ${car.brand} ${car.model} with image and tags`);
  }
};

// Main seeding function
export const seedDatabase = async (addLog: LogCallback) => {
  try {
    // First, seed the car tags table
    addLog("Setting up car tags for matching...");
    const tagsResult = await seedCarTags();
    
    if (!tagsResult.success) {
      addLog(`Warning: Issue with car tags: ${tagsResult.error?.message || 'Unknown error'}`);
      // Continue anyway since this is not critical
    } else {
      addLog("Car tags setup successful");
    }

    // Find or create a host user
    const hostId = await findOrCreateHostUser(addLog);

    // Insert cars
    await seedCarsToDatabase(hostId, addLog);

    addLog("Seeding completed successfully!");
    return true;
  } catch (error: any) {
    addLog(`ERROR: ${error.message}`);
    throw error;
  }
};
