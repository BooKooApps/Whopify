import { promises as fs } from "node:fs";
import path from "node:path";

type ShopRecord = {
  shopDomain: string;
  adminAccessToken: string;
  storefrontAccessToken?: string;
  createdAt?: string;
  updatedAt?: string;
};

const dataDir = path.join(process.cwd(), "data");
const shopsFile = path.join(dataDir, "shops.json");
const experienceMapFile = path.join(dataDir, "experience-mapping.json");

async function ensureDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as T;
  } catch (e: any) {
    if (e.code === "ENOENT") return fallback;
    throw e;
  }
}

async function writeJson<T>(file: string, data: T) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export const storage = {
  async saveShop(record: ShopRecord) {
    const all = await readJson<Record<string, ShopRecord>>(shopsFile, {});
    const now = new Date().toISOString();
    const existing = all[record.shopDomain];
    all[record.shopDomain] = { ...existing, ...record, createdAt: existing?.createdAt ?? now, updatedAt: now };
    await writeJson(shopsFile, all);
  },
  async getShop(shopDomain: string) {
    const all = await readJson<Record<string, ShopRecord>>(shopsFile, {});
    return all[shopDomain];
  },
  async saveExperienceMapping(experienceId: string, shopDomain: string) {
    const all = await readJson<Record<string, string>>(experienceMapFile, {});
    all[experienceId] = shopDomain;
    await writeJson(experienceMapFile, all);
  },
  async getShopByExperience(experienceId: string) {
    const map = await readJson<Record<string, string>>(experienceMapFile, {});
    const shopDomain = map[experienceId];
    if (!shopDomain) return undefined;
    return this.getShop(shopDomain);
  }
};

export type { ShopRecord };


