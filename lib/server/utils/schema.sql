CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain VARCHAR(255) NOT NULL UNIQUE,
  admin_access_token TEXT NOT NULL,
  storefront_access_token TEXT,
  creator jsonb NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id VARCHAR(255) NOT NULL,
  shop_id UUID NOT NULL,
  creator jsonb NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(experience_id, shop_id)
);