
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Mail, Smartphone, Eye, EyeOff, Car, Home } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SignupFormProps {
  onPhoneSubmit: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onPhoneSubmit }) => {
  const { signUp, signInWithPhone, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<"renter" | "host">("renter");

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password, undefined, userRole);
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithPhone(phone, userRole);
      onPhoneSubmit();
    } catch (error) {
      console.error("Phone signup error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Join Rento for seamless car rentals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="email" 
          value={authMethod} 
          onValueChange={(v) => setAuthMethod(v as "email" | "phone")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> Phone
            </TabsTrigger>
          </TabsList>
          
          {/* User role selection */}
          <div className="mb-6">
            <Label className="block mb-2">How do you plan to use Rento?</Label>
            <RadioGroup 
              value={userRole} 
              onValueChange={(value) => setUserRole(value as "renter" | "host")} 
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
          
          <TabsContent value="email">
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="phone">
            <form onSubmit={handlePhoneSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-phone">Phone Number</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignupForm;
