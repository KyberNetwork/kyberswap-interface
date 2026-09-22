import { NATIVE_TOKEN_ADDRESS, ChainId as SchemaChainId, Token as TokenSchema } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { t } from '@lingui/macro'
import Portal from '@reach/portal'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { VaultApiDetailItem } from 'services/vault'

import { ReactComponent as WalletIcon } from 'assets/svg/earn/ic_wallet.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import SlippageSelect from 'pages/Earns/components/VaultDeposit/SlippageSelect'
import {
  AddTokenButton,
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
  ReceiveAmount,
  ReceiveField,
  RemoveTokenButton,
  TokenButton,
  TokenRowList,
  TokenTag,
} from 'pages/Earns/components/VaultDeposit/styles'
import { DepositFormState, PERCENT_OPTIONS } from 'pages/Earns/components/VaultDeposit/useDepositForm'
import { useWalletModalToggle } from 'state/application/hooks'
import { isInventoryChain } from 'state/walletInventory/store'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

/** Which token the selector is being opened for: one row's token, or the list as a whole. */
type SelectorTarget = { mode: 'replace'; index: number } | { mode: 'add' }

const formatUsd = (value?: number) =>
  value === undefined ? undefined : formatDisplayNumber(value, { style: 'currency', significantDigits: 4 })

/**
 * The amount fields and route summary, shared by the panel on the vault page and the deposit modal.
 * A deposit of the vault's own asset needs no route detail; anything else is swapped on the way in,
 * so the swap figures appear.
 */
const DepositFields = ({ vault, form }: { vault: VaultApiDetailItem; form: DepositFormState }) => {
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget | null>(null)
  const toggleWalletModal = useWalletModalToggle()

  const shareSymbol = vault.shareToken?.symbol ?? ''
  const shareDecimals = vault.shareToken?.decimals ?? 18
  const shareLogo = vault.shareToken?.logo

  const sharesOut = form.sharesOutRaw
    ? formatDisplayNumber(formatUnits(form.sharesOutRaw, shareDecimals), { significantDigits: 6 })
    : undefined
  const minSharesOut = form.minSharesOutRaw
    ? formatDisplayNumber(formatUnits(form.minSharesOutRaw, shareDecimals), { significantDigits: 6 })
    : undefined
  const receiveUsd = form.route ? formatUsd(Number(form.route.zapDetails.finalAmountUsd)) : undefined
  const minReceiveUsd =
    form.route && form.minSharesOutRaw && form.sharesOutRaw
      ? formatUsd(
          (Number(form.route.zapDetails.finalAmountUsd) * Number(form.minSharesOutRaw)) / Number(form.sharesOutRaw),
        )
      : undefined

  const onTokenSelected = (token: TokenSchema) => {
    if (selectorTarget?.mode === 'replace') form.onSelectToken(selectorTarget.index, token)
    setSelectorTarget(null)
  }

  return (
    <>
      <TokenRowList>
        {form.rows.map((row, index) => {
          const balanceText = row.balance ? formatDisplayNumber(row.balance.toExact(), { significantDigits: 6 }) : '--'
          const amountUsd = formatUsd(row.amountUsd)
          const symbol = row.currency.symbol ?? ''

          return (
            <Field key={row.key} className="relative">
              {form.rows.length > 1 ? (
                <RemoveTokenButton aria-label={t`Remove ${symbol}`} onClick={() => form.onRemoveRow(index)}>
                  ✕
                </RemoveTokenButton>
              ) : null}

              <FieldRow className="items-start">
                <PillRange>
                  {PERCENT_OPTIONS.map(option => (
                    <Pill
                      key={option}
                      $active={row.percent === option}
                      disabled={!row.balance?.greaterThan(0)}
                      onClick={() => form.onSelectPercent(index, option)}
                    >
                      {option}%
                    </Pill>
                  ))}
                </PillRange>
                <BalanceRow>
                  <WalletIcon width={16} height={16} />
                  {balanceText}
                </BalanceRow>
              </FieldRow>

              <FieldRow>
                <AmountInput value={row.typedValue} onChange={e => form.onTypeAmount(index, e.target.value)} />
                <div className="flex shrink-0 items-center justify-end gap-2">
                  {amountUsd ? <span className="text-base leading-6 text-subText">~{amountUsd}</span> : null}
                  <TokenButton onClick={() => setSelectorTarget({ mode: 'replace', index })}>
                    {row.logo ? (
                      <TokenLogo src={row.logo} alt={row.currency.symbol} size={20} />
                    ) : (
                      <CurrencyLogo currency={row.currency} size="20px" />
                    )}
                    {row.currency.symbol}
                    <ChevronDown size={20} />
                  </TokenButton>
                </div>
              </FieldRow>
            </Field>
          )
        })}
      </TokenRowList>

      <AddTokenButton disabled={!form.canAddToken} onClick={() => setSelectorTarget({ mode: 'add' })}>
        {t`+ Add Token(s)`}
      </AddTokenButton>

      <ReceiveField>
        <span className="text-sm text-subText">{t`Est. Receive`}</span>
        <FieldRow>
          <div className="flex min-w-0 items-center gap-2">
            {form.isRouteLoading && !sharesOut ? (
              <Loader size="20px" />
            ) : (
              <ReceiveAmount>{sharesOut ?? '--'}</ReceiveAmount>
            )}
            {receiveUsd ? <span className="text-base leading-6 text-subText">~{receiveUsd}</span> : null}
          </div>
          <TokenTag>
            {shareLogo ? <TokenLogo src={shareLogo} alt={shareSymbol} size={20} /> : null}
            {shareSymbol}
          </TokenTag>
        </FieldRow>
      </ReceiveField>

      <InfoList>
        {form.exchangeRate !== undefined ? (
          <InfoRow>
            <InfoLabel>{t`Exchange Rate`}</InfoLabel>
            <InfoValue>
              1 {vault.underlyingToken?.symbol} = {formatDisplayNumber(form.exchangeRate, { significantDigits: 6 })}{' '}
              {shareSymbol}
            </InfoValue>
          </InfoRow>
        ) : null}

        {!form.isVaultAsset ? (
          <>
            <InfoRow>
              <InfoLabel
                tooltip={t`The least you will receive if the price moves against you by the full slippage tolerance.`}
              >{t`Est. Min Received`}</InfoLabel>
              <InfoValue>
                {form.isRouteLoading && !minSharesOut ? (
                  <Loader size="14px" />
                ) : minSharesOut ? (
                  <>
                    {minSharesOut} {shareSymbol}
                    {minReceiveUsd ? <span className="text-subText">~{minReceiveUsd}</span> : null}
                  </>
                ) : (
                  '--'
                )}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel
                tooltip={t`How far this trade moves the price of the pools it routes through. A large impact means thin liquidity.`}
              >{t`Price Impact`}</InfoLabel>
              <InfoValue>
                {form.route
                  ? formatDisplayNumber(form.route.zapDetails.priceImpact / 100, {
                      style: 'percent',
                      fractionDigits: 2,
                    })
                  : '--'}
              </InfoValue>
            </InfoRow>
          </>
        ) : null}

        <SlippageSelect value={form.slippage} onChange={form.setSlippage} />

        <InfoRow>
          <InfoLabel
            tooltip={t`Estimated network fee for this transaction. What you actually pay depends on network conditions.`}
          >{t`Est. Gas Fee`}</InfoLabel>
          <InfoValue>
            {form.route ? formatDisplayNumber(form.route.gasUsd, { style: 'currency', significantDigits: 4 }) : '--'}
          </InfoValue>
        </InfoRow>
      </InfoList>

      {selectorTarget ? (
        <Portal>
          <TokenSelectorModal
            chainId={form.chainId as unknown as SchemaChainId}
            enableWalletInventory={isInventoryChain(form.chainId)}
            title={t`Deposit token`}
            onClose={() => setSelectorTarget(null)}
            wallet={{ account: form.account ?? undefined, onConnectWallet: toggleWalletModal }}
            tokenOptions={{
              tokensIn: form.selectorTokens,
              amountsIn: form.selectorAmounts,
              mode: selectorTarget.mode === 'add' ? TOKEN_SELECT_MODE.ADD : TOKEN_SELECT_MODE.SELECT,
              selectedTokenAddress:
                selectorTarget.mode === 'replace'
                  ? form.rows[selectorTarget.index]?.currency.isNative
                    ? NATIVE_TOKEN_ADDRESS
                    : form.rows[selectorTarget.index]?.currency.wrapped.address
                  : undefined,
              token0Address: vault.underlyingToken?.address ?? '',
              token1Address: '',
              // The vault mints its share token; depositing it back has no route and no meaning.
              excludedTokenAddresses: vault.shareToken?.address ? [vault.shareToken.address] : [],
              // The fields above read these tokens from the chain, the selector's list from an index
              // that can sit a block or more behind it. Handing the reads over keeps them in step.
              liveTokenBalances: Object.fromEntries(
                form.rows.filter(row => row.balance).map(row => [row.key, BigInt(row.balance.quotient.toString())]),
              ),
              setTokensIn: form.onTokensChange,
              setAmountsIn: () => undefined,
              onTokenSelect: onTokenSelected,
            }}
            positionOptions={{ poolAddress: '' }}
          />
        </Portal>
      ) : null}
    </>
  )
}

export default DepositFields
