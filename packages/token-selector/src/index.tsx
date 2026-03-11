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
 *   tokenOptions={{
 *     onTokenSelect: (token) => console.log('Selected:', token),
 *   }}
 * />
 * ```
 *
 * @example Multi-token mode (with amounts management)
 * ```tsx
 * <TokenSelectorModal
 *   chainId={1}
 *   onClose={() => setOpen(false)}
 *   tokenOptions={{
 *     mode: TOKEN_SELECT_MODE.ADD,
 *     tokensIn: selectedTokens,
 *     amountsIn: amounts,
 *     setTokensIn: setSelectedTokens,
 *     setAmountsIn: setAmounts,
 *   }}
 * />
 * ```
 *
 * @example With user positions (select existing position as liquidity source)
 * ```tsx
 * <TokenSelectorModal
 *   chainId={1}
 *   onClose={() => setOpen(false)}
 *   wallet={{
 *     account: userAddress,
 *     onConnectWallet: () => openConnectModal(),
 *   }}
 *   tokenOptions={{
 *     token0Address: pool.token0.address,
 *     token1Address: pool.token1.address,
 *   }}
 *   positionOptions={{
 *     showUserPositions: true,
 *     onSelectLiquiditySource: (position) => handleSelectPosition(position),
 *   }}
 * />
 * ```
 */
const TokenSelectorModal = (props: TokenSelectorProps) => {
  const { chainId, wallet, tokenOptions } = props;

  const token0Address = tokenOptions?.token0Address;
  const token1Address = tokenOptions?.token1Address;
  const account = wallet?.account;
  const tokenBalances = tokenOptions?.tokenBalances;

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
  TokenSelectorVariant,
  EarnPosition,
  PositionStatus,
  OnSelectLiquiditySource,
  CustomizeToken,
  // Grouped props interfaces
  WalletOptions,
  TokenOptions,
  PositionOptions,
} from "@/types";

// Export hooks for advanced usage
export { useTokenState, TokenContextProvider } from "@/useTokenState";
export { clearTokenCache } from "@/tokenCache";
