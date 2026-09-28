// ═══════════════════════════════════════════════════════════
// Seed initial feature requests for voting
// Usage: npx tsx scripts/seed-features.ts
// ═══════════════════════════════════════════════════════════
import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { prisma } from "../src/lib/db";

const FEATURES = [
  // ── Language & Accessibility ─────────────────────────────
  { title: "Multilingual Support — Vote for Your Language", description: "ForThePeople.in should speak your language. Citizens vote for which languages they want — Kannada, Hindi, Tamil, Telugu, Malayalam, Marathi, and more. The most-voted languages get built first. This is a community decision, not a top-down roadmap.", category: "Accessibility", icon: "🗣️", priority: 10 },
  { title: "Voice Search in Regional Languages", description: "Search by speaking in Kannada, Hindi, Tamil, Telugu. Uses Web Speech API — no typing needed. Critical for rural users.", category: "Accessibility", icon: "🎤", priority: 8 },
  { title: "Offline Mode (PWA)", description: "Add to Home Screen and browse even without internet. Essential for rural areas with poor connectivity.", category: "Accessibility", icon: "📱", priority: 7 },

  // ── Community & Engagement ───────────────────────────────
  { title: "WhatsApp Daily Digest", description: "Subscribe to daily WhatsApp updates for your district — dam levels, crop prices, weather, news. One message at 8 AM.", category: "Community", icon: "💬", priority: 10 },
  { title: "Citizen Problem Reporting", description: "Report potholes, power outages, water issues with photo + location. Track resolution status. Community-driven alerts.", category: "Community", icon: "📸", priority: 8 },
  { title: "Government Grievance Status Tracker", description: "Track your CPGRAMS, CM Helpline, and district grievance complaints in one place. See average resolution time. Escalate stuck complaints.", category: "Community", icon: "📝", priority: 9 },
  { title: "Ration Shop & PDS Monitor", description: "Track your nearest ration shop: is it open? Stock available? Report shortages or fake entries. Essential for BPL families.", category: "Community", icon: "🍚", priority: 8 },
  { title: "Road & Pothole Reporting", description: "Photo + GPS location for road damage. Track repair status. See which areas have worst road conditions.", category: "Community", icon: "🕳️", priority: 8 },
  { title: "Electricity Bill & Outage Tracker", description: "Compare your electricity bill with neighbors. Report unauthorized power cuts. Track DISCOM reliability score for your area.", category: "Community", icon: "💡", priority: 7 },
  { title: "Pension & Welfare Payment Tracker", description: "Track your social security pension, widow pension, disability pension status. Has it been credited? Report delays.", category: "Community", icon: "👴", priority: 7 },
  { title: "School Mid-Day Meal Monitor", description: "Is your child's school serving mid-day meals? Quality reports from parents. Budget vs actual spending.", category: "Community", icon: "🍱", priority: 6 },

  // ── Data & Transparency ──────────────────────────────────
  { title: "Compare Districts Side-by-Side", description: "Compare any 2-3 districts on literacy, budget, infrastructure, and health metrics. Understand governance patterns across regions based on official government data.", category: "Data", icon: "📊", priority: 9 },
  { title: "Elected Representative Dashboard", description: "Track every elected representative: projects delivered, budget utilized, attendance in Parliament/Assembly, and progress on announced initiatives — all sourced from official records.", category: "Data", icon: "📋", priority: 9 },
  { title: "Budget Utilization Tracker", description: "See how public money is allocated vs actually spent across government projects. Track budget utilization rates and identify under-utilized funds — all from official government budget documents.", category: "Transparency", icon: "💰", priority: 10 },
  { title: "Public Service Delivery Times", description: "Track real-world timelines for common citizen services — caste certificates, ration cards, building permits, licence renewals — based on citizen-reported data.", category: "Transparency", icon: "⏱️", priority: 9 },
  { title: "Land Record Simplifier", description: "Understand your land records (khata, pahani, RTC) in simple language. Check for encroachments. Track mutation status.", category: "Data", icon: "📜", priority: 7 },
  { title: "Government Job & Exam Tracker", description: "All government recruitment notifications for your district. Exam dates, results, vacancy status. Never miss a sarkari naukri update.", category: "Data", icon: "💼", priority: 8 },
  { title: "Hospital Wait Time & Bed Availability", description: "Real-time bed availability in government hospitals. Average wait times at PHCs and district hospitals.", category: "Data", icon: "🏥", priority: 7 },
  { title: "Water Quality Dashboard", description: "Is your drinking water safe? Test results from government labs. Contamination alerts. Compare with WHO standards.", category: "Data", icon: "🧪", priority: 6 },
  { title: "Disaster Early Warning System", description: "Flood risk maps, earthquake zones, cyclone tracking, drought monitoring. Emergency shelter locations.", category: "Data", icon: "🆘", priority: 6 },

  // ── Expansion ────────────────────────────────────────────
  { title: "Unlock Your District", description: "Vote for your district to go live next! We expand based on citizen demand. The most-voted district gets priority.", category: "Expansion", icon: "🗺️", priority: 10 },
  { title: "Android App", description: "Native Android app on the Google Play Store. Push notifications, offline reading, faster load times, and a better experience on Android devices — the most-used smartphone OS in India.", category: "Expansion", icon: "🤖", priority: 10 },
  { title: "iPhone App", description: "Native iOS app on the App Store. Built for iPhone users in Karnataka and beyond — smooth, fast, and always up-to-date with district data, alerts, and news.", category: "Expansion", icon: "🍎", priority: 10 },
  { title: "AI Chatbot in Local Language", description: "Ask questions about your district in Kannada, Hindi, Tamil. Get instant answers from government data.", category: "Accessibility", icon: "🤖", priority: 8 },
];

async function main() {
  console.log(`\n🌱 Seeding ${FEATURES.length} feature requests...\n`);

  // Remove old hardcoded language proposals (replaced by community multilingual vote)
  await prisma.featureRequest.deleteMany({
    where: {
      title: {
        in: [
          "Kannada Language Support",
          "Hindi Language Support",
        ],
      },
    },
  });
  console.log("  🧹 Removed old language proposals\n");

  let created = 0;
  let skipped = 0;

  for (const f of FEATURES) {
    const existing = await prisma.featureRequest.findFirst({
      where: { title: f.title },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.featureRequest.create({ data: f });
    console.log(`  ✅ Created: ${f.icon} ${f.title}`);
    created++;
  }

  console.log(`\n✅ Done: ${created} created, ${skipped} already existed`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
