import { ChainId, PoolType, Theme } from '@kyber/schema';

export enum TxStatus {
  INIT = 'init',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface ZapMigrationProps {
  theme?: Theme;
  chainId: ChainId;
  rpcUrl?: string;
  className?: string;
  from: {
    poolType: PoolType;
    poolAddress: string;
    positionId: string;
  };
  to?: {
    poolType: PoolType;
    poolAddress: string;
    positionId?: string;
  };
  initialSlippage?: number;
  rePositionMode?: boolean;
  initialTick?: {
    tickLower: number;
    tickUpper: number;
  };
  connectedAccount: {
    address: string | undefined;
    chainId: number;
  };
  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
  client: string;
  referral?: string;
  zapStatus?: Record<string, TxStatus>;
  onExplorePools?: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: {
      sourcePool: string;
      sourceDexLogo: string;
      destinationPool: string;
      destinationDexLogo: string;
    },
  ) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
  onBack?: () => void;
  onClose: () => void;
}
