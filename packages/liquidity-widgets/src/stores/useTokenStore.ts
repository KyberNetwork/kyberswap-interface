import { create } from 'zustand';

import { API_URLS, Token } from '@kyber/schema';
import { fetchTokenInfo } from '@kyber/utils';

const TOKEN_API = `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens`;

interface TokenState {
  tokens: Token[];
  importedTokens: Token[];
  fetchImportedTokens: () => void;
  importToken: (token: Token) => void;
  removeImportedToken: (token: Token) => void;
  removeAllImportedTokens: () => void;
  reset: () => void;
  fetchTokens: ({ chainId, defaultAddresses }: { chainId: number; defaultAddresses?: string }) => void;
}

const initState = {
  tokens: [],
  importedTokens: [],
};

export const useTokenStore = create<TokenState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  fetchImportedTokens: () => {
    if (typeof window !== 'undefined') {
      try {
        const localStorageTokens = JSON.parse(localStorage.getItem('importedTokens') || '[]');

        set({ importedTokens: localStorageTokens });
      } catch (e) {
        console.error('Failed to fetch imported tokens from localStorage:', e);
      }
    }
  },
  importToken: (token: Token) => {
    const { importedTokens } = get();
    const newTokens = [...importedTokens.filter(t => t.address !== token.address), token];

    set({ importedTokens: newTokens });

    if (typeof window !== 'undefined') localStorage.setItem('importedTokens', JSON.stringify(newTokens));
  },
  removeImportedToken: (token: Token) => {
    const { importedTokens } = get();
    const newTokens = importedTokens.filter(t => t.address.toLowerCase() !== token.address.toLowerCase());

    set({ importedTokens: newTokens });

    if (typeof window !== 'undefined') localStorage.setItem('importedTokens', JSON.stringify(newTokens));
  },
  removeAllImportedTokens: () => {
    set({ importedTokens: [] });
    if (typeof window !== 'undefined') localStorage.removeItem('importedTokens');
  },
  fetchTokens: async ({ chainId, defaultAddresses }: { chainId: number; defaultAddresses?: string }) => {
    Promise.all([
      fetch(`${TOKEN_API}?pageSize=100&isWhitelisted=true&chainIds=${chainId}&page=1`).then(res => res.json()),
      fetch(`${TOKEN_API}?pageSize=100&isWhitelisted=true&chainIds=${chainId}&page=2`).then(res => res.json()),
      ...(defaultAddresses ? defaultAddresses.split(',').map(address => fetchTokenInfo(address, chainId)) : []),
    ]).then(results => {
      const [res1, res2, ...defaultTokensResults] = results;
      const tokens1 = res1.data.tokens.map((item: Token & { logoURI: string }) => ({
        ...item,
        logo: item.logoURI,
      }));
      const tokens2 = res2.data.tokens.map((item: Token & { logoURI: string }) => ({
        ...item,
        logo: item.logoURI,
      }));
      let mergedTokens = [...tokens1, ...tokens2];
      if (defaultTokensResults.length) {
        // Flatten and filter out tokens already in mergedTokens
        const allDefaultTokens = defaultTokensResults.flat();
        const existingAddresses = new Set(mergedTokens.map(t => t.address.toLowerCase()));
        const newDefaultTokens = allDefaultTokens.filter(t => !existingAddresses.has(t.address.toLowerCase()));
        mergedTokens = [...mergedTokens, ...newDefaultTokens];
      }
      set({ tokens: mergedTokens });
    });
  },
}));
