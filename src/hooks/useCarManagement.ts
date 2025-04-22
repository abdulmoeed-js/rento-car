
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CarFormData } from '@/types/owner';
import { toast } from 'sonner';
import { formatErrorMessage } from '@/utils/supabaseHelpers';

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
      
      // Prepare car data for database
      const carData = {
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        transmission: formData.transmission,
        fuel_type: formData.fuel_type,
        doors: formData.doors,
        has_ac: formData.has_ac,
        license_plate: formData.license_plate,
        car_type: formData.car_type,
        price_per_day: formData.price_per_day,
        multi_day_discount: formData.multi_day_discount,
        cancellation_policy: formData.cancellation_policy,
        available_days: formData.available_days,
        available_hours: formData.available_hours,
        custom_availability: formData.custom_availability ? 
          formData.custom_availability.map(date => ({
            date: date.date instanceof Date ? 
              date.date.toISOString().split('T')[0] : 
              date.date,
            available: date.available
          })) : 
          null,
        location: formData.location,
        location_coordinates: formData.location_coordinates,
        pickup_instructions: formData.pickup_instructions,
        description: formData.description,
        host_id: userId
      };
      
      console.log("Submitting car data:", carData);
      
      let resultCarId = carId;
      
      // Insert or update car record
      if (carId) {
        // Update existing car
        const { error } = await supabase
          .from('cars')
          .update(carData)
          .eq('id', carId)
          .eq('host_id', userId);
          
        if (error) {
          console.error("Error updating car:", error);
          throw error;
        }
      } else {
        // Insert new car
        const { data, error } = await supabase
          .from('cars')
          .insert(carData)
          .select('id')
          .single();
          
        if (error) {
          console.error("Error inserting car:", error);
          throw error;
        }
        
        if (!data || !data.id) {
          throw new Error("Failed to get car ID after insertion");
        }
        
        resultCarId = data.id;
      }
      
      console.log("Car saved with ID:", resultCarId);
      
      // Ensure the car_images bucket exists before uploading
      try {
        const { data: bucketExists } = await supabase.storage.getBucket('car_images');
        if (!bucketExists) {
          console.log("Car images bucket doesn't exist, attempting to create");
          await supabase.storage.createBucket('car_images', { public: true });
        }
      } catch (error) {
        console.log("Storage bucket check error (continuing anyway):", error);
        // Continue anyway as the bucket might exist despite the error
      }
      
      // Handle image uploads
      if (formData.images && formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          const file = formData.images[i];
          const isPrimary = i === (formData.primaryImageIndex || 0) - (formData.existingImages?.length || 0);
          
          // Generate safe filename
          const fileExt = file.name.split('.').pop();
          const fileName = `${resultCarId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
          console.log("Uploading image:", fileName, "Primary:", isPrimary);
          
          try {
            // Upload image to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('car_images')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });
              
            if (uploadError) {
              console.error("Error uploading image:", uploadError);
              throw uploadError;
            }
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('car_images')
              .getPublicUrl(fileName);
              
            console.log("Image uploaded with URL:", publicUrl);
            
            // Create image record
            const { error: insertError } = await supabase
              .from('car_images')
              .insert({
                car_id: resultCarId,
                image_path: publicUrl,
                is_primary: isPrimary
              });
              
            if (insertError) {
              console.error("Error inserting image record:", insertError);
              throw insertError;
            }
          } catch (uploadErr) {
            console.error("Error during image upload process:", uploadErr);
            toast.error(`Failed to upload image ${i+1}: ${formatErrorMessage(uploadErr)}`);
            // Continue with other images even if one fails
          }
          
          // Update upload progress
          setUploadProgress(Math.round(((i + 1) / formData.images.length) * 100));
        }
      }
      
      // Update primary image if changed with existing images
      if (formData.existingImages && formData.existingImages.length > 0 && formData.primaryImageIndex !== undefined) {
        const primaryIndex = formData.primaryImageIndex;
        if (primaryIndex < formData.existingImages.length && formData.existingImages[primaryIndex]) {
          const primaryImageId = formData.existingImages[primaryIndex].id;
          
          if (primaryImageId) {
            console.log("Setting primary image ID:", primaryImageId);
            
            // Reset all to non-primary
            await supabase
              .from('car_images')
              .update({ is_primary: false })
              .eq('car_id', resultCarId);
              
            // Set selected as primary
            await supabase
              .from('car_images')
              .update({ is_primary: true })
              .eq('id', primaryImageId);
          }
        }
      }
      
      toast.success(carId ? 'Car updated successfully!' : 'Car added successfully!');
      return true;
    } catch (error: any) {
      console.error('Error submitting car:', error);
      let errorMessage = formatErrorMessage(error);
      
      // Check for specific known errors
      if (error?.message?.includes('row level security')) {
        errorMessage = "Permission denied. Make sure you have the right role to perform this action.";
      } else if (error?.message?.includes('Foreign key constraint')) {
        errorMessage = "Missing or invalid reference. Please check your form data.";
      } else if (error?.code === '23505') {
        errorMessage = "A car with this identifier already exists.";
      } else if (error?.message?.includes('storage') || error?.message?.includes('bucket')) {
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
    uploadProgress
  };
};
