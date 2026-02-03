import { Suspense, lazy, useCallback, useState } from "react";

import { Token } from "@kyber/schema";
import { Dialog, DialogContent, DialogTitle, Loading } from "@kyber/ui";

import TokenImportConfirm from "@/TokenImportConfirm";
import TokenSelector from "@/TokenSelector";
import {
  MAX_TOKENS,
  TOKEN_SELECT_MODE,
  TokenSelectorModalProps,
} from "@/types";
import { useTokenState } from "@/useTokenState";

// Lazy load TokenInfo since it's only shown when viewing token details
const TokenInfo = lazy(() => import("@/TokenInfo"));

/** Loading fallback for lazy-loaded TokenInfo */
const TokenInfoLoader = () => (
  <div className="w-full mx-auto text-white overflow-hidden">
    <div className="flex items-center gap-1 p-4 pb-[14px] animate-pulse">
      <div className="w-[26px] h-[26px] rounded bg-stroke" />
      <div className="w-20 h-5 rounded bg-stroke ml-1" />
      <div className="w-32 h-4 rounded bg-stroke mt-1" />
    </div>
    <div className="flex items-center justify-between px-4 py-2 bg-icon-200">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-stroke" />
        <div className="w-24 h-4 rounded bg-stroke" />
      </div>
    </div>
    <div className="flex flex-col gap-3 px-[26px] py-[14px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between animate-pulse"
        >
          <div className="w-28 h-3 rounded bg-stroke" />
          <div className="w-20 h-3 rounded bg-stroke" />
        </div>
      ))}
    </div>
    <div className="flex justify-center py-4">
      <Loading className="text-accent w-6 h-6" />
    </div>
  </div>
);

const TokenModal = ({
  tokensIn = [],
  amountsIn = "",
  account,
  title,
  chainId,
  mode = TOKEN_SELECT_MODE.SELECT,
  selectedTokenAddress,
  positionId,
  poolAddress,
  token0Address = "",
  token1Address = "",
  showUserPositions = false,
  positionsOnly = false,
  setTokensIn,
  setAmountsIn,
  onTokenSelect,
  onConnectWallet,
  onSelectLiquiditySource,
  onClose,
  initialSlippage,
}: TokenSelectorModalProps) => {
  const { importToken } = useTokenState();

  const [tokenToShow, setTokenToShow] = useState<Token | null>(null);
  const [tokenToImport, setTokenToImport] = useState<Token | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([...tokensIn]);

  const handleGoBackFromTokenInfo = useCallback(() => {
    setTokenToShow(null);
  }, []);

  const handleGoBackFromImport = useCallback(() => {
    setTokenToImport(null);
  }, []);

  const handleSetTokenToShow = useCallback((token: Token) => {
    setTokenToShow(token);
  }, []);

  const handleSetTokenToImport = useCallback((token: Token) => {
    setTokenToImport(token);
  }, []);

  const handleConfirmImportToken = useCallback(() => {
    if (!tokenToImport) return;
    importToken(tokenToImport);
    if (mode === TOKEN_SELECT_MODE.SELECT) {
      // Handle SELECT mode
      if (setTokensIn && setAmountsIn) {
        const index = tokensIn.findIndex(
          (tokenIn: Token) => tokenIn.address === selectedTokenAddress,
        );
        if (index > -1) {
          const clonedTokensIn = [...tokensIn];
          clonedTokensIn[index] = tokenToImport;
          setTokensIn(clonedTokensIn);

          const listAmountsIn = amountsIn.split(",");
          listAmountsIn[index] = "";
          setAmountsIn(listAmountsIn.join(","));

          onClose();
        }
      } else if (onTokenSelect) {
        // Simple mode with just onTokenSelect callback
        onTokenSelect(tokenToImport);
        onClose();
      }
    } else if (
      (selectedTokens || []).length < MAX_TOKENS &&
      setTokensIn &&
      setAmountsIn
    ) {
      const clonedTokensIn = [...tokensIn];
      clonedTokensIn.push(tokenToImport);
      setTokensIn(clonedTokensIn);
      setAmountsIn(`${amountsIn},`);
    }
    setTokenToImport(null);
  }, [
    amountsIn,
    importToken,
    mode,
    onClose,
    onTokenSelect,
    selectedTokenAddress,
    selectedTokens,
    setAmountsIn,
    setTokensIn,
    tokenToImport,
    tokensIn,
  ]);

  const isSelectorView = !tokenToShow && !tokenToImport;

  return (
    <Dialog onOpenChange={onClose} open={true}>
      <DialogContent
        containerClassName="ks-token-selector"
        className={
          `bg-layer2 p-0 !max-h-[min(80vh,640px)] ` +
          `${isSelectorView ? "h-[80vh] pb-6 overflow-hidden " : "overflow-y-auto "}` +
          `${tokenToImport ? "max-w-[420px]" : "max-w-[435px]"}`
        }
        skipClose
        aria-describedby={undefined}
      >
        <DialogTitle className="hidden" />
        {tokenToShow ? (
          <Suspense fallback={<TokenInfoLoader />}>
            <TokenInfo
              token={tokenToShow}
              chainId={chainId}
              onGoBack={handleGoBackFromTokenInfo}
            />
          </Suspense>
        ) : tokenToImport ? (
          <TokenImportConfirm
            chainId={chainId}
            token={tokenToImport}
            handleConfirmImportToken={handleConfirmImportToken}
            onGoBack={handleGoBackFromImport}
            onClose={onClose}
          />
        ) : (
          <TokenSelector
            tokensIn={tokensIn}
            amountsIn={amountsIn}
            setTokensIn={setTokensIn}
            setAmountsIn={setAmountsIn}
            account={account}
            title={title}
            selectedTokenAddress={selectedTokenAddress}
            mode={mode}
            chainId={chainId}
            positionId={positionId}
            token0Address={token0Address}
            token1Address={token1Address}
            poolAddress={poolAddress}
            showUserPositions={showUserPositions}
            positionsOnly={positionsOnly}
            onTokenSelect={onTokenSelect}
            onConnectWallet={onConnectWallet}
            onSelectLiquiditySource={onSelectLiquiditySource}
            selectedTokens={selectedTokens}
            setSelectedTokens={setSelectedTokens}
            setTokenToShow={handleSetTokenToShow}
            setTokenToImport={handleSetTokenToImport}
            onClose={onClose}
            initialSlippage={initialSlippage}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TokenModal;
