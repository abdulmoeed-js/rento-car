
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CarFormData, FormStep } from "@/types/owner";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CarDetailsForm from "@/components/owner/CarDetailsForm";
import CarPhotosForm from "@/components/owner/CarPhotosForm";
import CarPricingForm from "@/components/owner/CarPricingForm";
import CarAvailabilityForm from "@/components/owner/CarAvailabilityForm";
import CarPickupForm from "@/components/owner/CarPickupForm";
import CarReviewForm from "@/components/owner/CarReviewForm";
import { ChevronLeft, ChevronRight } from "lucide-react";

const formSteps: FormStep[] = [
  'details',
  'photos',
  'pricing',
  'availability',
  'pickup',
  'review'
];

const stepLabels: Record<FormStep, string> = {
  'details': 'Car Details',
  'photos': 'Photos',
  'pricing': 'Pricing',
  'availability': 'Availability',
  'pickup': 'Pickup',
  'review': 'Review'
};

const AddEditCar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validatedSteps, setValidatedSteps] = useState<Set<FormStep>>(new Set());
  const [formData, setFormData] = useState<Partial<CarFormData>>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    transmission: 'automatic',
    fuel_type: 'gasoline',
    doors: 4,
    has_ac: true,
    license_plate: '',
    car_type: 'sedan',
    images: [],
    primaryImageIndex: 0,
    price_per_day: 50,
    multi_day_discount: 0,
    cancellation_policy: 'moderate',
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    available_hours: { start: '08:00', end: '20:00' },
    location: '',
    description: '',
    existingImages: []
  });
  
  // Redirect if not logged in or not a host
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    } else if (user.user_role !== 'host') {
      toast.error("Only hosts can add or edit cars");
      navigate("/");
      return;
    }
  }, [user, navigate]);

  // Fetch car data if editing
  useEffect(() => {
    const fetchCarData = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        
        const { data: carData, error } = await supabase
          .from('cars')
          .select(`
            *,
            images:car_images(*)
          `)
          .eq('id', id)
          .eq('host_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (carData) {
          // Cast carData to any to access all properties
          const car = carData as any;
          
          // Map database data to form data
          const imagesData = car.images;
          const images = Array.isArray(imagesData) ? imagesData : [];
          
          // Find primary image or default to first
          let primaryImage = null;
          let primaryIndex = 0;
          
          if (images.length > 0) {
            primaryImage = images.find(img => img.is_primary === true);
            if (primaryImage) {
              primaryIndex = images.findIndex(img => img.id === primaryImage.id);
              if (primaryIndex === -1) primaryIndex = 0;
            }
          }
        
          setFormData({
            brand: car.brand,
            model: car.model,
            year: car.year,
            transmission: car.transmission,
            fuel_type: car.fuel_type,
            doors: car.doors || 4,
            has_ac: car.has_ac === undefined ? true : car.has_ac,
            license_plate: car.license_plate || '',
            car_type: car.car_type,
            existingImages: Array.isArray(images) ? images.map(img => ({
              id: img.id,
              url: img.image_path,
              is_primary: img.is_primary
            })) : [],
            primaryImageIndex: primaryIndex,
            price_per_day: car.price_per_day,
            multi_day_discount: car.multi_day_discount || 0,
            cancellation_policy: (car.cancellation_policy as 'flexible' | 'moderate' | 'strict') || 'moderate',
            available_days: car.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            available_hours: car.available_hours || { start: '08:00', end: '20:00' },
            custom_availability: car.custom_availability,
            location: car.location,
            location_coordinates: car.location_coordinates as { lat?: number; lng?: number } || null,
            pickup_instructions: car.pickup_instructions || '',
            description: car.description || '',
            images: []
          });
          
          // Mark all steps as validated for existing car
          setValidatedSteps(new Set(formSteps));
        }
      } catch (error) {
        console.error('Error fetching car data:', error);
        toast.error('Failed to load car data. Please try again.');
        navigate('/owner-portal');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCarData();
  }, [id, user, navigate]);

  // Handle step change
  const handleStepChange = (newStep: FormStep) => {
    setCurrentStep(newStep);
  };

  // Handle form data update from step forms
  const updateFormData = (stepData: Partial<CarFormData>, isValid: boolean) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    
    if (isValid) {
      setValidatedSteps(prev => {
        const newSet = new Set(prev);
        newSet.add(currentStep);
        return newSet;
      });
    } else {
      setValidatedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
    }
  };

  // Navigate between steps
  const goToNextStep = () => {
    const currentIndex = formSteps.indexOf(currentStep);
    if (currentIndex < formSteps.length - 1) {
      setCurrentStep(formSteps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = formSteps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(formSteps[currentIndex - 1]);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to save a car");
      navigate("/auth");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Ensure bucket exists
      const { error: bucketError } = await supabase.storage
        .getBucket('car_images');
      
      if (bucketError && bucketError.message.includes('does not exist')) {
        console.warn('Bucket does not exist, but should have been created by migration');
      }
      
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
        host_id: user.id
      };
      
      console.log("Submitting car data:", carData);
      
      let carId = id;
      
      // Insert or update car record
      if (id) {
        // Update existing car
        const { error } = await supabase
          .from('cars')
          .update(carData)
          .eq('id', id)
          .eq('host_id', user.id);
          
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
        
        carId = data.id;
      }
      
      console.log("Car saved with ID:", carId);
      
      // Handle image uploads
      if (formData.images && formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          const file = formData.images[i];
          const isPrimary = i === (formData.primaryImageIndex || 0) - (formData.existingImages?.length || 0);
          const fileName = `${carId}/${Date.now()}-${file.name}`;
          
          console.log("Uploading image:", fileName, "Primary:", isPrimary);
          
          // Upload image to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('car_images')
            .upload(fileName, file);
            
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
              car_id: carId,
              image_path: publicUrl,
              is_primary: isPrimary
            });
            
          if (insertError) {
            console.error("Error inserting image record:", insertError);
            throw insertError;
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
              .eq('car_id', carId);
              
            // Set selected as primary
            await supabase
              .from('car_images')
              .update({ is_primary: true })
              .eq('id', primaryImageId);
          }
        }
      }
      
      toast.success(id ? 'Car updated successfully!' : 'Car added successfully!');
      navigate('/owner-portal');
    } catch (error: any) {
      console.error('Error submitting car:', error);
      toast.error(`Failed to save car: ${error.message || 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RentoHeader />
        <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-rento-blue border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg">Loading car data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />
      
      <main className="container mx-auto py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{id ? 'Edit Car' : 'Add New Car'}</CardTitle>
            <CardDescription>
              {id ? 'Update your car listing information' : 'Add a new car to start earning'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <div className="relative">
                <div className="overflow-x-auto">
                  <div className="flex space-x-2 md:space-x-4">
                    {formSteps.map((step, index) => {
                      const isActive = step === currentStep;
                      const isComplete = validatedSteps.has(step);
                      
                      return (
                        <div 
                          key={step} 
                          className="flex flex-col items-center flex-1"
                          onClick={() => isComplete ? handleStepChange(step) : null}
                        >
                          <div 
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-sm mb-2
                              ${isActive ? 'bg-rento-blue text-white' : 
                                isComplete ? 'bg-green-500 text-white cursor-pointer' : 
                                'bg-gray-200 text-gray-500'}
                            `}
                          >
                            {index + 1}
                          </div>
                          <span className="text-xs text-center hidden md:block">
                            {stepLabels[step]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
                </div>
              </div>
            </div>
            
            {/* Form steps */}
            {currentStep === 'details' && (
              <CarDetailsForm 
                formData={formData} 
                updateFormData={updateFormData} 
              />
            )}
            
            {currentStep === 'photos' && (
              <CarPhotosForm 
                formData={formData} 
                updateFormData={updateFormData} 
              />
            )}
            
            {currentStep === 'pricing' && (
              <CarPricingForm 
                formData={formData} 
                updateFormData={updateFormData} 
              />
            )}
            
            {currentStep === 'availability' && (
              <CarAvailabilityForm 
                formData={formData} 
                updateFormData={updateFormData} 
              />
            )}
            
            {currentStep === 'pickup' && (
              <CarPickupForm 
                formData={formData} 
                updateFormData={updateFormData} 
              />
            )}
            
            {currentStep === 'review' && (
              <CarReviewForm 
                formData={formData} 
                isSubmitting={isSubmitting}
                uploadProgress={uploadProgress}
                onSubmit={handleSubmit}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 'details'}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            
            {currentStep !== 'review' ? (
              <Button
                onClick={goToNextStep}
                disabled={!validatedSteps.has(currentStep)}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !validatedSteps.has('review')}
              >
                {id ? 'Update Car' : 'Add Car'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default AddEditCar;
