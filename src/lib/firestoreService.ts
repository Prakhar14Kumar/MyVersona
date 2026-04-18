// Firestore Service for VerSona - Database operations
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  arrayUnion,
  arrayRemove,
  increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, firebaseInitialized } from "./firebase";

// Helper to check if Firebase is initialized
const checkFirebaseInitialized = () => {
  if (!firebaseInitialized || !db) {
    throw new Error('Firebase is not initialized. Please add your Firebase credentials to use database features.');
  }
};

// Sanitize data before writing to Firestore (removes undefined values)
const sanitizeForFirestore = <T extends Record<string, any>>(data: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
};

// Post interface
export interface Post {
  id?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userCollege: string | null;
  content: string;
  image?: string;
  type: 'entertainment' | 'career';
  likes: number;
  comments: number;
  likedBy: string[]; // Array of user IDs who liked the post
  savedBy?: string[]; // Array of user IDs who bookmarked the post
  createdAt: Date;
  updatedAt: Date;
}

// Comment interface
export interface Comment {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: Date;
}

// College interface
export interface College {
  id?: string;
  name: string;
  hashtag: string;
  members: number;
  icon: string;
  verified: boolean;
  createdAt: Date;
}

// Upload post image
export const uploadPostImage = async (
  userId: string,
  file: File
): Promise<string> => {
  checkFirebaseInitialized();
  
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }
  
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `post-images/${userId}/${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error: any) {
    console.error('Upload post image error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
};

// Create a new post
export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'likedBy'>): Promise<string> => {
  checkFirebaseInitialized();
  
  try {
    const post = {
      ...postData,
      likes: 0,
      comments: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'posts'), post);
    return docRef.id;
  } catch (error: any) {
    console.error('Create post error:', error);
    throw new Error(error.message || 'Failed to create post');
  }
};

// Get posts by type (entertainment or career)
export const getPostsByType = async (type: 'entertainment' | 'career', limitCount: number = 20): Promise<Post[]> => {
  try {
    // Fetch all posts first, then filter by type in the client
    // This avoids the need for a composite index during development
    // For production, create the composite index and uncomment the optimized query below
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount * 2) // Fetch more to ensure we have enough after filtering
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by type on the client side
      if (data.type === type) {
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Post);
      }
    });

    // Return only the requested limit
    return posts.slice(0, limitCount);

    /* OPTIMIZED VERSION - Requires composite index
    // To use this, create the index at:
    // https://console.firebase.google.com/project/versona-app/firestore/indexes
    // Index: Collection: posts, Fields: type (Ascending), createdAt (Descending)
    
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Post);
    });

    return posts;
    */
  } catch (error: any) {
    console.error('Get posts error:', error);
    return [];
  }
};

// Get all posts for feed
export const getAllPosts = async (limitCount: number = 50): Promise<Post[]> => {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Post);
    });

    return posts;
  } catch (error: any) {
    console.error('Get all posts error:', error);
    return [];
  }
};

// Get posts by user
export const getPostsByUser = async (userId: string, limitCount: number = 20): Promise<Post[]> => {
  try {
    // Fetch all posts first, then filter by userId in the client
    // This avoids the need for a composite index during development
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(100) // Fetch enough to find user's posts
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by userId on the client side
      if (data.userId === userId) {
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Post);
      }
    });

    // Return only the requested limit
    return posts.slice(0, limitCount);

    /* OPTIMIZED VERSION - Requires composite index
    // To use this, create the index at:
    // https://console.firebase.google.com/project/versona-app/firestore/indexes
    // Index: Collection: posts, Fields: userId (Ascending), createdAt (Descending)
    
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Post);
    });

    return posts;
    */
  } catch (error: any) {
    console.error('Get user posts error:', error);
    return [];
  }
};

// Update post
export const updatePost = async (postId: string, updates: Partial<Post>): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Update post error:', error);
    throw new Error(error.message || 'Failed to update post');
  }
};

// Delete post
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (error: any) {
    console.error('Delete post error:', error);
    throw new Error(error.message || 'Failed to delete post');
  }
};

// Like a post
export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Like post error:', error);
    throw new Error(error.message || 'Failed to like post');
  }
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(-1),
      likedBy: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Unlike post error:', error);
    throw new Error(error.message || 'Failed to unlike post');
  }
};

// Add a comment to a post
export const addComment = async (commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const comment = {
      ...commentData,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'comments'), comment);

    // Increment comment count on the post
    const postRef = doc(db, 'posts', commentData.postId);
    await updateDoc(postRef, {
      comments: increment(1),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error: any) {
    console.error('Add comment error:', error);
    throw new Error(error.message || 'Failed to add comment');
  }
};

// Get comments for a post
export const getComments = async (postId: string, limitCount: number = 50): Promise<Comment[]> => {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Comment);
    });

    return comments;
  } catch (error: any) {
    console.error('Get comments error:', error);
    return [];
  }
};

// Get trending colleges
export const getTrendingColleges = async (limitCount: number = 10): Promise<College[]> => {
  try {
    const collegesRef = collection(db, 'colleges');
    const q = query(
      collegesRef,
      orderBy('members', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const colleges: College[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      colleges.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as College);
    });

    return colleges;
  } catch (error: any) {
    console.error('Get trending colleges error:', error);
    return [];
  }
};

// Add a college
export const addCollege = async (collegeData: Omit<College, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const college = {
      ...collegeData,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'colleges'), college);
    return docRef.id;
  } catch (error: any) {
    console.error('Add college error:', error);
    throw new Error(error.message || 'Failed to add college');
  }
};

// Initialize sample data (call this once to populate database)
export const initializeSampleData = async (): Promise<void> => {
  try {
    // Sample colleges
    const sampleColleges = [
      { name: "IIT Delhi", hashtag: "#iitdelhi", members: 12500, icon: "🎓", verified: true },
      { name: "VIT Vellore", hashtag: "#vitvellore", members: 10200, icon: "🏛️", verified: true },
      { name: "BITS Pilani", hashtag: "#bitspilani", members: 9800, icon: "📚", verified: true },
      { name: "NIT Trichy", hashtag: "#nittrichy", members: 8500, icon: "🎯", verified: true },
    ];

    // Add colleges
    for (const college of sampleColleges) {
      await addCollege(college);
    }

    // Sample posts
    const samplePosts = [
      {
        userId: "sample_user_1",
        userName: "Priya Sharma",
        userAvatar: "https://images.unsplash.com/photo-1647907213195-308b4413e7bc?w=200&h=200&fit=crop",
        userCollege: "#iitdelhi",
        content: "Just wrapped up our college fest! The energy was absolutely incredible 🎉 Diwali vibes at campus!",
        image: "https://images.unsplash.com/photo-1585313419035-042907be0780?w=800&fit=crop",
        type: "entertainment" as const,
      },
      {
        userId: "sample_user_2",
        userName: "Tech Recruiters @ Flipkart",
        userAvatar: "https://via.placeholder.com/100/FF6F91/FFFFFF?text=FK",
        userCollege: "Verified Recruiter 🇮🇳",
        content: "We're hiring Software Engineering Interns for Summer 2025! Looking for talented developers from top Indian colleges. Apply now and join India's leading e-commerce platform! 🚀",
        image: "https://images.unsplash.com/photo-1733826544831-ad71d05c8423?w=800&fit=crop",
        type: "career" as const,
      },
      {
        userId: "sample_user_3",
        userName: "Arjun Kumar",
        userAvatar: "https://via.placeholder.com/100/6DE7C5/FFFFFF?text=AK",
        userCollege: "#vitvellore",
        content: "Anyone up for a hackathon this weekend? Looking for teammates! Let's build something amazing together 💻",
        type: "entertainment" as const,
      },
    ];

    // Add posts
    for (const post of samplePosts) {
      await createPost(post);
    }

    console.log('Sample data initialized successfully!');
  } catch (error: any) {
    console.error('Initialize sample data error:', error);
    throw new Error(error.message || 'Failed to initialize sample data');
  }
};

// REAL-TIME LISTENERS

// Subscribe to posts by type with real-time updates
export const subscribeToPostsByType = (
  type: 'entertainment' | 'career',
  callback: (posts: Post[]) => void,
  limitCount: number = 20
): Unsubscribe => {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount * 2)
  );

  return onSnapshot(q, (snapshot) => {
    const posts: Post[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type === type) {
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Post);
      }
    });
    callback(posts.slice(0, limitCount));
  }, (error) => {
    console.error('Subscribe to posts error:', error);
  });
};

// Subscribe to all posts with real-time updates
export const subscribeToAllPosts = (
  callback: (posts: Post[]) => void,
  limitCount: number = 50
): Unsubscribe => {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const posts: Post[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Post);
    });
    callback(posts);
  }, (error) => {
    console.error('Subscribe to all posts error:', error);
  });
};

// Subscribe to user's posts with real-time updates
export const subscribeToUserPosts = (
  userId: string,
  callback: (posts: Post[]) => void,
  limitCount: number = 20
): Unsubscribe => {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const posts: Post[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId) {
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Post);
      }
    });
    callback(posts.slice(0, limitCount));
  }, (error) => {
    console.error('Subscribe to user posts error:', error);
  });
};

// Subscribe to comments for a post with real-time updates
export const subscribeToComments = (
  postId: string,
  callback: (comments: Comment[]) => void,
  limitCount: number = 50
): Unsubscribe => {
  const commentsRef = collection(db, 'comments');
  const q = query(
    commentsRef,
    where('postId', '==', postId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Comment);
    });
    callback(comments);
  }, (error) => {
    console.error('Subscribe to comments error:', error);
  });
};

// User Profile interface
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  college?: string;
  graduationYear?: number;
  role: 'student' | 'alumni' | 'recruiter' | 'mentor';
  skills?: string[];
  interests?: string[];
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  isOnline?: boolean;
  lastSeen?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return null;
  }
};

// Ensure user profile exists (create if it doesn't)
export const ensureUserProfile = async (userId: string, userData: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('Creating user profile for:', userId);
      
      const email = userData.email || '';
      const displayName = userData.displayName || email.split('@')[0] || 'User';
      const usernameLower = displayName.toLowerCase();
      
      // SAFE: Sanitize data before writing to Firestore
      const profileData = sanitizeForFirestore({
        uid: userId,
        displayName: displayName,
        username_lower: usernameLower,
        full_name_lower: usernameLower,
        email: email,
        photoURL: userData.photoURL || null,
        role: userData.role || 'student',
        followers: 0,
        following: 0,
        postsCount: 0,
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData,
      });
      
      await setDoc(userRef, profileData);
    }
  } catch (error: any) {
    console.error('Ensure user profile error:', error);
  }
};

// Create user profile
export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const profileWithLower = { ...profileData };
    if (profileWithLower.displayName) {
      profileWithLower.username_lower = profileWithLower.displayName.toLowerCase();
      profileWithLower.full_name_lower = profileWithLower.displayName.toLowerCase();
    } else if (profileWithLower.email && !profileWithLower.displayName) {
      const derivedName = profileWithLower.email.split('@')[0];
      profileWithLower.displayName = derivedName;
      profileWithLower.username_lower = derivedName.toLowerCase();
      profileWithLower.full_name_lower = derivedName.toLowerCase();
    }

    if (profileWithLower.college) {
      profileWithLower.college_lower = profileWithLower.college.toLowerCase();
    }

    if (profileWithLower.skills && Array.isArray(profileWithLower.skills)) {
      profileWithLower.skills_lower = profileWithLower.skills.map(s => s.toLowerCase());
    }

    if (profileWithLower.interests && Array.isArray(profileWithLower.interests)) {
      profileWithLower.interests_lower = profileWithLower.interests.map(i => i.toLowerCase());
    }
    
    // SAFE: Sanitize data before writing to Firestore
    const cleanData = sanitizeForFirestore({
      ...profileWithLower,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Use setDoc with merge to create or update document
    await setDoc(userRef, cleanData, { merge: true });
  } catch (error: any) {
    console.error('Create user profile error:', error);
    throw new Error(error.message || 'Failed to create user profile');
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
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
    const cleanUpdates = sanitizeForFirestore({
      ...updatesWithLower,
      updatedAt: serverTimestamp(),
    });
    
    // Use setDoc with merge to handle cases where document may not exist
    await setDoc(userRef, cleanUpdates, { merge: true });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    throw new Error(error.message || 'Failed to update user profile');
  }
};

// Update user presence (online/offline)
export const updateUserPresence = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    // Use setDoc with merge to create document if it doesn't exist
    await setDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (error: any) {
    console.error('Update user presence error:', error);
  }
};

// Bookmark a post
export const bookmarkPost = async (userId: string, postId: string): Promise<void> => {
  try {
    const bookmarkRef = doc(db, 'bookmarks', `${userId}_${postId}`);
    // Use setDoc to create the bookmark document
    await setDoc(bookmarkRef, {
      userId,
      postId,
      createdAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Bookmark post error:', error);
    throw new Error(error.message || 'Failed to bookmark post');
  }
};

// Remove bookmark
export const removeBookmark = async (userId: string, postId: string): Promise<void> => {
  try {
    const bookmarkRef = doc(db, 'bookmarks', `${userId}_${postId}`);
    await deleteDoc(bookmarkRef);
  } catch (error: any) {
    console.error('Remove bookmark error:', error);
    throw new Error(error.message || 'Failed to remove bookmark');
  }
};

// Check if post is bookmarked
export const isPostBookmarked = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const bookmarkRef = doc(db, 'bookmarks', `${userId}_${postId}`);
    const bookmarkSnap = await getDoc(bookmarkRef);
    return bookmarkSnap.exists();
  } catch (error: any) {
    console.error('Check bookmark error:', error);
    return false;
  }
};

// Get user's bookmarked posts
export const getBookmarkedPosts = async (userId: string, limitCount: number = 20): Promise<Post[]> => {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    const q = query(
      bookmarksRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const postIds: string[] = [];
    querySnapshot.forEach((doc) => {
      postIds.push(doc.data().postId);
    });

    // Fetch posts
    const posts: Post[] = [];
    for (const postId of postIds) {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const data = postSnap.data();
        posts.push({
          id: postSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Post);
      }
    }

    return posts;
  } catch (error: any) {
    console.error('Get bookmarked posts error:', error);
    return [];
  }
};

// Submit user feedback
export interface Feedback {
  id?: string;
  userId: string;
  message: string;
  rating?: number; // 1-5
  page: string; // current page (feed, explore, college, etc.)
  createdAt: Date;
}

export const submitFeedback = async (feedbackData: Omit<Feedback, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const feedback = sanitizeForFirestore({
      ...feedbackData,
      createdAt: serverTimestamp(),
    });

    const docRef = await addDoc(collection(db, 'feedback'), feedback);
    return docRef.id;
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    throw new Error(error.message || 'Failed to submit feedback');
  }
};

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  notification_id?: string;
  // Field stored as `userId` (camelCase) to match the deployed Firestore security
  // rules which check `resource.data.userId` via the `isOwner()` helper.
  userId: string;
  actor_id?: string;
  actor_username?: string;
  actor_avatar?: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'connection' | 'system';
  message: string;
  post_id?: string;
  is_read: boolean;
  createdAt: Date;
}

// Fetch paginated notifications for a user from Firestore
export const getNotificationsForUser = async (
  userId: string,
  limitCount: number = 20
): Promise<Notification[]> => {
  try {
    const notifRef = collection(db, 'notifications');
    // No orderBy — avoids requiring a composite index (userId + createdAt).
    // A missing composite index causes Firestore to surface a misleading
    // permission-denied error when rules reference resource.data.
    // We sort client-side instead.
    const q = query(
      notifRef,
      where('userId', '==', userId),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const notifications: Notification[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notifications.push({
        notification_id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Notification);
    });
    // Sort newest-first client-side
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return notifications;
  } catch (error: any) {
    // Silently handle permission-denied errors - likely due to undeployed security rules
    // The backend will be used as the primary source until rules are deployed
    if (error.code === 'permission-denied') {
      console.log('Firestore notifications unavailable (permission-denied). Deploy security rules with: firebase deploy --only firestore:rules');
      return [];
    }
    console.error('Get notifications error:', error);
    return [];
  }
};

// Subscribe to real-time notifications for a user
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
  limitCount: number = 20
): Unsubscribe => {
  const notifRef = collection(db, 'notifications');
  // No orderBy — same reason as above (avoids composite index requirement).
  const q = query(
    notifRef,
    where('userId', '==', userId),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notifications.push({
          notification_id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Notification);
      });
      // Sort newest-first client-side
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(notifications);
    },
    (error) => {
      // Silently handle permission-denied errors - likely due to undeployed security rules
      if (error.code === 'permission-denied') {
        console.log('Firestore real-time notifications unavailable (permission-denied). Deploy security rules with: firebase deploy --only firestore:rules');
        callback([]); // Return empty array so the app continues to function
      } else {
        console.error('Subscribe to notifications error:', error);
      }
    }
  );
};

// Mark a single notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { is_read: true });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
  }
};

// Mark all unread notifications for a user as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notifRef = collection(db, 'notifications');
    // No orderBy — keeps the query on a single-field auto-index
    const q = query(notifRef, where('userId', '==', userId), where('is_read', '==', false));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => updateDoc(d.ref, { is_read: true })));
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
  }
};

// Delete a notification by ID
export const deleteNotificationById = async (notificationId: string): Promise<void> => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notifRef);
  } catch (error: any) {
    console.error('Delete notification error:', error);
  }
};

// ─── Search Functions ─────────────────────────────────────────────────────────

/**
 * Advanced Search for Users by username, display name, or college
 * Utilizes prefix matching, query merging, deduplication, and custom ranking.
 * Recommend Algolia or Meilisearch for full text/fuzzy search in the future.
 */
export const searchUsers = async (searchQuery: string, limitCount: number = 20): Promise<UserProfile[]> => {
  try {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }

    const searchLower = searchQuery.toLowerCase().trim();
    const usersRef = collection(db, 'users');
    
    // Create parallel queries for username_lower, full_name_lower, and college_lower
    const usernameQuery = query(
      usersRef,
      where('username_lower', '>=', searchLower),
      where('username_lower', '<=', searchLower + '\uf8ff'),
      limit(limitCount)
    );
    
    const nameQuery = query(
      usersRef,
      where('full_name_lower', '>=', searchLower),
      where('full_name_lower', '<=', searchLower + '\uf8ff'),
      limit(limitCount)
    );

    const collegeQuery = query(
      usersRef,
      where('college_lower', '>=', searchLower),
      where('college_lower', '<=', searchLower + '\uf8ff'),
      limit(limitCount)
    );
    
    // Execute all queries concurrently for maximum performance
    const [usernameSnap, nameSnap, collegeSnap] = await Promise.all([
      getDocs(usernameQuery),
      getDocs(nameQuery),
      getDocs(collegeQuery)
    ]);
    
    const userMap = new Map<string, UserProfile>();
    
    // Helper to safely add and deduplicate
    const addDocsToMap = (snap: any) => {
      snap.forEach((doc: any) => {
        if (!userMap.has(doc.id)) {
          userMap.set(doc.id, doc.data() as UserProfile);
        }
      });
    };

    addDocsToMap(usernameSnap);
    addDocsToMap(nameSnap);
    addDocsToMap(collegeSnap);

    // Convert to array and perform custom ranking
    let users = Array.from(userMap.values());
    
    users.sort((a, b) => {
      const aUsername = a.username_lower || '';
      const bUsername = b.username_lower || '';
      const aName = a.full_name_lower || '';
      const bName = b.full_name_lower || '';
      const aCollege = a.college_lower || '';
      const bCollege = b.college_lower || '';

      // Give highest priority to EXACT matches across any indexed field
      const aExact = aUsername === searchLower || aName === searchLower || aCollege === searchLower;
      const bExact = bUsername === searchLower || bName === searchLower || bCollege === searchLower;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Give second priority to fields that start with the query (alphabetical fallback)
      return aUsername.localeCompare(bUsername);
    });

    // Enforce final limit across the combined results
    return users.slice(0, limitCount);
  } catch (error: any) {
    console.error('Search users error:', error);
    return [];
  }
};

/**
 * Search posts by content
 * Firestore fallback for when backend search is unavailable
 */
export const searchPosts = async (searchQuery: string, limitCount: number = 20): Promise<Post[]> => {
  try {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }

    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation that fetches recent posts and filters client-side
    // For production, use backend search with proper text search capabilities
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(100) // Fetch more posts to search through
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    const searchLower = searchQuery.toLowerCase().trim();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Client-side filtering by content
      if (data.content?.toLowerCase().includes(searchLower)) {
        posts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Post);
      }
    });

    // Return only the requested limit
    return posts.slice(0, limitCount);
  } catch (error: any) {
    console.error('Search posts error:', error);
    return [];
  }
};