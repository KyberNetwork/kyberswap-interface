import { useEffect, useState } from 'react';

import { useDebounce } from '@kyber/hooks';
import { API_URLS, type ZapRouteDetail } from '@kyber/schema';

type AprData = {
  totalApr: number;
  feeApr: number;
  egApr: number;
  lmApr: number;
};

type AprEstimationResponse = {
  code: number;
  message: string;
  data: {
    feeApr: number;
    egApr: number;
    lmApr: number;
  };
  requestId: string;
};

export const useEstimatedPositionApr = ({
  chainId,
  poolAddress,
  tickLower,
  tickUpper,
  zapInfo,
  enabled = true,
}: {
  chainId: number;
  poolAddress: string;
  tickLower: number | null;
  tickUpper: number | null;
  zapInfo: ZapRouteDetail | null;
  enabled?: boolean;
}) => {
  const [aprData, setAprData] = useState<AprData | null>(null);
  const [loading, setLoading] = useState(false);

  const debouncedLower = useDebounce(tickLower, 150);
  const debouncedUpper = useDebounce(tickUpper, 150);

  useEffect(() => {
    if (!enabled || !poolAddress || !debouncedLower || !debouncedUpper) {
      setAprData(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchApr = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          poolAddress,
          chainId: chainId.toString(),
          tickLower: debouncedLower.toString(),
          tickUpper: debouncedUpper.toString(),
          positionLiquidity: zapInfo?.positionDetails.addedLiquidity.toString() || '0',
          positionTvl: zapInfo?.positionDetails.addedAmountUsd.toString() || '0',
        });

        const { data }: AprEstimationResponse = await fetch(
          `${API_URLS.ZAP_EARN_API}/v1/apr-estimation?${params.toString()}`,
          { signal: controller.signal },
        ).then(res => res.json());

        setAprData({
          totalApr: (data.feeApr + data.egApr + data.lmApr) * 100,
          feeApr: data.feeApr * 100,
          egApr: data.egApr * 100,
          lmApr: data.lmApr * 100,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchApr();

    return () => controller.abort();
  }, [
    enabled,
    poolAddress,
    chainId,
    debouncedLower,
    debouncedUpper,
    zapInfo?.positionDetails.addedAmountUsd,
    zapInfo?.positionDetails.addedLiquidity,
  ]);

  return {
    data: aprData,
    loading,
  };
};
