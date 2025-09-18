import { GetServerSideProps } from "next";

export default function InstallRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, res } = context;
  const { shop, experienceId, auth, returnUrl } = context.query;
  
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || "localhost";
  const origin = `${proto}://${host}`;
  
  const newUrl = new URL(`${origin}/api/shopify/install`);
  if (shop) newUrl.searchParams.set("shop", String(shop));
  if (experienceId) newUrl.searchParams.set("experienceId", String(experienceId));
  if (auth) newUrl.searchParams.set("auth", String(auth));
  if (returnUrl) newUrl.searchParams.set("returnUrl", String(returnUrl));
  
  return {
    redirect: {
      destination: newUrl.toString(),
      permanent: false,
    },
  };
};
