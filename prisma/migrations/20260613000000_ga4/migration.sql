-- Add the optional Google Analytics 4 property id to projects
ALTER TABLE "Project" ADD COLUMN "ga4PropertyId" TEXT;
