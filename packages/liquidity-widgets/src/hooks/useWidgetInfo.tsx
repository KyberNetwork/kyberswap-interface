import { createContext, ReactNode, useContext, useMemo } from "react";
import { useUniV3PoolInfo, usePancakeV3PoolInfo } from "./usePoolInfo";
import { PoolAdapter } from "../entities/Pool";
import { PoolType } from "../constants";
import { defaultTheme, Theme } from "../theme";
import { PositionAdaper } from "../entities/Position";
import { assertUnreachable } from "../utils";

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
  error?: string;
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
  position?: PositionAdaper;
  theme: Theme;
  feeAddress?: string;
  feePcm?: number;
  error?: string;
};

const PancakeV3Provider = ({
  poolAddress,
  children,
  positionId,
  ...rest
}: Omit<Props, "poolType">) => {
  const { loading, pool, position, error } = usePancakeV3PoolInfo(
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
        error,
        ...rest,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

const UniV3Provider = ({
  poolAddress,
  children,
  positionId,
  poolType,
  ...rest
}: Props) => {
  const { loading, pool, position, error } = useUniV3PoolInfo(
    poolAddress,
    positionId,
    poolType
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
        poolType,
        error,
        ...rest,
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
  if (
    props.poolType === PoolType.DEX_UNISWAPV3 ||
    props.poolType === PoolType.DEX_SWAPMODEV3 ||
    props.poolType === PoolType.DEX_METAVAULTV3 ||
    props.poolType === PoolType.DEX_LINEHUBV3
  ) {
    return <UniV3Provider {...props} />;
  }

  return assertUnreachable(props.poolType);
};

export const useWidgetInfo = () => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidgetInfo must be used within a WidgetProvider");
  }
  return context;
};
