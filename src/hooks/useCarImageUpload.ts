
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatErrorMessage } from "@/utils/supabaseHelpers";

/**
 * Uploads car images and returns their URLs.
 */
export async function uploadCarImages({
  carId,
  images,
  existingImageCount,
  primaryImageIndex,
  setUploadProgress,
}: {
  carId: string;
  images: File[];
  existingImageCount: number;
  primaryImageIndex: number;
  setUploadProgress: (progress: number) => void;
}): Promise<boolean> {
  try {
    // Ensure car_images bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket) => bucket.name === "car_images");
      
      if (!bucketExists) {
        console.log("Creating car_images bucket");
        const { error } = await supabase.storage.createBucket("car_images", {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (error) {
          console.error("Error creating bucket:", error);
          // Continue anyway, as the bucket might already exist
        }
      }
    } catch (err) {
      console.warn("Error checking/creating bucket:", err);
      // Continue anyway, as this might be a permission issue but the bucket might exist
    }
    
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      // Correct index for primary image if existing images
      const isPrimary = i === (primaryImageIndex || 0) - (existingImageCount || 0);
      const fileExt = file.name.split(".").pop();
      const fileName = `${carId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;

      try {
        console.log(`Uploading image ${i+1}/${images.length}:`, fileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("car_images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw uploadError;
        }

        console.log("Upload successful:", uploadData);

        const {
          data: { publicUrl },
        } = supabase.storage.from("car_images").getPublicUrl(fileName);

        console.log("Public URL:", publicUrl);

        const { error: insertError } = await supabase
          .from("car_images")
          .insert({
            car_id: carId,
            image_path: publicUrl,
            is_primary: isPrimary,
          });

        if (insertError) {
          console.error("Error inserting image record:", insertError);
          throw insertError;
        }
        
        console.log("Image record inserted successfully");
      } catch (uploadErr) {
        console.error("Error during image upload process:", uploadErr);
        toast.error(
          `Failed to upload image ${i + 1}: ${formatErrorMessage(uploadErr)}`
        );
        // Continue with other images
      }
      setUploadProgress(Math.round(((i + 1) / images.length) * 100));
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in uploadCarImages:", error);
    toast.error(`Image upload failed: ${formatErrorMessage(error)}`);
    return false;
  }
}
