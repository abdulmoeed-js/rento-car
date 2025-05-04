
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SetUserRole = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const makeHost = async (userEmail: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('set-user-role', {
        body: { email: userEmail, role: 'host' }
      });
      
      if (error) throw error;
      
      toast.success(data?.message || "User successfully set as host");
      setEmail("");
    } catch (error: any) {
      console.error("Error setting user role:", error);
      toast.error(`Failed to set user as host: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // For specific user: moeed@glotte.org
  const setSpecificUserAsHost = async () => {
    setLoading(true);
    try {
      const specificEmail = "moeed@glotte.org";
      const { data, error } = await supabase.functions.invoke('set-user-role', {
        body: { email: specificEmail, role: 'host' }
      });
      
      if (error) throw error;
      
      toast.success(`${specificEmail} has been made a host!`);
    } catch (error: any) {
      console.error("Error setting specific user role:", error);
      toast.error(`Failed to set specific user as host: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set User Role</CardTitle>
        <CardDescription>Change a user's role in the application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">User Email</label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={() => makeHost(email)} 
            disabled={loading || !email} 
            className="w-full sm:w-auto"
          >
            {loading ? "Setting Role..." : "Make Host"}
          </Button>
        </div>
        
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium mb-2">Set Specific User</h3>
          <Button
            variant="outline"
            onClick={setSpecificUserAsHost}
            disabled={loading}
            className="w-full"
          >
            Set moeed@glotte.org as Host
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetUserRole;
