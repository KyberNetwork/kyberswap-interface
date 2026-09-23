import { ChainId as SchemaChainId } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { t } from '@lingui/macro'
import Portal from '@reach/portal'
import { useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { VaultApiDetailItem } from 'services/vault'

import { ReactComponent as SharesIcon } from 'assets/svg/earn/ic_featured_vault.svg'
import TokenLogo from 'components/TokenLogo'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

/**
 * Amount field and terms for both withdrawal routes: selling the shares through the aggregator, or
 * queueing a redemption with the vault itself. The shares go in at the top and the route that takes
 * them out — along with the token it pays in — sits below the seam.
 */
import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import SlippageSelect from 'pages/Earns/components/VaultDeposit/SlippageSelect'
import {
  AmountInput,
  BalanceButton,
  DetailsBox,
  Field,
  FieldNote,
  FieldRow,
  FieldSeam,
  FieldStack,
  InfoLabel,
  InfoRow,
  InfoValue,
  Pill,
  PillRange,
  ReceiveAmount,
  SegmentedTab,
  SegmentedTabs,
  TokenButton,
  TokenTag,
} from 'pages/Earns/components/VaultDeposit/styles'
import { PERCENT_OPTIONS, WithdrawFormState, WithdrawMode } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { formatTerm } from 'pages/Earns/hooks/useCountdown'
import { useWalletModalToggle } from 'state/application/hooks'
import { isInventoryChain } from 'state/walletInventory/store'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

const WithdrawFields = ({ vault, form }: { vault: VaultApiDetailItem; form: WithdrawFormState }) => {
  const [isSelectorOpen, setSelectorOpen] = useState(false)
  const [isAssetMenuOpen, setAssetMenuOpen] = useState(false)
  const assetMenuRef = useRef<HTMLDivElement>(null)
  const toggleWalletModal = useWalletModalToggle()

  useOnClickOutside(assetMenuRef, () => setAssetMenuOpen(false))

  const shareLogo = vault.shareToken?.logo
  const balanceText = formatDisplayNumber(formatUnits(form.shareBalanceRaw, form.shareDecimals), {
    significantDigits: 6,
  })

  const sharesUsd = form.zapRoute
    ? formatDisplayNumber(form.zapRoute.zapDetails.initialAmountUsd, { style: 'currency', significantDigits: 4 })
    : undefined

  const amountOut = form.isNative
    ? form.nativeAmountOut !== undefined && form.nativeAsset
      ? formatDisplayNumber(formatUnits(form.nativeAmountOut, form.nativeAsset.decimals), { significantDigits: 6 })
      : undefined
    : form.zapAmountOutRaw !== undefined && form.swapToken
    ? formatDisplayNumber(formatUnits(form.zapAmountOutRaw, form.swapToken.decimals), { significantDigits: 6 })
    : undefined

  const nativeOut =
    form.nativeAmountOut !== undefined && form.nativeAsset
      ? `${formatDisplayNumber(formatUnits(form.nativeAmountOut, form.nativeAsset.decimals), {
          significantDigits: 6,
        })} ${form.nativeAsset.symbol}`
      : undefined

  const zapMinOut =
    form.zapMinAmountOutRaw !== undefined && form.swapToken
      ? `${formatDisplayNumber(formatUnits(form.zapMinAmountOutRaw, form.swapToken.decimals), {
          significantDigits: 6,
        })} ${form.swapToken.symbol}`
      : undefined

  const isOutLoading = form.isNative ? form.isLoadingPreview : form.isRouteLoading

  return (
    <>
      <FieldStack>
        <Field>
          <FieldRow className="items-start">
            <PillRange>
              {PERCENT_OPTIONS.map(option => (
                <Pill
                  key={option}
                  $active={form.percent === option}
                  disabled={form.shareBalanceRaw <= 0n}
                  onClick={() => form.onSelectPercent(option)}
                >
                  {option}%
                </Pill>
              ))}
            </PillRange>
            <BalanceButton
              aria-label={t`Withdraw the whole balance`}
              disabled={form.shareBalanceRaw <= 0n}
              onClick={() => form.onSelectPercent(100)}
            >
              <SharesIcon width={16} height={16} />
              {balanceText}
            </BalanceButton>
          </FieldRow>

          <FieldRow>
            <AmountInput value={form.typedValue} onChange={e => form.onTypeAmount(e.target.value)} />
            <div className="flex shrink-0 items-center justify-end gap-2">
              {sharesUsd ? <span className="text-base leading-6 text-subText">~{sharesUsd}</span> : null}
              <TokenTag>
                {shareLogo ? <TokenLogo src={shareLogo} alt={form.shareSymbol} size={20} /> : null}
                {form.shareSymbol}
              </TokenTag>
            </div>
          </FieldRow>
        </Field>

        <FieldSeam />

        <Field className="gap-3">
          <SegmentedTabs>
            <SegmentedTab
              $active={form.mode === WithdrawMode.ANY_TOKEN}
              onClick={() => form.onSelectMode(WithdrawMode.ANY_TOKEN)}
            >
              {t`Withdraw to any token`}
            </SegmentedTab>
            <SegmentedTab $active={form.isNative} onClick={() => form.onSelectMode(WithdrawMode.NATIVE)}>
              {t`Native withdraw`}
            </SegmentedTab>
          </SegmentedTabs>

          <FieldNote>
            {form.isNative
              ? t`Expected time: Starts ~3 days; may extend (3–10 days) depending on strategies.`
              : t`Instant exit uses market liquidity and settles in one transaction; the output may differ from a native redeem.`}
          </FieldNote>

          <FieldRow>
            {form.isNative ? (
              <div className="relative" ref={assetMenuRef}>
                <TokenButton
                  className="h-8 px-3 text-sm"
                  aria-haspopup="listbox"
                  aria-expanded={isAssetMenuOpen}
                  disabled={form.withdrawableAssets.length < 2}
                  onClick={() => setAssetMenuOpen(open => !open)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setAssetMenuOpen(false)
                  }}
                >
                  {form.nativeAsset?.symbol || '--'}
                  {form.withdrawableAssets.length > 1 ? <ChevronDown size={16} /> : null}
                </TokenButton>
                {isAssetMenuOpen ? (
                  <div
                    role="listbox"
                    aria-label={t`Receive token`}
                    onKeyDown={e => {
                      if (e.key === 'Escape') setAssetMenuOpen(false)
                    }}
                    className="absolute left-0 top-10 z-10 flex min-w-[120px] flex-col rounded-xl border border-white-08 bg-tableHeader p-1 shadow-[0px_4px_16px_rgba(0,0,0,0.4)]"
                  >
                    {form.withdrawableAssets.map(asset => (
                      <button
                        key={asset.assetAddress}
                        type="button"
                        role="option"
                        aria-selected={asset.assetAddress === form.nativeAssetAddress}
                        onClick={() => {
                          form.setNativeAssetAddress(asset.assetAddress)
                          setAssetMenuOpen(false)
                        }}
                        className="rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-white-04"
                      >
                        {asset.symbol}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <TokenButton className="h-8 px-3 text-sm" onClick={() => setSelectorOpen(true)}>
                {form.swapToken ? (
                  <>
                    {form.swapToken.logo ? (
                      <TokenLogo src={form.swapToken.logo} alt={form.swapToken.symbol} size={18} />
                    ) : null}
                    {form.swapToken.symbol}
                  </>
                ) : (
                  t`Select token`
                )}
                <ChevronDown size={16} />
              </TokenButton>
            )}

            {isOutLoading && !amountOut ? (
              <ValueSkeleton className="h-7 w-[120px]" />
            ) : (
              <ReceiveAmount className="truncate text-right">{amountOut ?? '--'}</ReceiveAmount>
            )}
          </FieldRow>
        </Field>
      </FieldStack>

      <DetailsBox>
        {/* One label for both paths, as the design has it. Only the aggregator route has a slippage
            floor, so on the queue path the tooltip says the figure is exact. */}
        <InfoRow>
          <InfoLabel
            tooltip={
              form.isNative
                ? t`The queue prices this redemption when you submit it and locks the amount into the request, so it is what you receive rather than a floor.`
                : t`The least you will receive if the price moves against you by the full slippage tolerance.`
            }
          >{t`Est. Min Received`}</InfoLabel>
          <InfoValue>
            {form.isNative ? (
              form.isLoadingPreview && !nativeOut ? (
                <ValueSkeleton />
              ) : (
                nativeOut || '--'
              )
            ) : form.isRouteLoading && !zapMinOut ? (
              <ValueSkeleton />
            ) : (
              zapMinOut || '--'
            )}
          </InfoValue>
        </InfoRow>

        {form.isNative ? (
          <InfoRow>
            <InfoLabel
              tooltip={t`How long the withdrawal usually takes. A solver fills the request out of the queue, so the vault does not pay out on a fixed schedule.`}
            >{t`Processing Time`}</InfoLabel>
            <InfoValue>{form.queueLimits ? formatTerm(form.queueLimits.minimumSecondsToDeadline) : '--'}</InfoValue>
          </InfoRow>
        ) : (
          <SlippageSelect
            value={form.slippage}
            onChange={form.setSlippage}
            notice={form.slippageNotice}
            suggested={form.suggestedSlippage}
            isResolving={form.isSlippageResolving}
          />
        )}
      </DetailsBox>

      {form.isNative ? (
        <FieldNote className="text-gray">
          {t`When completed, tokens are automatically sent to your wallet, no need to claim.`}
        </FieldNote>
      ) : null}

      {isSelectorOpen ? (
        <Portal>
          <TokenSelectorModal
            chainId={form.chainId as unknown as SchemaChainId}
            enableWalletInventory={isInventoryChain(form.chainId)}
            title={t`Receive token`}
            onClose={() => setSelectorOpen(false)}
            wallet={{ account: form.account ?? undefined, onConnectWallet: toggleWalletModal }}
            tokenOptions={{
              tokensIn: [],
              amountsIn: '',
              mode: TOKEN_SELECT_MODE.SELECT,
              selectedTokenAddress: form.swapToken?.address,
              token0Address: vault.underlyingToken?.address ?? '',
              token1Address: '',
              // The shares being burned are the input; taking them back out is not a withdrawal.
              excludedTokenAddresses: vault.shareToken?.address ? [vault.shareToken.address] : [],
              setTokensIn: () => undefined,
              setAmountsIn: () => undefined,
              onTokenSelect: token => {
                form.setSwapToken(token)
                setSelectorOpen(false)
              },
            }}
            positionOptions={{ poolAddress: '' }}
          />
        </Portal>
      ) : null}
    </>
  )
}

export default WithdrawFields
