-- CreateTable
CREATE TABLE "Competitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "label" TEXT,
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Competitor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitorRanking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "competitorId" INTEGER NOT NULL,
    "keyword" TEXT NOT NULL,
    "position" INTEGER,
    "day" TEXT NOT NULL,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitorRanking_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Competitor_projectId_idx" ON "Competitor"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_projectId_domain_key" ON "Competitor"("projectId", "domain");

-- CreateIndex
CREATE INDEX "CompetitorRanking_competitorId_idx" ON "CompetitorRanking"("competitorId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorRanking_competitorId_keyword_day_key" ON "CompetitorRanking"("competitorId", "keyword", "day");
