
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
  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    // Correct index for primary image if existing images
    const isPrimary = i === (primaryImageIndex || 0) - (existingImageCount || 0);
    const fileExt = file.name.split(".").pop();
    const fileName = `${carId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;

    try {
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

      const {
        data: { publicUrl },
      } = supabase.storage.from("car_images").getPublicUrl(fileName);

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
}
