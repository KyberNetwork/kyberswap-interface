import { TransactionResponse } from '@ethersproject/providers'
import { t, Trans } from '@lingui/macro'
import { FeeAmount, NonfungiblePositionManager } from '@vutien/dmm-v3-sdk'
import { Currency, CurrencyAmount, Percent, WETH } from '@vutien/sdk-core'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { PRO_AMM_CORE_FACTORY_ADDRESSES, PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { useProAmmDerivedPositionInfo } from 'hooks/useProAmmDerivedPositionInfo'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useWalletModalToggle } from 'state/application/hooks'
import { Bound, Field } from 'state/mint/proamm/actions'
import { useProAmmDerivedMintInfo, useProAmmMintActionHandlers, useProAmmMintState } from 'state/mint/proamm/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useIsExpertMode } from 'state/user/hooks'
import { currencyId } from 'utils/currencyId'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { Text } from 'rebass'
import { PageWrapper, DynamicSection, Container } from './styled'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import useProAmmPreviousTicks from 'hooks/useProAmmPreviousTicks'
import { calculateGasMargin } from 'utils'
import JSBI from 'jsbi'
import { useProAmmClientSideTrade } from 'hooks/useProAmmClientSideTrade'
import { nativeOnChain } from 'constants/tokens'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { BigNumber } from 'ethers'
import { PositionPreview } from 'components/PositionPreview'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()

  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: positionLoading } = useProAmmPositionsFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined
  )
  const { position: existingPosition } = useProAmmDerivedPositionInfo(existingPositionDetails)

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined
  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB
  // mint state
  const { independentField, typedValue } = useProAmmMintState()
  const {
    pool,
    ticks,
    dependentField,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    ticksAtLimit
  } = useProAmmDerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  )

  const previousTicks =
    // : number[] = []
    useProAmmPreviousTicks(pool, position)
  const { onFieldAInput, onFieldBInput } = useProAmmMintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }
  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field])
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_A],
    chainId ? PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    chainId ? PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )

  const allowedSlippage = useUserSlippageTolerance()

  //TODO: on add
  async function onAdd() {
    if (!chainId || !library || !account || !tokenId) return

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    if (!previousTicks || previousTicks.length != 2) {
      return
    }

    if (position && account && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, previousTicks, {
        slippageTolerance: new Percent(allowedSlippage[0], 10000),
        deadline: deadline.toString(),
        useNative,
        tokenId: JSBI.BigInt(tokenId)
      })

      //0.00283161
      const txn: { to: string; data: string; value: string } = {
        to: PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
        data: calldata,
        value
      }

      setAttemptingTxn(true)
      library
        .getSigner()
        .estimateGas(txn)
        .then(estimate => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate)
          }

          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              console.log(response)
              setAttemptingTxn(false)
              addTransactionWithType(response, {
                type: 'Add liquidity',
                summary:
                  (parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) || 0) +
                  ' ' +
                  baseCurrency?.symbol +
                  ' and ' +
                  (parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) || 0) +
                  ' ' +
                  quoteCurrency?.symbol +
                  //  ' with fee ' +  position.pool.fee / 100 + '%' +
                  ' (ProMM)'
              })
              setTxHash(response.hash)
            })
        })
        .catch(error => {
          console.error('Failed to send transaction', error)
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error)
          }
        })
    } else {
      return
    }
  }

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      history.push('/pool')
    }
    setTxHash('')
  }, [history, onFieldAInput, txHash])

  const addIsUnsupported = false

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA = approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB = approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${
    !depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
  }`

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled={true}>
        <Trans>Unsupported Asset</Trans>
      </ButtonPrimary>
    ) : !account ? (
      <ButtonLight onClick={toggleWalletModal}>
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    ) : (
      <AutoColumn gap={'md'}>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <RowBetween>
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={showApprovalB ? '48%' : '100%'}
                >
                  {approvalA === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
              {showApprovalB && (
                <ButtonPrimary
                  onClick={approveBCallback}
                  disabled={approvalB === ApprovalState.PENDING}
                  width={showApprovalA ? '48%' : '100%'}
                >
                  {approvalB === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
            </RowBetween>
          )}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={
            !isValid ||
            (approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (approvalB !== ApprovalState.APPROVED && !depositBDisabled)
          }
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
        >
          <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
        </ButtonError>
      </AutoColumn>
    )

  //disable = !feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)
  useProAmmClientSideTrade(
    0,
    position && CurrencyAmount.fromRawAmount(position?.pool.token0, JSBI.BigInt('10000000000000')),
    position?.pool.token1
  )
  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <ConfirmationModalContent
            title={t`Add Liquidity`}
            onDismiss={handleDismissConfirmation}
            topContent={() =>
              position && (
                <div style={{ marginTop: '12px' }}>
                  <PositionPreview
                    position={position}
                    title={<Trans>Selected Range</Trans>}
                    inRange={!outOfRange}
                    ticksAtLimit={ticksAtLimit}
                  />
                </div>
              )
            }
            bottomContent={() => (
              <ButtonPrimary style={{ marginTop: '1rem' }} onClick={onAdd}>
                <Text fontWeight={500} fontSize={20}>
                  <Trans>Add</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
        pendingText={pendingText}
      />
      <PageWrapper>
        <Container>
          <AddRemoveTabs creating={false} adding showTooltip={false} hideShare />

          {existingPosition && (
            <PositionPreview
              position={existingPosition}
              title={<Trans>Selected Range</Trans>}
              inRange={!outOfRange}
              ticksAtLimit={ticksAtLimit}
            />
          )}
          <DynamicSection disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}>
            <AutoColumn gap="md">
              <Text fontWeight="500">
                <Trans>Add More Liquidity</Trans>
              </Text>

              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_A]}
                onUserInput={onFieldAInput}
                onMax={() => {
                  onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                }}
                showMaxButton
                currency={currencies[Field.CURRENCY_A] ?? null}
                id="add-liquidity-input-tokena"
                showCommonBases
                positionMax="top"
                disableCurrencySelect
                locked={depositADisabled}
              />

              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_B]}
                onUserInput={onFieldBInput}
                onMax={() => {
                  onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                }}
                disableCurrencySelect
                showMaxButton
                currency={currencies[Field.CURRENCY_B] ?? null}
                id="add-liquidity-input-tokenb"
                showCommonBases
                positionMax="top"
                locked={depositBDisabled}
              />
            </AutoColumn>
          </DynamicSection>

          <Buttons />
        </Container>
      </PageWrapper>
    </>
  )
}
