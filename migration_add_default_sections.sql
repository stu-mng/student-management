-- Migration: Add form sections and migrate existing form fields
-- This script adds form_section_id to form_fields table and creates default sections for existing forms

BEGIN;

-- Step 1: Add form_section_id column to form_fields table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'form_fields' 
        AND column_name = 'form_section_id'
    ) THEN
        ALTER TABLE form_fields 
        ADD COLUMN form_section_id UUID REFERENCES form_sections(id);
    END IF;
END $$;

-- Step 2: Create default sections for all existing forms that don't have sections
INSERT INTO form_sections (id, form_id, title, description, "order", created_at)
SELECT 
    gen_random_uuid() as id,
    f.id as form_id,
    '預設區段' as title,
    '此區段包含所有原有的表單欄位' as description,
    1 as "order",
    NOW() as created_at
FROM forms f
WHERE NOT EXISTS (
    SELECT 1 
    FROM form_sections fs 
    WHERE fs.form_id = f.id
);

-- Step 3: Update all form_fields that don't have a section assigned
-- Assign them to the default section we just created
UPDATE form_fields 
SET form_section_id = (
    SELECT fs.id 
    FROM form_sections fs 
    WHERE fs.form_id = form_fields.form_id 
    AND fs.title = '預設區段'
    LIMIT 1
)
WHERE form_section_id IS NULL;

-- Step 4: Make form_section_id NOT NULL after assigning all fields to sections
ALTER TABLE form_fields 
ALTER COLUMN form_section_id SET NOT NULL;

-- Step 5: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'form_fields_form_section_id_fkey'
        AND table_name = 'form_fields'
    ) THEN
        ALTER TABLE form_fields 
        ADD CONSTRAINT form_fields_form_section_id_fkey 
        FOREIGN KEY (form_section_id) REFERENCES form_sections(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 6: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_form_fields_form_section_id 
ON form_fields(form_section_id);

-- Step 7: Update display_order within each section
-- Reset display_order to be relative to the section using CTE
WITH field_orders AS (
    SELECT 
        id,
        row_number() OVER (
            PARTITION BY form_section_id 
            ORDER BY display_order, created_at
        )::integer as new_display_order
    FROM form_fields
)
UPDATE form_fields 
SET display_order = field_orders.new_display_order
FROM field_orders
WHERE form_fields.id = field_orders.id;

COMMIT;

-- Verify the migration
SELECT 
    f.title as form_title,
    fs.title as section_title,
    COUNT(ff.id) as field_count
FROM forms f
LEFT JOIN form_sections fs ON f.id = fs.form_id
LEFT JOIN form_fields ff ON fs.id = ff.form_section_id
GROUP BY f.id, f.title, fs.id, fs.title
ORDER BY f.title, fs."order"; 