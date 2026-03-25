'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: any; // O FirebaseStorage si tienes el tipo
}

interface UserProfile {
  id: string;
  empresaId: string;
  rol: 'Superadmin' | 'Admin' | 'Lider_PESV' | 'RRHH' | 'Gestor_Flota' | 'Conductor' | 'Auditor';
  nombreCompleto: string;
  email: string;
  estado: string;
  nivel?: 'Básico' | 'Estándar' | 'Avanzado';
  nivelPesv?: 'Básico' | 'Estándar' | 'Avanzado';
  nivelPESV?: 'Básico' | 'Estándar' | 'Avanzado';
}

interface UserAuthState {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: any | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    profile: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) return;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          // Si hay usuario, escuchamos su perfil en tiempo real
          const profileRef = doc(firestore, 'usuarios', firebaseUser.uid);
          const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserAuthState({
                user: firebaseUser,
                profile: { ...docSnap.data(), id: docSnap.id } as UserProfile,
                isUserLoading: false,
                userError: null,
              });
            } else {
              // El usuario existe en Auth pero no tiene perfil (posible nuevo registro o Superadmin sin perfil)
              setUserAuthState({
                user: firebaseUser,
                profile: firebaseUser.uid === 'I9Al3kS46rcTAbylTHgufUFke8b2' ? {
                  id: firebaseUser.uid,
                  empresaId: 'system',
                  rol: 'Superadmin',
                  nombreCompleto: 'Super Admin',
                  email: firebaseUser.email || '',
                  estado: 'Activo'
                } : null,
                isUserLoading: false,
                userError: null,
              });
            }
          });
          return () => unsubscribeProfile();
        } else {
          setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        setUserAuthState(prev => ({ ...prev, isUserLoading: false, userError: error }));
      }
    );

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      ...userAuthState,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return context;
};

export const useAuth = () => useFirebase().auth!;
export const useFirestore = () => useFirebase().firestore!;
export const useStorage = () => useFirebase().storage!;
export const useUser = () => {
  const { user, profile, isUserLoading, userError } = useFirebase();
  return { user, profile, isUserLoading, userError };
};

type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}
