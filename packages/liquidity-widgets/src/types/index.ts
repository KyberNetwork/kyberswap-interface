import { ApprovalAdditionalInfo } from '@kyber/hooks';
import { ChainId, PoolType, Theme, TxStatus } from '@kyber/schema';

import { SupportedLocale } from '@/i18n';

export { TxStatus };

export interface WidgetProps {
  theme?: Theme;
  chainId: ChainId;
  rpcUrl?: string;
  poolAddress: string;
  positionId?: string;
  poolType: PoolType;
  dexId?: string;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  initDepositTokens?: string;
  initAmounts?: string;
  source: string;
  aggregatorOptions?: {
    includedSources?: string[];
    excludedSources?: string[];
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
  referral?: string;
  fromCreatePoolFlow?: boolean;
  initialTick?: { tickLower: number; tickUpper: number };
  txStatus?: Record<string, TxStatus>;
  txHashMapping?: Record<string, string>;
  locale?: SupportedLocale;
  onClose?: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onOpenZapMigration?: (
    position: {
      exchange: string;
      poolId: string;
      positionId: string | number;
    },
    initialTick?: { tickLower: number; tickUpper: number },
    initialSlippage?: number,
  ) => void;
  onSuccess?: ({ txHash, position }: OnSuccessProps) => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?:
      | {
          type: 'zap';
          tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>;
          pool: string;
          dexLogo: string;
        }
      | ApprovalAdditionalInfo,
  ) => Promise<string>;
  signTypedData?: (account: string, typedDataJson: string) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
  onSetUpSmartExit?: (params: { tokenId: string; chainId: ChainId; poolType: PoolType } | undefined) => void;
}

export interface OnSuccessProps {
  txHash: string;
  position: {
    positionId?: string;
    chainId: number;
    poolType: PoolType;
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

export enum PriceType {
  MinPrice = 'MinPrice',
  MaxPrice = 'MaxPrice',
}

export interface BuildDataWithGas {
  callData: string;
  routerAddress: string;
  value: string;
  gasUsd: number;
}
