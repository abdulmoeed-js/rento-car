
import { supabase } from "@/integrations/supabase/client";

// Tags for the car matching system
const CAR_TAGS = [
  // Use cases
  { tag: "city_driving", tag_type: "use_case" },
  { tag: "road_trip", tag_type: "use_case" },
  { tag: "off_road", tag_type: "use_case" },
  { tag: "family_travel", tag_type: "use_case" },
  { tag: "business", tag_type: "use_case" },
  { tag: "moving", tag_type: "use_case" },
  
  // Car body types
  { tag: "sedan", tag_type: "body" },
  { tag: "suv", tag_type: "body" },
  { tag: "coupe", tag_type: "body" },
  { tag: "convertible", tag_type: "body" },
  { tag: "minivan", tag_type: "body" },
  { tag: "pickup", tag_type: "body" },
  
  // Seats
  { tag: "2_seats", tag_type: "seats" },
  { tag: "4_seats", tag_type: "seats" },
  { tag: "5_seats", tag_type: "seats" },
  { tag: "7_seats", tag_type: "seats" },
  { tag: "8+_seats", tag_type: "seats" },
  
  // Fuel types
  { tag: "petrol", tag_type: "fuel" },
  { tag: "diesel", tag_type: "fuel" },
  { tag: "hybrid", tag_type: "fuel" },
  { tag: "electric", tag_type: "fuel" },
  
  // Features
  { tag: "luxury", tag_type: "feature" },
  { tag: "eco_friendly", tag_type: "feature" },
  { tag: "automatic", tag_type: "feature" },
  { tag: "manual", tag_type: "feature" },
  { tag: "pet_friendly", tag_type: "feature" }
];

export const seedCarTags = async () => {
  try {
    // Check if we have tags already
    const { data: existingTags, error: checkError } = await supabase
      .from('car_tags')
      .select('tag')
      .limit(1);
    
    if (checkError) {
      console.error("Error checking car tags:", checkError);
      return { success: false, error: checkError };
    }
    
    // If we already have tags, don't seed again
    if (existingTags && existingTags.length > 0) {
      console.log("Car tags already exist, skipping seed");
      return { success: true, message: "Tags already exist" };
    }
    
    // Insert all tags
    const { error: insertError } = await supabase
      .from('car_tags')
      .insert(CAR_TAGS);
    
    if (insertError) {
      console.error("Error seeding car tags:", insertError);
      return { success: false, error: insertError };
    }
    
    console.log("Successfully seeded car tags");
    return { success: true };
    
  } catch (error) {
    console.error("Unexpected error seeding car tags:", error);
    return { success: false, error };
  }
};

// Function to apply tags to a car
export const applyTagsToCar = async (carId: string, carInfo: any) => {
  try {
    // First, get tag IDs we need
    const tagQueries = [];
    const tagsToApply = [];
    
    // Body type tag
    if (carInfo.car_type) {
      tagQueries.push(
        supabase.from('car_tags').select('id').eq('tag', carInfo.car_type).single()
      );
      tagsToApply.push('body');
    }
    
    // Fuel type tag
    if (carInfo.fuel_type) {
      tagQueries.push(
        supabase.from('car_tags').select('id').eq('tag', carInfo.fuel_type).single()
      );
      tagsToApply.push('fuel');
    }
    
    // Seats tag (approximate based on car type)
    let seatsTag = "5_seats"; // default
    if (carInfo.car_type === "coupe" || carInfo.car_type === "convertible") {
      seatsTag = "2_seats";
    } else if (carInfo.car_type === "minivan") {
      seatsTag = "7_seats";
    }
    
    tagQueries.push(
      supabase.from('car_tags').select('id').eq('tag', seatsTag).single()
    );
    tagsToApply.push('seats');
    
    // Transmission tag
    if (carInfo.transmission) {
      const transmissionTag = carInfo.transmission === 'automatic' ? 'automatic' : 'manual';
      tagQueries.push(
        supabase.from('car_tags').select('id').eq('tag', transmissionTag).single()
      );
      tagsToApply.push('transmission');
    }
    
    // Get the tag IDs
    const results = await Promise.all(tagQueries);
    
    // Prepare tag joins
    const tagJoins = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i].data && !results[i].error) {
        tagJoins.push({
          car_id: carId,
          tag_id: results[i].data.id
        });
      } else {
        console.warn(`Could not find tag for ${tagsToApply[i]}`);
      }
    }
    
    // Insert tag joins if we have any
    if (tagJoins.length > 0) {
      const { error } = await supabase.from('car_tags_join').insert(tagJoins);
      if (error) {
        console.error("Error applying tags to car:", error);
        return { success: false, error };
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error("Unexpected error applying tags to car:", error);
    return { success: false, error };
  }
};

export default {
  seedCarTags,
  applyTagsToCar
};
