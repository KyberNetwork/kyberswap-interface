import { useEffect, useState } from 'react';

import { API_URLS, ChainId } from '@kyber/schema';

interface Honeypot {
  isHoneypot: boolean;
  isFOT: boolean;
  tax: number;
}

const checkTokenHoneypot = async (tokenAddress: string, chainId: ChainId) => {
  const response = await fetch(
    `${API_URLS.TOKEN_API}/v1/public/tokens/honeypot-fot-info?address=${tokenAddress.toLowerCase()}&chainId=${chainId}`,
  ).then(res => res.json());

  return response.data;
};

export function usePairHoneypot(tokenAddresses: string[], chainId: ChainId) {
  const [honeypots, setHoneypots] = useState<Honeypot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHoneypots = async () => {
      if (tokenAddresses.length === 0 || honeypots.length > 0 || loading) return;
      setLoading(true);

      const newHoneypots = await Promise.all(
        tokenAddresses.map(tokenAddress => checkTokenHoneypot(tokenAddress, chainId)),
      );
      setHoneypots(newHoneypots);
      setLoading(false);
    };

    fetchHoneypots();
  }, [chainId, tokenAddresses, honeypots, loading]);

  return honeypots;
}
