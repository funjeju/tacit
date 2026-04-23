import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_ADMIN_CREDENTIAL
  ? JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)
  : null;

if (!serviceAccount) {
  console.error('FIREBASE_ADMIN_CREDENTIAL env var is required');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const SEEDS_DIR = path.join(__dirname, '../seeds/templates');

async function seedDomain(domainId: string) {
  const filePath = path.join(SEEDS_DIR, domainId, `${domainId}_templates.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[SKIP] ${filePath} not found`);
    return;
  }

  const templates = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const batch = db.batch();

  for (const template of templates) {
    const ref = db.collection('domainTemplates').doc(template.id);
    batch.set(ref, {
      ...template,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  [+] ${template.id} — ${template.name}`);
  }

  await batch.commit();
  console.log(`[OK] ${domainId}: ${templates.length} templates seeded\n`);
}

async function main() {
  const domains = ['restaurant', 'education', 'real_estate'];
  console.log('=== Tacit Template Seed ===\n');

  for (const domain of domains) {
    console.log(`Seeding domain: ${domain}`);
    await seedDomain(domain);
  }

  console.log('Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
