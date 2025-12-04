'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';

export type UserRole = 'donor' | 'volunteer' | 'admin';

export type UserProfile = {
  role?: UserRole;
  organization?: string;
  onboardingComplete?: boolean;
};

type AuthContextShape = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateRole: (role: UserRole, organization?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

const provider = new GoogleAuthProvider();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const ref = doc(db, 'profiles', currentUser.uid);
        const snapshot = await getDoc(ref);
        setProfile(snapshot.data() as UserProfile | null);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const signIn = async () => {
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const updateRole = async (role: UserRole, organization?: string) => {
    if (!user) return;
    const ref = doc(db, 'profiles', user.uid);
    await setDoc(
      ref,
      {
        role,
        organization: organization?.trim() || null,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    const snapshot = await getDoc(ref);
    setProfile(snapshot.data() as UserProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
