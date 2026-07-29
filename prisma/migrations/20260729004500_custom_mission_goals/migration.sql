-- Replaces the fixed RIDE/PIT/SPORT enum with per-mission, user-defined goals.
-- Ordered so existing missions and activities survive: create the new shape,
-- carry the data across, and only then drop the old columns.

-- 1. New table -----------------------------------------------------------------
CREATE TABLE "MissionGoal" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "hue" INTEGER NOT NULL DEFAULT 255,
    "position" INTEGER NOT NULL DEFAULT 0,
    "countsTowardId" TEXT,
    CONSTRAINT "MissionGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MissionGoal_missionId_position_idx" ON "MissionGoal"("missionId", "position");
CREATE INDEX "MissionGoal_countsTowardId_idx" ON "MissionGoal"("countsTowardId");
CREATE UNIQUE INDEX "MissionGoal_missionId_name_key" ON "MissionGoal"("missionId", "name");

ALTER TABLE "MissionGoal" ADD CONSTRAINT "MissionGoal_missionId_fkey"
  FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MissionGoal" ADD CONSTRAINT "MissionGoal_countsTowardId_fkey"
  FOREIGN KEY ("countsTowardId") REFERENCES "MissionGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Turn each existing mission's three target columns into goal rows ------------
INSERT INTO "MissionGoal" ("id","missionId","name","target","hue","position")
SELECT 'goal_ride_' || "id", "id", 'Rides',            "rideTarget",  255, 0 FROM "Mission";
INSERT INTO "MissionGoal" ("id","missionId","name","target","hue","position")
SELECT 'goal_pit_'  || "id", "id", 'Pit explorations', "pitTarget",    78, 1 FROM "Mission";
INSERT INTO "MissionGoal" ("id","missionId","name","target","hue","position")
SELECT 'goal_sport_'|| "id", "id", 'Sport days',       "sportTarget", 300, 2 FROM "Mission";

-- Preserve the original semantics: a pit exploration was always a ride too.
UPDATE "MissionGoal" p
SET "countsTowardId" = 'goal_ride_' || p."missionId"
WHERE p."id" LIKE 'goal_pit_%';

-- 3. Point activities at their goal ---------------------------------------------
ALTER TABLE "Activity" ADD COLUMN "goalId" TEXT;

UPDATE "Activity" SET "goalId" =
  CASE "kind"::text
    WHEN 'RIDE'  THEN 'goal_ride_'  || "missionId"
    WHEN 'PIT'   THEN 'goal_pit_'   || "missionId"
    WHEN 'SPORT' THEN 'goal_sport_' || "missionId"
  END;

-- Any row the mapping missed would violate NOT NULL below; fail loudly instead
-- of silently dropping someone's logged session.
DO $$
DECLARE orphaned INT;
BEGIN
  SELECT COUNT(*) INTO orphaned FROM "Activity" WHERE "goalId" IS NULL;
  IF orphaned > 0 THEN
    RAISE EXCEPTION 'Migration aborted: % activities could not be mapped to a goal', orphaned;
  END IF;
END $$;

ALTER TABLE "Activity" ALTER COLUMN "goalId" SET NOT NULL;
CREATE INDEX "Activity_goalId_idx" ON "Activity"("goalId");
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_goalId_fkey"
  FOREIGN KEY ("goalId") REFERENCES "MissionGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Retire the old shape --------------------------------------------------------
ALTER TABLE "Activity" DROP COLUMN "kind";
ALTER TABLE "Mission" DROP COLUMN "rideTarget", DROP COLUMN "pitTarget", DROP COLUMN "sportTarget";
DROP TYPE "ActivityKind";
