import postgres from 'postgres';

export type ShopRecord = {
  shopDomain: string;
  adminAccessToken: string;
  storefrontAccessToken?: string;
  createdAt?: string;
  updatedAt?: string;
};

let sql: ReturnType<typeof postgres> | null = null;

function getSql() {
  if (!sql) {
    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      throw new Error('POSTGRES_URL environment variable is required');
    }
    sql = postgres(postgresUrl, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    });
  }
  return sql;
}

export const postgresStorage = {
  async saveShop(record: ShopRecord) {
    const now = new Date().toISOString();
    const db = getSql();
    
    await db`
      INSERT INTO shops (shop_domain, admin_access_token, storefront_access_token, created_at, updated_at)
      VALUES (${record.shopDomain}, ${record.adminAccessToken}, ${record.storefrontAccessToken || null}, ${record.createdAt || now}, ${now})
      ON CONFLICT (shop_domain) 
      DO UPDATE SET 
        admin_access_token = EXCLUDED.admin_access_token,
        storefront_access_token = EXCLUDED.storefront_access_token,
        updated_at = EXCLUDED.updated_at
    `;
  },

  async getShop(shopDomain: string): Promise<ShopRecord | undefined> {
    const db = getSql();
    const result = await db`
      SELECT shop_domain, admin_access_token, storefront_access_token, created_at, updated_at
      FROM shops 
      WHERE shop_domain = ${shopDomain}
    `;
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      shopDomain: row.shop_domain,
      adminAccessToken: row.admin_access_token,
      storefrontAccessToken: row.storefront_access_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async saveExperienceMapping(experienceId: string, shopDomain: string) {
    const db = getSql();
    
    await db`
      INSERT INTO experiences (experience_id, shop_domain, created_at)
      VALUES (${experienceId}, ${shopDomain}, NOW())
      ON CONFLICT (experience_id) 
      DO UPDATE SET shop_domain = EXCLUDED.shop_domain
    `;
  },

  async getShopByExperience(experienceId: string): Promise<ShopRecord | undefined> {
    const db = getSql();
    const result = await db`
      SELECT s.shop_domain, s.admin_access_token, s.storefront_access_token, s.created_at, s.updated_at
      FROM shops s
      JOIN experiences e ON s.shop_domain = e.shop_domain
      WHERE e.experience_id = ${experienceId}
    `;
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      shopDomain: row.shop_domain,
      adminAccessToken: row.admin_access_token,
      storefrontAccessToken: row.storefront_access_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async disconnectShop(experienceId: string) {
    const db = getSql();
    
    const result = await db`
      DELETE FROM experiences 
      WHERE experience_id = ${experienceId}
      RETURNING shop_domain
    `;
    
    if (result.length === 0) {
      return { success: false, message: `No shop found for experience ${experienceId}` };
    }
    
    const shopDomain = result[0].shop_domain;
    
    const shopExperiences = await db`
      SELECT COUNT(*) as count FROM experiences WHERE shop_domain = ${shopDomain}
    `;
    
    if (parseInt(shopExperiences[0].count) === 0) {
      await db`
        DELETE FROM shops WHERE shop_domain = ${shopDomain}
      `;
    }
    
    return { success: true, message: `Disconnected shop ${shopDomain}` };
  },

  async initTables() {
    const db = getSql();
    
    await db`
      CREATE TABLE IF NOT EXISTS shops (
        shop_domain VARCHAR(255) PRIMARY KEY,
        admin_access_token TEXT NOT NULL,
        storefront_access_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await db`
      CREATE TABLE IF NOT EXISTS experiences (
        experience_id VARCHAR(255) PRIMARY KEY,
        shop_domain VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (shop_domain) REFERENCES shops(shop_domain) ON DELETE CASCADE
      )
    `;
  }
};