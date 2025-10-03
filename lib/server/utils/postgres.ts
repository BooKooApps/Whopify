import postgres from 'postgres';

export type ShopRecord = {
  shopDomain: string;
  adminAccessToken: string;
  storefrontAccessToken?: string;
  creator?: any;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
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
      INSERT INTO shops (shop_domain, admin_access_token, storefront_access_token, creator, created_at, updated_at)
      VALUES (${record.shopDomain}, ${record.adminAccessToken}, ${record.storefrontAccessToken || null}, ${record.creator ? JSON.stringify(record.creator) : null}, ${record.createdAt || now}, ${now})
      ON CONFLICT (shop_domain) 
      DO UPDATE SET 
        admin_access_token = EXCLUDED.admin_access_token,
        storefront_access_token = EXCLUDED.storefront_access_token,
        creator = EXCLUDED.creator,
        updated_at = EXCLUDED.updated_at,
        deleted_at = NULL
    `;
  },

  async getShop(shopDomain: string): Promise<ShopRecord | undefined> {
    const db = getSql();
    const result = await db`
      SELECT shop_domain, admin_access_token, storefront_access_token, creator, created_at, updated_at, deleted_at
      FROM shops 
      WHERE shop_domain = ${shopDomain} AND deleted_at IS NULL
    `;
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      shopDomain: row.shop_domain,
      adminAccessToken: row.admin_access_token,
      storefrontAccessToken: row.storefront_access_token,
      creator: row.creator,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  },

  async saveExperienceMapping(experienceId: string, shopDomain: string, creator?: any) {
    const db = getSql();
    
    const shopResult = await db`
      SELECT id FROM shops WHERE shop_domain = ${shopDomain} AND deleted_at IS NULL
    `;
    
    if (shopResult.length === 0) {
      throw new Error(`Shop ${shopDomain} not found`);
    }
    
    const shopId = shopResult[0].id;
    
    await db`
      INSERT INTO experiences (experience_id, shop_id, creator, created_at)
      VALUES (${experienceId}, ${shopId}, ${creator ? JSON.stringify(creator) : null}, NOW())
      ON CONFLICT (experience_id, shop_id) 
      DO UPDATE SET creator = EXCLUDED.creator
    `;
  },

  async getShopByExperience(experienceId: string): Promise<ShopRecord | undefined> {
    const db = getSql();
    const result = await db`
      SELECT s.shop_domain, s.admin_access_token, s.storefront_access_token, s.creator, s.created_at, s.updated_at, s.deleted_at
      FROM shops s
      JOIN experiences e ON s.id = e.shop_id
      WHERE e.experience_id = ${experienceId} AND s.deleted_at IS NULL
    `;
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      shopDomain: row.shop_domain,
      adminAccessToken: row.admin_access_token,
      storefrontAccessToken: row.storefront_access_token,
      creator: row.creator,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  },

  async softDeleteShop(experienceId: string) {
    const db = getSql();
    
    const result = await db`
      SELECT s.shop_domain
      FROM shops s
      JOIN experiences e ON s.id = e.shop_id
      WHERE e.experience_id = ${experienceId} AND s.deleted_at IS NULL
    `;
    
    if (result.length === 0) {
      return { success: false, message: 'Shop not found or already deleted' };
    }
    
    const shopDomain = result[0].shop_domain;
    const now = new Date().toISOString();
    
    await db`
      UPDATE shops 
      SET deleted_at = ${now}, updated_at = ${now}
      WHERE shop_domain = ${shopDomain}
    `;
    
    return { success: true, message: `Shop ${shopDomain} has been closed` };
  },
};