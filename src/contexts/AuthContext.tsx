import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, upsertUserProfile, createApplicant, getApplicantByUserId } from '../services/ppdbService';
import { Applicant, UserProfile, UserRole } from '../types/ppdb';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  applicantProfile: Applicant | null;
  role: UserRole | null;
  loading: boolean;
  isDemoMode: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerApplicant: (data: {
    email: string;
    pass: string;
    fullName: string;
    gender: 'L' | 'P';
    nisn: string;
    previousSchool: string;
    parentName: string;
    parentPhone: string;
    program: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  activateDemoRole: (role: UserRole) => void;
  refreshApplicantProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [applicantProfile, setApplicantProfile] = useState<Applicant | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Sync profile when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isDemoMode) {
        setLoading(false);
        return;
      }

      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid);

          // Bootstrap admin if email matches admin or first system admin
          if (!profile) {
            const isDefaultAdmin = firebaseUser.email === 'fikririan16@gmail.com' || firebaseUser.email?.includes('admin');
            const assignedRole: UserRole = isDefaultAdmin ? 'admin' : 'applicant';
            
            await upsertUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Pengguna PPDB',
              role: assignedRole,
              photoURL: firebaseUser.photoURL || '',
            });

            profile = await getUserProfile(firebaseUser.uid);
          }

          if (profile) {
            setUserProfile(profile);
            setRole(profile.role);

            if (profile.role === 'applicant') {
              const appData = await getApplicantByUserId(firebaseUser.uid);
              setApplicantProfile(appData);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
        setApplicantProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const refreshApplicantProfile = async () => {
    if (currentUser) {
      const appData = await getApplicantByUserId(currentUser.uid);
      setApplicantProfile(appData);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsDemoMode(false);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      let message = 'Terjadi kesalahan saat masuk.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Format alamat email tidak valid.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.';
      }
      return { success: false, error: message };
    }
  };

  const registerApplicant = async (data: {
    email: string;
    pass: string;
    fullName: string;
    gender: 'L' | 'P';
    nisn: string;
    previousSchool: string;
    parentName: string;
    parentPhone: string;
    program: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsDemoMode(false);
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      const uid = userCredential.user.uid;

      // 1. Save User Profile with role 'applicant' (Never allow user to set admin or examiner)
      await upsertUserProfile({
        uid,
        email: data.email,
        displayName: data.fullName,
        role: 'applicant',
      });

      // 2. Generate random unique registration number
      const randomNum = Math.floor(100 + Math.random() * 900);
      const regNumber = `PPDB-2026-${randomNum}`;

      // 3. Create Applicant record in Firestore
      const newApplicant = await createApplicant({
        userId: uid,
        registrationNumber: regNumber,
        fullName: data.fullName,
        gender: data.gender,
        nisn: data.nisn,
        birthPlace: 'Kota',
        birthDate: '2012-01-01',
        previousSchool: data.previousSchool,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        address: 'Alamat Calon Santri',
        wave: 'Gelombang 1',
        program: data.program,
        status: 'registered',
      });

      setUserProfile({
        uid,
        email: data.email,
        displayName: data.fullName,
        role: 'applicant',
      });
      setRole('applicant');
      setApplicantProfile(newApplicant);
      setLoading(false);

      return { success: true };
    } catch (err: any) {
      setLoading(false);
      let message = 'Gagal mendaftarkan akun.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'Alamat email ini sudah terdaftar. Silakan login atau gunakan menu Lupa Password.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Kata sandi minimal 6 karakter.';
      }
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsDemoMode(false);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Gagal masuk dengan akun Google' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      let message = 'Gagal mengirim email reset password.';
      if (err.code === 'auth/user-not-found') {
        message = 'Alamat email tidak ditemukan dalam sistem PPDB.';
      }
      return { success: false, error: message };
    }
  };

  const logout = async (): Promise<void> => {
    setIsDemoMode(false);
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setApplicantProfile(null);
    setRole(null);
  };

  // Demo role switch helper for testing all 3 roles without creating real Google credentials
  const activateDemoRole = (targetRole: UserRole) => {
    setIsDemoMode(true);
    if (targetRole === 'admin') {
      setUserProfile({
        uid: 'demo-admin-uid',
        email: 'panitia@alikhlas.sch.id',
        displayName: 'Ust. H. Abdurrahman, M.Pd (Panitia PPDB)',
        role: 'admin',
      });
      setRole('admin');
      setApplicantProfile(null);
    } else if (targetRole === 'examiner') {
      setUserProfile({
        uid: 'demo-examiner-uid',
        email: 'penguji@alikhlas.sch.id',
        displayName: 'Ustadz Ahmad Al-Hafidz (Penguji Tahfidz)',
        role: 'examiner',
      });
      setRole('examiner');
      setApplicantProfile(null);
    } else {
      setUserProfile({
        uid: 'demo-santri-01',
        email: 'santri@alikhlas.sch.id',
        displayName: 'Ahmad Faiz Ramadhan (Calon Santri)',
        role: 'applicant',
      });
      setRole('applicant');
      setApplicantProfile({
        id: 'app-demo-01',
        userId: 'demo-santri-01',
        registrationNumber: 'PPDB-2026-001',
        fullName: 'Ahmad Faiz Ramadhan',
        nisn: '0089234123',
        gender: 'L',
        birthPlace: 'Bandung',
        birthDate: '2012-04-15',
        previousSchool: 'SDIT Nurul Fikri',
        parentName: 'H. Ridwan Ramadhan',
        parentPhone: '081234567890',
        address: 'Jl. Pesantren No. 12, Buahbatu, Bandung',
        wave: 'Gelombang 1',
        program: 'Kulliyyatul Mu\'allimin (KMI)',
        status: 'verified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        applicantProfile,
        role,
        loading,
        isDemoMode,
        loginWithEmail,
        registerApplicant,
        loginWithGoogle,
        resetPassword,
        logout,
        activateDemoRole,
        refreshApplicantProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
