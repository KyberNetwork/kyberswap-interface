import { formatAprNumber, formatDisplayNumber } from '@kyber/utils/number';

import { ShareOption, ShareType } from '@/components/ShareModal/types';

// Constants for time calculations
const TIME_CONSTANTS = {
  MINUTE_MS: 1000 * 60,
  HOUR_MS: 1000 * 60 * 60,
  DAY_MS: 1000 * 60 * 60 * 24,
  DAYS_PER_MONTH: 30,
  TIMESTAMP_THRESHOLD: 1e12,
} as const;

// Types for better type safety
export interface Pool {
  address?: string;
  chainId?: number;
  exchange?: string;
  apr?: {
    fees: number;
    eg: number;
    lm: number;
  };
}

interface Position {
  apr: {
    total: number;
    eg: number;
    lm: number;
  };
  createdTime: number;
  totalEarnings: number;
}

interface Reward {
  total: number;
  lm: number;
  eg: number;
}

interface GetValueByOptionParams {
  type: ShareType;
  option?: ShareOption;
  pool: Pool;
  position?: Position;
  reward?: Reward;
}

// Convert timestamp to format like "3 days 4 hrs" or "1 month 3 days" when days > 30
export const formatTimeDurationFromTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const targetTime =
    typeof timestamp === 'number' && timestamp < TIME_CONSTANTS.TIMESTAMP_THRESHOLD ? timestamp * 1000 : timestamp;
  const diffMs = Math.abs(now - targetTime);

  const minutes = Math.floor(diffMs / TIME_CONSTANTS.MINUTE_MS);
  const hours = Math.floor(diffMs / TIME_CONSTANTS.HOUR_MS);
  const days = Math.floor(diffMs / TIME_CONSTANTS.DAY_MS);
  const months = Math.floor(days / TIME_CONSTANTS.DAYS_PER_MONTH);

  if (minutes < 60) {
    return minutes === 1 ? '1 min' : `${minutes} mins`;
  }

  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return hours === 1 ? '1 hr' : `${hours} hrs`;
    }
    const hrText = hours === 1 ? 'hr' : 'hrs';
    const minText = remainingMinutes === 1 ? 'min' : 'mins';
    return `${hours} ${hrText} ${remainingMinutes} ${minText}`;
  }

  if (days <= TIME_CONSTANTS.DAYS_PER_MONTH) {
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return days === 1 ? '1 day' : `${days} days`;
    }
    const dayText = days === 1 ? 'day' : 'days';
    const hrText = remainingHours === 1 ? 'hr' : 'hrs';
    return `${days} ${dayText} ${remainingHours} ${hrText}`;
  }

  // For days > 30, show months and remaining days
  const remainingDays = days % TIME_CONSTANTS.DAYS_PER_MONTH;
  if (remainingDays === 0) {
    return months === 1 ? '1 month' : `${months} months`;
  }
  const monthText = months === 1 ? 'month' : 'months';
  const dayText = remainingDays === 1 ? 'day' : 'days';
  return `${months} ${monthText} ${remainingDays} ${dayText}`;
};

export const getProxyImage = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return `https://proxy.kyberswap.com/token-logo?url=${url}`;
};

export const getSharePath = (type: ShareType, pool: Pool): string => {
  const origin = window?.location?.origin || 'kyberswap.com';

  const path =
    type === ShareType.REWARD_INFO
      ? '/earn/pools?tag=farming_pool'
      : `/earn/pools?poolAddress=${pool.address}&poolChainId=${pool.chainId}&exchange=${pool.exchange}`;

  return `${origin}${path}`;
};

export const getValueByOption = ({ type, option, pool, position, reward }: GetValueByOptionParams): string => {
  if (!option) return '';

  const isPoolSharing = type === ShareType.POOL_INFO;
  const isPositionSharing = type === ShareType.POSITION_INFO;
  const isRewardSharing = type === ShareType.REWARD_INFO;

  if (isPoolSharing) {
    switch (option) {
      case ShareOption.TOTAL_APR:
        return `${formatAprNumber((pool.apr?.fees || 0) + (pool.apr?.eg || 0) + (pool.apr?.lm || 0))}%`;
      case ShareOption.LM_APR:
        return `${formatAprNumber(pool.apr?.lm || 0)}%`;
      case ShareOption.EG_APR:
        return `${formatAprNumber(pool.apr?.eg || 0)}%`;
      default:
        return '';
    }
  } else if (isPositionSharing) {
    switch (option) {
      case ShareOption.TOTAL_EARNINGS:
        return formatDisplayNumber(position?.totalEarnings || 0, {
          significantDigits: 4,
          style: 'currency',
        });
      case ShareOption.TOTAL_APR:
        return `${formatAprNumber(position?.apr?.total || 0)}%`;
      case ShareOption.LM_APR:
        return `${formatAprNumber(position?.apr?.lm || 0)}%`;
      case ShareOption.EG_APR:
        return `${formatAprNumber(position?.apr?.eg || 0)}%`;
      default:
        return '';
    }
  } else if (isRewardSharing) {
    switch (option) {
      case ShareOption.TOTAL_REWARD:
        return formatDisplayNumber(reward?.total || 0, {
          significantDigits: 4,
          style: 'currency',
        });
      case ShareOption.LM_REWARD:
        return formatDisplayNumber(reward?.lm || 0, {
          significantDigits: 4,
          style: 'currency',
        });
      case ShareOption.EG_REWARD:
        return formatDisplayNumber(reward?.eg || 0, {
          significantDigits: 4,
          style: 'currency',
        });
      default:
        return '';
    }
  }

  return '';
};

// Animation effects for staggered number rendering
const STAGGERED_EFFECTS = [
  'translate-y-0 scale-100',
  'translate-y-0 scale-100',
  '-translate-y-0.5 scale-103',
  '-translate-y-0.2 scale-101',
  'translate-y-0.5 scale-99',
  '-translate-y-0.5 scale-102',
  'translate-y-0 scale-100',
  '-translate-y-0.5 scale-99',
  'translate-y-0.5 scale-101',
] as const;

const SPECIAL_CHARS = ['$', '%'] as const;

export const renderStaggeredNumber = (numberString: string): JSX.Element => {
  const chars = numberString.split('');

  return (
    <span className="inline-flex items-baseline">
      {chars.map((char, index) => (
        <span
          key={index}
          className={`inline-block ${
            !SPECIAL_CHARS.includes(char as (typeof SPECIAL_CHARS)[number])
              ? STAGGERED_EFFECTS[index % STAGGERED_EFFECTS.length]
              : ''
          } transition-transform duration-300`}
        >
          {char}
        </span>
      ))}
    </span>
  );
};
