import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import SetUserRole from "@/components/admin/SetUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminTools = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Simple check to prevent unauthorized access
  // In a production app, you'd want to verify admin status with a more robust check
  React.useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Tools</h1>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Set User As Host</h2>
              <p className="text-gray-500 mb-4">
                Make a user a host so they can upload cars to rent out
              </p>
              <Button 
                onClick={async () => {
                  try {
                    const specificEmail = "moeed@glotte.org";
                    const { data, error } = await supabase.functions.invoke('set-user-role', {
                      body: { email: specificEmail, role: 'host' }
                    });
                    
                    if (error) throw error;
                    
                    toast.success(`${specificEmail} has been made a host!`);
                  } catch (error: any) {
                    console.error("Error setting specific user role:", error);
                    toast.error(`Failed: ${error.message || "Unknown error"}`);
                  }
                }} 
                className="bg-rento-blue hover:bg-rento-darkblue"
              >
                Set moeed@glotte.org as Host
              </Button>
            </Card>
            
            <SetUserRole />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTools;
