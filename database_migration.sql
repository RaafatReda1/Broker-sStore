-- Add ID card URL columns to the Brokers table
ALTER TABLE public."Brokers" 
ADD COLUMN "id_card_front_url" text,
ADD COLUMN "id_card_back_url" text;

-- Add comments to the new columns
COMMENT ON COLUMN public."Brokers"."id_card_front_url" IS 'URL of the front side ID card photo stored in Supabase storage';
COMMENT ON COLUMN public."Brokers"."id_card_back_url" IS 'URL of the back side ID card photo stored in Supabase storage';

-- Create an index on auth_id for better query performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_brokers_auth_id ON public."Brokers"("auth_id");
