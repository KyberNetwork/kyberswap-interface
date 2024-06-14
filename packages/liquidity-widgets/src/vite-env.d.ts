/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
interface Window {
  ethereum?: {
    on?: (...args: unknown[]) => void;
    removeListener?: (...args: unknown[]) => void;
    request: (params: { method: string; params?: unknown }) => Promise<unknown>;
    selectedProvider?: {
      isCoinbaseBrowser: boolean;
      isCoinbaseWallet: boolean;
      isMetaMask: boolean;
      close?: () => void;
    };
    providers?: unknown[];
    autoRefreshOnNetworkChange?: boolean;
  };
}
