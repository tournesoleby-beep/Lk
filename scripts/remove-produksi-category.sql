-- Remove the retired "Produksi" / "Production" category.
--
-- Run this yourself against your actual database — this environment has no
-- network access to your Supabase instance, so nothing here has been
-- executed for you. Run each step in order and read the output of step 1
-- before running step 3.
--
-- Schema context (prisma/schema.prisma):
--   Product.categoryId -> Category.id, onDelete: SetNull
-- This means deleting a Category row can NEVER fail with a foreign-key
-- violation and can NEVER cascade-delete products: any product still
-- pointing at a deleted category simply has its categoryId set to NULL
-- (shows as "Uncategorized" in the admin). So step 3 below is always safe
-- to run at the database level — step 1 exists so you know *whether* any
-- products would be affected, not to protect against an error.

-- ---------------------------------------------------------------------
-- STEP 1 — Inspect: does the category exist, and what would be affected?
-- ---------------------------------------------------------------------
SELECT id, name, slug, created_at
FROM categories
WHERE slug IN ('produksi', 'production');

-- For each row above, list every product currently filed under it:
SELECT p.id, p.name, p.slug, p.status, c.name AS category_name, c.slug AS category_slug
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.slug IN ('produksi', 'production')
ORDER BY p.updated_at DESC;

-- ---------------------------------------------------------------------
-- STEP 2 — If step 1's second query returned any rows, decide what those
-- products should become before deleting the category. Two options:
--
--   (a) Leave them uncategorized (simplest — this is what happens
--       automatically once you delete the category in step 3, thanks to
--       onDelete: SetNull. No action needed here for this option.)
--
--   (b) Reassign them to a real category first, e.g.:
--         UPDATE products
--         SET category_id = (SELECT id FROM categories WHERE slug = 'fashion')
--         WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('produksi', 'production'));
--
-- Do NOT run (b) blindly — only if you've reviewed step 1's product list
-- and a specific target category actually makes sense for those products.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- STEP 3 — Delete the category row(s). Safe per the onDelete: SetNull
-- note above; any remaining product references are nulled automatically.
-- ---------------------------------------------------------------------
DELETE FROM categories WHERE slug IN ('produksi', 'production');

-- ---------------------------------------------------------------------
-- STEP 4 — Verify.
-- ---------------------------------------------------------------------
SELECT * FROM categories WHERE slug IN ('produksi', 'production'); -- expect 0 rows
