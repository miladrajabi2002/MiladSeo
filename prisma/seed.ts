import { PrismaClient } from "@prisma/client";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

interface SeedKeyword {
  text: string;
  urlPath: string;
  group: string;
  basePosition: number;
  /** Average daily drift; negative means the keyword is improving */
  drift: number;
}

const SEED_KEYWORDS: SeedKeyword[] = [
  { text: "rent a car dubai airport", urlPath: "/dubai-airport", group: "Airport", basePosition: 8, drift: -0.2 },
  { text: "car rental dubai airport terminal 1", urlPath: "/dubai-airport", group: "Airport", basePosition: 14, drift: -0.4 },
  { text: "cheap car hire dxb airport", urlPath: "/dubai-airport", group: "Airport", basePosition: 22, drift: 0.3 },
  { text: "rent a car dubai", urlPath: "/", group: "Homepage", basePosition: 12, drift: -0.5 },
  { text: "car rental dubai", urlPath: "/", group: "Homepage", basePosition: 18, drift: -0.3 },
  { text: "best car rental company dubai", urlPath: "/", group: "Homepage", basePosition: 35, drift: -1.2 },
  { text: "daily car rental dubai", urlPath: "/daily", group: "Daily", basePosition: 6, drift: 0.1 },
  { text: "rent a car per day dubai", urlPath: "/daily", group: "Daily", basePosition: 9, drift: -0.1 },
  { text: "car hire one day dubai", urlPath: "/daily", group: "Daily", basePosition: 27, drift: 0.8 },
  { text: "dubai to oman by rental car", urlPath: "/oman-route", group: "Oman Route", basePosition: 4, drift: 0 },
  { text: "rent a car dubai to muscat", urlPath: "/oman-route", group: "Oman Route", basePosition: 11, drift: -0.6 },
  { text: "oman border crossing rental car", urlPath: "/oman-route", group: "Oman Route", basePosition: 47, drift: 1.5 },
  { text: "rent a car with driver dubai", urlPath: "/with-driver", group: "With Driver", basePosition: 7, drift: -0.2 },
  { text: "chauffeur car rental dubai", urlPath: "/with-driver", group: "With Driver", basePosition: 19, drift: 0.4 },
  { text: "toyota corolla rent dubai", urlPath: "/toyota", group: "Toyota", basePosition: 5, drift: -0.1 },
  { text: "rent toyota land cruiser dubai", urlPath: "/toyota", group: "Toyota", basePosition: 16, drift: -0.9 },
  { text: "toyota yaris rental price dubai", urlPath: "/toyota", group: "Toyota", basePosition: 31, drift: 0.6 },
  { text: "rent a car sharjah", urlPath: "/sharjah", group: "Sharjah", basePosition: 13, drift: -0.4 },
  { text: "cheap car rental sharjah monthly", urlPath: "/sharjah", group: "Sharjah", basePosition: 42, drift: -1.8 },
  { text: "rent a car ajman", urlPath: "/ajman", group: "Ajman", basePosition: 21, drift: 0.2 },
  { text: "ajman car hire weekly", urlPath: "/ajman", group: "Ajman", basePosition: 54, drift: -2.0 },
  { text: "rent a car dubai no deposit", urlPath: "/no-deposit", group: "No Deposit", basePosition: 3, drift: 0 },
  { text: "no deposit car rental dubai monthly", urlPath: "/no-deposit", group: "No Deposit", basePosition: 24, drift: 1.7 },
  { text: "zero deposit rent a car uae", urlPath: "/no-deposit", group: "No Deposit", basePosition: 68, drift: 2.2 },
];

const HISTORY_DAYS = 21;

function clampPosition(value: number): number {
  return Math.min(120, Math.max(1, Math.round(value * 10) / 10));
}

/** Deterministic pseudo-random so seeded data is stable between runs */
function noise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return (x - Math.floor(x)) * 2 - 1;
}

async function main(): Promise<void> {
  console.log("Seeding sample project…");

  await prisma.project.deleteMany({ where: { domain: "demo-rentcar.ae" } });

  const project = await prisma.project.create({
    data: {
      name: "Demo Rent a Car",
      domain: "demo-rentcar.ae",
      gscProperty: "sc-domain:demo-rentcar.ae",
      location: "UAE",
      lastSyncAt: new Date(),
    },
  });

  for (const [index, seed] of SEED_KEYWORDS.entries()) {
    const keyword = await prisma.keyword.create({
      data: {
        text: seed.text,
        urlPath: seed.urlPath,
        group: seed.group,
        projectId: project.id,
      },
    });

    const rankings: {
      keywordId: number;
      position: number;
      clicks: number;
      impressions: number;
      ctr: number;
      device: string;
      date: Date;
    }[] = [];

    for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
      const progress = HISTORY_DAYS - daysAgo;
      const date = new Date(subDays(new Date(), daysAgo).setUTCHours(0, 0, 0, 0));

      const desktop = clampPosition(
        seed.basePosition + seed.drift * progress + noise(index * 100 + daysAgo) * 2
      );
      const mobileOffset = noise(index * 37 + daysAgo) * 4;
      const mobile = clampPosition(desktop + mobileOffset);

      const impressions = Math.max(
        10,
        Math.round(800 / Math.sqrt(desktop) + noise(index + daysAgo) * 30)
      );
      const ctr = Math.max(0.001, 0.35 / desktop);
      const clicks = Math.round(impressions * ctr);

      rankings.push(
        {
          keywordId: keyword.id,
          position: desktop,
          clicks,
          impressions,
          ctr,
          device: "desktop",
          date,
        },
        {
          keywordId: keyword.id,
          position: mobile,
          clicks: Math.round(clicks * 0.8),
          impressions: Math.round(impressions * 0.9),
          ctr,
          device: "mobile",
          date,
        }
      );
    }

    await prisma.keywordRanking.createMany({ data: rankings });
  }

  await prisma.alert.createMany({
    data: [
      {
        projectId: project.id,
        keyword: "ajman car hire weekly",
        type: "jumped",
        group: "Ajman",
        prevPos: 54,
        nowPos: 40.1,
        delta: 13.9,
        createdAt: subDays(new Date(), 2),
      },
      {
        projectId: project.id,
        keyword: "cheap car rental sharjah monthly",
        type: "jumped",
        group: "Sharjah",
        prevPos: 42,
        nowPos: 30.5,
        delta: 11.5,
        createdAt: subDays(new Date(), 1),
      },
      {
        projectId: project.id,
        keyword: "zero deposit rent a car uae",
        type: "dropped",
        group: "No Deposit",
        prevPos: 47,
        nowPos: 63.5,
        delta: -16.5,
        createdAt: subDays(new Date(), 3),
      },
    ],
  });

  await prisma.syncLog.create({
    data: {
      projectId: project.id,
      status: "success",
      message: "Seed data generated",
    },
  });

  console.log(
    `Seeded project "${project.name}" with ${SEED_KEYWORDS.length} keywords and ${HISTORY_DAYS} days of history.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
