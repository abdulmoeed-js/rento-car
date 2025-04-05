
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Car, Home } from "lucide-react";

interface UserRoleSelectorProps {
  userRole: "renter" | "host";
  onChange: (role: "renter" | "host") => void;
}

const UserRoleSelector: React.FC<UserRoleSelectorProps> = ({
  userRole,
  onChange,
}) => {
  return (
    <div className="mb-6">
      <Label className="block mb-2">How do you plan to use Rento?</Label>
      <RadioGroup 
        value={userRole} 
        onValueChange={(value) => onChange(value as "renter" | "host")} 
        className="grid grid-cols-2 gap-4"
      >
        <Label
          htmlFor="role-renter"
          className={`flex flex-col items-center justify-center border rounded-lg p-4 cursor-pointer ${
            userRole === "renter" ? "border-rento-blue bg-rento-blue/5" : "border-gray-200"
          }`}
        >
          <RadioGroupItem value="renter" id="role-renter" className="sr-only" />
          <Car className={`h-8 w-8 mb-2 ${userRole === "renter" ? "text-rento-blue" : "text-gray-400"}`} />
          <span className="text-sm font-medium">Rent a Car</span>
        </Label>
        
        <Label 
          htmlFor="role-host"
          className={`flex flex-col items-center justify-center border rounded-lg p-4 cursor-pointer ${
            userRole === "host" ? "border-rento-blue bg-rento-blue/5" : "border-gray-200"
          }`}
        >
          <RadioGroupItem value="host" id="role-host" className="sr-only" />
          <Home className={`h-8 w-8 mb-2 ${userRole === "host" ? "text-rento-blue" : "text-gray-400"}`} />
          <span className="text-sm font-medium">List My Car</span>
        </Label>
      </RadioGroup>
    </div>
  );
};

export default UserRoleSelector;
