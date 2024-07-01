import { createContext, ReactNode, useContext } from "react";
import usePoolInfo from "./usePoolInfo";
import { defaultTheme, Theme } from "../theme";
import { PancakeV3Pool } from "../entities/Pool";
import { Position } from "@pancakeswap/v3-sdk";
import { Address } from "viem";

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
};

const WidgetContext = createContext<ContextState>({
  loading: true,
  pool: null,
  poolAddress: "",
  position: null,
  positionOwner: null,
  theme: defaultTheme,
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
