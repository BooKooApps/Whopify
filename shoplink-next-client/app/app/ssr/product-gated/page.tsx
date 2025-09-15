import { getServerWhopClient } from "../../../../lib/get-user-sdk/server";

export default async function Page() {
  const whop = await getServerWhopClient(({} as unknown) as any);
  const entitled = false;
  return (
    <main style={{ padding: 24 }}>
      {entitled ? (
        <div>Hi OwO.</div>
      ) : (
        <div>Not entitled to view this page.</div>
      )}
    </main>
  );
}


