
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CarFormData } from "@/types/owner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";

const formSchema = z.object({
  location: z.string().min(5, "Location is required"),
  pickup_instructions: z.string().optional(),
  location_coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

interface CarPickupFormProps {
  formData: Partial<CarFormData>;
  updateFormData: (data: Partial<CarFormData>, isValid: boolean) => void;
}

const CarPickupForm: React.FC<CarPickupFormProps> = ({ formData, updateFormData }) => {
  const [mapUrl, setMapUrl] = useState("");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: formData.location || "",
      pickup_instructions: formData.pickup_instructions || "",
      location_coordinates: formData.location_coordinates
    }
  });

  const { watch, formState } = form;
  const watchedValues = watch();
  const { isValid } = formState;

  // Update map URL when location changes
  useEffect(() => {
    if (watchedValues.location) {
      const encodedLocation = encodeURIComponent(watchedValues.location);
      setMapUrl(`https://maps.google.com/maps?q=${encodedLocation}&t=&z=13&ie=UTF8&iwloc=&output=embed`);
    }
  }, [watchedValues.location]);

  // Update parent component with form data when values change
  useEffect(() => {
    updateFormData(watchedValues, isValid);
  }, [watchedValues, isValid, updateFormData]);

  // Search for location
  const searchLocation = () => {
    // In a real app, this would use a geocoding API
    // For now, we'll just set a fake coordinate
    const location = form.getValues().location;
    
    if (location) {
      form.setValue('location_coordinates', {
        lat: 40.7128,
        lng: -74.0060
      });
      form.trigger('location_coordinates');
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Location</FormLabel>
              <div className="flex space-x-2">
                <FormControl>
                  <Input 
                    placeholder="Enter address or area name" 
                    {...field} 
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={searchLocation}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                Enter the general area where renters can pick up your car
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {watchedValues.location && (
          <div className="rounded-md overflow-hidden border h-60">
            <iframe
              title="Car Location"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={mapUrl}
            ></iframe>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="pickup_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Instructions</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="E.g. Please call me 15 minutes before pickup. The car will be in the parking lot near the entrance." 
                  className="min-h-24"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Provide clear instructions for renters on how to find and access your car
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-red-500" />
            Location Privacy Note
          </h3>
          <p className="text-sm text-muted-foreground">
            For security reasons, we only show the general area of your car to potential renters. 
            The exact location and pickup details will only be shared after booking confirmation.
          </p>
        </div>
      </form>
    </Form>
  );
};

export default CarPickupForm;
