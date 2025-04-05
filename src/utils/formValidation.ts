
/**
 * Utility functions for form validation
 */

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return "Please enter your email";
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Please enter your password";
  }
  
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) {
    return "Please enter your phone number";
  }
  
  // Basic validation for 10-digit number
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    return "Please enter a valid 10-digit phone number";
  }
  
  return null;
};
