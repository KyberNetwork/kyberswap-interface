import { useEffect, useMemo, useState } from 'react';

import { CHAIN_ID_TO_CHAIN, ChainId } from '@kyber/schema';
import { fetchTokens } from '@kyber/utils';
import { toRawString } from '@kyber/utils/number';

const BLOCKS_PER_CYCLE = 2016;
const DATA_SERVICE_BASE_URL = 'https://kd-market-service-api.kyberengineering.io';

interface RewardConfigItem {
  tokenAddress: string;
  amountReward: string | number;
}

interface RewardConfigResponse {
  rewardCfg?: RewardConfigItem[];
  startTime?: number;
  endTime?: number;
}

interface RewardCycleProgress {
  symbol: string;
  tokenAddress: string;
  totalReward: number;
  distributedReward: number;
  progress: number;
}

interface RewardCycleState {
  loading: boolean;
  data: RewardCycleProgress | null;
  error: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const useRewardCycleProgress = ({
  chainId,
  poolAddress,
  enabled,
}: {
  chainId: ChainId;
  poolAddress: string;
  enabled: boolean;
}): RewardCycleState => {
  const [state, setState] = useState<RewardCycleState>({ loading: false, data: null, error: '' });

  useEffect(() => {
    if (!enabled || !poolAddress) {
      setState(prev => ({ ...prev, data: null, error: '', loading: false }));
      return;
    }

    const abortController = new AbortController();
    let mounted = true;

    const fetchRewardConfig = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: '' }));

        const chainSlug = CHAIN_ID_TO_CHAIN[chainId];
        if (!chainSlug) {
          throw new Error('Unsupported chain');
        }

        const response = await fetch(`${DATA_SERVICE_BASE_URL}/${chainSlug}/api/v1/reward-config/${poolAddress}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reward data');
        }

        const json = (await response.json()) as RewardConfigResponse;

        const rewardItem = json?.rewardCfg?.[0];
        if (!rewardItem) {
          if (mounted) setState({ loading: false, data: null, error: '' });
          return;
        }

        const [tokenInfo] = await fetchTokens([rewardItem.tokenAddress], chainId);
        const symbol = tokenInfo?.symbol || '';
        const decimals = tokenInfo?.decimals ?? 18;

        const startTime = Number(json?.startTime ?? 0);
        const endTime = Number(json?.endTime ?? 0);

        if (!startTime || !endTime || endTime <= startTime) {
          if (mounted) setState({ loading: false, data: null, error: '' });
          return;
        }

        const totalRewardPerCycle = +toRawString(BigInt(rewardItem.amountReward), decimals) * BLOCKS_PER_CYCLE;

        const now = Math.floor(Date.now() / 1000);
        const duration = Math.max(endTime - startTime, 1);
        const progress = clamp((now - startTime) / duration, 0, 1);
        const distributedReward = totalRewardPerCycle * progress;

        if (mounted) {
          setState({
            loading: false,
            data: {
              symbol,
              tokenAddress: rewardItem.tokenAddress,
              totalReward: totalRewardPerCycle,
              distributedReward,
              progress,
            },
            error: '',
          });
        }
      } catch (error) {
        if (!mounted || abortController.signal.aborted) return;
        setState({ loading: false, data: null, error: error instanceof Error ? error.message : String(error) });
      }
    };

    fetchRewardConfig();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [chainId, poolAddress, enabled]);

  return useMemo(() => state, [state]);
};
