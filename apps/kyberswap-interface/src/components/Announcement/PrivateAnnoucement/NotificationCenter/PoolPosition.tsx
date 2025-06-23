import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { AnnouncementTemplatePoolPosition } from 'components/Announcement/type'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { useNavigateToUrl } from 'utils/redirect'
import { formatTime } from 'utils/time'

import { ArrowWrapper, Desc, Time, Title, Wrapper } from './styled'

const Detail = styled(Desc)`
  flex-direction: column;
  gap: 4px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 12px;
  `}
`
export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplatePoolPosition>) {
  const [expand, setExpand] = useState(false)
  const { sentAt, templateType } = announcement
  const { position } = announcement.templateBody || {}
  const {
    token0LogoURL,
    token0Symbol,
    token1LogoURL,
    token1Symbol,
    type,
    chainId: rawChain,
    maxPrice,
    minPrice,
    currentPrice,
    poolAddress,
  } = position || {}
  const isInRange = type === 'IN_RANGE'
  const statusMessage = isInRange ? t`Back in range` : t`Out of range`
  const chainId = Number(rawChain) as ChainId
  const theme = useTheme()

  const navigate = useNavigateToUrl()
  const onClick = () => {
    navigate(`${APP_PATHS.MY_POOLS}/${NETWORKS_INFO[chainId].route}?search=${poolAddress}`, chainId)
  }

  return (
    <Wrapper
      onClick={() => setExpand(!expand)}
      style={{ maxHeight: expand ? 'unset' : '100%', height: expand ? 'auto' : 'unset' }}
    >
      <Flex justifyContent="space-between" width="100%">
        <Title onClick={onClick}>
          <InboxIcon type={templateType} chainId={chainId} />
          {title}
        </Title>
        <Flex alignItems={'center'}>
          <Time>{formatTime(sentAt)} </Time>
          <ArrowWrapper data-expanded={expand}>
            <DropdownSVG />
          </ArrowWrapper>
        </Flex>
      </Flex>
      <Desc>
        Your position{' '}
        <DoubleCurrencyLogoV2 logoUrl1={token0LogoURL} logoUrl2={token1LogoURL} size={16} style={{ marginRight: 12 }} />{' '}
        {token0Symbol}-{token1Symbol} is <Text color={isInRange ? theme.apr : theme.warning}>{statusMessage}</Text>
        <MoneyBag color={isInRange ? theme.apr : theme.warning} size={16} />
      </Desc>
      {expand && (
        <Detail>
          <Text>
            <Trans>
              Current Market Price is {currentPrice} {token0Symbol} per {token1Symbol}
            </Trans>
          </Text>
          <Text>
            <Trans>
              Min Price of your range is {minPrice} {token0Symbol} per {token1Symbol}
            </Trans>
          </Text>
          <Text>
            <Trans>
              Max Price of your range is {maxPrice} {token0Symbol} per {token1Symbol}
            </Trans>
          </Text>
        </Detail>
      )}
    </Wrapper>
  )
}
