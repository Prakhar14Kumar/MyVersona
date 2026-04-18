/**
 * VerSona - Bulk Fix Existing Users
 * 
 * This script connects to Firestore using the Firebase Admin SDK,
 * fetches all existing users, and backfills required search fields
 * (`username_lower`, `full_name_lower`, `college_lower`, `skills_lower`, `interests_lower`)
 * ensuring future search queries work properly.
 * 
 * Prerequisite: 
 * 1. Ensure you have firebase-admin installed (`npm install firebase-admin`).
 * 2. Download your Firebase service account key JSON file.
 * 3. Run: GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json" node scripts/fixUsers.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (Uses GOOGLE_APPLICATION_CREDENTIALS env var)
// Alternatively, you can pass credentials explicitly:
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function fixUsers() {
  console.log('Starting VerSona user document backfill...');

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Found ${snapshot.size} users. Processing...`);

    let updatedCount = 0;
    const batches = [db.batch()];
    let currentBatchIndex = 0;
    let opsInCurrentBatch = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;

      // Extract values cleanly
      const email = data.email || '';
      const displayName = data.displayName || email.split('@')[0] || 'User';

      // 1. username_lower and full_name_lower
      const usernameLower = displayName.toLowerCase();
      if (data.username_lower !== usernameLower) {
        updates.username_lower = usernameLower;
        needsUpdate = true;
      }
      if (data.full_name_lower !== usernameLower) {
        updates.full_name_lower = usernameLower;
        needsUpdate = true;
      }

      // 2. college_lower
      if (data.college) {
        const collegeLower = data.college.toLowerCase();
        if (data.college_lower !== collegeLower) {
          updates.college_lower = collegeLower;
          needsUpdate = true;
        }
      }

      // 3. skills_lower
      if (Array.isArray(data.skills)) {
        const skillsLower = data.skills.map(s => s.toLowerCase());
        if (JSON.stringify(data.skills_lower) !== JSON.stringify(skillsLower)) {
          updates.skills_lower = skillsLower;
          needsUpdate = true;
        }
      }

      // 4. interests_lower
      if (Array.isArray(data.interests)) {
        const interestsLower = data.interests.map(i => i.toLowerCase());
        if (JSON.stringify(data.interests_lower) !== JSON.stringify(interestsLower)) {
          updates.interests_lower = interestsLower;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        // Sanitize out any undefineds just to be absolutely safe
        Object.keys(updates).forEach(key => {
          if (updates[key] === undefined) {
            delete updates[key];
          }
        });

        batches[currentBatchIndex].update(doc.ref, updates);
        opsInCurrentBatch++;
        updatedCount++;

        // Firestore limits batches to 500 operations
        if (opsInCurrentBatch === 490) {
          batches.push(db.batch());
          currentBatchIndex++;
          opsInCurrentBatch = 0;
        }
      }
    });

    if (updatedCount === 0) {
      console.log('All user documents are already up-to-date.');
      return;
    }

    console.log(`Committing updates for ${updatedCount} users...`);
    
    for (let i = 0; i < batches.length; i++) {
      if (batches[i]._mutations && batches[i]._mutations.length > 0 || batches[i]._ops && batches[i]._ops.length > 0) {
        await batches[i].commit();
        console.log(`Committed batch ${i + 1} of ${batches.length}`);
      }
    }

    console.log('✅ Backfill complete! All users updated successfully.');

  } catch (error) {
    console.error('❌ Error updating users:', error);
  }
}

fixUsers();