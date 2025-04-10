import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  session: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert("Check your email for the magic link.");
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserData(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.from("profiles").upsert(data);
      if (error) throw error;
      setUserData({ ...userData, ...data });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkProfile = useCallback(async (userId: string) => {
    if (!userId) return null;
    
    try {
      // Check if profile exists
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        // If profile doesn't exist, create one
        if (fetchError.code === 'PGRST116') {
          try {
            const { data: userData } = await supabase.auth.getUser();
            const email = userData.user?.email || '';
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: email.split('@')[0],
                user_role: 'renter' // Default role
              })
              .select('*')
              .single();
            
            if (createError) {
              console.error('Error creating profile:', createError);
              throw createError;
            }
            
            console.log('Created new profile:', newProfile);
            return newProfile;
          } catch (createProfileError) {
            console.error('Failed to create user profile', createProfileError);
            return null;
          }
        }
        
        console.error('Error fetching user profile:', fetchError);
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('Unexpected error checking profile:', error);
      return null;
    }
  }, []);
  
  // Enhanced init function to create profile if needed
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Set up auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
              if (session?.user) {
                setUser(session.user);
                const profile = await checkProfile(session.user.id);
                
                if (profile) {
                  setUserData({
                    ...session.user,
                    ...profile
                  });
                }
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setUserData(null);
              setSession(null);
            }
            
            setSession(session);
          }
        );
        
        // Check current session
        const { data: sessionData } = await supabase.auth.getSession();
        const currentSession = sessionData.session;
        
        if (currentSession?.user) {
          setUser(currentSession.user);
          const profile = await checkProfile(currentSession.user.id);
          
          if (profile) {
            setUserData({
              ...currentSession.user,
              ...profile
            });
          }
        }
        
        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [checkProfile]);

  const value = {
    user,
    userData,
    session,
    loading,
    signIn,
    signOut,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
