import { whopSdk } from "../../../lib/whop-sdk";
import { headers } from "next/headers";
import ConnectStoreForm from "./ConnectStoreForm";
import StorefrontClient from "./StorefrontClient";
import CustomerStorefront from "./CustomerStorefront";
import { postgresStorage } from "../../../lib/server/utils/postgres";
import { fetchShopInfo, fetchProductsAdmin } from "../../../lib/server/shopify/admin";

type Product = {
  id: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  handle?: string | null;
  variantId?: string | null;
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
    
    if (userToken) {
      const modifiedHeaders = new Headers(headersList);
      if (!modifiedHeaders.get('x-whop-user-token')) {
        modifiedHeaders.set('x-whop-user-token', userToken);
      }

      const { userId } = await whopSdk.verifyUserToken(modifiedHeaders);

      user = await whopSdk.users.getUser({ userId: userId });
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
    } catch (err) {
      console.error("Access validation error:", err);
      hasAccess = false;
      accessLevel = 'no_access';
    }
  }


  let shopDomain: string | null = null;
  let shopName: string | null = null;
  let products: Product[] = [];
  let isConnected = false;
  let shopError: string | null = null;

  if (user && hasAccess) {
    try {
      const shopRecord = await postgresStorage.getShopByExperience(experienceId);
      
      if (shopRecord?.adminAccessToken) {
        shopDomain = shopRecord.shopDomain;
        shopName = shopRecord.name || null;
        
        const shopInfo = await fetchShopInfo({ 
          shop: shopRecord.shopDomain, 
          adminAccessToken: shopRecord.adminAccessToken 
        });
        
        if (shopInfo) {
          
          const productsData = await fetchProductsAdmin({ 
            shop: shopRecord.shopDomain, 
            adminAccessToken: shopRecord.adminAccessToken, 
            first: 20 
          });
          
          products = productsData.map((n) => ({ 
            id: n.id, 
            title: n.title, 
            imageUrl: n.imageUrl ?? null, 
            price: n.price ?? null, 
            handle: n.handle ?? null,
            variantId: n.variantId ?? null
          }));
          
          isConnected = true;
        }
      }
    } catch (e: any) {
      shopError = e?.message || "Failed to check shop connection";
      console.error("Shop connection error:", e);
    }
  }

  if (user) {
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

    if (accessLevel === 'admin') {
      if (!isConnected) {
        return <ConnectStoreForm experienceId={experienceId} userName={user.name} userData={user} />;
      } else {
        return (
          <StorefrontClient
            experienceId={experienceId}
            shopDomain={shopDomain}
            shopName={shopName}
            products={products}
            isConnected={isConnected}
          />
        );
      }
    }

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
        return (
          <CustomerStorefront 
            shopDomain={shopDomain}
            shopName={shopName}
            products={products}
            experienceId={experienceId}
          />
        );
      }
    }
  }

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

