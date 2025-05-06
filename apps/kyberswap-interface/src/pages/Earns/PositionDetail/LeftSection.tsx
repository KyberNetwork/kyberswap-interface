import { CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { Flex, Text } from 'rebass'
import { ParsedPosition } from 'pages/Earns/types'

import HelpIcon from 'assets/svg/help-circle.svg'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import { useReadingContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useAllTransactions } from 'state/transactions/hooks'
import { formatDisplayNumber } from 'utils/numbers'

import { DexImage } from 'pages/Earns/UserPositions/styles'
import ClaimFeeModal, { isNativeToken } from 'pages/Earns/ClaimFeeModal'
import {
  CoreProtocol,
  DEXES_SUPPORT_COLLECT_FEE,
  EarnDex,
  NFT_MANAGER_ABI,
  NFT_MANAGER_CONTRACT,
} from 'pages/Earns/constants'
import { formatAprNumber, isForkFrom } from 'pages/Earns/utils'
import {
  InfoLeftColumn,
  InfoRight,
  InfoSection,
  InfoSectionFirstFormat,
  PositionAction,
  VerticalDivider,
} from 'pages/Earns/PositionDetail/styles'
import PositionHistory from './PositionHistory'

const FEE_FETCHING_INTERVAL = 30_000
let feeFetchingInterval: NodeJS.Timeout

export interface FeeInfo {
  balance0: string
  balance1: string
  amount0: string
  amount1: string
  value0: number
  value1: number
  totalValue: number
}

const LeftSection = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const [openClaimFeeModal, setOpenClaimFeeModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimTx, setClaimTx] = useState<string | null>(null)
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null)
  const [positionOwner, setPositionOwner] = useState<string | null>(null)

  const allTransactions = useAllTransactions(true)

  const nftManagerContractOfDex = NFT_MANAGER_CONTRACT[position.dex.id as keyof typeof NFT_MANAGER_CONTRACT]
  const nftManagerContract =
    typeof nftManagerContractOfDex === 'string'
      ? nftManagerContractOfDex
      : nftManagerContractOfDex[position.chain.id as keyof typeof nftManagerContractOfDex]
  const nftManagerAbi = NFT_MANAGER_ABI[position.dex.id as keyof typeof NFT_MANAGER_ABI]
  const contract = useReadingContract(nftManagerContract, nftManagerAbi, position.chain.id)

  const isToken0Native = isNativeToken(position.token0.address, position.chain.id as keyof typeof WETH)
  const isToken1Native = isNativeToken(position.token1.address, position.chain.id as keyof typeof WETH)
  const isUniv2 = isForkFrom(position.dex.id as EarnDex, CoreProtocol.UniswapV2)

  const handleGetPositionOwner = useCallback(async () => {
    if (!contract) return
    const owner = await contract.ownerOf(position.id)
    if (owner) setPositionOwner(owner)
  }, [contract, position.id])

  const handleFetchUnclaimedFee = useCallback(async () => {
    if (!contract || !positionOwner) return
    const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
    const results = await contract.callStatic.collect(
      {
        tokenId: position.id,
        recipient: positionOwner,
        amount0Max: maxUnit,
        amount1Max: maxUnit,
      },
      { from: positionOwner },
    )
    const balance0 = results.amount0.toString()
    const balance1 = results.amount1.toString()
    const amount0 = CurrencyAmount.fromRawAmount(
      new Token(position.chain.id, position.token0.address, position.token0.decimals),
      balance0,
    ).toExact()
    const amount1 = CurrencyAmount.fromRawAmount(
      new Token(position.chain.id, position.token1.address, position.token1.decimals),
      balance1,
    ).toExact()
    setFeeInfo({
      balance0,
      balance1,
      amount0,
      amount1,
      value0: parseFloat(amount0) * position.token0.price,
      value1: parseFloat(amount1) * position.token1.price,
      totalValue: parseFloat(amount0) * position.token0.price + parseFloat(amount1) * position.token1.price,
    })
  }, [contract, position.chain, position.id, position.token0, position.token1, positionOwner])

  useEffect(() => {
    handleGetPositionOwner()
  }, [handleGetPositionOwner])

  useEffect(() => {
    if (!positionOwner) return
    const wrappedHandleFetchUnclaimedFee = () => {
      if (!claiming) handleFetchUnclaimedFee()
    }
    wrappedHandleFetchUnclaimedFee()
    feeFetchingInterval = setInterval(wrappedHandleFetchUnclaimedFee, FEE_FETCHING_INTERVAL)
    return () => clearInterval(feeFetchingInterval)
  }, [claiming, handleFetchUnclaimedFee, positionOwner])

  useEffect(() => {
    if (claimTx && allTransactions && allTransactions[claimTx]) {
      const tx = allTransactions[claimTx]
      if (tx?.[0].receipt && tx?.[0].receipt.status === 1) {
        setClaiming(false)
        setClaimTx(null)
        setOpenClaimFeeModal(false)
        handleFetchUnclaimedFee()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTransactions])

  const nativeToken = NETWORKS_INFO[position.chain.id as keyof typeof NETWORKS_INFO].nativeToken

  return (
    <InfoLeftColumn halfWidth={isUniv2}>
      {openClaimFeeModal && feeInfo && (
        <ClaimFeeModal
          claiming={claiming}
          setClaiming={setClaiming}
          setClaimTx={setClaimTx}
          position={position}
          feeInfo={feeInfo}
          onClose={() => setOpenClaimFeeModal(false)}
        />
      )}
      <InfoSectionFirstFormat>
        <Text fontSize={14} color={theme.subText} marginTop={1}>
          {t`Total Liquidity`}
        </Text>
        <InfoRight>
          <Text fontSize={20}>
            {formatDisplayNumber(position.totalValue, {
              style: 'currency',
              significantDigits: 4,
            })}
          </Text>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <DexImage
              src={position.token0.logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null
                currentTarget.src = HelpIcon
              }}
            />
            <Text>{formatDisplayNumber(position.token0.totalAmount, { significantDigits: 6 })}</Text>
            <Text>{position.token0.symbol}</Text>
          </Flex>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <DexImage
              src={position.token1.logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null
                currentTarget.src = HelpIcon
              }}
            />
            <Text>{formatDisplayNumber(position.token1.totalAmount, { significantDigits: 6 })}</Text>
            <Text>{position.token1.symbol}</Text>
          </Flex>
        </InfoRight>
      </InfoSectionFirstFormat>
      <InfoSectionFirstFormat>
        <Flex alignItems={'center'} sx={{ marginTop: 1 }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Est. Position APR`}
          </Text>
          <InfoHelper text={t`Estimated 7 days APR`} placement="top" />
        </Flex>
        <Text fontSize={20} color={position.apr > 0 ? theme.primary : theme.text}>
          {formatAprNumber(position.apr * 100)}%
        </Text>
      </InfoSectionFirstFormat>
      <InfoSection>
        <Text fontSize={14} color={theme.subText} marginBottom={3}>
          {t`Fee Earn`}
        </Text>
        <Flex alignItems={'center'} justifyContent={'space-between'}>
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              1 {t`day`}
            </Text>
            <Text>
              {(position.earning.in24h || position.earning.in24h === 0) && !isUniv2
                ? formatDisplayNumber(position.earning.in24h, { significantDigits: 4, style: 'currency' })
                : '--'}
            </Text>
          </Flex>
          <VerticalDivider />
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              7 {t`days`}
            </Text>
            <Text>
              {(position.earning.in7d || position.earning.in7d === 0) && !isUniv2
                ? formatDisplayNumber(position.earning.in7d, { significantDigits: 4, style: 'currency' })
                : '--'}
            </Text>
          </Flex>
          <VerticalDivider />
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              {t`All`}
            </Text>
            <Text fontSize={18} color={position.earning.earned > 0 ? theme.primary : theme.text}>
              {(position.earning.earned || position.earning.earned === 0) && position.earning.earned >= 0
                ? formatDisplayNumber(position.earning.earned, { style: 'currency', significantDigits: 4 })
                : position.earning.earned && position.earning.earned < 0
                ? 0
                : '--'}
            </Text>
          </Flex>
        </Flex>
      </InfoSection>
      {DEXES_SUPPORT_COLLECT_FEE[position.dex.id as EarnDex] ? (
        <InfoSection>
          <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
            <Text fontSize={14} color={theme.subText} marginTop={1}>
              {t`Total Unclaimed Fees`}
            </Text>
            <Text fontSize={18}>
              {feeInfo
                ? formatDisplayNumber(feeInfo.totalValue, {
                    significantDigits: 4,
                    style: 'currency',
                  })
                : '--'}
            </Text>
          </Flex>
          <Flex alignItems={'center'} justifyContent={'space-between'}>
            <div>
              <Flex alignItems={'center'} sx={{ gap: '6px' }} marginBottom={1}>
                <Text>{formatDisplayNumber(feeInfo?.amount0, { significantDigits: 4 })}</Text>
                <Text>{isToken0Native ? nativeToken.symbol : position.token0.symbol}</Text>
                <Text fontSize={14} color={theme.subText}>
                  {formatDisplayNumber(feeInfo?.value0, {
                    style: 'currency',
                    significantDigits: 4,
                  })}
                </Text>
              </Flex>
              <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                <Text>{formatDisplayNumber(feeInfo?.amount1, { significantDigits: 4 })}</Text>
                <Text>{isToken1Native ? nativeToken.symbol : position.token1.symbol}</Text>
                <Text fontSize={14} color={theme.subText}>
                  {formatDisplayNumber(feeInfo?.value1, {
                    style: 'currency',
                    significantDigits: 4,
                  })}
                </Text>
              </Flex>
            </div>
            <PositionAction
              small
              outline
              mobileAutoWidth
              load={claiming}
              disabled={(!feeInfo || feeInfo.totalValue === 0) && !claiming}
              onClick={() => feeInfo && feeInfo.totalValue !== 0 && !claiming && setOpenClaimFeeModal(true)}
            >
              {claiming && <Loader size="14px" />}
              {claiming ? t`Claiming` : t`Claim`}
            </PositionAction>
          </Flex>
        </InfoSection>
      ) : null}
      {!isUniv2 && <PositionHistory position={position} />}
    </InfoLeftColumn>
  )
}

export default LeftSection
