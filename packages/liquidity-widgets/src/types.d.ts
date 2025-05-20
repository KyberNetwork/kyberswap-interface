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

declare module "*.png";

declare module "*.svg" {
  import * as React from "react";
  const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default ReactComponent;
}

declare module "*.svg?url" {
  const src: string;
  export default src;
}
