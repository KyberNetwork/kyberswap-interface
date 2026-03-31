import { ApprovalAdditionalInfo } from '@kyber/hooks';
import { ChainId, PoolType, Theme, TxStatus } from '@kyber/schema';

import { SupportedLocale } from '@/i18n';

export { TxStatus };

export interface OnSuccessProps {
  txHash: string;
  position: {
    positionId?: string;
    chainId: number;
    dexLogo: string;
    token0: {
      address: string;
      symbol: string;
      logo: string;
      amount: number;
    };
    token1: {
      address: string;
      symbol: string;
      logo: string;
      amount: number;
    };
    pool: {
      address: string;
      fee: number;
    };
    value: number;
    createdAt: number;
  };
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
    dexId?: string;
  };
  to?: {
    poolType: PoolType;
    poolAddress: string;
    positionId?: string;
    dexId?: string;
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
  txStatus?: Record<string, TxStatus>;
  txHashMapping?: Record<string, string>;
  locale?: SupportedLocale;
  onExplorePools?: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?:
      | {
          type: 'zap';
          sourcePool: string;
          sourceDexLogo: string;
          destinationPool: string;
          destinationDexLogo: string;
        }
      | ApprovalAdditionalInfo,
  ) => Promise<string>;
  signTypedData?: (account: string, typedDataJson: string) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
  onSuccess?: (props: OnSuccessProps) => void;
  onBack?: () => void;
  onClose: () => void;
}
