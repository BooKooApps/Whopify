'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type Product = {
  id: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  handle?: string | null;
  variantId?: string | null;
};

type AnimatedProductCardProps = {
  product: Product;
  index: number;
  shopDomain: string | null;
  experienceId: string;
  isAdmin: boolean;
};

export default function AnimatedProductCard({ product, index, shopDomain, experienceId, isAdmin }: AnimatedProductCardProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenAnimation = localStorage.getItem('whopify-animation-seen');
      if (hasSeenAnimation || !isAdmin) {
        setSkipAnimation(true);
        setHasAnimated(true);
        setIsVisible(true);
        return;
      }
    }

    const fadeInTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    const dealTimer = setTimeout(() => {
      setHasAnimated(true);
      if (index === 0) {
        localStorage.setItem('whopify-animation-seen', 'true');
      }
    }, 800 + (index * 150));

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(dealTimer);
    };
  }, [index, isAdmin]);

  const handleBuyClick = async () => {
    if (!product.variantId) {
      alert('Product not available for purchase');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/shopify/cart/create?experienceId=${encodeURIComponent(experienceId)}&variantId=${encodeURIComponent(product.variantId)}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete purchase');
      }

      if (data.status === 'needs_action' && data.inAppPurchase) {
        alert('Payment requires additional action. Please complete payment in Whop.');
        return;
      }

      if (data.status === 'success') {
        alert(`Purchase successful! Order ${data.order.name} created.`);
        return;
      }

      throw new Error('Unexpected response from server');
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.message || 'Failed to complete purchase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className={`product-card ${isVisible ? 'visible' : ''} ${hasAnimated ? 'animated' : ''} ${skipAnimation ? 'skip-animation' : ''}`}
        style={{ 
          border: "1px solid #ddd", 
          borderRadius: 8, 
          padding: 12, 
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, color: "black", minHeight: 40, display: "flex", alignItems: "center" }}>{product.title}</div>
        <div style={{ height: 160, background: "#f4f4f4", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {product.imageUrl ? (
            <Image 
              src={product.imageUrl} 
              alt={product.title} 
              width={220} 
              height={160} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          ) : (
            <span style={{ color: "black" }}>No Image</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
          <div style={{ fontWeight: 700, color: "black" }}>{product.price ? `$${product.price}` : "Price N/A"}</div>
          {product.variantId && (
            <button 
              onClick={handleBuyClick}
              disabled={isLoading}
              style={{ 
                padding: "8px 12px", 
                border: "none", 
                borderRadius: 6, 
                background: isLoading ? "#9ca3af" : "#5F8A3B", 
                color: "white", 
                cursor: isLoading ? "not-allowed" : "pointer", 
                fontWeight: 600 
              }}
            >
              {isLoading ? "Loading..." : "Buy"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .product-card {
          opacity: 0;
          position: fixed !important;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotateZ(${index * 2}deg);
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6));
          z-index: ${1000 - index};
          max-width: 300px;
          pointer-events: none;
        }

        .product-card.visible {
          animation: fadeInDeck 0.5s ease-out forwards;
          position: fixed !important;
        }

        .product-card.animated {
          animation: dealCard 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          pointer-events: auto;
          position: static !important;
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
          z-index: auto !important;
          width: auto !important;
        }

        .product-card.skip-animation {
          opacity: 1 !important;
          position: static !important;
          transform: none !important;
          filter: none !important;
          z-index: auto !important;
          width: auto !important;
          animation: none !important;
        }

        @keyframes fadeInDeck {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) rotateZ(${index * 2}deg) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) rotateZ(${index * 2}deg) scale(1);
          }
        }

        @keyframes dealCard {
          0% {
            opacity: 1;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotateZ(${index * 2}deg) scale(1);
            filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6));
            z-index: ${1000 - index};
          }
          50% {
            opacity: 1;
            position: fixed;
            transform: translate(-50%, -50%) rotateZ(${index * 8}deg) scale(1.2);
            filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.7));
          }
          100% {
            opacity: 1;
            position: relative;
            top: auto;
            left: auto;
            transform: translate(0, 0) rotateZ(0deg) scale(1);
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
            z-index: 1;
          }
        }
      `}</style>
    </>
  );
}

