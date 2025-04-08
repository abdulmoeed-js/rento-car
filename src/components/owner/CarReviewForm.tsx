
import React, { useEffect } from "react";
import { CarFormData } from "@/types/owner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, AlertCircle, Calendar, Banknote, MapPin, Car } from "lucide-react";

interface CarReviewFormProps {
  formData: Partial<CarFormData>;
  isSubmitting: boolean;
  uploadProgress: number;
  onSubmit: () => void;
}

const CarReviewForm: React.FC<CarReviewFormProps> = ({ 
  formData, 
  isSubmitting,
  uploadProgress,
  onSubmit 
}) => {
  // Set review as validated on mount
  useEffect(() => {
    // This is a view-only step, so it's always valid
    // The parent component needs this callback though
  }, []);

  const getTotalImageCount = () => {
    let count = 0;
    if (formData.existingImages) count += formData.existingImages.length;
    if (formData.images) count += formData.images.length;
    return count;
  };

  // Helper function to get image preview URL
  const getPreviewImage = () => {
    if (formData.existingImages && formData.existingImages.length > 0) {
      const primaryIndex = formData.primaryImageIndex || 0;
      if (formData.existingImages[primaryIndex]) {
        return formData.existingImages[primaryIndex].url;
      }
    }
    
    if (formData.images && formData.images.length > 0) {
      const primaryIndex = formData.primaryImageIndex || 0;
      if (formData.images[primaryIndex]) {
        return URL.createObjectURL(formData.images[primaryIndex]);
      }
    }
    
    return '/placeholder.svg';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="aspect-video rounded-md overflow-hidden mb-3">
                <img 
                  src={getPreviewImage()}
                  alt="Car preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {getTotalImageCount()} image{getTotalImageCount() !== 1 ? 's' : ''} uploaded
              </p>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold">
                {formData.brand} {formData.model} ({formData.year})
              </h2>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-center text-sm">
                  <Car className="h-4 w-4 mr-2 text-gray-500" />
                  {formData.car_type}, {formData.transmission}
                </div>
                
                <div className="flex items-center text-sm">
                  <Banknote className="h-4 w-4 mr-2 text-gray-500" />
                  ${formData.price_per_day}/day
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  {formData.available_days?.length} days available
                </div>
                
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  {formData.location}
                </div>
              </div>
              
              <div className="text-sm mt-3">
                <p className="line-clamp-3">{formData.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Review Summary</h3>
        
        <div className="space-y-3">
          <ReviewItem
            title="Car Details"
            items={[
              `${formData.brand} ${formData.model} (${formData.year})`,
              `${formData.car_type}, ${formData.transmission}, ${formData.fuel_type}`,
              `${formData.has_ac ? 'Has A/C' : 'No A/C'}, ${formData.doors} doors`
            ]}
            isComplete={true}
          />
          
          <ReviewItem
            title="Photos"
            items={[
              `${getTotalImageCount()} images uploaded`,
              'Primary image selected'
            ]}
            isComplete={getTotalImageCount() >= 3}
          />
          
          <ReviewItem
            title="Pricing"
            items={[
              `Base rate: $${formData.price_per_day}/day`,
              `Multi-day discount: ${formData.multi_day_discount}%`,
              `Cancellation policy: ${formData.cancellation_policy}`
            ]}
            isComplete={true}
          />
          
          <ReviewItem
            title="Availability"
            items={
              formData.custom_availability && formData.custom_availability.length > 0
                ? ['Custom calendar availability set']
                : formData.available_days?.map(day => 
                    `${day.charAt(0).toUpperCase() + day.slice(1)}: ${formData.available_hours?.start} - ${formData.available_hours?.end}`
                  ) || []
            }
            isComplete={true}
          />
          
          <ReviewItem
            title="Pickup Location"
            items={[
              formData.location || '',
              formData.pickup_instructions ? 'Custom pickup instructions added' : 'No special instructions'
            ]}
            isComplete={!!formData.location}
          />
        </div>
      </div>
      
      {isSubmitting && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Uploading images...</span>
            <span className="text-sm font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
};

interface ReviewItemProps {
  title: string;
  items: string[];
  isComplete: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ title, items, isComplete }) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className={`px-4 py-3 flex justify-between items-center ${
        isComplete ? 'bg-green-50' : 'bg-amber-50'
      }`}>
        <h4 className="font-medium">{title}</h4>
        {isComplete ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-600" />
        )}
      </div>
      
      <div className="px-4 py-3 bg-white">
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index} className="text-sm">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CarReviewForm;
