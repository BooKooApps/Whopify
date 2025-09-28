import type { GetServerSideProps, NextPage } from "next";

type Product = {
  id: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  handle?: string | null;
};

type Props = {
  experienceId: string;
  shopDomain: string | null;
  products: Product[];
  error?: string | null;
};

const StorefrontPage: NextPage<Props> = ({ experienceId, shopDomain, products, error }) => {
  if (error) {
    return <main style={{ padding: 24 }}><div>{error}</div></main>;
  }
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1>Storefront</h1>
      {shopDomain && <div style={{ marginBottom: 12 }}>Shop: {shopDomain}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{p.title}</div>
            <div style={{ height: 160, background: "#f4f4f4", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {p.imageUrl ? <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>No Image</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>{p.price ? `$${p.price}` : "Price N/A"}</div>
              {shopDomain && p.handle && (
                <a href={`https://${shopDomain}/products/${p.handle}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <button style={{ padding: "8px 12px", border: "none", borderRadius: 6, background: "#0ea5e9", color: "white", cursor: "pointer" }}>Buy Now</button>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const experienceId = String(ctx.params?.experienceId || "");
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!experienceId || !apiBase) {
    return { props: { experienceId, shopDomain: null, products: [], error: "Missing configuration" } };
  }
  try {
    const url = `${apiBase.replace(/\/$/, "")}/shopify/products?experienceId=${encodeURIComponent(experienceId)}`;
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data?.error || `HTTP ${resp.status}`);
    }
    const products: Product[] = (data.products || []).map((n: any) => ({ id: n.id, title: n.title, imageUrl: n.imageUrl ?? null, price: n.price ?? null, handle: n.handle ?? null }));
    return { props: { experienceId, shopDomain: data.shopDomain || null, products } };
  } catch (e: any) {
    return { props: { experienceId, shopDomain: null, products: [], error: e?.message || "Failed to load products" } };
  }
};

function parseCookie(header: string | undefined) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(/;\s*/).forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

export default StorefrontPage;


