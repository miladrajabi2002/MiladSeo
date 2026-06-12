-- CreateTable
CREATE TABLE "Annotation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Annotation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UrlIndexStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "urlPath" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "coverageState" TEXT,
    "indexingState" TEXT,
    "robotsState" TEXT,
    "fetchState" TEXT,
    "lastCrawlTime" DATETIME,
    "googleCanonical" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UrlIndexStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PageSpeedResult" (
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
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageSpeedResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Annotation_projectId_date_idx" ON "Annotation"("projectId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_projectId_idx" ON "ShareLink"("projectId");

-- CreateIndex
CREATE INDEX "UrlIndexStatus_projectId_idx" ON "UrlIndexStatus"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "UrlIndexStatus_projectId_urlPath_key" ON "UrlIndexStatus"("projectId", "urlPath");

-- CreateIndex
CREATE INDEX "PageSpeedResult_projectId_idx" ON "PageSpeedResult"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "PageSpeedResult_projectId_urlPath_strategy_key" ON "PageSpeedResult"("projectId", "urlPath", "strategy");
