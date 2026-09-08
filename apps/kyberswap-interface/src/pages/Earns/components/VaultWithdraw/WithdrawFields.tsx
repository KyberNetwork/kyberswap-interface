import { ChainId as SchemaChainId } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { t } from '@lingui/macro'
import Portal from '@reach/portal'
import { useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { VaultApiDetailItem } from 'services/vault'

import { ReactComponent as SharesIcon } from 'assets/svg/earn/ic_featured_vault.svg'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import SlippageSelect from 'pages/Earns/components/VaultDeposit/SlippageSelect'
import {
  AmountInput,
  BalanceRow,
  Field,
  FieldRow,
  InfoLabel,
  InfoList,
  InfoRow,
  InfoValue,
  Pill,
  PillRange,
  SegmentedTab,
  SegmentedTabs,
  TokenButton,
} from 'pages/Earns/components/VaultDeposit/styles'
import { PERCENT_OPTIONS, WithdrawFormState, WithdrawMode } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { formatDuration } from 'pages/Earns/hooks/useCountdown'
import { useWalletModalToggle } from 'state/application/hooks'
import { isInventoryChain } from 'state/walletInventory/store'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

/**
 * Amount field and terms for both withdrawal routes: selling the shares through the aggregator, or
 * queueing a redemption with the vault itself.
 */
const WithdrawFields = ({ vault, form }: { vault: VaultApiDetailItem; form: WithdrawFormState }) => {
  const [isSelectorOpen, setSelectorOpen] = useState(false)
  const [isAssetMenuOpen, setAssetMenuOpen] = useState(false)
  const assetMenuRef = useRef<HTMLDivElement>(null)
  const toggleWalletModal = useWalletModalToggle()

  useOnClickOutside(assetMenuRef, () => setAssetMenuOpen(false))

  const balanceText = formatDisplayNumber(formatUnits(form.shareBalanceRaw, form.shareDecimals), {
    significantDigits: 6,
  })

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

  return (
    <>
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

      {form.isNative ? (
        <p className="m-0 text-xs italic leading-4 text-subText">
          {t`Expected time: Starts ~3 days; may extend (3–10 days) depending on strategies.`}
        </p>
      ) : (
        <p className="m-0 text-xs italic leading-4 text-subText">
          {t`Your shares are sold on the market and settle in one transaction.`}
        </p>
      )}

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
          <BalanceRow>
            <SharesIcon width={16} height={16} />
            {balanceText} {form.shareSymbol}
          </BalanceRow>
        </FieldRow>

        <FieldRow>
          <AmountInput value={form.typedValue} onChange={e => form.onTypeAmount(e.target.value)} />
          <div className="flex shrink-0 items-center justify-end gap-2">
            {form.isNative ? (
              <div className="relative" ref={assetMenuRef}>
                <TokenButton
                  aria-haspopup="listbox"
                  aria-expanded={isAssetMenuOpen}
                  disabled={form.withdrawableAssets.length < 2}
                  onClick={() => setAssetMenuOpen(open => !open)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setAssetMenuOpen(false)
                  }}
                >
                  {form.nativeAsset?.symbol || '--'}
                  {form.withdrawableAssets.length > 1 ? <ChevronDown size={20} /> : null}
                </TokenButton>
                {isAssetMenuOpen ? (
                  <div
                    role="listbox"
                    aria-label={t`Receive token`}
                    onKeyDown={e => {
                      if (e.key === 'Escape') setAssetMenuOpen(false)
                    }}
                    className="absolute right-0 top-11 z-10 flex min-w-[120px] flex-col rounded-xl border border-white-08 bg-tableHeader p-1 shadow-[0px_4px_16px_rgba(0,0,0,0.4)]"
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
              <TokenButton onClick={() => setSelectorOpen(true)}>
                {form.swapToken ? (
                  <>
                    {form.swapToken.logo ? (
                      <TokenLogo src={form.swapToken.logo} alt={form.swapToken.symbol} size={20} />
                    ) : null}
                    {form.swapToken.symbol}
                  </>
                ) : (
                  t`Select token`
                )}
                <ChevronDown size={20} />
              </TokenButton>
            )}
          </div>
        </FieldRow>
      </Field>

      <InfoList>
        <InfoRow>
          <InfoLabel
            tooltip={
              form.isNative
                ? t`Quoted by the vault's withdrawal queue and locked into the request when you submit it.`
                : t`The least you will receive if the price moves against you by the full slippage tolerance.`
            }
          >
            {/* The queue prices the redemption exactly and freezes it into the request, so there is
                no slippage floor to describe on that path — only the aggregator route has one. */}
            {form.isNative ? t`You receive` : t`Est. Min Received`}
          </InfoLabel>
          <InfoValue>
            {form.isNative ? (
              form.isLoadingPreview && !nativeOut ? (
                <Loader size="14px" />
              ) : (
                nativeOut || '--'
              )
            ) : form.isRouteLoading && !zapMinOut ? (
              <Loader size="14px" />
            ) : (
              zapMinOut || '--'
            )}
          </InfoValue>
        </InfoRow>

        {form.isNative ? (
          <InfoRow>
            <InfoLabel
              tooltip={t`How long the vault's withdrawal queue waits before a solver can fill your request.`}
            >{t`Ready in`}</InfoLabel>
            <InfoValue>{form.queueConfig ? formatDuration(form.queueConfig.secondsToMaturity) : '--'}</InfoValue>
          </InfoRow>
        ) : (
          <>
            <InfoRow>
              <InfoLabel
                tooltip={t`How far this trade moves the price of the pools it routes through. A large impact means thin liquidity.`}
              >{t`Price Impact`}</InfoLabel>
              <InfoValue>
                {form.zapRoute
                  ? formatDisplayNumber(form.zapRoute.zapDetails.priceImpact / 100, {
                      style: 'percent',
                      fractionDigits: 2,
                    })
                  : '--'}
              </InfoValue>
            </InfoRow>
            <SlippageSelect value={form.slippage} onChange={form.setSlippage} />
            <InfoRow>
              <InfoLabel
                tooltip={t`Estimated network fee for this transaction. What you actually pay depends on network conditions.`}
              >{t`Est. Gas Fee`}</InfoLabel>
              <InfoValue>
                {form.zapRoute
                  ? formatDisplayNumber(form.zapRoute.gasUsd, { style: 'currency', significantDigits: 4 })
                  : '--'}
              </InfoValue>
            </InfoRow>
          </>
        )}
      </InfoList>

      {form.isNative ? (
        <p className="m-0 text-xs italic leading-4 text-gray">
          {t`When completed, tokens are automatically sent to your wallet, no need to claim.`}
        </p>
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
