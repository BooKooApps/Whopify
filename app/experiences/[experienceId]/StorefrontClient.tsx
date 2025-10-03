'use client';

import { useState } from 'react';
import SettingsModal from './SettingsModal';
import AnimatedProductCard from './AnimatedProductCard';

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
          {products.map((p, index) => (
            <AnimatedProductCard 
              key={p.id} 
              product={p} 
              index={index}
              shopDomain={shopDomain}
            />
          ))}
        </div>
      </main>
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        experienceId={experienceId}
        currentShopName={shopName || shopDomain || ''}
      />
    </>
  );
}
