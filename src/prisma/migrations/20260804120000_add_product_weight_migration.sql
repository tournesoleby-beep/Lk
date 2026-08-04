-- Change the default for products.weight_grams from 0g to 500g so newly
-- created products get a sensible shipping weight out of the box.
--
-- This does NOT add or drop any column (weight_grams already exists) and
-- does NOT touch any other product field.
ALTER TABLE "products" ALTER COLUMN "weight_grams" SET DEFAULT 500;

-- Backfill existing rows that are still sitting at the *old* default (0g)
-- up to the new default (500g). Rows are only touched if weight_grams = 0,
-- which was previously only reachable via the old column default — so this
-- only affects products that never had a real weight entered, and never
-- overwrites a product that already has an actual weight value.
UPDATE "products" SET "weight_grams" = 500 WHERE "weight_grams" = 0;
