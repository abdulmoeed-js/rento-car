
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import OtpForm from "./OtpForm";
import ResetPasswordForm from "./ResetPasswordForm";
import { useAuth } from "@/context/AuthContext";
import LicenseUpload from "./LicenseUpload";

const AuthTabs: React.FC = () => {
  const { user, authMethod } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showOtpForm, setShowOtpForm] = useState<boolean>(false);
  const [showResetForm, setShowResetForm] = useState<boolean>(false);

  // If authenticated and license not uploaded, show license upload
  if (user && user.licenseStatus === 'not_uploaded') {
    return <LicenseUpload />;
  }

  // If authenticated and license uploaded, show license status
  if (user) {
    return <LicenseUpload />;
  }

  // Handle OTP verification flow
  if (showOtpForm && authMethod === 'phone') {
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
