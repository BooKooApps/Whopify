import { whopSdk } from "../../../lib/whop-sdk";
import { headers } from "next/headers";
import Image from "next/image";
import ConnectStoreForm from "./ConnectStoreForm";

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
  isConnected?: boolean;
  accessLevel?: 'admin' | 'customer' | 'no_access';
  hasAccess?: boolean;
};

export default async function StorefrontPage({ params, searchParams }: { params: { experienceId: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
  let user = null;
  let error = null;

  try {
    const headersList = await headers();
    
    let userToken = headersList.get('x-whop-user-token');
    if (!userToken) {
      userToken = searchParams['whop-dev-user-token'] as string;
    }
    
    console.log("Token found:", !!userToken);
    console.log("Token source:", userToken ? (headersList.get('x-whop-user-token') ? 'headers' : 'query') : 'none');

    if (userToken) {
      const modifiedHeaders = new Headers(headersList);
      if (!modifiedHeaders.get('x-whop-user-token')) {
        modifiedHeaders.set('x-whop-user-token', userToken);
      }

      const { userId } = await whopSdk.verifyUserToken(modifiedHeaders);

      user = await whopSdk.users.getUser({ userId: userId });

      console.log({user});
    } else {
      error = "No user token found in headers or query params";
    }
  } catch (err) {
    error = err;
    console.error("WhopSDK error:", err);
  }

  const experienceId = params.experienceId;
  
  if (!experienceId) {
    return (
      <main style={{ padding: 24, minHeight: "100vh" }}>
        <div style={{ color: "white" }}>Missing experience ID</div>
      </main>
    );
  }

  let accessLevel: 'admin' | 'customer' | 'no_access' = 'no_access';
  let hasAccess = false;

  if (user) {
    try {
      const result = await whopSdk.access.checkIfUserHasAccessToExperience({
        userId: user.id,
        experienceId: experienceId,
      });

      hasAccess = result.hasAccess;
      accessLevel = result.accessLevel;
      // accessLevel = 'customer'; // dev only

      console.log("Access check result:", result);
    } catch (err) {
      console.error("Access validation error:", err);
      hasAccess = false;
      accessLevel = 'no_access';
    }
  }


  // Check shop connection status
  let shopDomain: string | null = null;
  let shopName: string | null = null;
  let products: Product[] = [];
  let isConnected = false;
  let shopError: string | null = null;

  if (user && hasAccess) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL || 'localhost:3000'}`;
      const shopUrl = `${baseUrl}/api/shopify/shop?experienceId=${encodeURIComponent(experienceId)}`;
      const shopResp = await fetch(shopUrl, { headers: { Accept: "application/json" } });
      
      if (shopResp.ok) {
        const shopData = await shopResp.json();
        shopDomain = shopData.shopInfo?.myshopifyDomain || null;
        shopName = shopData.shopInfo?.name || null;
        
        if (shopDomain) {
          const productsUrl = `${baseUrl}/api/shopify/products?experienceId=${encodeURIComponent(experienceId)}`;
          const productsResp = await fetch(productsUrl, { headers: { Accept: "application/json" } });
          
          if (productsResp.ok) {
            const productsData = await productsResp.json();
            products = (productsData.products || []).map((n: any) => ({ 
              id: n.id, 
              title: n.title, 
              imageUrl: n.imageUrl ?? null, 
              price: n.price ?? null, 
              handle: n.handle ?? null 
            }));
            isConnected = true;
          }
        }
      }
    } catch (e: any) {
      shopError = e?.message || "Failed to check shop connection";
      console.error("Shop connection error:", e);
    }
  }

  if (user) {
    // No access - show 404
    if (!hasAccess || accessLevel === 'no_access') {
      return (
        <main style={{ maxWidth: 720, margin: "0 auto", padding: 24, textAlign: "center", minHeight: "100vh" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, color: "white" }}>
            Access Denied
          </h1>
          <p style={{ fontSize: 16, color: "white" }}>
            You do not have access to this experience.
          </p>
        </main>
      );
    }

    // Admin - show connect store UI if not connected, or storefront if connected
    if (accessLevel === 'admin') {
      if (!isConnected) {
        return <ConnectStoreForm experienceId={experienceId} userName={user.name} />;
      } else {
        // Admin - show connected storefront
        return (
          <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, minHeight: "100vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ margin: 0, color: "white" }}>{shopName || shopDomain || "Storefront"}</h1>
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "#f9f9f9",
                  color: "#666",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                ⚙️ Settings
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {products.map((p) => (
                <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, backgroundColor: "white" }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: "black" }}>{p.title}</div>
                  <div style={{ height: 160, background: "#f4f4f4", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {p.imageUrl ? <Image src={p.imageUrl} alt={p.title} width={220} height={160} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "black" }}>No Image</span>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, color: "black" }}>{p.price ? `$${p.price}` : "Price N/A"}</div>
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
      }
    }

    // Customer - show store not connected message or storefront
    if (accessLevel === 'customer') {
      if (!isConnected) {
        return (
          <main style={{ maxWidth: 720, margin: "0 auto", padding: 24, textAlign: "center", minHeight: "100vh" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, color: "white" }}>
              Store Coming Soon
            </h1>
            <p style={{ fontSize: 16, color: "white" }}>
              Store has not been connected yet. Please check back later!
            </p>
          </main>
        );
      } else {
        // Customer - show storefront
        return (
          <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, minHeight: "100vh" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, color: "white" }}>{shopName || shopDomain || "Storefront"}</h1>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {products.map((p) => (
                <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, backgroundColor: "white" }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: "black" }}>{p.title}</div>
                  <div style={{ height: 160, background: "#f4f4f4", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {p.imageUrl ? <Image src={p.imageUrl} alt={p.title} width={220} height={160} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "black" }}>No Image</span>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, color: "black" }}>{p.price ? `$${p.price}` : "Price N/A"}</div>
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
      }
    }
  }

  // Show error if there's an issue
  if (error) {
    return (
      <main style={{ padding: 24, minHeight: "100vh" }}>
        <h1 style={{ color: "white" }}>Error</h1>
        <pre style={{ 
          background: "#ffebee", 
          padding: 16, 
          borderRadius: 8,
          maxWidth: 600,
          overflow: "auto",
          color: "red"
        }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      </main>
    );
  }

  // Show spinner while loading
  return (
    <main style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{
        width: 50,
        height: 50,
        border: "5px solid #f3f3f3",
        borderTop: "5px solid #8b5cf6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <p style={{ color: "white" }}>Loading...</p>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </main>
  );
}

