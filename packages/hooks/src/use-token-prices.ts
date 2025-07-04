import { useEffect, useState } from 'react';

import { fetchTokenPrice } from '@kyber/utils';

let refetchInterval: ReturnType<typeof setInterval> | null = null;

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
    const getPrice = async () => {
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
    };

    getPrice();
    refetchInterval = setInterval(getPrice, 10_000);

    return () => {
      if (refetchInterval) {
        clearInterval(refetchInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, addresses.join(',')]);

  return {
    loading,
    prices,
  };
}
