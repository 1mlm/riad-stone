-- CreateEnum
CREATE TYPE "HistoryItemType" AS ENUM ('CREATE_INPUT', 'UPDATE_INPUT', 'DELETE_INPUT', 'CREATE_OUTPUT', 'UPDATE_OUTPUT', 'DELETE_OUTPUT', 'CLEAR_EVERYTHING', 'SEED_FAKE_DATA', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "Entree" (
    "reference" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origine" TEXT,
    "longueur" DECIMAL(10,4) NOT NULL,
    "largeur" DECIMAL(10,4) NOT NULL,
    "nombrePieces" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entree_pkey" PRIMARY KEY ("reference")
);

-- CreateTable
CREATE TABLE "Sortie" (
    "entreeReference" TEXT NOT NULL,
    "dateSortie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bonCommande" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sortie_pkey" PRIMARY KEY ("entreeReference")
);

-- CreateTable
CREATE TABLE "HistoryEvent" (
    "id" SERIAL NOT NULL,
    "type" "HistoryItemType" NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoryEvent_createdAt_idx" ON "HistoryEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Sortie" ADD CONSTRAINT "Sortie_entreeReference_fkey" FOREIGN KEY ("entreeReference") REFERENCES "Entree"("reference") ON DELETE RESTRICT ON UPDATE CASCADE;
