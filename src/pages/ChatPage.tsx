
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RentoHeader from '@/components/layout/RentoHeader';
import Chat from '@/components/chat/Chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot } from 'lucide-react';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('faq');
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  if (!user) {
    return null; // Will redirect via effect
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RentoHeader />
      
      <div className="container mx-auto flex-1 p-4">
        <div className="bg-card rounded-lg shadow-sm border overflow-hidden h-[calc(100vh-12rem)]">
          <Tabs 
            defaultValue="faq" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <div className="border-b">
              <TabsList className="w-full justify-start p-2 h-auto bg-transparent">
                <TabsTrigger 
                  value="faq"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Assistant
                </TabsTrigger>
                <TabsTrigger 
                  value="support"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Support
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="faq" className="flex-1 p-0 m-0">
              <Chat receiverId="bot" />
            </TabsContent>
            
            <TabsContent value="support" className="flex-1 p-0 m-0">
              <Chat receiverId="support" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
