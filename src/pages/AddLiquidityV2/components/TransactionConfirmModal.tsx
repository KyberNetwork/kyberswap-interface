import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { Flex, Text } from 'rebass'

import { ButtonError } from 'components/Button'
import { ZapDetail } from 'components/ElasticZap/ZapDetail'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmPriceRangeConfirm from 'components/ProAmm/ProAmmPriceRangeConfirm'
import Row from 'components/Row'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { Bound } from 'state/mint/proamm/type'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

export const AddLiquidityTransactionConfirmModal = ({
  warnings,
  noLiquidity,
  showConfirm,
  handleDismissConfirmation,
  attemptingTxn,
  txHash,
  isMultiplePosition,
  modalContent,
  isWarningButton,
  onAdd,
  pendingText,
}: {
  warnings: ReactNode
  noLiquidity: boolean
  showConfirm: boolean
  handleDismissConfirmation: () => void
  attemptingTxn: boolean
  txHash: string
  isMultiplePosition: boolean
  modalContent: () => ReactNode
  isWarningButton: boolean
  onAdd: () => void
  pendingText: string
}) => {
  return (
    <TransactionConfirmationModal
      isOpen={showConfirm}
      onDismiss={handleDismissConfirmation}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      maxWidth={isMultiplePosition ? 'unset' : undefined}
      width={isMultiplePosition ? 'unset' : undefined}
      content={() => (
        <ConfirmationModalContent
          title={!!noLiquidity ? t`Create a new pool` : t`Add Liquidity`}
          onDismiss={handleDismissConfirmation}
          topContent={modalContent}
          showGridListOption={false}
          bottomContent={() => (
            <Flex flexDirection="column" sx={{ gap: '12px' }}>
              {warnings}
              <Row justify={isMultiplePosition ? 'flex-end' : 'flex-start'}>
                <ButtonError
                  warning={isWarningButton}
                  id="btnSupply"
                  onClick={onAdd}
                  width={isMultiplePosition ? '160px' : '100%'}
                >
                  <Text fontWeight={500}>
                    <Trans>Supply</Trans>
                  </Text>
                </ButtonError>
              </Row>
            </Flex>
          )}
        />
      )}
      pendingText={pendingText}
    />
  )
}

export const ZapConfirmTransactionModal = ({
  showZapConfirmation,
  handleDismissConfirmation,
  txHash,
  attemptingTxn,
  amountIn,
  selectedCurrency,
  newPosDraft,
  zapError,
  handleDissmissZap,
  zapDetail,
  ticksAtLimit,
  warnings,
  zapPriceImpactNote,
  handleZap,
  isWarningButton,
  useWrapped,
}: {
  showZapConfirmation: boolean
  handleDismissConfirmation: () => void
  txHash: string
  attemptingTxn: boolean
  amountIn: CurrencyAmount<Currency> | undefined
  selectedCurrency: Currency | undefined
  newPosDraft: Position | undefined
  zapError: string
  handleDissmissZap: () => void
  zapDetail: ZapDetail
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
  warnings: ReactNode
  zapPriceImpactNote: ReactNode
  handleZap: () => void
  isWarningButton: boolean
  useWrapped: boolean
}) => {
  const { chainId } = useActiveWeb3React()

  const symbol0 = getTokenSymbolWithHardcode(
    chainId,
    newPosDraft?.pool?.token0?.wrapped.address,
    useWrapped
      ? newPosDraft?.pool?.token0?.wrapped.symbol
      : (newPosDraft?.pool?.token0 ? unwrappedToken(newPosDraft.pool.token0) : newPosDraft?.pool?.token0)?.symbol,
  )
  const symbol1 = getTokenSymbolWithHardcode(
    chainId,
    newPosDraft?.pool?.token1?.wrapped.address,
    useWrapped
      ? newPosDraft?.pool?.token1?.wrapped.symbol
      : (newPosDraft?.pool?.token1 ? unwrappedToken(newPosDraft.pool.token1) : newPosDraft?.pool?.token1)?.symbol,
  )

  return (
    <TransactionConfirmationModal
      isOpen={showZapConfirmation}
      onDismiss={handleDismissConfirmation}
      hash={txHash}
      attemptingTxn={attemptingTxn}
      pendingText={
        <Trans>
          Zapping {amountIn?.toSignificant(6)} {selectedCurrency?.symbol} into {newPosDraft?.amount0.toSignificant(6)}{' '}
          {symbol0} and {newPosDraft?.amount1.toSignificant(6)} {symbol1} of liquidity to the pool
        </Trans>
      }
      content={() => (
        <Flex flexDirection={'column'} width="100%">
          {zapError ? (
            <TransactionErrorContent onDismiss={handleDissmissZap} message={zapError} />
          ) : (
            <ConfirmationModalContent
              title={t`Add Liquidity`}
              onDismiss={handleDissmissZap}
              topContent={() => (
                <div style={{ marginTop: '1rem' }}>
                  {!!zapDetail.newPosDraft && <ProAmmPoolInfo position={zapDetail.newPosDraft} />}
                  <ProAmmPooledTokens
                    liquidityValue0={
                      selectedCurrency?.isNative
                        ? CurrencyAmount.fromRawAmount(
                            selectedCurrency,
                            zapDetail.newPooledAmount0?.quotient.toString() || 0,
                          )
                        : zapDetail.newPooledAmount0
                    }
                    liquidityValue1={zapDetail.newPooledAmount1}
                    title={t`New Liquidity Amount`}
                  />
                  {!!zapDetail.newPosDraft && (
                    <ProAmmPriceRangeConfirm
                      position={zapDetail.newPosDraft}
                      ticksAtLimit={ticksAtLimit}
                      zapDetail={zapDetail}
                    />
                  )}
                </div>
              )}
              showGridListOption={false}
              bottomContent={() => (
                <Flex flexDirection="column" sx={{ gap: '12px' }}>
                  {warnings}
                  {zapPriceImpactNote}
                  <ButtonError
                    error={zapDetail.priceImpact.isVeryHigh}
                    warning={isWarningButton || zapDetail.priceImpact.isHigh}
                    id="btnSupply"
                    onClick={handleZap}
                  >
                    <Text fontWeight={500}>
                      <Trans>Supply</Trans>
                    </Text>
                  </ButtonError>
                </Flex>
              )}
            />
          )}
        </Flex>
      )}
    />
  )
}
