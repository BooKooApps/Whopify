import { sql } from '@vercel/postgres';

export type ShopRecord = {
  shopDomain: string;
  adminAccessToken: string;
  storefrontAccessToken?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const postgresStorage = {
  async saveShop(record: ShopRecord) {
    const now = new Date().toISOString();
    
    await sql`
      INSERT INTO shops (shop_domain, admin_access_token, storefront_access_token, created_at, updated_at)
      VALUES (${record.shopDomain}, ${record.adminAccessToken}, ${record.storefrontAccessToken || null}, ${now}, ${now})
      ON CONFLICT (shop_domain) 
      DO UPDATE SET 
        admin_access_token = EXCLUDED.admin_access_token,
        storefront_access_token = EXCLUDED.storefront_access_token,
        updated_at = EXCLUDED.updated_at
    `;
  },

  async getShop(shopDomain: string) {
    const result = await sql`
      SELECT shop_domain, admin_access_token, storefront_access_token, created_at, updated_at
      FROM shops 
      WHERE shop_domain = ${shopDomain}
    `;
    
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      shopDomain: row.shop_domain,
      adminAccessToken: row.admin_access_token,
      storefrontAccessToken: row.storefront_access_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async saveExperienceMapping(experienceId: string, shopDomain: string) {
    await sql`
      INSERT INTO experiences (experience_id, shop_domain, created_at)
      VALUES (${experienceId}, ${shopDomain}, ${new Date().toISOString()})
      ON CONFLICT (experience_id) 
      DO UPDATE SET 
        shop_domain = EXCLUDED.shop_domain,
        created_at = EXCLUDED.created_at
    `;
  },

  async getShopByExperience(experienceId: string) {
    const result = await sql`
      SELECT s.shop_domain, s.admin_access_token, s.storefront_access_token, s.created_at, s.updated_at
      FROM shops s
      JOIN experiences em ON s.shop_domain = em.shop_domain
      WHERE em.experience_id = ${experienceId}
    `;
    
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      shopDomain: row.shop_domain,
      adminAccessToken: row.admin_access_token,
      storefrontAccessToken: row.storefront_access_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async disconnectShop(experienceId: string) {
    // Get the shop domain for this experience
    const mappingResult = await sql`
      SELECT shop_domain FROM experiences WHERE experience_id = ${experienceId}
    `;
    
    if (mappingResult.rows.length === 0) {
      return { success: false, message: "No shop connected to this experience" };
    }
    
    const shopDomain = mappingResult.rows[0].shop_domain;
    
    // Remove experience mapping
    await sql`DELETE FROM experiences WHERE experience_id = ${experienceId}`;
    
    // Remove shop data
    await sql`DELETE FROM shops WHERE shop_domain = ${shopDomain}`;
    
    console.log(`✅ Disconnected shop ${shopDomain} from experience ${experienceId}`);
    return { success: true, message: `Disconnected shop ${shopDomain}` };
  },

  async initTables() {
    // Create shops table
    await sql`
      CREATE TABLE IF NOT EXISTS shops (
        shop_domain VARCHAR(255) PRIMARY KEY,
        admin_access_token TEXT NOT NULL,
        storefront_access_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create experience mappings table
    await sql`
      CREATE TABLE IF NOT EXISTS experiences (
        experience_id VARCHAR(255) PRIMARY KEY,
        shop_domain VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (shop_domain) REFERENCES shops(shop_domain) ON DELETE CASCADE
      )
    `;
  }
};
