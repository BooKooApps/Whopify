'use client';

import { useState } from 'react';

type CartItem = {
  variantId: string;
  productId: string;
  title: string;
  price: string;
  imageUrl: string | null;
  quantity: number;
};

type CartProps = {
  items: CartItem[];
  onClose: () => void;
  onRemoveItem: (variantId: string) => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onCheckout: () => Promise<void>;
  experienceId: string;
  userId: string;
};

export default function Cart({ items, onClose, onRemoveItem, onUpdateQuantity, onCheckout, experienceId, userId }: CartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      await onCheckout();
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
            Shopping Cart ({items.length})
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0 8px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20
        }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
              Your cart is empty
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item) => (
                <div key={item.variantId} style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 6,
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{item.title}</div>
                    <div style={{ fontWeight: 700, color: '#1f2937' }}>${item.price}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => onUpdateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                        style={{
                          padding: '4px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 4,
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: 'black'
                        }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 30, textAlign: 'center', color: '#1f2937' }}>{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                        style={{
                          padding: '4px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 4,
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: 'black'
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.variantId)}
                        style={{
                          marginLeft: 'auto',
                          padding: '4px 12px',
                          border: 'none',
                          borderRadius: 4,
                          background: '#ef4444',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: 14
                        }}
                      >
                        Remove from Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={{
            padding: 20,
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>Total:</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              style={{
                width: '100%',
                padding: '12px 24px',
                border: 'none',
                borderRadius: 6,
                background: isCheckingOut ? '#9ca3af' : '#5F8A3B',
                color: 'white',
                cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 16
              }}
            >
              {isCheckingOut ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
