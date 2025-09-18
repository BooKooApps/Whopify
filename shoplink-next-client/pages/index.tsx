import { NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { SpinnerDotted } from "spinners-react";
import { useColors } from "../hooks/use-colors";


type Product = {
  id: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  variantId?: string | null;
  description?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  totalInventory?: number;
};

const ProductCard = ({ product, onBuyNow, disabled }: { product: Product; onBuyNow: (p: Product) => void; disabled?: boolean }) => {
  const colors = useColors();
  
  return (
    <div style={{
      border: `1px solid ${colors.gray5}`,
      borderRadius: 8,
      padding: 16,
      backgroundColor: colors.gray2,
      transition: "transform 0.2s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
    }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: colors.gray12 }}>
        {product.title}
      </div>
      
      {product.vendor && (
        <div style={{ fontSize: 14, color: colors.gray11, marginBottom: 8 }}>
          by {product.vendor}
        </div>
      )}
      
      <div style={{ 
        height: 200, 
        backgroundColor: colors.gray3, 
        borderRadius: 8, 
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover" 
            }}
          />
        ) : (
          <div style={{ color: colors.gray9, fontSize: 14 }}>No Image</div>
        )}
      </div>
      
      {product.description && (
        <div style={{ 
          fontSize: 14, 
          color: colors.gray11, 
          marginBottom: 12,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {product.description}
        </div>
      )}
      
      {product.tags && product.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {product.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              style={{
                fontSize: 12,
                padding: "2px 8px",
                backgroundColor: colors.violet3,
                color: colors.violet11,
                borderRadius: 10,
                fontWeight: 500
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 12
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: colors.gray12 }}>
          {product.price ? `$${product.price}` : "Price N/A"}
        </div>
        {product.totalInventory !== undefined && (
          <div style={{ fontSize: 12, color: colors.gray10 }}>
            {product.totalInventory} in stock
          </div>
        )}
      </div>
      
      <button 
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: colors.violet9,
          color: colors.gray12,
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          transition: "background-color 0.2s ease"
        }}
        disabled={disabled}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.violet10;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.violet9;
        }}
        onClick={() => onBuyNow(product)}
      >
        {disabled ? "Preparing checkout..." : "Buy Now"}
      </button>
    </div>
  );
};

const IndexPage: NextPage = () => {
  const [shopDomain, setShopDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showConnectedToast, setShowConnectedToast] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingShopDomain, setEditingShopDomain] = useState("");
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  
  const colors = useColors();

  const experienceId = useMemo(() => process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "", []);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL ?? "", []);

  useEffect(() => {
    const savedShop = typeof window !== "undefined" ? window.localStorage.getItem("shop_domain") : null;
    
    if (savedShop) {
      setShopDomain(savedShop);
      setEditingShopDomain(savedShop);
    }
    
    // Check for connected=1 in URL params
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("connected") === "1") {
        setShowConnectedToast(true);
        setIsConnected(true);
        // Auto-hide toast after 3 seconds
        setTimeout(() => setShowConnectedToast(false), 3000);
        // Auto-load products
        setTimeout(() => handleLoadProducts(), 1000);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("shop_domain", shopDomain || "");
  }, [shopDomain]);

  function normalizeBaseUrl(input: string): string | null {
    const raw = (input || "").trim();
    if (!raw) return null;
    const candidate = raw.match(/^https?:\/\//i) ? raw : `https://${raw}`;
    try {
      const u = new URL(candidate);
      return `${u.protocol}//${u.host}`;
    } catch {
      return null;
    }
  }

  function normalizeShopDomain(input: string): string {
    const raw = (input || "").trim().toLowerCase();
    if (!raw) return "";
    try {
      const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
      const host = url.hostname;
      if (host === "shopify.com" || host.endsWith(".shopify.com")) {
        const parts = url.pathname.split("/").filter(Boolean);
        const idx = parts.findIndex((p) => p === "store" || p === "stores");
        if (idx !== -1 && parts[idx + 1]) return `${parts[idx + 1]}.myshopify.com`;
      }
      if (host.endsWith(".myshopify.com")) return host;
      return host;
    } catch {
      const withoutProto = raw.replace(/^https?:\/\//, "");
      const host = withoutProto.split("/")[0];
      return host;
    }
  }

  async function handleConnect() {
    if (!experienceId) return;
    const b = normalizeBaseUrl(apiBase);
    if (!b) { setError("API base URL is not configured"); return; }
    const normalized = normalizeShopDomain(shopDomain);
    if (!/\.myshopify\.com$/i.test(normalized)) { setError("Enter a myshopify.com domain"); return; }

    setIsConnecting(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}?connected=1&shop=${encodeURIComponent(normalized)}`;
      const qs = new URLSearchParams({ shop: normalized, experienceId: String(experienceId), returnUrl });
      const resp = await fetch(`/api/shopify/install/start?${qs.toString()}`, { headers: { Accept: "application/json" } });
      if (!resp.ok) {
        const m = await resp.json().catch(() => null);
        throw new Error(m?.error || `Failed to start install (${resp.status})`);
      }
      const json = await resp.json();
      const installUrl = json.installUrl as string;
      if (!installUrl) throw new Error("Missing installUrl");
      window.location.href = installUrl;
    } catch (e: any) {
      setError(e.message || "Failed to start install");
      setIsConnecting(false);
    }
  }

  const handleLoadProducts = async () => {
    setError(null);
    setLoading(true);
    try {
      const b = normalizeBaseUrl(apiBase);
      if (!b) throw new Error("API base URL is not configured");
      if (!experienceId) throw new Error("Missing experienceId");
      const url = `${b}/shopify/products?experienceId=${encodeURIComponent(experienceId)}&ngrok-skip-browser-warning=true`;
      const res = await fetch(url, { headers: { "Accept": "application/json", "ngrok-skip-browser-warning": "true" } });
      const ct = res.headers.get("content-type") || "";
      if (!ct.toLowerCase().includes("application/json")) {
        const text = await res.text().catch(() => "");
        throw new Error(`Expected JSON from ${new URL(url).host}, got ${ct || "unknown"}`);
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({} as any));
        throw new Error(errJson?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const items: Product[] = (data.products ?? []).map((n: any) => ({
        id: n.id,
        title: n.title,
        imageUrl: n.imageUrl ?? null,
        price: n.price ?? null,
        variantId: n.variantId ?? null,
        description: n.description ?? null,
        vendor: n.vendor ?? null,
        productType: n.productType ?? null,
        tags: n.tags ?? [],
        createdAt: n.createdAt ?? null,
        updatedAt: n.updatedAt ?? null,
        status: n.status ?? null,
        totalInventory: n.totalInventory ?? null,
      }));
      
      // Add 2-second delay for cool loading effect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProducts(items);
    } catch (e: any) {
      setError(e.message ?? "Error");
    } finally {
      setLoading(false);
      setIsConnecting(false);
    }
  };

  const handleBuyNow = async (p: Product) => {
    if (!p?.variantId) { setError("No variant available for this product"); return; }
    setError(null);
    setCheckingOutId(p.id);
    try {
      const b = normalizeBaseUrl(apiBase);
      if (!b) throw new Error("API base URL is not configured");
      if (!experienceId) throw new Error("Missing experienceId");
      const url = `${b}/shopify/cart/create`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ experienceId, lines: [{ variantId: p.variantId, quantity: 1 }] })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const checkoutUrl = json?.checkoutUrl as string | undefined;
      if (!checkoutUrl) throw new Error("Missing checkoutUrl");
      window.location.href = checkoutUrl;
    } catch (e: any) {
      setError(e?.message || "Failed to start checkout");
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleDeleteStore = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("shop_domain");
    }
    setShopDomain("");
    setEditingShopDomain("");
    setProducts([]);
    setIsConnected(false);
    setShowSettingsModal(false);
    setError(null);
  };

  const handleUpdateStore = () => {
    const normalized = normalizeShopDomain(editingShopDomain);
    if (!/\.myshopify\.com$/i.test(normalized)) {
      setError("Enter a valid myshopify.com domain");
      return;
    }
    setShopDomain(normalized);
    setEditingShopDomain(normalized);
    setShowSettingsModal(false);
    setError(null);
    // Reload products with new store
    handleLoadProducts();
  };

  return (
    <>
      <Head>
        <title>Storefront Setup</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, backgroundColor: "transparent", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: colors.gray12 }}>
            {isConnected ? "Your Store" : "Welcome, let's get you connected."}
          </h1>
          {isConnected && (
            <button
              onClick={() => setShowSettingsModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: `1px solid ${colors.gray6}`,
                background: colors.gray2,
                color: colors.gray11,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              ⚙️ Settings
            </button>
          )}
        </div>

        {!isConnected && (
          <h3 style={{ fontSize: 16, color: colors.gray11, margin: 4, textAlign: "left" , lineHeight: 3}}>
            To get started, please connect your store below.
            <br />
            1. Copy and paste your store domain below.
            <br />
            2. Click the &quot;Connect Your Store&quot; button below.
            <br />
            3. Follow the instructions to connect our app to your Shopify store.
          </h3>
        )}

        {!isConnected && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
              <input
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="yourstore.myshopify.com"
                style={{ 
                  border: `1px solid ${colors.gray6}`, 
                  borderRadius: 8, 
                  padding: 12,
                  backgroundColor: colors.gray2,
                  color: colors.gray12,
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <button 
                onClick={handleConnect} 
                disabled={isConnecting || loading || !shopDomain}
                style={{ 
                  padding: "16px 32px", 
                  borderRadius: 8, 
                  border: "none", 
                  background: isConnecting || loading ? colors.gray4 : colors.violet9, 
                  color: isConnecting || loading ? colors.gray9 : colors.gray12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: isConnecting || loading ? "not-allowed" : "pointer",
                  minWidth: 200
                }}
              >
                {isConnecting || loading ? "Connecting..." : "Connect Your Store"}
              </button>
            </div>
          </>
        )}

        {isConnected && showConnectedToast && (
          <div style={{ 
            padding: 16, 
            backgroundColor: colors.violet3, 
            borderRadius: 8, 
            marginBottom: 16,
            border: `1px solid ${colors.violet6}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: colors.violet11, fontSize: 18 }}>✅</span>
              <span style={{ fontWeight: 600, color: colors.gray12 }}>Connected to {shopDomain}</span>
            </div>
            <div style={{ color: colors.violet11, fontSize: 14 }}>
              Your store is connected and products are loaded below.
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24 }}>
            <SpinnerDotted size={50} color={colors.violet9} />
            <div style={{ marginTop: 16, fontSize: 16, color: colors.gray11 }}>Loading your products...</div>
          </div>
        )}
        {error && (
          <div style={{ padding: 8, color: colors.red11, backgroundColor: colors.red3, borderRadius: 6, border: `1px solid ${colors.red6}` }}>{error}</div>
        )}

        {products.length > 0 && (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", 
            gap: 16, 
            marginTop: 24 
          }}>
            {products.map((item) => (
              <ProductCard key={item.id} product={item} onBuyNow={handleBuyNow} disabled={checkingOutId === item.id} />
            ))}
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.grayA9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: colors.gray2,
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
              border: `1px solid ${colors.gray6}`
            }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 600, color: colors.gray12 }}>Store Settings</h2>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: colors.gray12 }}>
                  Store Domain
                </label>
                <input
                  value={editingShopDomain}
                  onChange={(e) => setEditingShopDomain(e.target.value)}
                  placeholder="yourstore.myshopify.com"
                  style={{ 
                    width: "100%", 
                    border: `1px solid ${colors.gray6}`, 
                    borderRadius: 8, 
                    padding: 12,
                    fontSize: 14,
                    backgroundColor: colors.gray3,
                    color: colors.gray12
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 6,
                    border: `1px solid ${colors.gray6}`,
                    background: colors.gray4,
                    color: colors.gray11,
                    cursor: "pointer",
                    fontSize: 14
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStore}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 6,
                    border: "none",
                    background: colors.violet9,
                    color: colors.gray12,
                    cursor: "pointer",
                    fontSize: 14
                  }}
                >
                  Update Store
                </button>
              </div>

              <div style={{ 
                marginTop: 24, 
                padding: 16, 
                backgroundColor: colors.amber3, 
                borderRadius: 8,
                border: `1px solid ${colors.amber6}`
              }}>
                <div style={{ fontWeight: 600, color: colors.amber11, marginBottom: 8 }}>
                  ⚠️ Danger Zone
                </div>
                <div style={{ color: colors.amber11, fontSize: 14, marginBottom: 12 }}>
                  This will disconnect your store and remove all products.
                </div>
                <button
                  onClick={handleDeleteStore}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: `1px solid ${colors.red6}`,
                    background: colors.red3,
                    color: colors.red11,
                    cursor: "pointer",
                    fontSize: 14
                  }}
                >
                  Delete Store
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default IndexPage;
