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
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import LeftSection from 'pages/Earns/PositionDetail/LeftSection'
import RightSection from 'pages/Earns/PositionDetail/RightSection'
import { PositionDetailWrapper } from 'pages/Earns/PositionDetail/styles'
import { EmptyPositionText, PositionPageWrapper } from 'pages/Earns/UserPositions/styles'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { ParsedPosition } from 'pages/Earns/types'
import { parseRawPosition } from 'pages/Earns/utils'

const PositionDetail = () => {
  const firstLoading = useRef(false)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const forceLoading = searchParams.get('forceLoading')

  const { account } = useActiveWeb3React()
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

  const position: ParsedPosition | undefined = useMemo(
    () => (!!userPosition?.[0] ? parseRawPosition(userPosition[0]) : undefined),
    [userPosition],
  )

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
            <PositionDetailWrapper>
              <LeftSection position={position} />
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
