import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { PositionHistoryType, usePositionHistoryQuery } from 'services/zapEarn'

import HelpIcon from 'assets/svg/help-circle.svg'
import CopyHelper from 'components/Copy'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import { useReadingContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useAllTransactions } from 'state/transactions/hooks'
import { formatDisplayNumber } from 'utils/numbers'

import { ParsedPosition } from '.'
import { DexImage } from '../UserPositions/styles'
import ClaimFeeModal, { isNativeToken } from '../components/ClaimFeeModal'
import { NFT_MANAGER_ABI, NFT_MANAGER_CONTRACT } from '../constants'
import { formatAprNumber } from '../utils'
import {
  InfoLeftColumn,
  InfoRight,
  InfoSection,
  InfoSectionFirstFormat,
  PositionAction,
  VerticalDivider,
} from './styles'

const FEE_FETCHING_INTERVAL = 15_000
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

const formatDateTime = (number: number) => (number < 10 ? `0${number}` : number)

const LeftSection = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const [openClaimFeeModal, setOpenClaimFeeModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimTx, setClaimTx] = useState<string | null>(null)
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null)

  const allTransactions = useAllTransactions(true)

  const { data: historyData } = usePositionHistoryQuery({
    chainId: position.chainId,
    tokenAddress: position.tokenAddress,
    tokenId: position.id,
  })

  const nftManagerContractOfDex = NFT_MANAGER_CONTRACT[position.dex as keyof typeof NFT_MANAGER_CONTRACT]
  const nftManagerContract =
    typeof nftManagerContractOfDex === 'string'
      ? nftManagerContractOfDex
      : nftManagerContractOfDex[position.chainId as keyof typeof nftManagerContractOfDex]
  const nftManagerAbi = NFT_MANAGER_ABI[position.dex as keyof typeof NFT_MANAGER_ABI]
  const contract = useReadingContract(nftManagerContract, nftManagerAbi, position.chainId)

  const isToken0Native = isNativeToken(position.token0Address, position.chainId as keyof typeof WETH)
  const isToken1Native = isNativeToken(position.token1Address, position.chainId as keyof typeof WETH)

  const createdTime = useMemo(() => {
    const data = new Date(position.createdTime * 1000)
    const hours = formatDateTime(data.getHours())
    const minutes = formatDateTime(data.getMinutes())
    const seconds = formatDateTime(data.getSeconds())
    return `${hours}:${minutes}:${seconds} ${data.toLocaleDateString()}`
  }, [position.createdTime])

  const txHash = useMemo(() => {
    if (!historyData) return ''
    return [...historyData].reverse().find(item => item.type === PositionHistoryType.DEPOSIT)?.txHash || ''
  }, [historyData])

  const handleFetchUnclaimedFee = useCallback(async () => {
    if (!contract) return
    const owner = await contract.ownerOf(position.id)
    const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
    const results = await contract.callStatic.collect(
      {
        tokenId: position.id,
        recipient: owner,
        amount0Max: maxUnit,
        amount1Max: maxUnit,
      },
      { from: owner },
    )
    const balance0 = results.amount0.toString()
    const balance1 = results.amount1.toString()
    const amount0 = CurrencyAmount.fromRawAmount(
      new Token(position.chainId, position.token0Address, position.token0Decimals),
      balance0,
    ).toExact()
    const amount1 = CurrencyAmount.fromRawAmount(
      new Token(position.chainId, position.token1Address, position.token1Decimals),
      balance1,
    ).toExact()
    setFeeInfo({
      balance0,
      balance1,
      amount0,
      amount1,
      value0: parseFloat(amount0) * position.token0Price,
      value1: parseFloat(amount1) * position.token1Price,
      totalValue: parseFloat(amount0) * position.token0Price + parseFloat(amount1) * position.token1Price,
    })
  }, [
    contract,
    position.chainId,
    position.id,
    position.token0Address,
    position.token0Decimals,
    position.token0Price,
    position.token1Address,
    position.token1Decimals,
    position.token1Price,
  ])

  useEffect(() => {
    const wrappedHandleFetchUnclaimedFee = () => {
      if (!claiming) handleFetchUnclaimedFee()
    }
    wrappedHandleFetchUnclaimedFee()
    feeFetchingInterval = setInterval(wrappedHandleFetchUnclaimedFee, FEE_FETCHING_INTERVAL)
    return () => clearInterval(feeFetchingInterval)
  }, [claiming, handleFetchUnclaimedFee])

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

  const nativeToken = NETWORKS_INFO[position.chainId as keyof typeof NETWORKS_INFO].nativeToken

  return (
    <InfoLeftColumn>
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
              src={position.token0Logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null
                currentTarget.src = HelpIcon
              }}
            />
            <Text>{formatDisplayNumber(position.token0TotalAmount, { significantDigits: 6 })}</Text>
            <Text>{position.token0Symbol}</Text>
          </Flex>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <DexImage
              src={position.token1Logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null
                currentTarget.src = HelpIcon
              }}
            />
            <Text>{formatDisplayNumber(position.token1TotalAmount, { significantDigits: 6 })}</Text>
            <Text>{position.token1Symbol}</Text>
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
              {position.earning24h || position.earning24h === 0
                ? formatDisplayNumber(position.earning24h, { significantDigits: 4, style: 'currency' })
                : '--'}
            </Text>
          </Flex>
          <VerticalDivider />
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              7 {t`days`}
            </Text>
            <Text>
              {position.earning7d || position.earning7d === 0
                ? formatDisplayNumber(position.earning7d, { significantDigits: 4, style: 'currency' })
                : '--'}
            </Text>
          </Flex>
          <VerticalDivider />
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              {t`All`}
            </Text>
            <Text fontSize={18} color={position.totalEarnedFee ? theme.primary : theme.text}>
              {position.totalEarnedFee
                ? formatDisplayNumber(position.totalEarnedFee, { style: 'currency', significantDigits: 4 })
                : '--'}
            </Text>
          </Flex>
        </Flex>
      </InfoSection>
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
              <Text>{isToken0Native ? nativeToken.symbol : position.token0Symbol}</Text>
              <Text fontSize={14} color={theme.subText}>
                {formatDisplayNumber(feeInfo?.value0, {
                  style: 'currency',
                  significantDigits: 4,
                })}
              </Text>
            </Flex>
            <Flex alignItems={'center'} sx={{ gap: '6px' }}>
              <Text>{formatDisplayNumber(feeInfo?.amount1, { significantDigits: 4 })}</Text>
              <Text>{isToken1Native ? nativeToken.symbol : position.token1Symbol}</Text>
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
      <InfoSection>
        <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
          <Text fontSize={14} color={theme.subText}>
            {t`Created Time`}
          </Text>
          <Text>{createdTime}</Text>
        </Flex>
        {/* <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
          <Text fontSize={14} color={theme.subText}>
            {t`Liquidity Source`}
          </Text>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <Text fontSize={14} color={theme.subText}>{t`Value`}</Text>
            <Text>$12,600</Text>
          </Flex>
        </Flex> */}
        <Flex flexDirection={'column'} alignItems={'flex-end'} sx={{ gap: 2 }} marginBottom={2}>
          {/* <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <Text>345 KNC</Text> <Text>+ 12.65 JUP</Text> <Text>+ 0.18 ETH</Text>
          </Flex> */}
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <Text fontSize={14} color={theme.subText}>{t`Tnx Hash`}</Text>
            <Text
              color={theme.blue2}
              onClick={() => window.open(NETWORKS_INFO[position.chainId as ChainId].etherscanUrl + '/tx/' + txHash)}
              sx={{ cursor: 'pointer' }}
              marginRight={-1}
            >{`${txHash.substring(0, 6)}...${txHash.substring(62)}`}</Text>
            <CopyHelper color={theme.blue2} size={16} toCopy={txHash} />
          </Flex>
        </Flex>
        {/* <Flex alignItems={'flex-start'} justifyContent={'space-between'}>
          <Text fontSize={14} color={theme.subText}>{t`Past Actions`}</Text>
          <Flex flexDirection={'column'} alignItems={'flex-end'} sx={{ gap: '6px' }}>
            <Text>{t`Increased Liquidity`}</Text>
            <Flex alignItems={'center'} sx={{ gap: '6px' }}>
              <Text fontSize={14} color={theme.subText}>{t`Value`}</Text>
              <Text>$12,600</Text>
            </Flex>
          </Flex>
        </Flex> */}
      </InfoSection>
    </InfoLeftColumn>
  )
}

export default LeftSection
