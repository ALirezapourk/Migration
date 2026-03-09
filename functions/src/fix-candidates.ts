// functions/src/fix-candidates.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export const fixCandidates = onRequest(
  { cors: true, timeoutSeconds: 540 },
  async (req, res) => {
    try {
      const snapshot = await db.collection("candidates").get();
      const batchSize = 500;
      let totalFixed = 0;
      
      const docs = snapshot.docs;
      const batches = Math.ceil(docs.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = db.batch();
        const start = i * batchSize;
        const end = Math.min(start + batchSize, docs.length);
        
        for (let j = start; j < end; j++) {
          const doc = docs[j];
          const data = doc.data();
          if (data.is_draft === undefined) {
            batch.update(doc.ref, { is_draft: false });
            totalFixed++;
          }
        }
        
        await batch.commit();
      }
      
      res.json({ success: true, fixed: totalFixed, total: docs.length });
    } catch (e: any) {
      console.error("fix-candidates error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);
