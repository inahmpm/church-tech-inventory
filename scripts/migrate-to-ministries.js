// One-off migration: introduces the "ministries" collection and backfills
// ministryId onto every existing equipment/categories/historyLogs/borrowRequests
// document under a single "Technology Ministry" record. Also provisions the
// first super-admin user profile for the existing admin account.
//
// This is run locally by a developer with a Firebase service account key —
// it is NOT deployed anywhere, so it does not require the Blaze billing plan.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
//   ADMIN_EMAIL=existing-admin@example.com \
//   node scripts/migrate-to-ministries.js
//
// Prerequisites:
//   1. Firestore security rules must temporarily allow this write (or run
//      this against the Firestore emulator / with rules disabled), since the
//      Admin SDK bypasses rules by default anyway — no change needed there.
//   2. Download a service account key from Firebase Console > Project
//      Settings > Service Accounts > Generate new private key, and point
//      GOOGLE_APPLICATION_CREDENTIALS at it.
//   3. Set ADMIN_EMAIL to the Firebase Auth email of the person who should
//      become the first super-admin.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) {
  console.error('Set ADMIN_EMAIL to the email of the existing admin to promote to super-admin.');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const auth = getAuth();

const TECHNOLOGY_MINISTRY_ID = 'technology';
const BATCH_LIMIT = 500;

async function upsertTechnologyMinistry() {
  const ref = db.collection('ministries').doc(TECHNOLOGY_MINISTRY_ID);
  const snap = await ref.get();
  if (snap.exists) {
    console.log('Ministry doc already exists, leaving it as-is:', snap.data());
    return;
  }
  const now = Date.now();
  await ref.set({
    name: 'Technology Ministry',
    slug: 'technology',
    inventoryCodePrefix: 'TECH',
    notificationEmail: 'cogtech.dasma@gmail.com',
    createdAt: now,
    updatedAt: now,
  });
  console.log('Created ministries/technology');
}

async function upsertSuperAdminProfile() {
  const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
  const ref = db.collection('users').doc(userRecord.uid);
  const snap = await ref.get();
  if (snap.exists) {
    console.log('User profile already exists, leaving it as-is:', snap.data());
    return;
  }
  await ref.set({
    email: ADMIN_EMAIL,
    ministryId: TECHNOLOGY_MINISTRY_ID,
    role: 'super-admin',
    active: true,
    mustChangePassword: false,
    createdAt: Date.now(),
  });
  console.log(`Created users/${userRecord.uid} as super-admin for ${ADMIN_EMAIL}`);
}

async function backfillCollection(collectionName) {
  // Firestore can't query "field missing" directly, so scan the whole
  // collection and filter client-side. Fine for a one-off, small-collection migration.
  const snap = await db.collection(collectionName).get();
  const docsNeedingBackfill = snap.docs.filter((d) => !('ministryId' in d.data()));

  if (docsNeedingBackfill.length === 0) {
    console.log(`${collectionName}: nothing to backfill.`);
    return;
  }

  for (let i = 0; i < docsNeedingBackfill.length; i += BATCH_LIMIT) {
    const chunk = docsNeedingBackfill.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    for (const doc of chunk) {
      batch.update(doc.ref, { ministryId: TECHNOLOGY_MINISTRY_ID });
    }
    await batch.commit();
  }
  console.log(`${collectionName}: backfilled ${docsNeedingBackfill.length} document(s).`);
}

async function main() {
  await upsertTechnologyMinistry();
  await upsertSuperAdminProfile();
  for (const collectionName of ['equipment', 'categories', 'historyLogs', 'borrowRequests']) {
    await backfillCollection(collectionName);
  }
  console.log('Migration complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
