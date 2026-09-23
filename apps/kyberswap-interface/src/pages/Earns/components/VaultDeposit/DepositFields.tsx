import { ChainId as SchemaChainId } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { t } from '@lingui/macro'
import Portal from '@reach/portal'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { VaultApiDetailItem } from 'services/vault'

import { ReactComponent as WalletIcon } from 'assets/svg/earn/ic_wallet.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import TokenLogo from 'components/TokenLogo'
import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import SlippageSelect from 'pages/Earns/components/VaultDeposit/SlippageSelect'
import {
  AddTokenButton,
  AmountInput,
  BalanceButton,
  DetailsBox,
  Field,
  FieldCaption,
  FieldRow,
  InfoLabel,
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
import { AmountFieldSkeleton } from 'pages/Earns/components/VaultFormSkeleton'
import VaultPriceImpactRow from 'pages/Earns/components/VaultPriceImpactRow'
import { useWalletModalToggle } from 'state/application/hooks'
import { isInventoryChain } from 'state/walletInventory/store'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

const formatUsd = (value?: number) =>
  value === undefined ? undefined : formatDisplayNumber(value, { style: 'currency', significantDigits: 4 })

/**
 * The amount fields and route summary, shared by the panel on the vault page and the deposit modal.
 * A deposit of the vault's own asset needs no route detail; anything else is swapped on the way in,
 * so the swap figures appear.
 */
const DepositFields = ({ vault, form }: { vault: VaultApiDetailItem; form: DepositFormState }) => {
  const [isSelectorOpen, setSelectorOpen] = useState(false)
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

  return (
    <>
      <TokenRowList>
        {form.isInitialising ? <AmountFieldSkeleton /> : null}
        {form.rows.map((row, index) => {
          const balanceText = row.balance ? formatDisplayNumber(row.balance.toExact(), { significantDigits: 6 }) : '--'
          const amountUsd = formatUsd(row.amountUsd)
          const symbol = row.currency.symbol ?? ''

          return (
            <Field key={row.key} className={cn('relative', form.rows.length > 1 && 'rounded-tr')}>
              {form.rows.length > 1 ? (
                <RemoveTokenButton aria-label={t`Remove ${symbol}`} onClick={() => form.onRemoveRow(index)} />
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
                <BalanceButton
                  aria-label={t`Deposit the whole ${symbol} balance`}
                  disabled={!row.balance?.greaterThan(0)}
                  onClick={() => form.onSelectPercent(index, 100)}
                >
                  <WalletIcon width={16} height={16} />
                  {balanceText}
                </BalanceButton>
              </FieldRow>

              <FieldRow>
                <AmountInput value={row.typedValue} onChange={e => form.onTypeAmount(index, e.target.value)} />
                <div className="flex shrink-0 items-center justify-end gap-2">
                  {amountUsd ? <span className="text-base leading-6 text-subText">~{amountUsd}</span> : null}
                  <TokenButton onClick={() => setSelectorOpen(true)}>
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

      <AddTokenButton disabled={!form.canAddToken} onClick={() => setSelectorOpen(true)}>
        {t`+ Add Token(s)`}
      </AddTokenButton>

      <ReceiveField>
        <span className="text-sm text-subText">{t`Est. Receive`}</span>
        <FieldRow>
          <div className="flex min-w-0 items-center gap-2">
            {form.isRouteLoading && !sharesOut ? (
              <ValueSkeleton className="h-7 w-[140px]" />
            ) : (
              <ReceiveAmount>{sharesOut ?? '--'}</ReceiveAmount>
            )}
            {receiveUsd ? <span className="text-base leading-6 text-subText">~{receiveUsd}</span> : null}
          </div>
          {/* Flat, unlike the withdraw field's: there is no token to choose on this side, and a
              pill reads as something to press. */}
          <TokenTag className="bg-transparent px-0">
            {shareLogo ? <TokenLogo src={shareLogo} alt={shareSymbol} size={20} /> : null}
            {shareSymbol}
          </TokenTag>
        </FieldRow>
      </ReceiveField>

      {/* Always on the page, so the rate arriving does not push everything under it down. */}
      <FieldCaption>
        <span>{t`Exchange Rate`}</span>
        {form.exchangeRate !== undefined ? (
          <span className="text-text">
            1 {vault.underlyingToken?.symbol} = {formatDisplayNumber(form.exchangeRate, { significantDigits: 6 })}{' '}
            {shareSymbol}
          </span>
        ) : form.isRouteLoading ? (
          <ValueSkeleton className="h-4 w-40" />
        ) : (
          <span className="text-text">--</span>
        )}
      </FieldCaption>

      <DetailsBox>
        {/* Slippage applies to the shares the route mints, whether or not a swap happened on the
            way in, so the floor it implies is worth stating for every deposit. */}
        <InfoRow>
          <InfoLabel
            tooltip={t`The least you will receive if the price moves against you by the full slippage tolerance.`}
          >{t`Est. Min Received`}</InfoLabel>
          <InfoValue>
            {form.isRouteLoading && !minSharesOut ? (
              <ValueSkeleton />
            ) : minSharesOut ? (
              <>
                {shareLogo ? <TokenLogo src={shareLogo} alt={shareSymbol} size={16} /> : null}
                {minSharesOut} {shareSymbol}
                {minReceiveUsd ? <span className="text-subText">~{minReceiveUsd}</span> : null}
              </>
            ) : (
              '--'
            )}
          </InfoValue>
        </InfoRow>

        <VaultPriceImpactRow priceImpact={form.route?.zapDetails.priceImpact} isLoading={form.isRouteLoading} />

        <SlippageSelect
          value={form.slippage}
          onChange={form.setSlippage}
          notice={form.slippageNotice}
          suggested={form.suggestedSlippage}
          isResolving={form.isSlippageResolving}
        />
      </DetailsBox>

      {isSelectorOpen ? (
        <Portal>
          <TokenSelectorModal
            chainId={form.chainId as unknown as SchemaChainId}
            enableWalletInventory={isInventoryChain(form.chainId)}
            title={t`Deposit token`}
            onClose={() => setSelectorOpen(false)}
            wallet={{ account: form.account ?? undefined, onConnectWallet: toggleWalletModal }}
            tokenOptions={{
              tokensIn: form.selectorTokens,
              amountsIn: form.selectorAmounts,
              // Always the multi-select list, whichever control opened it, so the tokens already in
              // the form stay ticked — the same door the pool-detail zap-in opens.
              mode: TOKEN_SELECT_MODE.ADD,
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
            }}
            positionOptions={{ poolAddress: '' }}
          />
        </Portal>
      ) : null}
    </>
  )
}

export default DepositFields
