import { ChainId } from '@kyberswap/ks-sdk-core'
import { useNavigate } from 'react-router-dom'
import { PoolDetail as PoolDetailData } from 'services/zapEarn'

import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { EarnPool } from 'pages/Earns/types'

import {
  HeaderBackButton,
  HeaderBadge,
  HeaderIdentity,
  HeaderTokenGroup,
  PoolHeaderContainer,
  PoolHeaderMeta,
  PoolHeaderTitle,
} from '../styled'

interface PoolHeaderProps {
  pool?: EarnPool
  poolDetail?: PoolDetailData
  chainId?: number
  exchange?: string
}

const PoolHeader = ({ pool, poolDetail, chainId, exchange }: PoolHeaderProps) => {
  const navigate = useNavigate()

  const primaryToken = pool?.tokens?.[0] || poolDetail?.tokens?.[0]
  const secondaryToken = pool?.tokens?.[1] || poolDetail?.tokens?.[1]
  const pairLabel = primaryToken && secondaryToken ? `${primaryToken.symbol}/${secondaryToken.symbol}` : 'Pool Detail'
  const dexInfo = exchange ? EARN_DEXES[exchange as Exchange] : undefined
  const chainName = chainId ? NETWORKS_INFO[chainId as ChainId]?.name : undefined
  const chainLogo = chainId ? NETWORKS_INFO[chainId as ChainId]?.icon : undefined
  const feeLabel =
    pool?.feeTier !== undefined
      ? `Fee ${pool.feeTier}%`
      : poolDetail?.swapFee !== undefined
      ? `Fee ${poolDetail.swapFee}%`
      : undefined

  return (
    <PoolHeaderContainer>
      <HeaderBackButton onClick={() => navigate(-1)} role="button" aria-label="Go back">
        <IconArrowLeft />
      </HeaderBackButton>

      <HeaderTokenGroup>
        <TokenLogo src={primaryToken && 'logoURI' in primaryToken ? primaryToken.logoURI : ''} size={28} />
        <TokenLogo
          src={secondaryToken && 'logoURI' in secondaryToken ? secondaryToken.logoURI : ''}
          size={28}
          translateLeft
        />
        {chainLogo ? <TokenLogo src={chainLogo} size={16} translateLeft translateTop /> : null}
      </HeaderTokenGroup>

      <HeaderIdentity>
        <PoolHeaderTitle>{pairLabel}</PoolHeaderTitle>
        <PoolHeaderMeta>{dexInfo?.name || poolDetail?.type || 'Add Liquidity'}</PoolHeaderMeta>
        {chainName ? <HeaderBadge>{chainName}</HeaderBadge> : null}
        {feeLabel ? <HeaderBadge $accent>{feeLabel}</HeaderBadge> : null}
      </HeaderIdentity>
    </PoolHeaderContainer>
  )
}

export default PoolHeader
