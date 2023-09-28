import { Trans } from '@lingui/macro'
import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { TokenInfo } from 'components/Announcement/PrivateAnnoucement/InboxItemKyberAIWatchList'
import { PrivateAnnouncementPropCenter } from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { AnnouncementTemplateKyberAIWatchlist } from 'components/Announcement/type'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { formatTime } from 'utils/time'

import { ArrowWrapper, Desc, Time, Title, Wrapper } from './styled'

const Detail = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`

export default function AnnouncementItem({
  announcement,
  title,
}: PrivateAnnouncementPropCenter<AnnouncementTemplateKyberAIWatchlist>) {
  const { sentAt, templateType, templateBody } = announcement
  const { assets = [] } = templateBody || {}
  const theme = useTheme()
  const navigate = useNavigate()
  const [expand, setExpand] = useState(false)
  const slice = 3
  const minimalAssets = assets.slice(0, slice)

  return (
    <Wrapper onClick={() => setExpand(!expand)}>
      <Flex justifyContent="space-between" width="100%">
        <Title onClick={() => navigate(APP_PATHS.KYBERAI_RANKINGS)}>
          <InboxIcon type={templateType} />
          {title}
        </Title>
        <Flex alignItems={'center'}>
          <Time>{formatTime(sentAt)} </Time>
          <ArrowWrapper data-expanded={expand}>
            <DropdownSVG />
          </ArrowWrapper>
        </Flex>
      </Flex>
      <Desc style={{ gap: 6, flexWrap: 'wrap', color: theme.subText }}>
        <Trans>Here is an update on the tokens in your watchlist:</Trans>
        {!expand &&
          minimalAssets.map((token, i) => (
            <Fragment key={i}>
              <TokenInfo token={token} showPrice={false} key={i} logoSize={'14px'} />
              {i === minimalAssets.length - 1 ? (minimalAssets.length < slice ? '' : ', ...') : ', '}
            </Fragment>
          ))}
      </Desc>
      {expand && (
        <Detail>
          {assets.map((token, i) => (
            <TokenInfo token={token} key={i} showPrice logoSize={'14px'} />
          ))}
        </Detail>
      )}
    </Wrapper>
  )
}
