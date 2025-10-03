"use client";

interface ConnectStoreFormProps {
  experienceId: string;
  userName: string;
  userData: any;
}

export default function ConnectStoreForm({ experienceId, userName, userData }: ConnectStoreFormProps) {
  const handleConnect = async () => {
    const input = document.getElementById('shop-input') as HTMLInputElement;
    const shopDomain = input?.value?.trim();
    
    if (!shopDomain) {
      alert('Please enter a shop domain');
      return;
    }
    
    if (!shopDomain.includes('.myshopify.com')) {
      alert('Please enter a valid Shopify domain (e.g., yourstore.myshopify.com)');
      return;
    }
    
    try {
      const baseUrl = window.location.origin;
      const creatorData = encodeURIComponent(JSON.stringify({
        whopUserId: userData.id,
        whopUserName: userData.name,
        whopEmail: userData.email,
        connectedAt: new Date().toISOString(),
        source: 'whop'
      }));
      
      const installUrl = `${baseUrl}/api/shopify/install?shop=${encodeURIComponent(shopDomain)}&experienceId=${encodeURIComponent(experienceId)}&auth=dev-token&returnUrl=${encodeURIComponent(window.location.href)}&creatorData=${creatorData}`;
      
      window.open(installUrl, '_blank');
    } catch (error) {
      alert('Failed to start store connection');
      console.error('Connection error:', error);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "white" }}>
          Welcome {userName}, let&apos;s get you connected.
        </h1>
      </div>

      <h3 style={{ fontSize: 16, color: "white", margin: 4, textAlign: "left", lineHeight: 3 }}>
        To get started, please connect your store below.
        <br />
        1. Copy and paste your store domain below.
        <br />
        2. Click the &quot;Connect Your Store&quot; button below.
        <br />
        3. Follow the instructions to connect our app to your Shopify store.
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
        <input
          id="shop-input"
          placeholder="yourstore.myshopify.com"
          style={{ 
            border: "1px solid #ddd", 
            borderRadius: 8, 
            padding: 12,
            backgroundColor: "white",
            color: "black",
            fontSize: 14
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <button 
          onClick={handleConnect}
          style={{ 
            padding: "16px 32px", 
            borderRadius: 8, 
            border: "none", 
            background: "#8b5cf6", 
            color: "white",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            minWidth: 200
          }}
        >
          Connect Your Store
        </button>
      </div>
    </main>
  );
}
