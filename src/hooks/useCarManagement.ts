
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CarFormData } from "@/types/owner";
import { toast } from "sonner";
import { formatErrorMessage, hasRole } from "@/utils/supabaseHelpers";
import { prepareCarData } from "@/utils/prepareCarData";
import { uploadCarImages } from "./useCarImageUpload";

export const useCarManagement = (carId?: string) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const saveCar = async (formData: Partial<CarFormData>, userId: string) => {
    if (!userId) {
      toast.error("You must be logged in to save a car");
      return false;
    }

    try {
      setIsSubmitting(true);
      console.log("Starting car save process...");

      // 1. Verify host role
      console.log("Verifying host role for user:", userId);
      const isHost = await hasRole(userId, "host");
      console.log("Is user a host?", isHost);
      
      if (!isHost) {
        toast.error(
          "Only hosts can add or edit cars. Please contact support if you believe this is an error."
        );
        return false;
      }

      // 2. Prepare data
      const carData = prepareCarData(formData, userId);
      console.log("Prepared car data:", carData);

      let resultCarId = carId;

      // 3. Insert/update car record (fix RLS by always setting host_id)
      if (carId) {
        // Update
        console.log("Updating existing car:", carId);
        const { error } = await supabase
          .from("cars")
          .update(carData)
          .eq("id", carId)
          .eq("host_id", userId);

        if (error) {
          console.error("Error updating car:", error);
          throw error;
        }
        console.log("Car updated successfully");
      } else {
        // Insert
        console.log("Creating new car");
        const { data, error } = await supabase
          .from("cars")
          .insert({ ...carData, host_id: userId })
          .select("id")
          .single();

        if (error) {
          console.error("Error creating car:", error);
          if (
            error.message.includes("row level security") ||
            error.message.includes("violates security policy")
          ) {
            toast.error(
              "Permission denied. Make sure you have the right role and are logged in."
            );
            return false;
          }
          throw error;
        }
        if (!data || !data.id) {
          throw new Error("Failed to get car ID after insertion");
        }
        resultCarId = data.id;
        console.log("New car created with ID:", resultCarId);
      }

      // 4. Upload images if any
      if (formData.images && formData.images.length > 0 && resultCarId) {
        console.log("Uploading car images");
        const uploadSuccess = await uploadCarImages({
          carId: resultCarId,
          images: formData.images,
          existingImageCount: formData.existingImages?.length || 0,
          primaryImageIndex: formData.primaryImageIndex || 0,
          setUploadProgress,
        });
        
        if (!uploadSuccess) {
          toast.error("Some images failed to upload. Your car was saved, but you may need to re-upload images.");
        }
      }

      // 5. Update primary image if changed with existing images
      if (
        formData.existingImages &&
        formData.existingImages.length > 0 &&
        formData.primaryImageIndex !== undefined
      ) {
        const primaryIndex = formData.primaryImageIndex;
        console.log("Updating primary image, selected index:", primaryIndex);
        
        if (
          primaryIndex < formData.existingImages.length &&
          formData.existingImages[primaryIndex]
        ) {
          const primaryImageId = formData.existingImages[primaryIndex].id;
          if (primaryImageId) {
            console.log("Setting primary image ID:", primaryImageId);
            
            // Reset all to non-primary
            await supabase
              .from("car_images")
              .update({ is_primary: false })
              .eq("car_id", resultCarId);

            // Set selected as primary
            await supabase
              .from("car_images")
              .update({ is_primary: true })
              .eq("id", primaryImageId);
            
            console.log("Primary image updated successfully");
          }
        }
      }

      toast.success(carId ? "Car updated successfully!" : "Car added successfully!");
      return true;
    } catch (error: any) {
      console.error("Error submitting car:", error);
      let errorMessage = formatErrorMessage(error);

      if (error?.message?.includes("row level security")) {
        errorMessage =
          "Permission denied. Make sure you have the right role to perform this action.";
      } else if (error?.message?.includes("Foreign key constraint")) {
        errorMessage =
          "Missing or invalid reference. Please check your form data.";
      } else if (error?.code === "23505") {
        errorMessage = "A car with this identifier already exists.";
      } else if (
        error?.message?.includes("storage") ||
        error?.message?.includes("bucket")
      ) {
        errorMessage = "Error with file storage. Please try again or contact support.";
      }

      toast.error(`Failed to save car: ${errorMessage}`);
      return false;
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return {
    saveCar,
    isSubmitting,
    uploadProgress,
  };
};
