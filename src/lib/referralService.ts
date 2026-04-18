// Referral Service for VerSona
import { doc, setDoc, getDoc, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// Generate a unique 6-character referral code
export const generateReferralCode = (userId: string): string => {
  // Create a unique code based on userId and timestamp
  const timestamp = Date.now().toString(36);
  const userHash = userId.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${userHash}${random}${timestamp.substring(timestamp.length - 3)}`.substring(0, 6);
};

// Create or get referral code for a user
export const ensureReferralCode = async (userId: string): Promise<string> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // If user already has a referral code, return it
      if (userData.referralCode) {
        return userData.referralCode;
      }
      
      // Generate new code
      let referralCode = generateReferralCode(userId);
      let isUnique = false;
      let attempts = 0;
      
      // Ensure code is unique (max 5 attempts)
      while (!isUnique && attempts < 5) {
        const q = query(collection(db, 'users'), where('referralCode', '==', referralCode));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          isUnique = true;
        } else {
          referralCode = generateReferralCode(userId);
          attempts++;
        }
      }
      
      // Update user with referral code
      await updateDoc(userDocRef, {
        referralCode,
        updatedAt: new Date(),
      });
      
      return referralCode;
    }
    
    throw new Error('User not found');
  } catch (error: any) {
    console.error('Error ensuring referral code:', error);
    throw new Error(error.message || 'Failed to generate referral code');
  }
};

// Find user by referral code
export const getUserByReferralCode = async (referralCode: string): Promise<string | null> => {
  try {
    const q = query(collection(db, 'users'), where('referralCode', '==', referralCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error finding user by referral code:', error);
    return null;
  }
};

// Track a referral
export const trackReferral = async (inviterId: string, newUserId: string, referralCode: string): Promise<void> => {
  try {
    const referralId = `${inviterId}_${newUserId}`;
    const referralDocRef = doc(db, 'referrals', referralId);
    
    // Check if referral already exists
    const existingReferral = await getDoc(referralDocRef);
    if (existingReferral.exists()) {
      console.log('Referral already tracked');
      return;
    }
    
    // Create referral record
    await setDoc(referralDocRef, {
      inviterId,
      newUserId,
      referralCode,
      createdAt: new Date(),
    });
    
    // Update inviter's referral stats
    const inviterDocRef = doc(db, 'users', inviterId);
    const inviterDoc = await getDoc(inviterDocRef);
    
    if (inviterDoc.exists()) {
      const inviterData = inviterDoc.data();
      const currentReferralCount = inviterData.referralCount || 0;
      
      await updateDoc(inviterDocRef, {
        referralCount: currentReferralCount + 1,
        updatedAt: new Date(),
      });
    }
    
    console.log('Referral tracked successfully');
  } catch (error: any) {
    console.error('Error tracking referral:', error);
    // Silent fail - don't block signup if referral tracking fails
  }
};

// Get referral stats for a user
export const getReferralStats = async (userId: string): Promise<{
  referralCode: string;
  referralCount: number;
  referredUsers: Array<{ userId: string; createdAt: Date }>;
}> => {
  try {
    // Get user's referral code
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const referralCode = userData.referralCode || '';
    const referralCount = userData.referralCount || 0;
    
    // Get all referrals
    const q = query(collection(db, 'referrals'), where('inviterId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const referredUsers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: data.newUserId,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
    
    return {
      referralCode,
      referralCount,
      referredUsers,
    };
  } catch (error: any) {
    console.error('Error getting referral stats:', error);
    return {
      referralCode: '',
      referralCount: 0,
      referredUsers: [],
    };
  }
};

// Generate shareable referral text
export const generateShareText = (referralCode: string): string => {
  return `Join me on VerSona 🚀 - India's first youth-focused social & professional network!\n\nUse my code: ${referralCode}\n\nConnect with college friends, build your career, and grow together! 🇮🇳`;
};

// Share via Web Share API (if available)
export const shareReferralCode = async (referralCode: string): Promise<boolean> => {
  const shareText = generateShareText(referralCode);
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join VerSona',
        text: shareText,
      });
      return true;
    } catch (error: any) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', error);
      return false;
    }
  }
  
  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareText);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};