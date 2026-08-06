-- Entree.date and Sortie.dateSortie no longer carry a time-of-day component.
-- The USING cast truncates any existing timestamp down to its date part.
ALTER TABLE "Entree" ALTER COLUMN "date" TYPE DATE USING "date"::date;
ALTER TABLE "Entree" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Sortie" ALTER COLUMN "dateSortie" TYPE DATE USING "dateSortie"::date;
ALTER TABLE "Sortie" ALTER COLUMN "dateSortie" SET DEFAULT CURRENT_TIMESTAMP;
