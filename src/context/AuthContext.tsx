import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";
import { logInfo, logError, logWarn, LogType } from "@/utils/logger";

interface User {
  id: string;
  email?: string;
  phone?: string;
  licenseStatus: 'not_uploaded' | 'pending_verification' | 'verified' | 'rejected';
  licenseImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authMethod: 'email' | 'phone' | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signUp: (email: string, password: string, phone?: string) => Promise<void>;
  uploadLicense: (licenseImage: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | null>(null);
  
  // This would normally connect to a backend service
  // For now, we'll simulate authentication with localStorage
  useEffect(() => {
    logInfo(LogType.AUTH, "Initializing authentication state");
    const storedUser = localStorage.getItem('rentoUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      logInfo(LogType.AUTH, "User loaded from storage", { userId: parsedUser.id });
    } else {
      logInfo(LogType.AUTH, "No stored user found");
    }
    setIsLoading(false);
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    logInfo(LogType.AUTH, "Attempting email sign in", { email });
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, automatically "authenticate" with any valid email format
      if (!email.includes('@')) {
        const error = new Error('Invalid email format');
        logError(LogType.AUTH, "Email sign in failed - invalid format", { email });
        throw error;
      }
      
      // Check if user exists in our "database" (localStorage)
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      const existingUser = storedUsers.find((u: any) => u.email === email);
      
      if (!existingUser) {
        const error = new Error('User not found');
        logError(LogType.AUTH, "Email sign in failed - user not found", { email });
        throw error;
      }
      
      // In a real app, we would validate the password here
      // For demo purposes, we'll accept any password
      
      setUser(existingUser);
      localStorage.setItem('rentoUser', JSON.stringify(existingUser));
      setAuthMethod('email');
      logInfo(LogType.AUTH, "Email sign in successful", { userId: existingUser.id });
      toast.success('Successfully signed in!');
    } catch (error: any) {
      logError(LogType.AUTH, "Email sign in error", { error: error.message });
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phone: string) => {
    logInfo(LogType.AUTH, "Attempting phone sign in", { phone: phone.substring(0, 6) + "XXXX" });
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation for demo
      if (!/^\d{10}$/.test(phone)) {
        const error = new Error('Please enter a valid 10-digit phone number');
        logError(LogType.AUTH, "Phone sign in failed - invalid format", { phone: phone.substring(0, 6) + "XXXX" });
        throw error;
      }
      
      // In a real app, this would send an OTP to the phone number
      setAuthMethod('phone');
      logInfo(LogType.AUTH, "OTP sent for phone sign in", { phone: phone.substring(0, 6) + "XXXX" });
      toast.success('OTP sent to your phone!');
      
      // Store the phone temporarily for verification
      localStorage.setItem('rentoTempPhone', phone);
    } catch (error: any) {
      logError(LogType.AUTH, "Phone sign in error", { error: error.message });
      toast.error(error.message || 'Failed to send OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    logInfo(LogType.AUTH, "Verifying OTP");
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, we'll accept any 6-digit OTP
      if (!/^\d{6}$/.test(otp)) {
        const error = new Error('Please enter a valid 6-digit OTP');
        logError(LogType.AUTH, "OTP verification failed - invalid format");
        throw error;
      }
      
      const phone = localStorage.getItem('rentoTempPhone');
      if (!phone) {
        const error = new Error('Session expired, please try again');
        logError(LogType.AUTH, "OTP verification failed - session expired");
        throw error;
      }
      
      // Check if user exists
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      const existingUser = storedUsers.find((u: any) => u.phone === phone);
      
      if (existingUser) {
        setUser(existingUser);
        localStorage.setItem('rentoUser', JSON.stringify(existingUser));
        logInfo(LogType.AUTH, "OTP verification successful - existing user", { userId: existingUser.id });
      } else {
        // Create a new user account with phone
        const newUser = {
          id: Date.now().toString(),
          phone,
          licenseStatus: 'not_uploaded' as const
        };
        
        const updatedUsers = [...storedUsers, newUser];
        localStorage.setItem('rentoUsers', JSON.stringify(updatedUsers));
        localStorage.setItem('rentoUser', JSON.stringify(newUser));
        setUser(newUser);
        logInfo(LogType.AUTH, "OTP verification successful - new user created", { userId: newUser.id });
      }
      
      localStorage.removeItem('rentoTempPhone');
      toast.success('Successfully signed in!');
    } catch (error: any) {
      logError(LogType.AUTH, "OTP verification error", { error: error.message });
      toast.error(error.message || 'Failed to verify OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, phone?: string) => {
    logInfo(LogType.AUTH, "Attempting sign up", { email, hasPhone: !!phone });
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation
      if (!email.includes('@')) {
        const error = new Error('Invalid email format');
        logError(LogType.AUTH, "Sign up failed - invalid email format", { email });
        throw error;
      }
      
      // Check if user already exists
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      if (storedUsers.some((u: any) => u.email === email)) {
        const error = new Error('User with this email already exists');
        logError(LogType.AUTH, "Sign up failed - email already exists", { email });
        throw error;
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        phone,
        licenseStatus: 'not_uploaded' as const
      };
      
      const updatedUsers = [...storedUsers, newUser];
      localStorage.setItem('rentoUsers', JSON.stringify(updatedUsers));
      localStorage.setItem('rentoUser', JSON.stringify(newUser));
      
      setUser(newUser);
      setAuthMethod('email');
      logInfo(LogType.AUTH, "Sign up successful", { userId: newUser.id });
      toast.success('Account created successfully!');
    } catch (error: any) {
      logError(LogType.AUTH, "Sign up error", { error: error.message });
      toast.error(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLicense = async (licenseImage: string) => {
    logInfo(LogType.KYC, "Attempting license upload");
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!user) {
        const error = new Error('You must be logged in to upload a license');
        logError(LogType.KYC, "License upload failed - user not logged in");
        throw error;
      }
      
      // Update user with license information
      const updatedUser = {
        ...user,
        licenseImage,
        licenseStatus: 'pending_verification' as const
      };
      
      // Update in "database"
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === user.id ? updatedUser : u
      );
      
      localStorage.setItem('rentoUsers', JSON.stringify(updatedUsers));
      localStorage.setItem('rentoUser', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      logInfo(LogType.KYC, "License uploaded successfully", { userId: user.id });
      toast.success('License uploaded successfully! Verification pending.');
    } catch (error: any) {
      logError(LogType.KYC, "License upload error", { error: error.message });
      toast.error(error.message || 'Failed to upload license');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    logInfo(LogType.AUTH, "Password reset requested", { email });
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      const existingUser = storedUsers.find((u: any) => u.email === email);
      
      if (!existingUser) {
        // For security, don't reveal if the email exists or not
        logWarn(LogType.AUTH, "Password reset requested for non-existent email", { email });
        toast.success('If an account with that email exists, we have sent password reset instructions.');
        return;
      }
      
      // In a real app, this would send an email with password reset instructions
      logInfo(LogType.AUTH, "Password reset email sent", { userId: existingUser.id });
      toast.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      // For security, we still show success even if there's an error
      logError(LogType.AUTH, "Password reset error", { error: error.message, email });
      toast.success('If an account with that email exists, we have sent password reset instructions.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    logInfo(LogType.AUTH, "User signing out", { userId: user?.id });
    localStorage.removeItem('rentoUser');
    setUser(null);
    setAuthMethod(null);
    toast.info('Signed out successfully');
  };

  const value = {
    user,
    isLoading,
    authMethod,
    signInWithEmail,
    signInWithPhone,
    verifyOtp,
    signUp,
    uploadLicense,
    resetPassword,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
