
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CarFront, User, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Badge } from "@/components/ui/badge";

const RentoHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { unreadCount } = useChat();
  const navigate = useNavigate();

  return (
    <header className="bg-rento-blue text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <CarFront className="h-6 w-6" />
          <span className="font-bold text-xl">Rento</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 relative"
                onClick={() => navigate("/chat")}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <span className="hidden sm:inline">
                  {user.email || user.phone}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button asChild variant="secondary">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default RentoHeader;
