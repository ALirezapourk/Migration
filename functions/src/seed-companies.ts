// functions/src/seed-companies.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const companyPrefixes = ["Tech", "Cloud", "Digital", "Smart", "Cyber", "Data", "AI", "Quantum", "Next", "Prime", "Alpha", "Beta", "Omega", "Nova", "Apex", "Peak", "Elite", "Core", "Meta", "Hyper"];
const companySuffixes = ["Solutions", "Systems", "Labs", "Works", "Hub", "Dynamics", "Logic", "Soft", "Wave", "Flow", "Stream", "Bridge", "Scale", "Forge", "Craft", "Stack", "Base", "Mind", "Sense", "Pulse"];
const companyTypes = ["Inc", "Corp", "LLC", "Technologies", "Group", "Ventures", "Partners", "Co"];

const industries = ["Technology", "Finance", "Healthcare", "E-commerce", "Education", "Entertainment", "Cybersecurity", "Logistics", "Real Estate", "Manufacturing", "Consulting", "Media", "Telecommunications", "Energy", "Automotive", "Aerospace", "Biotechnology", "Gaming", "Insurance", "Legal Tech"];

const skills = ["JavaScript", "TypeScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin", "React", "Vue.js", "Angular", "Next.js", "Node.js", "Express", "Django", "Flask", "Spring Boot", "FastAPI", "GraphQL", "REST APIs", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "Git", "Linux", "TensorFlow", "PyTorch", "Scikit-learn", "Spark", "Kafka", "Figma", "Tailwind CSS", "Jest", "Cypress"];

const locations = ["San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Los Angeles, CA", "Boston, MA", "Chicago, IL", "Denver, CO", "Portland, OR", "Miami, FL", "Atlanta, GA", "Phoenix, AZ", "San Diego, CA", "Dallas, TX", "Remote - USA", "London, UK", "Berlin, Germany", "Toronto, Canada", "Sydney, Australia", "Singapore", "Amsterdam, Netherlands", "Dublin, Ireland", "Paris, France", "Tel Aviv, Israel", "Bangalore, India", "Remote - Worldwide"];

const sizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];

const domains = ["FinTech", "HealthTech", "E-commerce", "EdTech", "SaaS", "AI/ML", "Cybersecurity", "Gaming", "Social Media", "AdTech", "IoT", "Blockchain", "Cloud Computing", "DevTools", "HR Tech", "PropTech", "LegalTech", "InsurTech", "AgriTech", "CleanTech", "Logistics", "Travel Tech", "FoodTech", "Retail Tech", "Media & Entertainment"];

const budgetRanges = ["$50k-$80k", "$80k-$120k", "$100k-$150k", "$120k-$180k", "$150k-$200k", "$180k-$250k", "$200k-$300k", "$250k+", "Competitive", "Market Rate"];

const workPreferences = ["Remote", "Onsite", "Hybrid"] as const;
const workTypes = ["Full-time", "Contract", "Freelance"] as const;

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSkills(): string[] {
  const count = 4 + Math.floor(Math.random() * 6);
  const shuffled = [...skills].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateCompany() {
  const name = `${randomFrom(companyPrefixes)}${randomFrom(companySuffixes)} ${randomFrom(companyTypes)}`;
  const industry = randomFrom(industries);
  const requiredSkills = randomSkills();
  const minExperience = Math.floor(Math.random() * 8);
  const location = randomFrom(locations);
  const size = randomFrom(sizes);
  const workPreference = randomFrom(workPreferences);
  const workType = randomFrom(workTypes);
  const domain = randomFrom(domains);
  const budgetRange = randomFrom(budgetRanges);
  const openPositions = 1 + Math.floor(Math.random() * 10);

  const descriptions = [
    `${name} is a leading ${industry} company specializing in ${domain} solutions. We're looking for talented engineers to join our growing team.`,
    `A fast-growing ${industry} startup focused on ${domain}. ${name} offers competitive salaries and a collaborative work environment.`,
    `${name} is revolutionizing the ${industry} industry with innovative ${domain} products. Join us to work on cutting-edge technology.`,
    `We are ${name}, a ${size} employee ${industry} company building the future of ${domain}. Remote-friendly culture with excellent benefits.`,
  ];

  const notes = [
    "Looking for self-starters who can work independently.",
    "Team collaboration is key. Must have excellent communication skills.",
    "Fast-paced environment. You'll ship code on day one.",
    "We value work-life balance and offer flexible hours.",
    "Equity compensation available for senior roles.",
    "Growth opportunities in a rapidly scaling company.",
    "",
  ];

  return {
    name,
    industry,
    description: randomFrom(descriptions),
    location,
    size,
    requiredSkills,
    minExperience,
    workPreference,
    workType,
    domain,
    budgetRange,
    openPositions,
    notes: randomFrom(notes),
    createdAt: new Date(),
    userId: "seed-script",
    is_draft: false,
  };
}

export const seedCompanies = onRequest(
  { cors: true, timeoutSeconds: 540 },
  async (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 100;
      const batchSize = 500;
      let totalAdded = 0;

      const batches = Math.ceil(count / batchSize);

      for (let batchNum = 0; batchNum < batches; batchNum++) {
        const batch = db.batch();
        const itemsInBatch = Math.min(batchSize, count - totalAdded);

        for (let i = 0; i < itemsInBatch; i++) {
          const company = generateCompany();
          const docRef = db.collection("companies").doc();
          batch.set(docRef, company);
        }

        await batch.commit();
        totalAdded += itemsInBatch;
      }

      res.json({ success: true, added: totalAdded });
    } catch (e: any) {
      console.error("seed-companies error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);
