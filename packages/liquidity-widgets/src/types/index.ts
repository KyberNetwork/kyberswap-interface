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
  /**
   * Use KyberSwap's wallet-inventory service as the token selector's balance source on the chains it
   * indexes; a balanceOf multicall serves the rest. Off by default.
   */
  enableWalletInventory?: boolean;
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
          /** The position this zap produces, so a host can show it before the transaction is indexed. */
          position?: OnSuccessProps['position'];
        }
      | ApprovalAdditionalInfo,
  ) => Promise<string>;
  signTypedData?: (account: string, typedDataJson: string) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
  onSetUpSmartExit?: (params: { tokenId: string; chainId: ChainId; poolType: PoolType } | undefined) => void;
  onEvent?: (eventName: string, data?: Record<string, any>) => void;
  onOpenPoolDetail?: (pool: { chainId: number; poolAddress: string; dexId?: string }) => void;
}

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
      decimals?: number;
    };
    token1: {
      address: string;
      symbol: string;
      logo: string;
      amount: number;
      decimals?: number;
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
