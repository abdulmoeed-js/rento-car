
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import EmailSignupForm from "./signup/EmailSignupForm";
import PhoneSignupForm from "./signup/PhoneSignupForm";
import UserRoleSelector from "./signup/UserRoleSelector";

interface SignupFormProps {
  onPhoneSubmit: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onPhoneSubmit }) => {
  const { signUp, signInWithPhone, isLoading } = useAuth();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [userRole, setUserRole] = useState<"renter" | "host">("renter");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleEmailSignup = async (email: string, password: string) => {
    setEmailError(null);
    
    try {
      console.log("Signing up with role:", userRole);
      const { error } = await signUp(email, password, undefined, userRole);
      if (error) {
        setEmailError(error);
        console.error("Signup error:", error);
      } else {
        toast.success("Account created successfully! Please log in.");
      }
    } catch (error: any) {
      setEmailError(error.message || "Failed to create account. Please try again.");
      console.error("Signup error:", error);
    }
  };

  const handlePhoneSignup = async (phone: string) => {
    setPhoneError(null);
    
    try {
      console.log("Signing up with phone for role:", userRole);
      const { error } = await signInWithPhone(phone, userRole);
      if (error) {
        setPhoneError(error);
        console.error("Phone signup error:", error);
      } else {
        onPhoneSubmit();
      }
    } catch (error: any) {
      setPhoneError(error.message || "Failed to send OTP. Please try again.");
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
          onValueChange={(v) => {
            setAuthMethod(v as "email" | "phone");
            // Clear errors when switching tabs
            setEmailError(null);
            setPhoneError(null);
          }}
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
          
          {/* User role selector component */}
          <UserRoleSelector userRole={userRole} onChange={setUserRole} />
          
          <TabsContent value="email">
            <EmailSignupForm 
              onSubmit={handleEmailSignup}
              error={emailError}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="phone">
            <PhoneSignupForm 
              onSubmit={handlePhoneSignup}
              error={phoneError}
              isLoading={isLoading}
            />
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
