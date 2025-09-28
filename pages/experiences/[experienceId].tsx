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
  console.log("=== CUSTOMER STOREFRONT DEBUG ===");
  console.log("Experience ID:", ctx.params?.experienceId);
  console.log("Request URL:", ctx.req.url);
  console.log("Query params:", ctx.query);
  console.log("Request headers:", Object.keys(ctx.req.headers));
  console.log("Cookies:", Object.keys(parseCookie(ctx.req.headers.cookie)));
  
  // Check for Whop token in various places
  const whopToken = 
    ctx.query.whop_token as string ||
    ctx.req.headers['x-whop-token'] as string ||
    parseCookie(ctx.req.headers.cookie)['whop_user_token'] ||
    ctx.req.headers.authorization?.replace(/^Bearer\s+/i, '');
    
  console.log("Whop token found:", !!whopToken);
  console.log("Token source:", whopToken ? "found" : "not found");
  console.log("=================================");
  
  const experienceId = String(ctx.params?.experienceId || "");
  
  // For now, return mock data to test the page
  const mockProducts: Product[] = [
    {
      id: "1",
      title: "Test Product 1",
      imageUrl: null,
      price: "29.99",
      handle: "test-product-1"
    },
    {
      id: "2", 
      title: "Test Product 2",
      imageUrl: null,
      price: "49.99",
      handle: "test-product-2"
    }
  ];
  
  return { 
    props: { 
      experienceId, 
      shopDomain: "test-shop.myshopify.com", 
      products: mockProducts 
    } 
  };
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


