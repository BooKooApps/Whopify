'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  currentShopName?: string;
}

export default function SettingsModal({ isOpen, onClose, experienceId, currentShopName }: SettingsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [shopName, setShopName] = useState(currentShopName || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShopName(currentShopName || '');
    }
  }, [isOpen, currentShopName]);

  const handleSaveName = async () => {
    if (!shopName.trim()) {
      alert('Store name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/shopify/update-name?experienceId=${encodeURIComponent(experienceId)}&name=${encodeURIComponent(shopName)}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        onClose();
        window.location.reload();
      } else {
        alert('Failed to update store name: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating store name:', error);
      alert('Failed to update store name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseStore = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsClosing(true);
    try {
      const response = await fetch(`/api/shopify/close-store?experienceId=${encodeURIComponent(experienceId)}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        onClose();
        window.location.reload();
      } else {
        alert('Failed to close store: ' + data.error);
      }
    } catch (error) {
      console.error('Error closing store:', error);
      alert('Failed to close store. Please try again.');
    } finally {
      setIsClosing(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 24,
        maxWidth: 400,
        width: '90%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
          Store Settings
        </h2>
        
        {!showConfirm ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#374151', fontSize: 14, fontWeight: 500 }}>
                Store Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Enter store name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: 12 }}>
                This is the display name for your store
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginBottom: 20 }}>
              <button
                onClick={handleCloseStore}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #dc2626',
                  background: 'white',
                  color: '#dc2626',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Close Store
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    color: '#374151',
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: isSaving ? '#9ca3af' : '#5F8A3B',
                    color: 'white',
                    fontSize: 14,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: 16, fontWeight: 500 }}>
                Are you sure you want to close your store?
              </p>
              <p style={{ margin: '0', color: '#6b7280', fontSize: 14 }}>
                This action will close your store and it will no longer be accessible. This action cannot be undone.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCloseStore}
                disabled={isClosing}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: isClosing ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  fontSize: 14,
                  cursor: isClosing ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                {isClosing ? 'Closing...' : 'Yes, Close Store'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isClosing}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontSize: 14,
                  cursor: isClosing ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
