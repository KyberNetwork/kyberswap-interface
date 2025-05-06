import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import LocalLoader from 'components/LocalLoader'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

import { NavigateButton } from 'pages/Earns/PoolExplorer/styles'
import { EmptyPositionText, PositionPageWrapper } from 'pages/Earns/UserPositions/styles'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import LeftSection from 'pages/Earns/PositionDetail/LeftSection'
import RightSection from 'pages/Earns/PositionDetail/RightSection'
import {
  MainSection,
  PositionAction,
  PositionActionWrapper,
  PositionDetailWrapper,
} from 'pages/Earns/PositionDetail/styles'
import { CoreProtocol, EarnDex } from 'pages/Earns/constants'
import { ParsedPosition } from 'pages/Earns/types'
import { isForkFrom } from 'pages/Earns/utils'
import useZapOutWidget from 'pages/Earns/hooks/useZapOutWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'

const PositionDetail = () => {
  const firstLoading = useRef(false)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const forceLoading = searchParams.get('forceLoading')

  const { account } = useActiveWeb3React()
  const { positionId, chainId, protocol } = useParams()
  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
  })
  const { widget: zapOutWidget, handleOpenZapOut } = useZapOutWidget()
  const { data: userPosition, isLoading } = useUserPositionsQuery(
    {
      addresses: account || '',
      positionId: positionId,
      chainIds: chainId || '',
      protocols: protocol || '',
    },
    { skip: !account, pollingInterval: forceLoading ? 5_000 : 15_000 },
  )
  const currentWalletAddress = useRef(account)
  const hadForceLoading = useRef(forceLoading ? true : false)

  const position: ParsedPosition | undefined = useMemo(() => {
    if (!userPosition?.[0]) return
    const position = userPosition?.[0]

    return {
      id: position.tokenId,
      pool: {
        fee: position.pool.fees?.[0],
        address: position.pool.poolAddress,
      },
      dex: {
        id: position.pool.project || '',
        logo: position.pool.projectLogo || '',
      },
      chain: {
        id: position.chainId,
        name: position.chainName,
        logo: position.chainLogo || '',
      },
      priceRange: {
        min: position.minPrice || 0,
        max: position.maxPrice || 0,
        current: position.pool.price || 0,
      },
      earning: {
        earned:
          position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0) +
          position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0),
        in7d: position.earning7d || 0,
        in24h: position.earning24h || 0,
      },
      token0: {
        address: position.pool.tokenAmounts[0]?.token.address || '',
        logo: position.pool.tokenAmounts[0]?.token.logo || '',
        symbol: position.pool.tokenAmounts[0]?.token.symbol || '',
        decimals: position.pool.tokenAmounts[0]?.token.decimals,
        price: position.currentAmounts[0]?.token.price,
        totalAmount: position
          ? position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price
          : 0,
      },
      token1: {
        address: position.pool.tokenAmounts[1]?.token.address || '',
        logo: position.pool.tokenAmounts[1]?.token.logo || '',
        symbol: position.pool.tokenAmounts[1]?.token.symbol || '',
        decimals: position.pool.tokenAmounts[1]?.token.decimals,
        price: position.currentAmounts[1]?.token.price,
        totalAmount: position
          ? position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price
          : 0,
      },
      tokenAddress: position.tokenAddress,
      apr: position.apr || 0,
      totalValue: position.currentPositionValue,
      status: position.status,
      createdTime: position.createdTime,
    }
  }, [userPosition])

  const isUniv2 = useMemo(() => position && isForkFrom(position.dex.id as EarnDex, CoreProtocol.UniswapV2), [position])

  const onOpenIncreaseLiquidityWidget = () => {
    if (!position) return
    handleOpenZapIn(
      {
        exchange: position.dex.id,
        chainId: position.chain.id,
        address: position.pool.address,
      },
      isUniv2 ? account || '' : position.id,
    )
  }

  useEffect(() => {
    if (!firstLoading.current && !isLoading) {
      firstLoading.current = true
    }
  }, [isLoading])

  useEffect(() => {
    if (!account || account !== currentWalletAddress.current) navigate(APP_PATHS.EARN_POSITIONS)
  }, [account, navigate])

  useEffect(() => {
    if (position && forceLoading) {
      searchParams.delete('forceLoading')
      setSearchParams(searchParams)
    }
  }, [forceLoading, position, searchParams, setSearchParams])

  return (
    <>
      {zapInWidget}
      {zapMigrationWidget}
      {zapOutWidget}
      <PositionPageWrapper>
        {forceLoading || (isLoading && !firstLoading.current) ? (
          <LocalLoader />
        ) : !!position ? (
          <>
            <PositionDetailHeader position={position} hadForceLoading={hadForceLoading.current} />
            <PositionDetailWrapper>
              <MainSection>
                <LeftSection position={position} />
                <RightSection position={position} />
              </MainSection>
              <PositionActionWrapper>
                <PositionAction
                  outline
                  onClick={() => {
                    handleOpenZapOut({
                      dex: position.dex.id,
                      chainId: position.chain.id,
                      poolAddress: position.pool.address,
                      id: isUniv2 ? account || '' : position.id,
                    })
                  }}
                >{t`Remove Liquidity`}</PositionAction>
                <PositionAction onClick={onOpenIncreaseLiquidityWidget}>{t`Add Liquidity`}</PositionAction>
              </PositionActionWrapper>
            </PositionDetailWrapper>
          </>
        ) : (
          <EmptyPositionText>
            <IconEarnNotFound />
            <Text>{t`No position found!`}</Text>
            <Flex sx={{ gap: 2 }} marginTop={12}>
              <NavigateButton
                icon={<RocketIcon width={20} height={20} />}
                text={t`Explorer Pools`}
                to={APP_PATHS.EARN_POOLS}
              />
              <NavigateButton icon={<IconUserEarnPosition />} text={t`My Positions`} to={APP_PATHS.EARN_POSITIONS} />
            </Flex>
          </EmptyPositionText>
        )}
      </PositionPageWrapper>
    </>
  )
}

export default PositionDetail
