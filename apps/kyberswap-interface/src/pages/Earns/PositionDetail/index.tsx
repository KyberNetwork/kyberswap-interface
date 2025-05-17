import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import LocalLoader from 'components/LocalLoader'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NavigateButton } from 'pages/Earns/PoolExplorer/styles'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import LeftSection from 'pages/Earns/PositionDetail/LeftSection'
import RightSection from 'pages/Earns/PositionDetail/RightSection'
import { MigrationLiquidityRecommend, PositionDetailWrapper } from 'pages/Earns/PositionDetail/styles'
import { EmptyPositionText, PositionPageWrapper } from 'pages/Earns/UserPositions/styles'
import { EarnDex2 } from 'pages/Earns/constants'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { FeeInfo, ParsedPosition } from 'pages/Earns/types'
import { getFullUnclaimedFeesInfo, getNftManagerContract, parseRawPosition } from 'pages/Earns/utils'

const PositionDetail = () => {
  const firstLoading = useRef(false)
  const navigate = useNavigate()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const forceLoading = searchParams.get('forceLoading')

  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { positionId, chainId, protocol } = useParams()
  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()

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
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfo | undefined>()

  const position: ParsedPosition | undefined = useMemo(() => {
    if (!userPosition?.[0]) return undefined

    return parseRawPosition({ position: userPosition[0], feeInfo: feeInfoFromRpc })
  }, [feeInfoFromRpc, userPosition])

  const handleFetchUnclaimedFee = useCallback(async () => {
    if (!position || !library) return
    const contract = getNftManagerContract(position.dex.id, position.chain.id, library)

    if (!contract) return
    const owner = await contract.ownerOf(position.tokenId)

    if (!owner) return

    const feeFromRpc = await getFullUnclaimedFeesInfo({
      contract,
      positionOwner: owner,
      tokenId: position.tokenId,
      chainId: position.chain.id,
      token0: position.token0,
      token1: position.token1,
    })

    setFeeInfoFromRpc(feeFromRpc)

    setTimeout(() => setFeeInfoFromRpc(undefined), 60_000)
  }, [library, position])

  const handleMigrateToKem = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!position || !position.suggestionPool) return

    handleOpenZapMigration({
      chainId: position.chain.id,
      from: {
        dex: position.dex.id,
        poolId: position.pool.address,
        positionId: position.tokenId,
      },
      to: {
        dex: position.suggestionPool?.poolExchange as EarnDex2,
        poolId: position.suggestionPool?.address || '',
      },
    })
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

  const emptyPosition = (
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
  )

  return (
    <>
      {zapMigrationWidget}

      <PositionPageWrapper>
        {forceLoading || (isLoading && !firstLoading.current) ? (
          <LocalLoader />
        ) : !!position ? (
          <>
            <PositionDetailHeader position={position} hadForceLoading={hadForceLoading.current} />
            {!!position?.suggestionPool && (
              <MigrationLiquidityRecommend>
                <Text color={'#fafafa'} lineHeight={'18px'}>
                  {position.pool.fee === position.suggestionPool.feeTier
                    ? t`Migrate to exact same pair and fee tier on Uniswap v4 hook to earn extra rewards from the
              Kyberswap Liquidity Mining Program.`
                    : t`We found a pool with the same pair having Liquidity Mining Program. Migrate to this pool on Uniswap v4 hook to start earning farming rewards.`}
                </Text>
                <Text color={theme.primary} sx={{ cursor: 'pointer' }} onClick={handleMigrateToKem}>
                  Migrate →
                </Text>
              </MigrationLiquidityRecommend>
            )}
            <PositionDetailWrapper>
              <LeftSection position={position} onFetchUnclaimedFee={handleFetchUnclaimedFee} />
              <RightSection position={position} onOpenZapMigration={handleOpenZapMigration} />
            </PositionDetailWrapper>
          </>
        ) : (
          emptyPosition
        )}
      </PositionPageWrapper>
    </>
  )
}

export default PositionDetail
