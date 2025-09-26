export default function Unauthorized() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Access requires Whop</h1>
      <p style={{ marginTop: 12, fontSize: 16 }}>
        This page must be opened from the Whop platform.
      </p>
      <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
        If you reached this URL directly (e.g., from a bookmark or by typing it in),
        please return to Whop and open the app from there so we can verify your role
        (merchant vs customer) and grant access.
      </p>
      <div style={{ marginTop: 16, fontSize: 14 }}>
        Merchant: open this app from your Whop dashboard so we can establish your session.
        <br/>
        Customer: follow the link provided inside Whop for the experience you own.
      </div>
    </main>
  );
}


