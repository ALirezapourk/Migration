// functions/src/seed-candidates.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen", "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Peyton", "Cameron", "Sofia", "Emma", "Olivia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn", "Liam", "Noah", "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Alexander", "Ethan", "Jacob"];

const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];

const titles = ["Software Engineer", "Senior Software Engineer", "Full Stack Developer", "Frontend Developer", "Backend Developer", "DevOps Engineer", "Data Scientist", "Machine Learning Engineer", "Product Manager", "UX Designer", "UI Designer", "QA Engineer", "Security Engineer", "Cloud Architect", "Solutions Architect", "Technical Lead", "Engineering Manager", "Data Engineer", "Mobile Developer", "iOS Developer", "Android Developer", "React Developer", "Node.js Developer", "Python Developer", "Java Developer", "Go Developer", "Rust Developer", "Systems Engineer", "Site Reliability Engineer", "Platform Engineer"];

const skills = ["JavaScript", "TypeScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin", "React", "Vue.js", "Angular", "Next.js", "Node.js", "Express", "Django", "Flask", "Spring Boot", "FastAPI", "GraphQL", "REST APIs", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "Git", "Linux", "Nginx", "RabbitMQ", "Kafka", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Spark", "Hadoop", "Airflow", "dbt", "Figma", "Sketch", "Adobe XD", "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI", "Jest", "Cypress", "Selenium", "Playwright", "Agile", "Scrum", "Jira", "Confluence"];

const locations = ["San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Los Angeles, CA", "Boston, MA", "Chicago, IL", "Denver, CO", "Portland, OR", "Miami, FL", "Atlanta, GA", "Phoenix, AZ", "San Diego, CA", "Dallas, TX", "Minneapolis, MN", "Remote - USA", "Remote - Europe", "London, UK", "Berlin, Germany", "Toronto, Canada", "Vancouver, Canada", "Sydney, Australia", "Singapore", "Amsterdam, Netherlands", "Dublin, Ireland", "Paris, France", "Stockholm, Sweden", "Tel Aviv, Israel", "Bangalore, India", "Remote - Worldwide"];

const domains = ["FinTech", "HealthTech", "E-commerce", "EdTech", "SaaS", "AI/ML", "Cybersecurity", "Gaming", "Social Media", "AdTech", "IoT", "Blockchain", "Cloud Computing", "DevTools", "HR Tech", "PropTech", "LegalTech", "InsurTech", "AgriTech", "CleanTech", "Logistics", "Travel Tech", "FoodTech", "Retail Tech", "Media & Entertainment"];

const workPreferences = ["Remote", "Onsite", "Hybrid"] as const;
const workTypes = ["Full-time", "Contract", "Freelance"] as const;
const availabilities = ["Immediately", "2 weeks", "1 month", "3 months"] as const;

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSkills(): string[] {
  const count = 3 + Math.floor(Math.random() * 8);
  const shuffled = [...skills].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateCandidate() {
  const firstName = randomFrom(firstNames);
  const lastName = randomFrom(lastNames);
  const name = `${firstName} ${lastName}`;
  const title = randomFrom(titles);
  const candidateSkills = randomSkills();
  const experience = 1 + Math.floor(Math.random() * 15);
  const location = randomFrom(locations);
  const workPreference = randomFrom(workPreferences);
  const workType = randomFrom(workTypes);
  const availability = randomFrom(availabilities);
  const domain = randomFrom(domains);

  const summaries = [
    `${name} is a ${title} with ${experience} years of experience specializing in ${candidateSkills.slice(0, 3).join(", ")}. Strong background in ${domain} with a passion for building scalable solutions.`,
    `Experienced ${title} with expertise in ${candidateSkills.slice(0, 2).join(" and ")}. ${experience} years in the industry focusing on ${domain} applications.`,
    `${title} bringing ${experience} years of hands-on experience in ${candidateSkills[0]} and ${candidateSkills[1]}. Proven track record in ${domain} sector.`,
    `Results-driven ${title} with ${experience}+ years building products in ${domain}. Proficient in ${candidateSkills.slice(0, 3).join(", ")}.`,
  ];

  return {
    name,
    title,
    skills: candidateSkills,
    experience,
    location,
    workPreference,
    workType,
    availability,
    domain,
    summary: randomFrom(summaries),
    createdAt: new Date(),
    userId: "seed-script",
    is_draft: false,
  };
}

export const seedCandidates = onRequest(
  { cors: true, timeoutSeconds: 540 },
  async (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 1000;
      const batchSize = 500;
      let totalAdded = 0;

      const batches = Math.ceil(count / batchSize);

      for (let batchNum = 0; batchNum < batches; batchNum++) {
        const batch = db.batch();
        const itemsInBatch = Math.min(batchSize, count - totalAdded);

        for (let i = 0; i < itemsInBatch; i++) {
          const candidate = generateCandidate();
          const docRef = db.collection("candidates").doc();
          batch.set(docRef, candidate);
        }

        await batch.commit();
        totalAdded += itemsInBatch;
      }

      res.json({ success: true, added: totalAdded });
    } catch (e: any) {
      console.error("seed-candidates error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);
