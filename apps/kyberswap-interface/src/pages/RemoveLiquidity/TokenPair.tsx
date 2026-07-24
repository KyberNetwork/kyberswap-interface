import { Currency, CurrencyAmount, Fraction, Percent, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { BlackCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import CurrentPrice from 'components/CurrentPrice'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Loader'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import Slider from 'components/Slider'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { wagmiConfig } from 'components/Web3Provider'
import { KS_ROUTER_STATIC_FEE_ABI, ROUTER_DYNAMIC_FEE_ABI, ROUTER_STATIC_FEE_ABI } from 'constants/abis'
import { EIP712Domain } from 'constants/index'
import { LEGACY_POOL_APP_PATHS } from 'constants/legacyPools'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { usePairContract } from 'hooks/useContract'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import useTheme from 'hooks/useTheme'
import { useCurrency } from 'hooks/useTokens'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { Wrapper } from 'pages/MyPool/styleds'
import {
  CurrentPriceWrapper,
  DetailBox,
  DetailWrapper,
  FirstColumn,
  GridColumn,
  MaxButton,
  ModalDetailWrapper,
  SecondColumn,
  TokenWrapper,
} from 'pages/RemoveLiquidity/styled'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/burn/actions'
import { useBurnActionHandlers, useBurnState, useDerivedBurnInfo } from 'state/burn/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { StyledInternalLink, UppercaseText } from 'theme'
import { currencyId } from 'utils/currencyId'
import { friendlyError } from 'utils/errorMessage'
import { formatJSBIValue } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { calculateSlippageAmount } from 'utils/slippage'
import { ErrorName, TransactionError } from 'utils/transactionError'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'
import { Address, encodeFunctionData, parseSignature } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'
import { didUserReject } from 'utils/walletError'

export default function TokenPair({
  currencyIdA,
  currencyIdB,
  pairAddress,
}: {
  currencyIdA: string
  currencyIdB: string
  pairAddress: string
}) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()

  const nativeA = currencyA as Currency
  const nativeB = currencyB as Currency
  const [tokenA, tokenB] = useMemo(() => [currencyA?.wrapped, currencyB?.wrapped], [currencyA, currencyB])

  const currencyAIsETHER = !!currencyA?.isNative
  const currencyAIsWETH = !!currencyA?.equals(WETH[chainId])
  const currencyBIsETHER = !!currencyB?.isNative
  const currencyBIsWETH = !!currencyB?.equals(WETH[chainId])

  const theme = useTheme()
  const notify = useNotify()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, typedValue } = useBurnState()
  const { pair, userLiquidity, parsedAmounts, amountsMin, price, error, isStaticFeePair, isOldStaticFeeContract } =
    useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined, pairAddress)
  const contractAddress = isStaticFeePair
    ? isOldStaticFeeContract
      ? networkInfo.classic.oldStatic?.router
      : networkInfo.classic.static.router
    : networkInfo.classic.dynamic?.router
  const amp = pair?.amp || JSBI.BigInt(0)
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()
  const [removeLiquidityError, setRemoveLiquidityError] = useState<string>('')

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  }

  // pair contract
  const pairContract = usePairContract(pair?.liquidityToken?.address)

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback({
    amount: parsedAmounts[Field.LIQUIDITY],
    spender: contractAddress,
  })

  // if user liquidity change => remove signature
  useEffect(() => {
    setSignatureData(null)
    // eslint-disable-next-line
  }, [userLiquidity?.toExact()])

  const isArgentWallet = useIsArgentWallet()

  async function onAttemptToApprove() {
    if (!chainId) throw new Error('missing chain')
    if (!pairContract || !pair || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (isArgentWallet) {
      await approveCallback()
      return
    }

    // try to gather a signature for permission
    const nonce = (await readContract(wagmiConfig, {
      address: pairContract.address,
      abi: pairContract.abi,
      functionName: 'nonces',
      args: [account],
      chainId: chainId as number,
    })) as bigint

    const domain = {
      name: isStaticFeePair ? 'KyberSwap LP' : 'KyberDMM LP',
      version: '1',
      chainId,
      verifyingContract: pair.liquidityToken.address,
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ]
    const message = {
      owner: account,
      spender: contractAddress,
      value: liquidityAmount.quotient.toString(),
      nonce: `0x${nonce.toString(16)}`,
      deadline: Number(deadline),
    }
    const typedData = {
      types: {
        EIP712Domain,
        Permit,
      },
      domain,
      primaryType: 'Permit',
      message,
    }

    try {
      const rawSignature = await signTypedDataRaw({
        chainId: chainId as number,
        account: account as Address,
        typedData,
      })
      const signature = parseSignature(rawSignature as `0x${string}`)
      setSignatureData({
        v: Number(signature.v ?? (signature.yParity === 0 ? 27 : 28)),
        r: signature.r,
        s: signature.s,
        deadline: Number(deadline),
      })
    } catch (error) {
      if (didUserReject(error)) {
        notify(
          {
            title: t`Approve failed`,
            summary: friendlyError(error),
            type: NotificationType.ERROR,
          },
          8000,
        )
      } else {
        await approveCallback()
      }
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      setSignatureData(null)
      return _onUserInput(field, typedValue)
    },
    [_onUserInput],
  )

  const onLiquidityInput = useCallback(
    (typedValue: string): void => onUserInput(Field.LIQUIDITY, typedValue),
    [onUserInput],
  )
  const onCurrencyAInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue),
    [onUserInput],
  )
  const onCurrencyBInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue),
    [onUserInput],
  )

  // tx sending
  const addTransactionWithType = useTransactionAdder()
  async function onRemove() {
    if (!account || !deadline) throw new Error('missing dependencies')
    if (!contractAddress) throw new Error('missing router address')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const routerAbi = isStaticFeePair
      ? isOldStaticFeeContract
        ? ROUTER_STATIC_FEE_ABI
        : KS_ROUTER_STATIC_FEE_ABI
      : ROUTER_DYNAMIC_FEE_ABI

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0],
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB.isNative
    const oneCurrencyIsETH = currencyA.isNative || currencyBIsETH

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    const deadlineArg = BigInt(deadline.toString())
    const liquidityArg = BigInt(liquidityAmount.quotient.toString())

    let methodNames: string[]
    let methodArgs: unknown[][]
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        const sharedArgs = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          pairAddress,
          liquidityArg,
          BigInt(amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString()),
          BigInt(amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString()),
          account,
          deadlineArg,
        ]
        methodArgs = [sharedArgs, sharedArgs]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        methodArgs = [
          [
            tokenA.address,
            tokenB.address,
            pairAddress,
            liquidityArg,
            BigInt(amountsMin[Field.CURRENCY_A].toString()),
            BigInt(amountsMin[Field.CURRENCY_B].toString()),
            account,
            deadlineArg,
          ],
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        const sharedArgs = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          pairAddress,
          liquidityArg,
          BigInt(amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString()),
          BigInt(amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString()),
          account,
          BigInt(signatureData.deadline),
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
        methodArgs = [sharedArgs, sharedArgs]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        methodArgs = [
          [
            tokenA.address,
            tokenB.address,
            pairAddress,
            liquidityArg,
            BigInt(amountsMin[Field.CURRENCY_A].toString()),
            BigInt(amountsMin[Field.CURRENCY_B].toString()),
            account,
            BigInt(signatureData.deadline),
            false,
            signatureData.v,
            signatureData.r,
            signatureData.s,
          ],
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    setAttemptingTxn(true)
    let response: Awaited<ReturnType<typeof sendEVMTransaction>>
    let lastError: unknown
    for (let i = 0; i < methodNames.length; i++) {
      try {
        response = await sendEVMTransaction({
          account,
          contractAddress,
          encodedData: encodeFunctionData({
            abi: routerAbi,
            functionName: methodNames[i],
            args: methodArgs[i],
          }),
          value: 0n,
          errorInfo: { name: ErrorName.SwapError, wallet: undefined },
          isSmartConnector,
          chainId,
        })
        if (response) break
      } catch (error) {
        lastError = error
        console.error(`sendTransaction failed`, methodNames[i], methodArgs[i], error)
        // Only retry the next method when the failure was at gas estimation —
        // the wallet hasn't been prompted yet, so falling back to the alternate
        // method (e.g. supportingFeeOnTransfer variant) is free. If the failure
        // was at `sendTransaction` the user has already seen (and likely
        // rejected) a wallet prompt; retrying would pop a second one.
        const isEstimateFailure = error instanceof TransactionError && error.type === 'estimateGas'
        const shouldRetry = isEstimateFailure && i < methodNames.length - 1
        if (!shouldRetry) {
          setAttemptingTxn(false)
          const err = error as Error
          const message = err?.message?.includes('INSUFFICIENT')
            ? t`Insufficient liquidity available. Please reload page or increase max slippage and try again!`
            : err?.message || JSON.stringify(error)
          setRemoveLiquidityError(message)
          if (!didUserReject(error)) {
            console.error('Remove Classic Liquidity Error:', { message, error })
          }
          return
        }
      }
    }

    if (!response?.hash) {
      setAttemptingTxn(false)
      if (lastError) {
        const err = lastError as Error
        setRemoveLiquidityError(err?.message || JSON.stringify(lastError))
      }
      return
    }

    setAttemptingTxn(false)
    const tokenAmountIn = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? ''
    const tokenAmountOut = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? ''
    const tokenSymbolIn = currencyAIsWETH ? NativeCurrencies[chainId].symbol : currencyA.symbol
    const tokenSymbolOut = currencyBIsWETH ? NativeCurrencies[chainId].symbol : currencyB.symbol
    addTransactionWithType({
      hash: response.hash,
      type: TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY,
      extraInfo: {
        tokenAmountIn,
        tokenAmountOut,
        tokenSymbolIn,
        tokenSymbolOut,
        tokenAddressIn: currencyA.wrapped.address,
        tokenAddressOut: currencyB.wrapped.address,
        contract: pairAddress,
        arbitrary: {
          poolAddress: pairAddress,
          token_1: currencyA.symbol,
          token_2: currencyB.symbol,
          remove_liquidity_method: 'token pair',
          amp: new Fraction(amp).divide(JSBI.BigInt(10000)).toSignificant(5),
        },
      },
    })

    setTxHash(response.hash)
  }

  const tokenAddresses: string[] = useMemo(
    () => [tokenA, tokenB].map(token => token?.address as string).filter(item => !!item),
    [tokenA, tokenB],
  )
  const marketPriceMap = useTokenPrices(tokenAddresses)
  const usdPrices = [tokenA, tokenB].map(item => marketPriceMap[item?.address || ''] || 0)

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[0]
      ? parseFloat((parsedAmounts[Field.CURRENCY_A] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[1]
      ? parseFloat((parsedAmounts[Field.CURRENCY_B] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[1]
      : 0

  const pendingText = `Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    nativeA?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${nativeB?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
    setRemoveLiquidityError('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback,
  )

  function modalHeader() {
    const displaySlp = allowedSlippage / 100
    return (
      <AutoColumn className="mt-5 gap-3">
        <AutoRow className="gap-1">
          <CurrencyLogo currency={currencyA} size={'28px'} />
          <span className="text-[32px] font-medium leading-[normal]">
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </span>
          <span className="text-[32px] font-medium leading-[normal]">{nativeA?.symbol}</span>
          {!!estimatedUsdCurrencyA && (
            <span className="ml-1 text-[18px] font-medium leading-[normal] text-subText">
              (~{formatDisplayNumber(estimatedUsdCurrencyA, { style: 'currency', significantDigits: 6 })})
            </span>
          )}
        </AutoRow>

        <AutoRow className="gap-1">
          <CurrencyLogo currency={currencyB} size={'28px'} />
          <span className="text-[32px] font-medium leading-[normal]">
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </span>
          <span className="text-[32px] font-medium leading-[normal]">{nativeB?.symbol}</span>
          {!!estimatedUsdCurrencyB && (
            <span className="ml-1 text-[18px] font-medium leading-[normal] text-subText">
              (~{formatDisplayNumber(estimatedUsdCurrencyB, { style: 'currency', significantDigits: 6 })})
            </span>
          )}
        </AutoRow>

        <p className="m-0 text-left text-[12px] font-normal italic leading-[normal] text-subText">
          {t`Output is estimated. If the price changes by more than ${displaySlp}% your transaction will revert.`}
        </p>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <ModalDetailWrapper>
          {pair && (
            <>
              <CurrentPriceWrapper className="pb-2">
                <p className="m-0 text-sm font-normal leading-[normal] text-subText">
                  <Trans>Current Price</Trans>
                </p>
                <p className="m-0 text-sm font-normal leading-[normal] text-text">
                  <CurrentPrice price={price} />
                </p>
              </CurrentPriceWrapper>

              <RowBetween className="pb-3">
                <span className="text-[14px] leading-[normal] text-subText">
                  <Trans>LP Tokens Removed</Trans>
                </span>

                <RowFixed>
                  <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
                  <span className="text-[14px] leading-[normal] text-text">
                    {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
                  </span>
                </RowFixed>
              </RowBetween>

              {amountsMin && (
                <>
                  <RowBetween className="pb-3">
                    <p className="m-0 text-sm font-normal leading-[normal] text-subText">
                      <Trans>Minimum Received</Trans>
                    </p>

                    <TokenWrapper>
                      <CurrencyLogo currency={currencyA} size="16px" />
                      <p className="m-0 text-sm font-normal leading-[normal] text-text">
                        {formatJSBIValue(amountsMin[Field.CURRENCY_A], currencyA?.decimals)} {nativeA?.symbol}
                      </p>
                    </TokenWrapper>
                  </RowBetween>

                  <RowBetween>
                    <div />

                    <TokenWrapper>
                      <CurrencyLogo currency={currencyB} size="16px" />
                      <p className="m-0 text-sm font-normal leading-[normal] text-text">
                        {formatJSBIValue(amountsMin[Field.CURRENCY_B], currencyB?.decimals)} {nativeB?.symbol}
                      </p>
                    </TokenWrapper>
                  </RowBetween>
                </>
              )}
            </>
          )}
        </ModalDetailWrapper>

        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          <span className="text-[16px] font-medium leading-[normal]">
            <Trans>Confirm</Trans>
          </span>
        </ButtonPrimary>
      </>
    )
  }

  return (
    <>
      <Wrapper>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash ? txHash : ''}
          content={() =>
            removeLiquidityError ? (
              <TransactionErrorContent onDismiss={handleDismissConfirmation} message={removeLiquidityError} />
            ) : (
              <ConfirmationModalContent
                title={t`You will receive`}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )
          }
          pendingText={pendingText}
        />
        <AutoColumn className="gap-3">
          <GridColumn>
            <FirstColumn>
              <BlackCard className="rounded p-4">
                <AutoColumn className="gap-4">
                  <RowBetween>
                    <span className="text-[12px] font-medium leading-[normal]">
                      <Trans>Amount</Trans>
                    </span>

                    <span className="text-[12px] font-medium leading-[normal]">
                      <Trans>Balance</Trans>:{' '}
                      {!userLiquidity ? (
                        <Loader />
                      ) : (
                        formatDisplayNumber(userLiquidity, { style: 'decimal', significantDigits: 6 })
                      )}{' '}
                      LP Tokens
                    </span>
                  </RowBetween>
                  <Row className="items-end">
                    <span className="text-[72px] font-medium leading-[normal]">
                      {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                    </span>
                  </Row>

                  <>
                    <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} size={18} />
                    <RowBetween className="gap-1">
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}>25%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}>50%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}>75%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}>
                        <Trans>Max</Trans>
                      </MaxButton>
                    </RowBetween>
                  </>
                </AutoColumn>
              </BlackCard>

              {chainId && pair && (
                <CurrencyInputPanel
                  hideBalance
                  hideLogo
                  value={formattedAmounts[Field.LIQUIDITY]}
                  onUserInput={onLiquidityInput}
                  disableCurrencySelect
                  currency={
                    new Token(
                      chainId,
                      pair.liquidityToken?.address,
                      pair.liquidityToken?.decimals,
                      `LP Tokens`,
                      `LP Tokens`,
                    )
                  }
                  id="liquidity-amount"
                />
              )}
            </FirstColumn>

            <SecondColumn>
              <>
                <div className="mb-6">
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onCurrencyAInput}
                    currency={currencyA}
                    label={t`Output`}
                    onCurrencySelect={() => null}
                    disableCurrencySelect={true}
                    id="remove-liquidity-tokena"
                    estimatedUsd={formatDisplayNumber(estimatedUsdCurrencyA, {
                      style: 'currency',
                      significantDigits: 6,
                    })}
                  />
                  <div className="mt-2 flex items-center justify-end">
                    {pairAddress && chainId && (currencyAIsETHER || currencyAIsWETH) && (
                      <StyledInternalLink
                        replace
                        to={`/${networkInfo.route}${LEGACY_POOL_APP_PATHS.CLASSIC_REMOVE_POOL}/${
                          currencyAIsETHER ? currencyId(WETH[chainId], chainId) : NativeCurrencies[chainId].symbol
                        }/${currencyIdB}/${pairAddress}`}
                      >
                        {currencyAIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    )}
                  </div>
                </div>

                <div>
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_B]}
                    onUserInput={onCurrencyBInput}
                    currency={currencyB}
                    onCurrencySelect={() => null}
                    disableCurrencySelect={true}
                    id="remove-liquidity-tokenb"
                    estimatedUsd={formatDisplayNumber(estimatedUsdCurrencyB, {
                      style: 'currency',
                      significantDigits: 6,
                    })}
                  />
                  <div className="mt-2 flex items-center justify-end">
                    {pairAddress && chainId && (currencyBIsWETH || currencyBIsETHER) && (
                      <StyledInternalLink
                        replace
                        to={`/${networkInfo.route}${LEGACY_POOL_APP_PATHS.CLASSIC_REMOVE_POOL}/${currencyIdA}/${
                          currencyBIsETHER ? currencyId(WETH[chainId], chainId) : NativeCurrencies[chainId].symbol
                        }/${pairAddress}`}
                      >
                        {currencyBIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    )}
                  </div>
                </div>
              </>

              {pair && (
                <DetailWrapper>
                  <AutoRow className="justify-between gap-1 pb-3">
                    <p className="m-0 text-[12px] font-medium leading-[normal] text-subText">
                      <UppercaseText>
                        <Trans>Minimum Received</Trans>
                      </UppercaseText>
                    </p>
                  </AutoRow>

                  {amountsMin && (
                    <DetailBox style={{ paddingBottom: '12px', borderBottom: `1px dashed ${theme.border}` }}>
                      <TokenWrapper>
                        <CurrencyLogo currency={currencyA} size="16px" />
                        <p className="m-0 text-sm font-normal leading-[normal] text-text">
                          {formatJSBIValue(amountsMin[Field.CURRENCY_A], currencyA?.decimals)} {nativeA?.symbol}
                        </p>
                      </TokenWrapper>

                      <TokenWrapper>
                        <CurrencyLogo currency={currencyB} size="16px" />
                        <p className="m-0 text-sm font-normal leading-[normal] text-text">
                          {formatJSBIValue(amountsMin[Field.CURRENCY_B], currencyB?.decimals)} {nativeB?.symbol}
                        </p>
                      </TokenWrapper>
                    </DetailBox>
                  )}

                  <DetailBox className="pt-3">
                    <p className="m-0 flex items-center text-[12px] font-medium leading-[normal] text-subText">
                      <UppercaseText>
                        <Trans>Current Price</Trans>
                      </UppercaseText>
                    </p>
                    <p className="m-0 text-sm font-normal leading-[normal] text-text">
                      <CurrentPrice price={price} />
                    </p>
                  </DetailBox>
                </DetailWrapper>
              )}

              <div className="relative">
                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect</Trans>
                  </ButtonLight>
                ) : (
                  <RowBetween>
                    {!error && (
                      <ButtonConfirmed
                        onClick={onAttemptToApprove}
                        confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                        disabled={
                          approval !== ApprovalState.NOT_APPROVED ||
                          signatureData !== null ||
                          !userLiquidity ||
                          userLiquidity.equalTo('0')
                        }
                        className="mr-4 text-base font-medium"
                      >
                        {approval === ApprovalState.PENDING ? (
                          <Dots>
                            <Trans>Approving</Trans>
                          </Dots>
                        ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                          t`Approved`
                        ) : (
                          t`Approve`
                        )}
                      </ButtonConfirmed>
                    )}
                    <ButtonError
                      onClick={() => {
                        setShowConfirm(true)
                      }}
                      disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                      error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                    >
                      <span className="text-[16px] font-medium leading-[normal]">{error || t`Remove`}</span>
                    </ButtonError>
                  </RowBetween>
                )}
              </div>
            </SecondColumn>
          </GridColumn>
        </AutoColumn>
      </Wrapper>
    </>
  )
}
