
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Mail, Smartphone, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface LoginFormProps {
  onPhoneSubmit: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onPhoneSubmit, onForgotPassword }) => {
  const { signInWithEmail, signInWithPhone, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear previous errors
    setEmailError(null);
    
    if (!email || !password) {
      setEmailError("Please fill in all required fields");
      return;
    }
    
    try {
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

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear previous errors
    setPhoneError(null);
    
    if (!phone) {
      setPhoneError("Please enter your phone number");
      return;
    }
    
    try {
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
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {emailError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{emailError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="px-0 text-xs"
                    onClick={onForgotPassword}
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
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
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="phone">
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              {phoneError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{phoneError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
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
    </Card>
  );
};

export default LoginForm;
