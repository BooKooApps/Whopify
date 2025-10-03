'use client';

import { useState } from 'react';
import Image from 'next/image';
import SettingsModal from './SettingsModal';

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
  shopName: string | null;
  products: Product[];
  isConnected: boolean;
};

export default function StorefrontClient({ 
  experienceId, 
  shopDomain, 
  shopName, 
  products, 
  isConnected
}: Props) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!isConnected) {
    return null;
  }

  return (
    <>
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
            onClick={() => setIsSettingsOpen(true)}
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
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        experienceId={experienceId}
      />
    </>
  );
}
