
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import EmailLoginForm from "./login/EmailLoginForm";
import PhoneLoginForm from "./login/PhoneLoginForm";

interface LoginFormProps {
  onPhoneSubmit: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onPhoneSubmit, onForgotPassword }) => {
  const { signInWithEmail, signInWithPhone, isLoading } = useAuth();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      setEmailError(null);
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setEmailError(error);
      } else {
        toast.success("Logged in successfully");
      }
    } catch (error: any) {
      setEmailError(error.message || "Failed to login. Please try again.");
      console.error("Login error:", error);
    }
  };

  const handlePhoneLogin = async (phone: string) => {
    try {
      setPhoneError(null);
      const { error } = await signInWithPhone(phone);
      if (error) {
        setPhoneError(error);
      } else {
        onPhoneSubmit();
      }
    } catch (error: any) {
      setPhoneError(error.message || "Failed to send OTP. Please try again.");
      console.error("Phone login error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Log in to your Rento account
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
          
          <TabsContent value="email">
            <EmailLoginForm 
              onSubmit={handleEmailLogin}
              error={emailError}
              isLoading={isLoading}
              onForgotPassword={onForgotPassword}
            />
          </TabsContent>
          
          <TabsContent value="phone">
            <PhoneLoginForm 
              onSubmit={handlePhoneLogin}
              error={phoneError}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
