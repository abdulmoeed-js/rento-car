
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
      
      let resultCarId = carId;
      
      // Insert or update car record
      if (carId) {
        // Update existing car
        const { error } = await supabase
          .from('cars')
          .update(carData)
          .eq('id', carId)
          .eq('host_id', userId);
          
        if (error) throw error;
      } else {
        // Insert new car
        const { data, error } = await supabase
          .from('cars')
          .insert(carData)
          .select('id')
          .single();
          
        if (error) throw error;
        
        if (!data || !data.id) {
          throw new Error("Failed to get car ID after insertion");
        }
        
        resultCarId = data.id;
      }
      
      // Handle image uploads
      await handleImageUploads(formData, resultCarId, userId);
      
      toast.success(carId ? 'Car updated successfully!' : 'Car added successfully!');
      return true;
    } catch (error: any) {
      console.error('Error saving car:', error);
      toast.error(`Failed to save car: ${formatErrorMessage(error)}`);
      return false;
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };
  
  const handleImageUploads = async (
    formData: Partial<CarFormData>, 
    carId: string,
    userId: string
  ) => {
    // Handle image uploads
    if (formData.images && formData.images.length > 0) {
      for (let i = 0; i < formData.images.length; i++) {
        const file = formData.images[i];
        const isPrimary = i === (formData.primaryImageIndex || 0) - (formData.existingImages?.length || 0);
        const fileName = `${carId}/${Date.now()}-${file.name}`;
        
        // Upload image to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('car_images')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('car_images')
          .getPublicUrl(fileName);
          
        // Create image record
        const { error: insertError } = await supabase
          .from('car_images')
          .insert({
            car_id: carId,
            image_path: publicUrl,
            is_primary: isPrimary
          });
          
        if (insertError) throw insertError;
        
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
          // Reset all to non-primary
          await supabase
            .from('car_images')
            .update({ is_primary: false })
            .eq('car_id', carId);
            
          // Set selected as primary
          await supabase
            .from('car_images')
            .update({ is_primary: true })
            .eq('id', primaryImageId);
        }
      }
    }
  };
  
  return {
    saveCar,
    isSubmitting,
    uploadProgress
  };
};
