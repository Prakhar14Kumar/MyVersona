// Firebase Authentication Service for MyVerSona
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, firebaseInitialized } from "./firebase";
import { uploadImage } from "./cloudinary";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username_lower?: string;
  full_name_lower?: string;
  
  // Onboarding tracking
  profileCompleted: boolean;
  onboardingStep: number;

  // Step 1: Education
  college?: string;
  college_lower?: string;
  collegeHashtag?: string;
  degree?: string;
  branch?: string;
  graduationYear?: string;
  city?: string;

  // Step 2 & 3: Interests & Skills
  interests?: string[];
  interests_lower?: string[];
  skills?: string[];
  skills_lower?: string[];
  careerGoals?: string[];
  lookingFor?: string[];

  // Step 4: Profile Customization
  bio?: string;
  photoURL?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;

  // Legacy fields (kept for compatibility)
  role?: 'student' | 'recruiter' | 'alumni';
  year?: string;
  major?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

// Convert Firebase user to our User type
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    photoURL: firebaseUser.photoURL || undefined,
  };
};

// Sanitize data before writing to Firestore (removes undefined values)
const sanitizeForFirestore = <T extends Record<string, any>>(data: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
};

// Helper to check if Firebase is initialized
const checkFirebaseInitialized = () => {
  if (!firebaseInitialized || !auth || !db) {
    throw new Error('Firebase is not initialized. Please add your Firebase credentials to use authentication features.');
  }
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  checkFirebaseInitialized();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
    const firebaseUser = userCredential.user;

    // Update display name if provided
    if (displayName) {
      await updateProfile(firebaseUser, { displayName });
    }

    // Create user profile in Firestore - SAFE: no undefined values
    const finalEmail = firebaseUser.email || email;
    const finalDisplayName = displayName || finalEmail.split('@')[0] || 'User';

    const userProfile: Partial<UserProfile> = sanitizeForFirestore({
      uid: firebaseUser.uid,
      email: finalEmail,
      displayName: finalDisplayName,
      // Lowercase fields required for Firestore case-insensitive search queries
      username_lower: finalDisplayName.toLowerCase(),
      full_name_lower: finalDisplayName.toLowerCase(),
      photoURL: firebaseUser.photoURL || undefined,
      profileCompleted: false,
      onboardingStep: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setDoc(doc(db!, 'users', firebaseUser.uid), userProfile);

    return convertFirebaseUser(firebaseUser);
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  checkFirebaseInitialized();

  try {
    const userCredential = await signInWithEmailAndPassword(auth!, email, password);
    return convertFirebaseUser(userCredential.user);
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('No user found with this email');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password');
    } else {
      throw new Error(error.message || 'Failed to sign in');
    }
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  checkFirebaseInitialized();

  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth!, provider);
    const firebaseUser = userCredential.user;

    // Check if user profile exists
    const userDocRef = doc(db!, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    // Create profile if it doesn't exist - SAFE: no undefined values
    if (!userDoc.exists()) {
      const finalEmail = firebaseUser.email || '';
      const finalDisplayName = firebaseUser.displayName || finalEmail.split('@')[0] || 'User';

      const userProfile: Partial<UserProfile> = sanitizeForFirestore({
        uid: firebaseUser.uid,
        email: finalEmail,
        displayName: finalDisplayName,
        // Lowercase fields required for Firestore case-insensitive search queries
        username_lower: finalDisplayName.toLowerCase(),
        full_name_lower: finalDisplayName.toLowerCase(),
        photoURL: firebaseUser.photoURL || undefined,
        profileCompleted: false,
        onboardingStep: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await setDoc(userDocRef, userProfile);
    }

    return convertFirebaseUser(firebaseUser);
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  checkFirebaseInitialized();

  try {
    await firebaseSignOut(auth!);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  checkFirebaseInitialized();

  try {
    const userDocRef = doc(db!, 'users', uid);

    // Automatically manage lowercase fields for search compatibility
    const updatesWithLower = { ...updates };
    if (updatesWithLower.displayName) {
      updatesWithLower.username_lower = updatesWithLower.displayName.toLowerCase();
      updatesWithLower.full_name_lower = updatesWithLower.displayName.toLowerCase();
    }

    if (updatesWithLower.college) {
      updatesWithLower.college_lower = updatesWithLower.college.toLowerCase();
    }

    if (updatesWithLower.skills && Array.isArray(updatesWithLower.skills)) {
      updatesWithLower.skills_lower = updatesWithLower.skills.map(s => s.toLowerCase());
    }

    if (updatesWithLower.interests && Array.isArray(updatesWithLower.interests)) {
      updatesWithLower.interests_lower = updatesWithLower.interests.map(i => i.toLowerCase());
    }

    // SAFE: Sanitize updates before writing to Firestore
    const sanitizedUpdates = sanitizeForFirestore({
      ...updatesWithLower,
      updatedAt: new Date(),
    });

    // Use setDoc with {merge: true} instead of updateDoc.
    // If the database document is missing for any reason, this prevents the NOT_FOUND crash
    // and correctly injects the profilePic payload while keeping existing data unharmed.
    await setDoc(userDocRef, sanitizedUpdates, { merge: true });

    // Update Firebase Auth profile if displayName or photoURL changed
    const currentUser = auth!.currentUser;
    if (currentUser && (updates.displayName || updates.photoURL)) {
      const profileUpdates: { displayName?: string; photoURL?: string | null } = {};
      if (updates.displayName) profileUpdates.displayName = updates.displayName;
      if (updates.photoURL) profileUpdates.photoURL = updates.photoURL;
      await updateProfile(currentUser, profileUpdates);
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

// Get user profile by UID
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  checkFirebaseInitialized();

  try {
    const userDocRef = doc(db!, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }

    return null;
  } catch (error: any) {
    console.error('Get profile error:', error);
    return null;
  }
};

// Get current authenticated user
export const getCurrentUser = (): User | null => {
  if (!firebaseInitialized || !auth) {
    return null;
  }

  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  return convertFirebaseUser(firebaseUser);
};

// Auth state change listener
type AuthStateCallback = (user: User | null) => void;

export const onAuthChange = (callback: AuthStateCallback): (() => void) => {
  if (!firebaseInitialized || !auth) {
    // Return no-op function silently - warning banner handles communication
    return () => { };
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(convertFirebaseUser(firebaseUser));
    } else {
      callback(null);
    }
  });
};

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  checkFirebaseInitialized();

  try {
    await sendPasswordResetEmail(auth!, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('No user found with this email');
    } else {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }
};

// Upload profile picture
export const uploadProfilePicture = async (
  uid: string,
  file: File
): Promise<string> => {
  checkFirebaseInitialized();

  console.log('[Upload Trace] 1. Initiating Cloudinary upload protocol for uid:', uid);
  
  try {
    console.log('[Upload Trace] 2. Transmitting bytes to Cloudinary...');
    const uploadResult = await uploadImage(file);
    const downloadURL = uploadResult.secure_url;
    console.log('[Upload Trace] 3. Valid URL retrieved:', downloadURL);

    // Update user profile with new photo URL
    console.log('[Upload Trace] 4. Patching firestore user profile document...');
    await updateUserProfile(uid, { photoURL: downloadURL });
    console.log('[Upload Trace] 5. Profile perfectly synchronized.');

    return downloadURL;
  } catch (error: any) {
    console.error('[Upload Trace] ❌ FATAL ERROR:', error);
    throw new Error(error.message || 'Failed to upload profile picture to Cloudinary.');
  }
};