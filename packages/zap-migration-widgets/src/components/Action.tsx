import { DexInfos, NetworkInfo, ZERO_ADDRESS } from "../constants";
import { useNftApproval } from "../hooks/use-nft-approval";
import { ChainId, Token, univ2Dexes } from "../schema";
import { usePoolsStore } from "../stores/usePoolsStore";
import { usePositionStore } from "../stores/usePositionStore";
import { RefundAction, useZapStateStore } from "../stores/useZapStateStore";
import { PI_LEVEL } from "../utils";
import { useSwapPI } from "./SwapImpact";
import { useDebounce } from "@kyber/hooks/use-debounce";
import { InfoHelper } from "@kyber/ui/info-helper";
import { formatTokenAmount } from "@kyber/utils/number";
import { cn } from "@kyber/utils/tailwind-helpers";
import { useEffect, useState } from "react";

export function Action({
  chainId,
  onSwitchChain,
  onConnectWallet,
  connectedAccount,
  onClose,
  onSubmitTx,
  client,
}: {
  chainId: ChainId;
  connectedAccount: {
    address: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onClose: () => void;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
  }) => Promise<string>;
  client: string;
}) {
  const { pools } = usePoolsStore();
  const { fromPosition: position } = usePositionStore();

  const {
    toggleSetting,
    fetchZapRoute,
    tickUpper,
    tickLower,
    liquidityOut,
    route,
    fetchingRoute,
    togglePreview,
    showPreview,
    degenMode,
  } = useZapStateStore();

  const isTargetUniv2 =
    pools !== "loading" && univ2Dexes.includes(pools[1].dex);

  const nftManager =
    pools === "loading" ? undefined : DexInfos[pools[0].dex].nftManagerContract;

  const {
    isChecking,
    isApproved: approved,
    approve,
    pendingTx,
  } = useNftApproval({
    rpcUrl: NetworkInfo[chainId].defaultRpc,
    nftManagerContract: nftManager
      ? typeof nftManager === "string"
        ? nftManager
        : nftManager[chainId]
      : undefined,
    nftId: position === "loading" ? undefined : +position.id,
    spender: route?.routerAddress,
    account: connectedAccount.address,
    onSubmitTx,
  });
  const isApproved = approved && !isChecking;

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);
  const debouncedTickUpper = useDebounce(tickUpper, 500);
  const debouncedTickLower = useDebounce(tickLower, 500);

  useEffect(() => {
    if (showPreview) return;
    fetchZapRoute(chainId, client, connectedAccount?.address || ZERO_ADDRESS);
  }, [
    pools,
    position,
    fetchZapRoute,
    debouncedTickUpper,
    debouncedTickLower,
    debounceLiquidityOut,
    showPreview,
    connectedAccount?.address,
    chainId,
    client,
  ]);

  const { swapPiRes } = useSwapPI(chainId);
  const pi = {
    piHigh: swapPiRes.piRes.level === PI_LEVEL.HIGH,
    piVeryHigh: swapPiRes.piRes.level === PI_LEVEL.VERY_HIGH,
  };

  const [clickedApprove, setClickedApprove] = useState(false);

  let btnText = "";
  if (fetchingRoute) btnText = "Fetching Route...";
  else if (liquidityOut === 0n) btnText = "Select Liquidity to Migrate";
  else if (!isTargetUniv2) {
    if (tickLower === null || tickUpper === null)
      btnText = "Select Price Range";
    else if (tickLower >= tickUpper) btnText = "Invalid Price Range";
  } else if (route === null) btnText = "No Route Found";
  else if (!connectedAccount.address) btnText = "Connect Wallet";
  else if (connectedAccount.chainId !== chainId) btnText = "Switch Network";
  else if (isChecking) btnText = "Checking Allowance";
  else if (pendingTx || clickedApprove) btnText = "Approving...";
  else if (!isApproved) btnText = "Approve";
  else if (pi.piVeryHigh) btnText = "Zap anyway";
  else if (!route) btnText = "No Route Found";
  else btnText = "Preview";

  const disableBtn =
    fetchingRoute ||
    route === null ||
    liquidityOut === 0n ||
    (!isTargetUniv2 &&
      (tickLower === null || tickUpper === null || tickLower >= tickUpper)) ||
    isChecking ||
    !!pendingTx ||
    clickedApprove;

  const handleClick = async () => {
    if (!connectedAccount.address) onConnectWallet();
    else if (connectedAccount.chainId !== chainId) onSwitchChain();
    else if (!isApproved) {
      setClickedApprove(true);
      await approve().finally(() => setClickedApprove(false));
    } else if (pi.piVeryHigh && !degenMode) {
      toggleSetting(true);
      document
        .getElementById("zapout-setting")
        ?.scrollIntoView({ behavior: "smooth" });
    } else togglePreview();
  };

  const refundInfo = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | null;

  const tokens: Token[] =
    pools === "loading"
      ? []
      : [pools[0].token0, pools[0].token1, pools[1].token0, pools[1].token1];
  const refunds: { amount: string; symbol: string }[] = [];
  refundInfo?.refund.tokens.forEach((refund) => {
    const token = tokens.find(
      (t) => t.address.toLowerCase() === refund.address.toLowerCase()
    );
    if (token) {
      refunds.push({
        amount: formatTokenAmount(BigInt(refund.amount), token.decimals),
        symbol: token.symbol,
      });
    }
  });

  return (
    <div className="flex gap-5 mt-8">
      <button
        className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
        onClick={onClose}
      >
        Cancel
      </button>
      <button
        className={cn(
          "flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium",
          "disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed",
          !disableBtn && isApproved
            ? pi.piVeryHigh
              ? "bg-error border-solid border-error text-white"
              : pi.piHigh
              ? "bg-warning border-solid border-warning"
              : ""
            : ""
        )}
        disabled={disableBtn}
        onClick={handleClick}
      >
        {btnText}

        {pi.piVeryHigh && (
          <InfoHelper
            color="#ffffff"
            width="300px"
            text={
              degenMode
                ? "You have turned on Degen Mode from settings. Trades with very high price impact can be executed"
                : "To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings."
            }
          />
        )}
      </button>
    </div>
  );
}
