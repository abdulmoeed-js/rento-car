
import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { CarFormData, FormStep } from "@/types/owner";
import RentoHeader from "@/components/layout/RentoHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCarManagement } from "@/hooks/useCarManagement";
import { useCarStepper, formSteps, stepLabels } from "@/hooks/useCarStepper";
import { useCarData } from "@/hooks/useCarData";
import CarDetailsForm from "@/components/owner/CarDetailsForm";
import CarPhotosForm from "@/components/owner/CarPhotosForm";
import CarPricingForm from "@/components/owner/CarPricingForm";
import CarAvailabilityForm from "@/components/owner/CarAvailabilityForm";
import CarPickupForm from "@/components/owner/CarPickupForm";
import CarReviewForm from "@/components/owner/CarReviewForm";
import { CarStepper } from "@/components/owner/CarStepper";

const AddEditCar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const {
    currentStep,
    setCurrentStep,
    validatedSteps,
    setStepValidation,
    goToNextStep,
    goToPreviousStep
  } = useCarStepper("details");

  // load state for car (edit mode)
  const [allValidated, setAllValidated] = useState(false);

  useCarData({
    id,
    user,
    onLoaded: (data) => setFormData((prev) => ({ ...prev, ...data })),
    onAllStepsValidated: () => setAllValidated(true)
  });

  const { saveCar, isSubmitting, uploadProgress } = useCarManagement(id);

  const updateFormData = useCallback((stepData: Partial<CarFormData>, isValid: boolean) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    setStepValidation(currentStep, isValid);
  }, [setFormData, currentStep, setStepValidation]);

  const handleStepChange = (newStep: FormStep) => setCurrentStep(newStep);

  const handleSubmit = async () => {
    if (!user) {
      return;
    }
    const success = await saveCar(formData, user.id);
    if (success) {
      navigate("/owner-portal");
    }
  };

  // Loading state
  // We'll rely on useCarData's isLoading state:

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
            <CarStepper
              currentStep={currentStep}
              validatedSteps={validatedSteps}
              onStepClick={handleStepChange}
            />
            {currentStep === "details" && (
              <CarDetailsForm
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === "photos" && (
              <CarPhotosForm
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === "pricing" && (
              <CarPricingForm
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === "availability" && (
              <CarAvailabilityForm
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === "pickup" && (
              <CarPickupForm
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === "review" && (
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
              disabled={currentStep === "details"}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {currentStep !== "review" ? (
              <Button
                onClick={goToNextStep}
                disabled={!validatedSteps.has(currentStep)}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !validatedSteps.has("review")}
              >
                {id ? "Update Car" : "Add Car"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default AddEditCar;
