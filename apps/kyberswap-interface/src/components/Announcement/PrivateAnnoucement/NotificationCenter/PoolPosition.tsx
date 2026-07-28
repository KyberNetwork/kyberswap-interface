import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import {
  ArrowWrapper,
  Desc,
  Time,
  Title,
  Wrapper,
} from 'components/Announcement/PrivateAnnoucement/NotificationCenter/styled'
import { AnnouncementTemplatePoolPosition } from 'components/Announcement/type'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import { LEGACY_POOL_APP_PATHS } from 'constants/legacyPools'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { useNavigateToUrl } from 'utils/redirect'
import { formatTime } from 'utils/time'

export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplatePoolPosition>) {
  const theme = useTheme()
  const navigate = useNavigateToUrl()
  const [expand, setExpand] = useState(false)

  const { sentAt, templateType, templateBody } = announcement
  const {
    chainId: rawChain,
    token0Symbol,
    token1Symbol,
    token0LogoURL,
    token1LogoURL,
    currentPrice,
    minPrice,
    maxPrice,
    poolAddress,
  } = templateBody.position || {}

  const chainId = Number(rawChain) as ChainId
  const isInRange = currentPrice >= minPrice && currentPrice <= maxPrice
  const statusMessage = isInRange ? t`Back in range` : t`Out of range`
  const statusColorClass = isInRange ? 'text-apr' : 'text-warning'

  const onClick = () => {
    navigate(`${LEGACY_POOL_APP_PATHS.MY_POOLS}/${NETWORKS_INFO[chainId].route}?search=${poolAddress}`, chainId)
  }

  return (
    <Wrapper
      onClick={() => setExpand(!expand)}
      style={{ maxHeight: expand ? 'unset' : '100%', height: expand ? 'auto' : 'unset' }}
    >
      <div className="flex w-full justify-between">
        <Title onClick={onClick}>
          <InboxIcon type={templateType} chainId={chainId} />
          {title}
        </Title>
        <div className="flex items-center">
          <Time>{formatTime(sentAt)} </Time>
          <ArrowWrapper data-expanded={expand}>
            <DropdownSVG />
          </ArrowWrapper>
        </div>
      </div>
      <Desc>
        <Trans>
          Your position{' '}
          <DoubleCurrencyLogoV2
            logoUrl1={token0LogoURL}
            logoUrl2={token1LogoURL}
            size={16}
            style={{ marginRight: 12 }}
          />{' '}
          {token0Symbol}-{token1Symbol} is <span className={statusColorClass}>{statusMessage}</span>
          <MoneyBag color={isInRange ? theme.apr : theme.warning} size={16} />
        </Trans>
      </Desc>
      {expand && (
        <Desc className="flex-col gap-1 max-md:text-xs">
          <div>
            <Trans>
              Current Market Price is {currentPrice} {token0Symbol} per {token1Symbol}
            </Trans>
          </div>
          <div>
            <Trans>
              Min Price of your range is {minPrice} {token0Symbol} per {token1Symbol}
            </Trans>
          </div>
          <div>
            <Trans>
              Max Price of your range is {maxPrice} {token0Symbol} per {token1Symbol}
            </Trans>
          </div>
        </Desc>
      )}
    </Wrapper>
  )
}
