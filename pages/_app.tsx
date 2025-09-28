import "../styles/globals.css";

import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  // Debug: Log every page load
  if (typeof window !== "undefined") {
    console.log("=== CLIENT SIDE DEBUG ===");
    console.log("Current URL:", window.location.href);
    console.log("Current pathname:", window.location.pathname);
    console.log("Current search:", window.location.search);
    console.log("Document referrer:", document.referrer);
    console.log("=========================");
  }
  
  return <Component {...pageProps} />;
}

export default MyApp;
