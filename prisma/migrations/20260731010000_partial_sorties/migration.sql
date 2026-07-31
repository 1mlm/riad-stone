-- AlterTable: add the per-sortie quantity, nullable first so existing rows can be backfilled
ALTER TABLE "Sortie" ADD COLUMN "nombrePieces" INTEGER;

-- Backfill: under the old 1:1 model a sortie always consumed the entree's entire lot
UPDATE "Sortie" AS s
SET "nombrePieces" = e."nombrePieces"
FROM "Entree" AS e
WHERE e."reference" = s."entreeReference";

ALTER TABLE "Sortie" ALTER COLUMN "nombrePieces" SET NOT NULL;

-- Drop the entreeReference-based primary key and replace it with a real
-- autoincrement id, so multiple sorties can now point at the same entree
ALTER TABLE "Sortie" DROP CONSTRAINT "Sortie_pkey";
ALTER TABLE "Sortie" ADD COLUMN "id" SERIAL;
ALTER TABLE "Sortie" ADD CONSTRAINT "Sortie_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Sortie_entreeReference_idx" ON "Sortie"("entreeReference");
