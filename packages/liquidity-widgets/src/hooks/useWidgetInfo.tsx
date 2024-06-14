import { createContext, ReactNode, useContext, useMemo } from "react";
import { useUniV3PoolInfo, usePancakeV3PoolInfo } from "./usePoolInfo";
import { PoolAdapter } from "../entities/Pool";
import { PoolType } from "../constants";
import { defaultTheme, Theme } from "../theme";
import { PositionAdaper } from "../entities/Position";

type ContextState = {
  loading: boolean;
  poolAddress: string;
  pool: PoolAdapter | null;
  poolType: PoolType;
  positionId?: string;
  position: PositionAdaper | null;
  theme: Theme;
  feeAddress?: string;
  feePcm?: number;
};

const WidgetContext = createContext<ContextState>({
  loading: true,
  pool: null,
  poolType: PoolType.DEX_UNISWAPV3,
  poolAddress: "",
  position: null,
  theme: defaultTheme,
});

type Props = {
  poolAddress: string;
  children: ReactNode;
  poolType: PoolType;
  positionId?: string;
  position?: { tickLower: number; tickUpper: number };
  theme: Theme;
  feeAddress?: string;
  feePcm?: number;
};

const PancakeV3Provider = ({
  poolAddress,
  children,
  positionId,
  theme,
  feeAddress,
  feePcm,
}: Omit<Props, "poolType">) => {
  const { loading, pool, position } = usePancakeV3PoolInfo(
    poolAddress,
    positionId
  );

  const poolAdapter = useMemo(
    () => (pool ? new PoolAdapter(pool) : null),
    [pool]
  );

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolAddress,
        pool: poolAdapter,
        positionId,
        position,
        poolType: PoolType.DEX_PANCAKESWAPV3,
        theme,
        feeAddress,
        feePcm,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

const UniV3Provider = ({
  poolAddress,
  children,
  theme,
  positionId,
  feePcm,
  feeAddress,
}: Omit<Props, "poolType">) => {
  const { loading, pool, position } = useUniV3PoolInfo(poolAddress, positionId);

  const poolAdapter = useMemo(
    () => (pool ? new PoolAdapter(pool) : null),
    [pool]
  );

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolAddress,
        pool: poolAdapter,
        position,
        poolType: PoolType.DEX_UNISWAPV3,
        theme,
        feeAddress,
        feePcm,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

export const WidgetProvider = (props: Props) => {
  if (props.poolType === PoolType.DEX_PANCAKESWAPV3) {
    return <PancakeV3Provider {...props} />;
  }

  return <UniV3Provider {...props} />;
};

export const useWidgetInfo = () => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidgetInfo must be used within a WidgetProvider");
  }
  return context;
};
