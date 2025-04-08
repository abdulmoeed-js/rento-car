
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CarFormData } from "@/types/owner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const currentYear = new Date().getFullYear();
const yearRange = Array.from({ length: 30 }, (_, i) => currentYear - i);

const formSchema = z.object({
  brand: z.string().min(2, "Brand is required"),
  model: z.string().min(2, "Model is required"),
  year: z.coerce.number().int().min(1900).max(currentYear),
  transmission: z.string(),
  fuel_type: z.string(),
  doors: z.coerce.number().int().min(2).max(6),
  has_ac: z.boolean(),
  license_plate: z.string().optional(),
  car_type: z.string(),
  description: z.string().min(10, "Description must be at least 10 characters")
});

interface CarDetailsFormProps {
  formData: Partial<CarFormData>;
  updateFormData: (data: Partial<CarFormData>, isValid: boolean) => void;
}

const CarDetailsForm: React.FC<CarDetailsFormProps> = ({ formData, updateFormData }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: formData.brand || "",
      model: formData.model || "",
      year: formData.year || currentYear,
      transmission: formData.transmission || "automatic",
      fuel_type: formData.fuel_type || "gasoline",
      doors: formData.doors || 4,
      has_ac: formData.has_ac === undefined ? true : formData.has_ac,
      license_plate: formData.license_plate || "",
      car_type: formData.car_type || "sedan",
      description: formData.description || ""
    }
  });

  const { watch, formState } = form;
  const watchedValues = watch();
  const { isValid, isDirty } = formState;

  // Update parent component with form data when values change
  useEffect(() => {
    updateFormData(watchedValues, isValid);
  }, [watchedValues, isValid, updateFormData]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Car Brand</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Toyota" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Car Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Camry" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {yearRange.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="car_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Car Type</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select car type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="hatchback">Hatchback</SelectItem>
                    <SelectItem value="convertible">Convertible</SelectItem>
                    <SelectItem value="coupe">Coupe</SelectItem>
                    <SelectItem value="minivan">Minivan</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="wagon">Wagon</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transmission</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuel_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Type</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gasoline">Gasoline</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Doors</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doors" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Plate (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. ABC123" {...field} />
                </FormControl>
                <FormDescription>
                  Only for your reference, not shown to renters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="has_ac"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Air Conditioning</FormLabel>
                  <FormDescription>
                    Does your car have air conditioning?
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Car Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your car's features, condition, and anything special about it..."
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A detailed description helps attract more renters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default CarDetailsForm;
