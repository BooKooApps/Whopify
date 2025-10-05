'use client';

import { useState, useEffect } from 'react';
import AnimatedProductCard from './AnimatedProductCard';
import Cart from './Cart';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Product = {
  id: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  handle?: string | null;
  variantId?: string | null;
};

type CartItem = {
  variantId: string;
  productId: string;
  title: string;
  price: string;
  imageUrl: string | null;
  quantity: number;
};

type CustomerStorefrontProps = {
  shopDomain: string | null;
  shopName: string | null;
  products: Product[];
  experienceId: string;
  userId: string;
};

export default function CustomerStorefront({ shopDomain, shopName, products, experienceId, userId }: CustomerStorefrontProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartBadgeAnimate, setCartBadgeAnimate] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem(`whopify-cart-${experienceId}`);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart from localStorage:', e);
      }
    }
  }, [experienceId]);

  useEffect(() => {
    localStorage.setItem(`whopify-cart-${experienceId}`, JSON.stringify(cartItems));
  }, [cartItems, experienceId]);

  const addToCart = (product: Product) => {
    if (!product.variantId || !product.price) return;
    
    const variantId = product.variantId;
    const price = product.price;
    
    setCartItems(prev => {
      const existing = prev.find(item => item.variantId === variantId);
      if (existing) {
        return prev.map(item =>
          item.variantId === variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        variantId,
        productId: product.id,
        title: product.title,
        price,
        imageUrl: product.imageUrl,
        quantity: 1
      }];
    });

    setCartBadgeAnimate(true);
    setTimeout(() => setCartBadgeAnimate(false), 600);

    toast.success(`Added ${product.title} to cart`, {
      position: "bottom-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: "dark"
    });
  };

  const removeFromCart = (variantId: string) => {
    setCartItems(prev => prev.filter(item => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    setCartItems(prev => 
      prev.map(item =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const handleCheckout = async () => {
    try {
      const response = await fetch(`/api/shopify/cart/create?experienceId=${encodeURIComponent(experienceId)}&userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems })
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
        alert(`Purchase successful! ${data.orders.length} order(s) created.`);
        setCartItems([]);
        localStorage.removeItem(`whopify-cart-${experienceId}`);
        setIsCartOpen(false);
        return;
      }

      throw new Error('Unexpected response from server');
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to complete checkout');
      throw error;
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
              gap: 8,
              position: 'relative'
            }}
            onClick={() => setIsCartOpen(true)}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span 
                className={cartBadgeAnimate ? 'cart-badge-animate' : ''}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {products.map((p, index) => (
            <AnimatedProductCard 
              key={p.id} 
              product={p} 
              index={index}
              shopDomain={shopDomain}
              experienceId={experienceId}
              userId={userId}
              onAddToCart={addToCart}
              isAdmin={false}
            />
          ))}
        </div>
      </main>

      {isCartOpen && (
        <Cart
          items={cartItems}
          onClose={() => setIsCartOpen(false)}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onCheckout={handleCheckout}
          experienceId={experienceId}
          userId={userId}
        />
      )}

      <ToastContainer />

      <style jsx>{`
        .cart-badge-animate {
          animation: popBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes popBounce {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.5);
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          70% {
            transform: scale(1.3) rotate(-10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </>
  );
}

