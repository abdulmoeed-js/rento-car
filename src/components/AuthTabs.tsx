
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import OtpForm from "./OtpForm";
import ResetPasswordForm from "./ResetPasswordForm";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const AuthTabs: React.FC = () => {
  const { user, isLoading, authInitialized } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showOtpForm, setShowOtpForm] = useState<boolean>(false);
  const [showResetForm, setShowResetForm] = useState<boolean>(false);
  const navigate = useNavigate();

  // If still loading auth state, don't render anything yet
  if (!authInitialized) return null;

  // If authenticated, redirect to appropriate dashboard based on user role
  if (user) {
    if (user.user_role === 'host') {
      navigate("/owner-portal");
    } else {
      navigate("/cars");
    }
    return null;
  }

  // Handle OTP verification flow
  if (showOtpForm) {
    return (
      <OtpForm
        onBack={() => setShowOtpForm(false)}
      />
    );
  }

  // Handle reset password flow
  if (showResetForm) {
    return (
      <ResetPasswordForm
        onBack={() => setShowResetForm(false)}
      />
    );
  }

  return (
    <Tabs 
      defaultValue="login" 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full max-w-md mx-auto"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Log In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login">
        <LoginForm 
          onPhoneSubmit={() => setShowOtpForm(true)} 
          onForgotPassword={() => setShowResetForm(true)}
        />
      </TabsContent>
      
      <TabsContent value="signup">
        <SignupForm onPhoneSubmit={() => setShowOtpForm(true)} />
      </TabsContent>
    </Tabs>
  );
};

export default AuthTabs;
