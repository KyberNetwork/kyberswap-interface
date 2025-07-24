import { ChainId, Pool, PoolType, Theme, Token, ZapRouteDetail } from '@kyber/schema';

export interface WidgetProps {
  theme?: Theme;
  poolAddress: string;
  positionId?: string;
  poolType: PoolType;
  chainId: ChainId;
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
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onOpenZapMigration?: (
    position: {
      exchange: string;
      poolId: string;
      positionId: string | number;
    },
    initialTick?: { tickLower: number; tickUpper: number },
  ) => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
}

export enum PriceType {
  PriceLower = 'PriceLower',
  PriceUpper = 'PriceUpper',
}

export interface ZapState {
  pool: Pool;
  zapInfo: ZapRouteDetail;
  tokensIn: Token[];
  amountsIn: string;
  deadline: number;
  isFullRange: boolean;
  slippage: number;
  tickLower: number;
  tickUpper: number;
}
