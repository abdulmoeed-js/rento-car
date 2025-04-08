
import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CarFront, DollarSign } from "lucide-react";

interface UserRoleSelectorProps {
  userRole: "renter" | "host";
  onChange: (role: "renter" | "host") => void;
}

const UserRoleSelector: React.FC<UserRoleSelectorProps> = ({ userRole, onChange }) => {
  return (
    <div className="mb-6">
      <Label className="mb-2 block">I want to join as:</Label>
      <RadioGroup 
        value={userRole} 
        onValueChange={(value) => onChange(value as "renter" | "host")}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className={`flex-1 border rounded-lg p-4 ${userRole === 'renter' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
          <RadioGroupItem 
            value="renter" 
            id="renter" 
            className="sr-only" 
          />
          <Label 
            htmlFor="renter" 
            className="flex items-start cursor-pointer"
          >
            <CarFront className={`h-5 w-5 mt-0.5 mr-2 ${userRole === 'renter' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <span className="font-medium block">Renter</span>
              <span className="text-xs text-muted-foreground">I want to rent cars</span>
            </div>
          </Label>
        </div>
        
        <div className={`flex-1 border rounded-lg p-4 ${userRole === 'host' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
          <RadioGroupItem 
            value="host" 
            id="host" 
            className="sr-only" 
          />
          <Label 
            htmlFor="host" 
            className="flex items-start cursor-pointer"
          >
            <DollarSign className={`h-5 w-5 mt-0.5 mr-2 ${userRole === 'host' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <span className="font-medium block">Car Owner</span>
              <span className="text-xs text-muted-foreground">I want to rent out my car</span>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default UserRoleSelector;
