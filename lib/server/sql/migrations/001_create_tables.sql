-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
  shop_domain VARCHAR(255) PRIMARY KEY,
  admin_access_token TEXT NOT NULL,
  storefront_access_token TEXT,
  ownerData jsonb NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create experience mappings table
CREATE TABLE IF NOT EXISTS experiences (
  experience_id VARCHAR(255) PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (shop_domain) REFERENCES shops(shop_domain) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experiences_shop_domain ON experiences(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shops_created_at ON shops(created_at);
