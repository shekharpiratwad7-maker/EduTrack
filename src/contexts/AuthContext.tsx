import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { Database } from '../types/supabase'
import { toast } from 'sonner'

type Profile = {
  id: string
  name: string
  role: 'admin' | 'teacher' | 'student' | 'parent'
  email?: string
  phone?: string
  dob?: string
  city?: string
  class_grade?: string
  class_section?: string
  roll_number?: string
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, profileData: Partial<Profile> & { role: Profile['role'] }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const buildProfileFromMetadata = (
  user: User,
  fallbackRole: Profile['role'] = 'teacher'
): Profile => {
  const meta = (user.user_metadata || {}) as Record<string, any>
  const nameFromMeta = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim()
  return {
    id: user.id,
    name: (meta.name as string) || nameFromMeta || user.email?.split('@')[0] || 'User',
    role: (meta.role as Profile['role']) || fallbackRole,
    email: user.email,
    phone: meta.phone as string | undefined,
    dob: meta.dob as string | undefined,
    city: meta.city as string | undefined,
    class_grade: meta.class_grade as string | undefined,
    class_section: meta.class_section as string | undefined,
    roll_number: meta.roll_number as string | undefined,
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    };
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user ?? null);
        setLoading(false);
        if (session.user) {
          fetchProfile(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

const fetchProfile = async (userId: string) => {
    try {
      // Use minimal stable columns to avoid 400 errors on partially migrated schemas.
      let { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        const fallback = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('id', userId)
          .maybeSingle();
        data = fallback.data as any;
        error = fallback.error;
      }

      if (error) throw error;

      if (!data) {
        // Auto-heal missing profile rows for users created via email confirmation flow.
        const { data: userData } = await supabase.auth.getUser()
        const activeUser = userData.user
        if (activeUser && activeUser.id === userId) {
          const hydratedProfile = buildProfileFromMetadata(activeUser)
          const { data: upserted, error: upsertError } = await supabase
            .from('profiles')
            .upsert(
              {
                ...hydratedProfile,
                email: activeUser.email,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            )
            .select('id, name, role')
            .single()

          let finalUpserted: any = upserted
          let finalUpsertError: any = upsertError
          if (upsertError?.message?.toLowerCase().includes("column") && upsertError?.message?.toLowerCase().includes("email")) {
            const retry = await supabase
              .from('profiles')
              .upsert(
                {
                  id: hydratedProfile.id,
                  name: hydratedProfile.name,
                  role: hydratedProfile.role,
                  phone: hydratedProfile.phone,
                  dob: hydratedProfile.dob,
                  city: hydratedProfile.city,
                  class_grade: hydratedProfile.class_grade,
                  class_section: hydratedProfile.class_section,
                  roll_number: hydratedProfile.roll_number,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              )
              .select('id, name, role')
              .single()
            finalUpserted = retry.data
            finalUpsertError = retry.error
          }

          if (finalUpsertError) {
            console.warn('Profile auto-create failed:', finalUpsertError.message)
            // If RLS blocks insert, keep session alive with metadata-backed profile.
            const rlsBlocked = String(finalUpsertError.message || '').toLowerCase().includes('row-level security policy')
            if (rlsBlocked) {
              setProfile(hydratedProfile)
              return
            }
            setProfile(null)
            return
          }

          setProfile(finalUpserted)
          return
        }

        setProfile(null)
        return
      }

      setProfile(data);
    } catch (error: any) {
console.error('Profile load failed:', error);
      const rlsBlocked = String(error?.message || '').toLowerCase().includes('row-level security policy')
      if (!rlsBlocked) {
        toast.error('Profile not found. Please complete signup or contact admin.');
      }
      setProfile(null);
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('Attempting signIn:', { email: email.replace(/@.*/, '@***') }); // Log sanitized
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase Auth Error:', error.message, error.status, error.code);
      throw error;
    }
    console.log('SignIn success:', data.user?.email);
  }

const signUp = async (email: string, password: string, profileData: Partial<Profile> & {role: Profile['role']}) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          role: profileData.role,
          name: profileData.name,
          phone: profileData.phone,
          dob: profileData.dob,
          city: profileData.city,
          class_grade: profileData.class_grade,
          class_section: profileData.class_section,
          roll_number: profileData.roll_number,
        }
      }
    })
    if (error) throw error
    
    if (data.user && data.session) {
      const profileInsert = {
        id: data.user.id,
        name: profileData.name || email.split('@')[0],
        role: profileData.role,
        email,
        phone: profileData.phone,
        dob: profileData.dob,
        city: profileData.city,
        class_grade: profileData.class_grade,
        class_section: profileData.class_section,
        roll_number: profileData.roll_number,
        updated_at: new Date().toISOString()
      };
      
      let { error: profileError } = await supabase
        .from('profiles')
        .insert(profileInsert);

      if (profileError?.message?.toLowerCase().includes("column") && profileError?.message?.toLowerCase().includes("email")) {
        const retry = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: profileData.name || email.split('@')[0],
            role: profileData.role,
            phone: profileData.phone,
            dob: profileData.dob,
            city: profileData.city,
            class_grade: profileData.class_grade,
            class_section: profileData.class_section,
            roll_number: profileData.roll_number,
            updated_at: new Date().toISOString(),
          });
        profileError = retry.error;
      }
      
      if (profileError) {
        console.error('Profile creation failed:', profileError)
        toast.error('Account created but profile setup failed')
        throw profileError;
      }
      
      toast.success(`Account created as ${profileData.role}! Check your email.`);
      await fetchProfile(data.user.id);
    } else if (data.user) {
      toast.success('Signup successful. Verify your email, then sign in.')
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Signout error:', e);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

