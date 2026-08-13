// `/partner-swap` redirects to `/` unless a clientId is present (the partner-attribution gate), so
// every embed URL carries one. This is the route partners actually iframe.
const CLIENT_ID = "kyberswap-demo";
const PROD_ORIGIN = "https://kyberswap.com";

// Point the iframe at a local KyberSwap for the allow-path test with `/?ks=http://localhost:8080`.
export const targetOrigin = new URLSearchParams(window.location.search).get("ks") || PROD_ORIGIN;

export const partnerSwapUrl = (origin: string, chainId: number) =>
  `${origin}/partner-swap?clientId=${CLIENT_ID}&chainId=${chainId}`;

interface Chain {
  id: number;
  label: string;
}

export const CHAINS: Chain[] = [
  { id: 1, label: "Ethereum" },
  { id: 8453, label: "Base" },
  { id: 42161, label: "Arbitrum" },
];
