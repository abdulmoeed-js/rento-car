import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CarFormData } from "@/types/owner";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Star, StarIcon } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  images: z.array(
    z.instanceof(File)
      .refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 5MB`)
      .refine(
        file => ACCEPTED_IMAGE_TYPES.includes(file.type),
        "Only .jpg, .jpeg, .png, and .webp formats are supported"
      )
  ).min(3, "Please upload at least 3 images").max(10, "Maximum of 10 images allowed"),
  primaryImageIndex: z.number().min(0)
});

interface CarPhotosFormProps {
  formData: Partial<CarFormData>;
  updateFormData: (data: Partial<CarFormData>, isValid: boolean) => void;
}

const CarPhotosForm: React.FC<CarPhotosFormProps> = ({ formData, updateFormData }) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(formData.primaryImageIndex || 0);
  const [existingImages, setExistingImages] = useState<Array<{id: string, url: string, is_primary?: boolean}>>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      images: [],
      primaryImageIndex: formData.primaryImageIndex || 0
    }
  });

  // Initialize existing images if editing
  useEffect(() => {
    if (formData.existingImages && formData.existingImages.length > 0) {
      setExistingImages(formData.existingImages);
      setPrimaryIndex(formData.primaryImageIndex || 0);
    }
  }, [formData.existingImages, formData.primaryImageIndex]);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check if adding these files would exceed the limit
    const totalCount = files.length + imagePreviews.length + existingImages.length;
    if (totalCount > 10) {
      toast.error("Maximum of 10 images allowed");
      return;
    }
    
    // Process each file
    const validFiles: File[] = [];
    const fileReaders: FileReader[] = [];
    const newImagePreviews: string[] = [...imagePreviews];
    
    files.forEach(file => {
      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Only .jpg, .jpeg, .png, and .webp formats are supported`);
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File size exceeds 5MB limit`);
        return;
      }
      
      // Add to valid files
      validFiles.push(file);
      
      // Create image preview
      const reader = new FileReader();
      fileReaders.push(reader);
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newImagePreviews.push(result);
        
        // If all files have been processed, update state
        if (newImagePreviews.length === imagePreviews.length + validFiles.length) {
          setImagePreviews(newImagePreviews);
          
          // Update form data
          const currentImages = form.getValues().images;
          form.setValue('images', [...currentImages, ...validFiles]);
          
          // Validate form
          form.trigger('images');
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Remove an image
  const removeImage = (index: number) => {
    const currentImages = form.getValues().images;
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    
    setImagePreviews(newPreviews);
    form.setValue('images', newImages);
    
    // Update primary image index if needed
    if (primaryIndex === index + existingImages.length) {
      const newPrimaryIndex = newImages.length > 0 || existingImages.length > 0 ? 0 : -1;
      setPrimaryIndex(newPrimaryIndex);
      form.setValue('primaryImageIndex', newPrimaryIndex);
    } else if (primaryIndex > index + existingImages.length) {
      setPrimaryIndex(primaryIndex - 1);
      form.setValue('primaryImageIndex', primaryIndex - 1);
    }
    
    // Validate form
    form.trigger('images');
  };

  // Remove an existing image
  const removeExistingImage = (index: number) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
    
    // Update primary image index if needed
    if (primaryIndex === index) {
      const newPrimaryIndex = newExistingImages.length > 0 ? 0 : 
                             (imagePreviews.length > 0 ? 0 : -1);
      setPrimaryIndex(newPrimaryIndex);
      form.setValue('primaryImageIndex', newPrimaryIndex);
    } else if (primaryIndex > index) {
      setPrimaryIndex(primaryIndex - 1);
      form.setValue('primaryImageIndex', primaryIndex - 1);
    }
    
    // Validate form
    validateForm();
  };

  // Set primary image
  const setPrimaryImage = (index: number, isExisting: boolean = false) => {
    setPrimaryIndex(index);
    form.setValue('primaryImageIndex', index);
    
    // Update form validation
    form.trigger('primaryImageIndex');
  };

  // Validate if we have enough images
  const validateForm = () => {
    const totalImages = form.getValues().images.length + existingImages.length;
    return totalImages >= 3;
  };

  // Update parent component with form data when values change
  useEffect(() => {
    const subscription = form.watch((values) => {
      const isValid = validateForm();
      
      updateFormData({
        images: values.images,
        primaryImageIndex: primaryIndex,
        existingImages
      }, isValid);
    });
    
    return () => subscription.unsubscribe();
  }, [form, primaryIndex, existingImages, updateFormData]);

  // Initial validation
  useEffect(() => {
    validateForm();
  }, []);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <label htmlFor="image-upload" className="cursor-pointer block">
            <ImagePlus className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-lg font-medium mb-1">Upload Car Images</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload 3-10 high-quality images of your car (5MB max per image)
            </p>
            <Button type="button" variant="outline">
              Select Images
              <Input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </Button>
          </label>
        </div>
        
        {form.formState.errors.images && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.images.message}
          </p>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-3">Image Gallery</h3>
          
          {/* Existing and new images preview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existing images */}
            {existingImages.map((image, index) => (
              <div key={`existing-${index}`} className="relative aspect-square rounded-md overflow-hidden border">
                <img
                  src={image.url}
                  alt={`Car image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-between p-2">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => removeExistingImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant={primaryIndex === index ? "default" : "outline"}
                      size="sm"
                      className="bg-white/80 hover:bg-white"
                      onClick={() => setPrimaryImage(index, true)}
                    >
                      <StarIcon className={`h-4 w-4 mr-1 ${primaryIndex === index ? 'text-yellow-400' : 'text-gray-400'}`} />
                      {primaryIndex === index ? "Primary" : "Set as Primary"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* New images */}
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                <img
                  src={preview}
                  alt={`Car image ${existingImages.length + index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-between p-2">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant={primaryIndex === existingImages.length + index ? "default" : "outline"}
                      size="sm"
                      className="bg-white/80 hover:bg-white"
                      onClick={() => setPrimaryImage(existingImages.length + index)}
                    >
                      <StarIcon className={`h-4 w-4 mr-1 ${primaryIndex === existingImages.length + index ? 'text-yellow-400' : 'text-gray-400'}`} />
                      {primaryIndex === existingImages.length + index ? "Primary" : "Set as Primary"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {existingImages.length === 0 && imagePreviews.length === 0 && (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">
                No images uploaded yet. Please upload at least 3 images.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Image Tips</h4>
          <ul className="text-sm space-y-1 list-disc pl-4">
            <li>Include images of both the exterior and interior of your car</li>
            <li>Take photos in good lighting</li>
            <li>Capture from multiple angles (front, back, sides)</li>
            <li>Include any unique features or selling points</li>
            <li>Clean your car before taking pictures</li>
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default CarPhotosForm;
