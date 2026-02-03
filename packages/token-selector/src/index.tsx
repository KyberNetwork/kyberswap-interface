import TokenModal from "@/TokenModal";
import { TokenContextProvider } from "@/useTokenState";
import {
  TokenSelectorModalProps,
  TOKEN_SELECT_MODE,
  MAX_TOKENS,
} from "@/types";

export interface TokenSelectorProps extends TokenSelectorModalProps {}

/**
 * TokenSelectorModal - A reusable token selection modal component
 *
 * @remarks
 * Remember to import the styles in your application:
 * ```tsx
 * import '@kyber/token-selector/styles.css';
 * ```
 *
 * @example Simple mode (single token selection with callback)
 * ```tsx
 * <TokenSelectorModal
 *   chainId={1}
 *   onClose={() => setOpen(false)}
 *   onTokenSelect={(token) => console.log('Selected:', token)}
 * />
 * ```
 *
 * @example Multi-token mode (with amounts management)
 * ```tsx
 * <TokenSelectorModal
 *   chainId={1}
 *   mode={TOKEN_SELECT_MODE.ADD}
 *   tokensIn={selectedTokens}
 *   amountsIn={amounts}
 *   setTokensIn={setSelectedTokens}
 *   setAmountsIn={setAmounts}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 *
 * @example With user positions (select existing position as liquidity source)
 * ```tsx
 * <TokenSelectorModal
 *   chainId={1}
 *   showUserPositions={true}
 *   account={userAddress}
 *   token0Address={pool.token0.address}
 *   token1Address={pool.token1.address}
 *   onSelectLiquiditySource={(position) => handleSelectPosition(position)}
 *   onConnectWallet={() => openConnectModal()}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */
const TokenSelectorModal = (props: TokenSelectorProps) => {
  const { chainId, token0Address, token1Address, account, tokenBalances } =
    props;

  const additionalTokenAddresses =
    token0Address && token1Address
      ? `${token0Address},${token1Address}`
      : undefined;

  return (
    <TokenContextProvider
      chainId={chainId}
      account={account}
      additionalTokenAddresses={additionalTokenAddresses}
      externalTokenBalances={tokenBalances}
    >
      <TokenModal {...props} />
    </TokenContextProvider>
  );
};

export default TokenSelectorModal;

// Re-export types and constants
export { TOKEN_SELECT_MODE, MAX_TOKENS };
export type {
  TokenSelectorModalProps,
  EarnPosition,
  PositionStatus,
  OnSelectLiquiditySource,
  CustomizeToken,
} from "@/types";

// Export hooks for advanced usage
export { useTokenState, TokenContextProvider } from "@/useTokenState";
export { clearTokenCache } from "@/tokenCache";
