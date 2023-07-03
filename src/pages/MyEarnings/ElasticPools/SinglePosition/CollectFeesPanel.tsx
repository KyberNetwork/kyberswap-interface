import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { NonfungiblePositionManager, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract, useProMMFarmContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { setAttemptingTxn, setCollectFeeError, setShowPendingModal, setTxnHash } from 'state/myEarnings/actions'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { updateChainId } from 'state/user/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { basisPointsToPercent, calculateGasMargin } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

type Props = {
  nftId: string
  feeValue0: CurrencyAmount<Currency>
  feeValue1: CurrencyAmount<Currency>
  feeUsd: number
  chainId: ChainId
  hasUserDepositedInFarm: boolean
  poolAddress: string
  farmAddress?: string
  position: Position
}
const CollectFeesPanel: React.FC<Props> = ({
  nftId,
  chainId,
  feeUsd,
  feeValue0,
  feeValue1,
  hasUserDepositedInFarm,
  farmAddress,
  poolAddress,
  position,
}) => {
  const theme = useTheme()
  const { account, chainId: currentChainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const dispatch = useDispatch()
  const hasNoFeeToCollect = !(feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0))
  const changeNetwork = useChangeNetwork()
  const positionManager = useProAmmNFTPositionManagerContract()
  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance()
  const token0Shown = feeValue0?.currency || position.pool.token0
  const token1Shown = feeValue1?.currency || position.pool.token1

  const liquidity = position.liquidity.toString()
  const farmContract = useProMMFarmContract(farmAddress || '')
  const addTransactionWithType = useTransactionAdder()

  const handleBroadcastClaimSuccess = (response: TransactionResponse) => {
    const tokenAmountIn = feeValue0?.toSignificant(6)
    const tokenAmountOut = feeValue1?.toSignificant(6)
    const tokenSymbolIn = feeValue0?.currency.symbol ?? ''
    const tokenSymbolOut = feeValue1?.currency.symbol ?? ''
    addTransactionWithType({
      hash: response.hash,
      type: TRANSACTION_TYPE.ELASTIC_COLLECT_FEE,
      extraInfo: {
        tokenAmountIn,
        tokenAmountOut,
        tokenAddressIn: feeValue0?.currency.wrapped.address,
        tokenAddressOut: feeValue1?.currency.wrapped.address,
        tokenSymbolIn,
        tokenSymbolOut,
        arbitrary: {
          token_1: token0Shown?.symbol,
          token_2: token1Shown?.symbol,
          token_1_amount: tokenAmountIn,
          token_2_amount: tokenAmountOut,
        },
      },
    })
    dispatch(setAttemptingTxn(false))
    dispatch(setTxnHash(response.hash))
  }

  const collectFeeFromFarmContract = async () => {
    if (!farmContract || !feeValue0 || !feeValue1) {
      dispatch(setAttemptingTxn(false))
      dispatch(setCollectFeeError('Something went wrong!'))
      return
    }

    const amount0Min = feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage)))
    const amount1Min = feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage)))
    try {
      const gasEstimation = await farmContract.estimateGas.claimFee(
        [nftId],
        amount0Min.quotient.toString(),
        amount1Min.quotient.toString(),
        poolAddress,
        true,
        deadline?.toString(),
      )

      const tx = await farmContract.claimFee(
        [nftId],
        amount0Min.quotient.toString(),
        amount1Min.quotient.toString(),
        poolAddress,
        true,
        deadline?.toString(),
        {
          gasLimit: calculateGasMargin(gasEstimation),
        },
      )

      handleBroadcastClaimSuccess(tx)
    } catch (e) {
      dispatch(setShowPendingModal(true))
      dispatch(setAttemptingTxn(false))
      dispatch(setCollectFeeError(e?.message || JSON.stringify(e)))
    }
  }

  const collect = () => {
    dispatch(setShowPendingModal(true))
    dispatch(setAttemptingTxn(true))

    if (!feeValue0 || !feeValue1 || !positionManager || !account || !library || !deadline) {
      //|| !layout || !token
      dispatch(setAttemptingTxn(false))
      dispatch(setCollectFeeError('Something went wrong!'))
      return
    }

    if (hasUserDepositedInFarm) {
      collectFeeFromFarmContract()
      return
    }

    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: nftId.toString(),
      expectedCurrencyOwed0: feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage))),
      expectedCurrencyOwed1: feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage))),
      recipient: account,
      deadline: deadline.toString(),
      havingFee: true,
      isPositionClosed: liquidity === '0',
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate: BigNumber) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            handleBroadcastClaimSuccess(response)
          })
      })
      .catch((error: any) => {
        dispatch(setShowPendingModal(true))
        dispatch(setAttemptingTxn(false))
        dispatch(setCollectFeeError(error?.message || JSON.stringify(error)))
        console.error(error)
      })
  }

  const handleClickCollectFees = async () => {
    if (currentChainId !== chainId) {
      changeNetwork(chainId, () => {
        dispatch(updateChainId(chainId))
        collect()
      })
    } else {
      collect()
    }
  }

  return (
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '20px',
        background: hasNoFeeToCollect ? theme.background : rgba(theme.apr, 0.3),
        padding: '16px',
      }}
    >
      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        <Text
          as="span"
          sx={{
            fontWeight: 500,
            fontSize: '12px',
            lineHeight: '16px',
            color: theme.subText,
            width: 'fit-content',
            borderBottom: '1px dashed transparent',
            borderBottomColor: theme.subText,
          }}
        >
          <MouseoverTooltip
            width="200px"
            text={<Trans>Your fees are being automatically compounded so you earn more</Trans>}
            placement="top"
          >
            <Trans>Fees Earned</Trans>
          </MouseoverTooltip>
        </Text>

        <HoverDropdown
          anchor={
            <Text as="span" fontSize="16px" fontWeight={500} lineHeight={'20px'}>
              {formatDollarAmount(feeUsd)}
            </Text>
          }
          disabled={hasNoFeeToCollect}
          text={
            <>
              {[feeValue0, feeValue1].map((fee, index) => (
                <Flex
                  alignItems="center"
                  key={index}
                  sx={{
                    gap: '4px',
                  }}
                >
                  <CurrencyLogo currency={fee.currency} size="14px" />
                  <Text fontSize={12}>
                    {+fee.toSignificant(8)} {fee.currency.symbol}
                  </Text>
                </Flex>
              ))}
            </>
          }
        />
      </Flex>

      <ButtonPrimary
        disabled={hasNoFeeToCollect}
        style={{
          height: '36px',
          width: 'fit-content',
          flexWrap: 'nowrap',
          padding: '0 12px',
        }}
        onClick={handleClickCollectFees}
      >
        Collect Fees
      </ButtonPrimary>
    </Flex>
  )
}

export default CollectFeesPanel
