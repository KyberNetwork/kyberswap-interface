export enum ShareType {
  POOL_INFO = 'pool',
  POSITION_INFO = 'position',
  REWARD_INFO = 'reward',
}

export enum ShareOption {
  TOTAL_APR = 'Total APR',
  ACTIVE_APR = 'Active APR',
  REWARD_APR = 'Reward APR',
  EG_APR = 'EG Sharing APR',
  TOTAL_EARNINGS = 'Total Earnings',
  TOTAL_REWARD = 'Total Rewards',
  REWARD = 'Reward',
  EG_REWARD = 'EG Sharing rewards',
}

export interface ShareModalProps {
  type: ShareType;
  /** Pre-built absolute share URL. When provided, used as-is instead of letting getSharePath build the legacy query-param form. */
  url?: string;
  isFarming?: boolean;
  hasActiveApr?: boolean;
  defaultOptions?: ShareOption[];
  pool?: {
    feeTier?: number;
    address?: string;
    chainId?: number;
    chainLogo?: string;
    dexLogo: string;
    dexName: string;
    exchange?: string;
    token0?: {
      symbol: string;
      logo: string;
    };
    token1?: {
      symbol: string;
      logo: string;
    };
    apr?: {
      fees: number;
      eg: number;
      /** Farming LM APR plus external campaign (Merkl) bonus APR. */
      reward: number;
      activeTotal?: number;
      activeEg?: number;
      /** Active-liquidity counterpart of `reward`. */
      activeReward?: number;
    };
  };
  position?: {
    apr: {
      total: number;
      eg: number;
      /** Farming LM APR plus external campaign (Merkl) bonus APR. */
      reward: number;
    };
    createdTime: number;
    totalEarnings: number;
  };
  reward?: {
    total: number;
    /** Farming LM rewards plus external campaign (Merkl) rewards, in USD. */
    reward: number;
    eg: number;
  };
  onClose: () => void;
}
