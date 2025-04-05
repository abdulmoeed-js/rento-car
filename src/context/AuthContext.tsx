
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";

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
    const storedUser = localStorage.getItem('rentoUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, automatically "authenticate" with any valid email format
      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }
      
      // Check if user exists in our "database" (localStorage)
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      const existingUser = storedUsers.find((u: any) => u.email === email);
      
      if (!existingUser) {
        throw new Error('User not found');
      }
      
      // In a real app, we would validate the password here
      // For demo purposes, we'll accept any password
      
      setUser(existingUser);
      localStorage.setItem('rentoUser', JSON.stringify(existingUser));
      setAuthMethod('email');
      toast.success('Successfully signed in!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation for demo
      if (!/^\d{10}$/.test(phone)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }
      
      // In a real app, this would send an OTP to the phone number
      setAuthMethod('phone');
      toast.success('OTP sent to your phone!');
      
      // Store the phone temporarily for verification
      localStorage.setItem('rentoTempPhone', phone);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, we'll accept any 6-digit OTP
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Please enter a valid 6-digit OTP');
      }
      
      const phone = localStorage.getItem('rentoTempPhone');
      if (!phone) {
        throw new Error('Session expired, please try again');
      }
      
      // Check if user exists
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      const existingUser = storedUsers.find((u: any) => u.phone === phone);
      
      if (existingUser) {
        setUser(existingUser);
        localStorage.setItem('rentoUser', JSON.stringify(existingUser));
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
      }
      
      localStorage.removeItem('rentoTempPhone');
      toast.success('Successfully signed in!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, phone?: string) => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation
      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }
      
      // Check if user already exists
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      if (storedUsers.some((u: any) => u.email === email)) {
        throw new Error('User with this email already exists');
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
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLicense = async (licenseImage: string) => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!user) {
        throw new Error('You must be logged in to upload a license');
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
      toast.success('License uploaded successfully! Verification pending.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload license');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists
      const storedUsers = JSON.parse(localStorage.getItem('rentoUsers') || '[]');
      const existingUser = storedUsers.find((u: any) => u.email === email);
      
      if (!existingUser) {
        // For security, don't reveal if the email exists or not
        toast.success('If an account with that email exists, we have sent password reset instructions.');
        return;
      }
      
      // In a real app, this would send an email with password reset instructions
      toast.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      // For security, we still show success even if there's an error
      toast.success('If an account with that email exists, we have sent password reset instructions.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
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
