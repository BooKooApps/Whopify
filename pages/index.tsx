import { NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import { getToken } from "next-auth/jwt";
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

type ShopInfo = {
  id: string;
  name: string;
  email: string;
  domain: string;
  myshopifyDomain: string;
  currency: string;
  timezone: string;
  ianaTimezone: string;
  shopOwner: string;
  plan: {
    displayName: string;
    partnerDevelopment: boolean;
    shopifyPlus: boolean;
  };
  address: {
    address1: string;
    address2: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  moneyFormat: string;
  moneyWithCurrencyFormat: string;
  moneyInEmailsFormat: string;
  moneyWithCurrencyInEmailsFormat: string;
  hasDiscounts: boolean;
  hasGiftCards: boolean;
  hasStorefront: boolean;
  setupRequired: boolean;
  forceSsl: boolean;
  checkoutApiSupported: boolean;
  multiLocationEnabled: boolean;
  taxesIncluded: boolean;
  taxShipping: boolean;
  countyTaxes: boolean;
  requiresExtraPaymentsAgreement: boolean;
  passwordEnabled: boolean;
  eligibleForPayments: boolean;
  eligibleForCardReaderGiveaway: boolean;
  finances: boolean;
  primaryDomain: {
    host: string;
    sslEnabled: boolean;
    url: string;
  };
  brand: {
    logo: {
      image: {
        url: string;
        altText: string;
      };
    };
    coverImage: {
      image: {
        url: string;
        altText: string;
      };
    };
  };
  features: {
    storefront: boolean;
    multiLocation: boolean;
    advancedReportBuilder: boolean;
    giftCards: boolean;
    internationalization: boolean;
    manualOrderCreation: boolean;
    draftOrderCreation: boolean;
    customerAccounts: boolean;
    abandonedCheckouts: boolean;
    discountCodes: boolean;
    automaticDiscounts: boolean;
    priceRules: boolean;
    giftCardSales: boolean;
    multiLocationInventory: boolean;
    multiLocationFulfillment: boolean;
    multiLocationReporting: boolean;
    multiLocationInventoryTracking: boolean;
    multiLocationFulfillmentTracking: boolean;
    multiLocationReportingTracking: boolean;
    multiLocationInventoryTrackingTracking: boolean;
    multiLocationFulfillmentTrackingTracking: boolean;
    multiLocationReportingTrackingTracking: boolean;
  };
  billingAddress: {
    address1: string;
    address2: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  customerEmail: string;
  currencyCode: string;
  currencySymbol: string;
  weightUnit: string;
  unitSystem: string;
  timezoneAbbreviation: string;
  timezoneOffset: string;
  createdAt: string;
  updatedAt: string;
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

type IndexPageProps = {
  experienceId: string;
};

const IndexPage: NextPage<IndexPageProps> = ({ experienceId }) => {
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
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loadingShopInfo, setLoadingShopInfo] = useState(false);
  
  const colors = useColors();
  const isMerchantView = true;

  const apiBase = useMemo(() => "", []);

  useEffect(() => {
    const savedShop = typeof window !== "undefined" ? window.localStorage.getItem("shop_domain") : null;
    
    if (savedShop) {
      setShopDomain(savedShop);
      setEditingShopDomain(savedShop);
    }
    
    setTimeout(() => handleLoadShopInfo(), 300);

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const justInstalled = urlParams.get("installed") === "1" || urlParams.get("connected") === "1";
      if (justInstalled) {
        setShowConnectedToast(true);
        setTimeout(() => setShowConnectedToast(false), 3000);
        setTimeout(() => { handleLoadShopInfo(); }, 800);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("shop_domain", shopDomain || "");
  }, [shopDomain]);

  useEffect(() => {
    if (isConnected && shopInfo) {
      handleLoadProducts();
    }
  }, [isConnected, shopInfo]);

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
    const normalized = normalizeShopDomain(shopDomain);
    if (!/\.myshopify\.com$/i.test(normalized)) { setError("Enter a myshopify.com domain"); return; }

    setIsConnecting(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}?installed=1&shop=${encodeURIComponent(normalized)}`;
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

  const handleLoadShopInfo = async () => {
    setLoadingShopInfo(true);
    try {
      const b = normalizeBaseUrl(apiBase) || "";
      if (!experienceId) throw new Error("Missing experienceId");
      const url = `${b || "/api"}/shopify/shop?experienceId=${encodeURIComponent(experienceId)}&ngrok-skip-browser-warning=true`;
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
      setShopInfo(data.shopInfo);
      setIsConnected(true);
      
      if (data.shopInfo?.myshopifyDomain) {
        setShopDomain(data.shopInfo.myshopifyDomain);
        setEditingShopDomain(data.shopInfo.myshopifyDomain);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("shop_domain", data.shopInfo.myshopifyDomain);
        }
      }
    } catch (e: any) {
      console.error("Failed to load shop info:", e.message);
      setIsConnected(false);
    } finally {
      setLoadingShopInfo(false);
    }
  };

  const handleLoadProducts = async () => {
    setError(null);
    setLoading(true);
    try {
      const b = normalizeBaseUrl(apiBase) || "";
      if (!experienceId) throw new Error("Missing experienceId");
      const url = `${b || "/api"}/shopify/products?experienceId=${encodeURIComponent(experienceId)}&ngrok-skip-browser-warning=true`;
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
      const b = normalizeBaseUrl(apiBase) || "";
      if (!experienceId) throw new Error("Missing experienceId");
      const url = `${b || "/api"}/shopify/cart/create`;
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
      window.localStorage.removeItem("is_connected");
    }
    setShopDomain("");
    setEditingShopDomain("");
    setProducts([]);
    setShopInfo(null);
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
    handleLoadShopInfo();
  };

  return (
    <>
      <Head>
        <title>Storefront Setup</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, backgroundColor: "transparent", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: colors.gray12 }}>
              {isConnected ? (shopInfo?.name || "Your Store") : "Welcome, let's get you connected."}
            </h1>
            {isConnected && shopInfo && (
              <div style={{ fontSize: 14, color: colors.gray11, marginTop: 4 }}>
                {/* {shopInfo.domain} • {shopInfo.plan.displayName} • {shopInfo.currency} */}
              </div>
            )}
          </div>
          {isMerchantView && isConnected && (
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
              Your store is connected.
            </div>
          </div>
        )}

        {/* {isConnected && shopInfo && (
          <div style={{ 
            backgroundColor: colors.gray2, 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 24,
            border: `1px solid ${colors.gray6}`,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              {shopInfo.brand?.logo?.image?.url && (
                <img 
                  src={shopInfo.brand.logo.image.url} 
                  alt={shopInfo.brand.logo.image.altText || "Store Logo"}
                  style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 8,
                    objectFit: "cover"
                  }}
                />
              )}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: colors.gray12 }}>
                  {shopInfo.name}
                </h2>
                <div style={{ fontSize: 14, color: colors.gray11 }}>
                  {shopInfo.shopOwner} • {shopInfo.plan.displayName}
                </div>
              </div>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 16,
              marginBottom: 16
            }}>
              <div>
                <div style={{ fontSize: 12, color: colors.gray10, marginBottom: 4 }}>DOMAIN</div>
                <div style={{ fontSize: 14, color: colors.gray12, fontWeight: 500 }}>
                  {shopInfo.domain || shopInfo.myshopifyDomain}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: colors.gray10, marginBottom: 4 }}>CURRENCY</div>
                <div style={{ fontSize: 14, color: colors.gray12, fontWeight: 500 }}>
                  {shopInfo.currency} ({shopInfo.currencyCode})
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: colors.gray10, marginBottom: 4 }}>TIMEZONE</div>
                <div style={{ fontSize: 14, color: colors.gray12, fontWeight: 500 }}>
                  {shopInfo.timezone}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: colors.gray10, marginBottom: 4 }}>EMAIL</div>
                <div style={{ fontSize: 14, color: colors.gray12, fontWeight: 500 }}>
                  {shopInfo.email}
                </div>
              </div>
            </div>

            {shopInfo.address && (shopInfo.address.address1 || shopInfo.address.city) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: colors.gray10, marginBottom: 4 }}>ADDRESS</div>
                <div style={{ fontSize: 14, color: colors.gray12 }}>
                  {[shopInfo.address.address1, shopInfo.address.city, shopInfo.address.province, shopInfo.address.country]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            )}

            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: 8,
              marginBottom: 16
            }}>
              {shopInfo.hasDiscounts && (
                <span style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  backgroundColor: colors.green3,
                  color: colors.green11,
                  borderRadius: 6,
                  fontWeight: 500
                }}>
                  Discounts
                </span>
              )}
              {shopInfo.hasGiftCards && (
                <span style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  backgroundColor: colors.blue3,
                  color: colors.blue11,
                  borderRadius: 6,
                  fontWeight: 500
                }}>
                  Gift Cards
                </span>
              )}
              {shopInfo.multiLocationEnabled && (
                <span style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  backgroundColor: colors.blue3,
                  color: colors.blue11,
                  borderRadius: 6,
                  fontWeight: 500
                }}>
                  Multi-Location
                </span>
              )}
              {shopInfo.plan.shopifyPlus && (
                <span style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  backgroundColor: colors.amber3,
                  color: colors.amber11,
                  borderRadius: 6,
                  fontWeight: 500
                }}>
                  Shopify Plus
                </span>
              )}
              {shopInfo.eligibleForPayments && (
                <span style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  backgroundColor: colors.violet3,
                  color: colors.violet11,
                  borderRadius: 6,
                  fontWeight: 500
                }}>
                  Payments Ready
                </span>
              )}
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
              gap: 12,
              fontSize: 12,
              color: colors.gray10
            }}>
              <div>
                <div style={{ marginBottom: 2 }}>Money Format</div>
                <div style={{ color: colors.gray12, fontSize: 11 }}>{shopInfo.moneyFormat}</div>
              </div>
              <div>
                <div style={{ marginBottom: 2 }}>Weight Unit</div>
                <div style={{ color: colors.gray12, fontSize: 11 }}>{shopInfo.weightUnit}</div>
              </div>
              <div>
                <div style={{ marginBottom: 2 }}>Taxes Included</div>
                <div style={{ color: colors.gray12, fontSize: 11 }}>
                  {shopInfo.taxesIncluded ? "Yes" : "No"}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 2 }}>SSL Enabled</div>
                <div style={{ color: colors.gray12, fontSize: 11 }}>
                  {shopInfo.primaryDomain?.sslEnabled ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>
        )} */}

        {(loading || loadingShopInfo) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24 }}>
            <SpinnerDotted size={50} color={colors.violet9} />
            <div style={{ marginTop: 16, fontSize: 16, color: colors.gray11 }}>
              {loadingShopInfo ? "Loading store information..." : "Loading your products..."}
            </div>
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
        {isMerchantView && showSettingsModal && (
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

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-start" }}>
                <button
                  onClick={handleUpdateStore}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 6,
                    border: "none",
                    background: colors.violet9,
                    color: colors.gray12,
                    cursor: "pointer",
                    fontSize: 14,
                    display: `${editingShopDomain === shopDomain ? "none" : "block"}`
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
              <br/>
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
                  Close
                </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default IndexPage;

function parseCookie(header: string | undefined) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(/;\s*/).forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

export const getServerSideProps: GetServerSideProps<IndexPageProps> = async (ctx) => {
  // Debug: Log Whop user info
  try {
    const cookies = parseCookie(ctx.req.headers.cookie);
    const bearer = cookies["whop_user_token"] || (ctx.req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    console.log("=== WHOP DEBUG ===");
    console.log("Request URL:", ctx.req.url);
    console.log("Request headers:", Object.keys(ctx.req.headers));
    console.log("Cookies:", Object.keys(cookies));
    console.log("Has whop_user_token:", !!cookies["whop_user_token"]);
    console.log("Bearer token present:", !!bearer);
    console.log("Referer:", ctx.req.headers.referer);
    console.log("User-Agent:", ctx.req.headers['user-agent']);
    
    // Check for other possible Whop tokens
    const allCookies = Object.keys(cookies);
    const whopCookies = allCookies.filter(name => name.toLowerCase().includes('whop'));
    console.log("Whop-related cookies:", whopCookies);
    
    if (bearer) {
      const base = process.env.WHOP_API_BASE_URL || "https://api.whop.com";
      const response = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${bearer}` } });
      const me = await response.json().catch(() => ({} as any));
      console.log("Whop /me response:", response.status, me);
    }
    console.log("==================");
  } catch (e: any) {
    console.log("Whop debug error:", e?.message);
  }

  // Check if this is a Whop request (customer access)
  const isWhopRequest = ctx.req.headers['user-agent']?.includes('vercel-screenshot') || 
                       ctx.req.headers.referer?.includes('whop.com') ||
                       ctx.req.headers['x-forwarded-host']?.includes('whop.com');
  
  if (isWhopRequest) {
    // This is a Whop customer request - redirect to customer storefront
    // We need to extract the experience ID from the Whop context
    // For now, let's use a default or extract from headers
    const experienceId = ctx.req.headers['x-whop-experience-id'] as string || 'exp_R7TZ3eFqNqQG0H';
    
    return {
      redirect: {
        destination: `/experiences/${experienceId}`,
        permanent: false,
      },
    };
  }

  // This is a direct access - check for merchant authentication
  const token = await getToken({ req: ctx.req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "merchant") {
    return {
      redirect: {
        destination: "/unauthorized",
        permanent: false,
      },
    };
  }

  const experienceId = Array.isArray(token.experiences) && token.experiences.length > 0 ? token.experiences[0] : null;
  if (!experienceId) {
    return {
      redirect: {
        destination: "/unauthorized",
        permanent: false,
      },
    };
  }

  return {
    props: {
      experienceId,
    },
  };
};
