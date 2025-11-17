'use client';

import { User } from '@/app/types/user';
import { auth, db } from '@/lib/firebase';
import { User as FirebaseUser, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
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
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            console.log('Auth initialization completed via timeout');
            setLoading(false);
        }, 3000); // 3 seconds timeout

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    setUser(firebaseUser);
                    // Fetch user data from Firestore
                    try {
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        if (userDoc.exists()) {
                            setUserData(userDoc.data() as User);
                        } else {
                            // Create user document for new Google sign-in users
                            const newUserDoc: User = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                displayName: firebaseUser.displayName || 'User',
                                role: 'new_artist',
                            };
                            await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
                            setUserData(newUserDoc);
                        }
                    } catch (firestoreError) {
                        console.error('Firestore error (may be blocked by ad blocker):', firestoreError);
                        // Fallback: create basic user data from Firebase Auth
                        const fallbackUserData: User = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            displayName: firebaseUser.displayName || 'User',
                            role: 'new_artist',
                        };
                        setUserData(fallbackUserData);
                    }
                } else {
                    setUser(null);
                    setUserData(null);
                }
            } catch (error) {
                console.error('Auth error:', error);
            } finally {
                clearTimeout(loadingTimeout);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(loadingTimeout);
            unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const value = {
        user,
        userData,
        loading,
        signInWithGoogle,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};