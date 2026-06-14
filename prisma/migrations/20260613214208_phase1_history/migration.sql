/*
  Warnings:

  - Added the required column `day` to the `PageSpeedResult` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "UrlIndexHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "urlPath" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "coverageState" TEXT,
    "day" TEXT NOT NULL,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UrlIndexHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PageSpeedResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "urlPath" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "lcpMs" REAL,
    "cls" REAL,
    "inpMs" REAL,
    "fcpMs" REAL,
    "ttfbMs" REAL,
    "day" TEXT NOT NULL,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageSpeedResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PageSpeedResult" ("checkedAt", "cls", "fcpMs", "id", "inpMs", "lcpMs", "projectId", "score", "strategy", "ttfbMs", "urlPath") SELECT "checkedAt", "cls", "fcpMs", "id", "inpMs", "lcpMs", "projectId", "score", "strategy", "ttfbMs", "urlPath" FROM "PageSpeedResult";
DROP TABLE "PageSpeedResult";
ALTER TABLE "new_PageSpeedResult" RENAME TO "PageSpeedResult";
CREATE INDEX "PageSpeedResult_projectId_idx" ON "PageSpeedResult"("projectId");
CREATE UNIQUE INDEX "PageSpeedResult_projectId_urlPath_strategy_day_key" ON "PageSpeedResult"("projectId", "urlPath", "strategy", "day");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "UrlIndexHistory_projectId_day_idx" ON "UrlIndexHistory"("projectId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "UrlIndexHistory_projectId_urlPath_day_key" ON "UrlIndexHistory"("projectId", "urlPath", "day");
