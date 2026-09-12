import { NATIVE_TOKEN_ADDRESS, ChainId as SchemaChainId } from '@kyber/schema'
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
  TokenButton,
} from 'pages/Earns/components/VaultDeposit/styles'
import { DepositFormState, PERCENT_OPTIONS } from 'pages/Earns/components/VaultDeposit/useDepositForm'
import { useWalletModalToggle } from 'state/application/hooks'
import { isInventoryChain } from 'state/walletInventory/store'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

/**
 * The amount field and route summary, shared by the panel on the vault page and the deposit modal.
 * A deposit of the vault's own asset needs no route detail; anything else is swapped on the way in,
 * so the swap figures appear.
 */
const DepositFields = ({ vault, form }: { vault: VaultApiDetailItem; form: DepositFormState }) => {
  const [isSelectorOpen, setSelectorOpen] = useState(false)
  const toggleWalletModal = useWalletModalToggle()

  const shareSymbol = vault.shareToken?.symbol ?? ''
  const shareDecimals = vault.shareToken?.decimals ?? 18

  const selectedTokenAddress = form.currency
    ? form.currency.isNative
      ? NATIVE_TOKEN_ADDRESS
      : form.currency.wrapped.address
    : undefined

  const balanceText = form.balance ? formatDisplayNumber(form.balance.toExact(), { significantDigits: 6 }) : '--'
  const amountUsd = form.route ? Number(form.route.zapDetails.initialAmountUsd) : undefined
  const minSharesOut = form.minSharesOutRaw
    ? formatDisplayNumber(formatUnits(form.minSharesOutRaw, shareDecimals), { significantDigits: 6 })
    : undefined

  return (
    <>
      <Field>
        <FieldRow className="items-start">
          <PillRange>
            {PERCENT_OPTIONS.map(option => (
              <Pill
                key={option}
                $active={form.percent === option}
                disabled={!form.balance?.greaterThan(0)}
                onClick={() => form.onSelectPercent(option)}
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
          <AmountInput value={form.typedValue} onChange={e => form.onTypeAmount(e.target.value)} />
          <div className="flex shrink-0 items-center justify-end gap-2">
            {amountUsd !== undefined ? (
              <span className="text-base leading-6 text-subText">
                ~{formatDisplayNumber(amountUsd, { style: 'currency', significantDigits: 4 })}
              </span>
            ) : null}
            <TokenButton onClick={() => setSelectorOpen(true)}>
              {form.currency ? (
                <>
                  {form.currencyLogo ? (
                    <TokenLogo src={form.currencyLogo} alt={form.currency.symbol} size={20} />
                  ) : (
                    <CurrencyLogo currency={form.currency} size="20px" />
                  )}
                  {form.currency.symbol}
                </>
              ) : (
                t`Select token`
              )}
              <ChevronDown size={20} />
            </TokenButton>
          </div>
        </FieldRow>
      </Field>

      <InfoList>
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
                  `${minSharesOut} ${shareSymbol}`
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

      {isSelectorOpen ? (
        <Portal>
          <TokenSelectorModal
            chainId={form.chainId as unknown as SchemaChainId}
            enableWalletInventory={isInventoryChain(form.chainId)}
            title={t`Deposit token`}
            onClose={() => setSelectorOpen(false)}
            wallet={{ account: form.account ?? undefined, onConnectWallet: toggleWalletModal }}
            tokenOptions={{
              tokensIn: [],
              amountsIn: '',
              mode: TOKEN_SELECT_MODE.SELECT,
              selectedTokenAddress: selectedTokenAddress,
              token0Address: vault.underlyingToken?.address ?? '',
              token1Address: '',
              setTokensIn: () => undefined,
              setAmountsIn: () => undefined,
              onTokenSelect: token => {
                form.onSelectToken(token)
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

export default DepositFields
