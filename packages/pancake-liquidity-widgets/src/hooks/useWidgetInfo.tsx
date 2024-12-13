import { createContext, ReactNode, useContext } from "react";
import { Address } from "viem";
import usePoolInfo from "@/hooks/usePoolInfo";
import { defaultTheme, Theme } from "@/theme";
import { PancakeV3Pool } from "@/entities/Pool";
import { Position } from "@pancakeswap/v3-sdk";

type ContextState = {
  loading: boolean;
  poolAddress: string;
  pool: PancakeV3Pool | null;
  positionId?: string;
  position: Position | null;
  positionOwner: Address | null;
  theme: Theme;
  feeAddress?: string;
  feePcm?: number;
  error?: string;
  onConnectWallet: () => void;
  onAddTokens: (tokenAddresses: string) => void;
  onRemoveToken: (tokenAddress: string) => void;
  onAmountChange: (tokenAddress: string, amount: string) => void;
  onOpenTokenSelectModal: () => void;
  farmContractAddresses: string[];
};

const WidgetContext = createContext<ContextState>({
  loading: true,
  pool: null,
  poolAddress: "",
  position: null,
  positionOwner: null,
  theme: defaultTheme,
  onConnectWallet: () => {},
  onAddTokens: () => {},
  onRemoveToken: () => {},
  onAmountChange: () => {},
  onOpenTokenSelectModal: () => {},
  farmContractAddresses: [],
});

type Props = {
  poolAddress: string;
  children: ReactNode;
  positionId?: string;
  position?: Position;
  positionOwner?: Address;
  theme: Theme;
  feeAddress?: string;
  feePcm?: number;
  error?: string;
  onConnectWallet: () => void;
  onAddTokens: (tokenAddresses: string) => void;
  onRemoveToken: (tokenAddress: string) => void;
  onAmountChange: (tokenAddress: string, amount: string) => void;
  onOpenTokenSelectModal: () => void;
  farmContractAddresses: string[];
};

export const WidgetProvider = ({
  poolAddress,
  children,
  positionId,
  ...rest
}: Props) => {
  const { loading, pool, position, error, positionOwner } = usePoolInfo(
    poolAddress,
    positionId
  );

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolAddress,
        pool,
        positionId,
        position,
        positionOwner,
        error,
        ...rest,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidgetInfo = () => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidgetInfo must be used within a WidgetProvider");
  }
  return context;
};
