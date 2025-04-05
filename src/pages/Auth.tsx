
import React from "react";
import { Card } from "@/components/ui/card";
import AuthTabs from "@/components/AuthTabs";
import { CarFront } from "lucide-react";

const Auth: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rento-lightblue to-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md mb-6 flex flex-col items-center">
        <div className="bg-rento-blue text-white p-3 rounded-full mb-3">
          <CarFront className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-rento-dark">Rento</h1>
        <p className="text-muted-foreground mt-1">Drive anywhere, anytime</p>
      </div>
      
      <AuthTabs />
      
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>©{new Date().getFullYear()} Rento. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Auth;
