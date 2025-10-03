'use client';

import AnimatedProductCard from './AnimatedProductCard';

type Product = {
  id: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  handle?: string | null;
  variantId?: string | null;
};

type CustomerStorefrontProps = {
  shopDomain: string | null;
  shopName: string | null;
  products: Product[];
  experienceId: string;
};

export default function CustomerStorefront({ shopDomain, shopName, products, experienceId }: CustomerStorefrontProps) {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "white" }}>{shopName || shopDomain || "Storefront"}</h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {products.map((p, index) => (
          <AnimatedProductCard 
            key={p.id} 
            product={p} 
            index={index}
            shopDomain={shopDomain}
            experienceId={experienceId}
            isAdmin={false}
          />
        ))}
      </div>
    </main>
  );
}

