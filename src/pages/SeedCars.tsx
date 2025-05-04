
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CarFront } from "lucide-react";
import { toast } from "sonner";
import { SeedCarInfo } from "@/components/seed/SeedCarInfo";
import { SeedCardFooter } from "@/components/seed/SeedCardFooter";
import { checkSeedingStatus, seedDatabase } from "@/services/SeedService";

const SeedCars = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    // Check if seeding was done before
    const checkSeed = async () => {
      try {
        const hasExistingCars = await checkSeedingStatus();
        if (hasExistingCars) {
          setLog(prev => [...prev, "Cars already exist in the database."]);
          setIsComplete(true);
        }
      } catch (error) {
        console.error("Error checking seed status:", error);
      }
    };
    
    checkSeed();
  }, []);

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
  };

  const handleSeedDatabase = async () => {
    setIsLoading(true);
    addLog("Starting database seeding process...");

    try {
      await seedDatabase(addLog);
      setIsComplete(true);
      toast.success("Demo cars added successfully!");
    } catch (error: any) {
      toast.error(`Failed to seed database: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CarFront className="h-6 w-6 text-rento-blue" />
            Seed Cars Database
          </CardTitle>
          <CardDescription>
            Add demo cars to the database for development and testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeedCarInfo log={log} isComplete={isComplete} />
        </CardContent>
        <CardFooter>
          <SeedCardFooter 
            isLoading={isLoading}
            isComplete={isComplete}
            onSeed={handleSeedDatabase}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default SeedCars;
