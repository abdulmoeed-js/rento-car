
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CarFormData, FormStep } from "@/types/owner";
import { hasRole } from "@/utils/supabaseHelpers";

interface UseCarDataProps {
  id?: string;
  user: { id: string } | null;
  onLoaded: (data: Partial<CarFormData>) => void;
  onAllStepsValidated?: () => void;
}

export function useCarData({ id, user, onLoaded, onAllStepsValidated }: UseCarDataProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not logged in or not a host
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        toast.error("You need to be logged in");
        navigate("/auth");
        return;
      }
      try {
        const isHost = await hasRole(user.id, "host");
        if (!isHost) {
          toast.error("Only hosts can add or edit cars");
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking role:", error);
        toast.error("Error verifying user permissions");
        navigate("/");
      }
    };
    checkUserRole();
  }, [user, navigate]);

  useEffect(() => {
    const fetchCar = async () => {
      if (!id || !user) return;
      try {
        setIsLoading(true);
        
        const { data: carData, error } = await supabase
          .from("cars")
          .select(`*, car_images(*)`)
          .eq("id", id)
          .eq("host_id", user.id)
          .single();

        if (error) throw error;

        if (carData) {
          const car = carData as any;
          const images = Array.isArray(car.car_images) ? car.car_images : [];
          let primaryIndex = 0;
          if (images.length > 0) {
            const primaryImage = images.find((img) => img.is_primary === true);
            if (primaryImage) {
              primaryIndex = images.findIndex((img) => img.id === primaryImage.id);
              if (primaryIndex === -1) primaryIndex = 0;
            }
          }
          onLoaded({
            brand: car.brand,
            model: car.model,
            year: car.year,
            transmission: car.transmission,
            fuel_type: car.fuel_type,
            doors: car.doors || 4,
            has_ac: car.has_ac === undefined ? true : car.has_ac,
            license_plate: car.license_plate || "",
            car_type: car.car_type,
            existingImages: images.map((img) => ({
              id: img.id,
              url: img.image_path,
              is_primary: img.is_primary
            })),
            primaryImageIndex: primaryIndex,
            price_per_day: car.price_per_day,
            multi_day_discount: car.multi_day_discount || 0,
            cancellation_policy: (car.cancellation_policy as "flexible" | "moderate" | "strict") || "moderate",
            available_days: car.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            available_hours: car.available_hours || { start: '08:00', end: '20:00' },
            custom_availability: car.custom_availability,
            location: car.location,
            location_coordinates: car.location_coordinates as { lat?: number; lng?: number } || null,
            pickup_instructions: car.pickup_instructions || "",
            description: car.description || "",
            images: []
          });
          if (onAllStepsValidated) onAllStepsValidated();
        }
      } catch (e) {
        console.error("Error fetching car:", e);
        toast.error("Failed to load car data. Please try again.");
        navigate("/owner-portal");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCar();
  }, [id, user, onLoaded, onAllStepsValidated, navigate]);

  return { isLoading };
}
