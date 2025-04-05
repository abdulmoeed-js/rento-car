
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createTestAdmin } from "@/utils/createTestAdmin";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";

const CreateAdmin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please provide both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await createTestAdmin(email, password);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Navigate to login page
        navigate("/auth");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create admin account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="absolute left-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="flex-1 text-center flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 text-red-600" /> 
              Create Admin Account
            </CardTitle>
          </div>
          <CardDescription className="text-center">
            Create a test admin account for KYC verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? "Creating Admin..." : "Create Admin Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-sm text-center text-muted-foreground">
          <p>This page is for development purposes only.</p>
          <p className="text-red-500 font-semibold mt-2">
            Do not use in production!
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateAdmin;
