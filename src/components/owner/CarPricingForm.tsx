
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CarFormData } from "@/types/owner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const formSchema = z.object({
  price_per_day: z.coerce.number()
    .min(10, "Minimum price is $10 per day")
    .max(1000, "Maximum price is $1000 per day"),
  multi_day_discount: z.coerce.number()
    .min(0, "Minimum discount is 0%")
    .max(50, "Maximum discount is 50%"),
  cancellation_policy: z.enum(['flexible', 'moderate', 'strict'])
});

interface CarPricingFormProps {
  formData: Partial<CarFormData>;
  updateFormData: (data: Partial<CarFormData>, isValid: boolean) => void;
}

const CarPricingForm: React.FC<CarPricingFormProps> = ({ formData, updateFormData }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price_per_day: formData.price_per_day || 50,
      multi_day_discount: formData.multi_day_discount || 0,
      cancellation_policy: (formData.cancellation_policy as any) || 'moderate'
    }
  });

  const { watch, formState } = form;
  const watchedValues = watch();
  const { isValid } = formState;

  // Update parent component with form data when values change
  useEffect(() => {
    updateFormData(watchedValues, isValid);
  }, [watchedValues, isValid, updateFormData]);

  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="price_per_day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Rental Price</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input 
                    type="number" 
                    placeholder="50" 
                    className="pl-8" 
                    {...field} 
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      if (!isNaN(value)) {
                        field.onChange(value);
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Set a competitive price based on your car's make, model, and year
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="multi_day_discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Multi-Day Discount</FormLabel>
              <div className="space-y-3">
                <FormControl>
                  <Slider
                    min={0}
                    max={50}
                    step={1}
                    defaultValue={[field.value || 0]}
                    onValueChange={(value) => field.onChange(value[0])}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormDescription>
                    Discount percentage for bookings longer than 7 days
                  </FormDescription>
                  <span className="font-medium text-lg">{field.value}%</span>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cancellation_policy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cancellation Policy</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cancellation policy" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="flexible">
                    Flexible (Full refund 1 day prior to arrival)
                  </SelectItem>
                  <SelectItem value="moderate">
                    Moderate (Full refund 3 days prior to arrival)
                  </SelectItem>
                  <SelectItem value="strict">
                    Strict (50% refund 7 days prior to arrival)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 bg-muted p-4 rounded-md">
          <h3 className="font-medium">Estimated Earnings</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Price per day</span>
              <span className="font-medium">${form.getValues().price_per_day}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Weekly (7 days)</span>
              <span className="font-medium">
                ${(form.getValues().price_per_day * 7 * (1 - form.getValues().multi_day_discount / 100)).toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Monthly (30 days)</span>
              <span className="font-medium">
                ${(form.getValues().price_per_day * 30 * (1 - form.getValues().multi_day_discount / 100)).toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            *Estimates before service fees
          </div>
        </div>
      </form>
    </Form>
  );
};

export default CarPricingForm;
