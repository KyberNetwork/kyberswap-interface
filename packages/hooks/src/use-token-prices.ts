import { useEffect, useState } from 'react';

import { fetchTokenPrice } from '@kyber/utils';

export function useTokenPrices({ addresses, chainId }: { addresses: string[]; chainId: number }) {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<{ [key: string]: number }>(() => {
    return addresses.reduce((acc, address) => {
      return {
        ...acc,
        [address]: { price: 0 },
      };
    }, {});
  });

  useEffect(() => {
    if (addresses.length === 0) {
      setPrices({});
      return;
    }

    fetchTokenPrice({ addresses, chainId })
      .then(prices => {
        setPrices(
          addresses.reduce((acc, address) => {
            return {
              ...acc,
              [address]: prices[address]?.PriceBuy || 0,
            };
          }, {}),
        );
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, addresses.join(',')]);

  return {
    loading,
    prices,
  };
}
