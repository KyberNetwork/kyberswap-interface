import { useNavigate } from 'react-router-dom'
import styled, { CSSProperties } from 'styled-components'

import kyberCrystal from 'assets/images/kyberdao/kyber_crystal.png'
import { formatTime } from 'components/Announcement/helper'
import { Announcement } from 'components/Announcement/type'
import Column from 'components/Column'

const HEIGHT = '100px'

const Wrapper = styled.div<{ isRead: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  font-size: 12px;
  padding: 12px 16px;
  gap: 12px;
  display: flex;
  align-items: flex-start;
  cursor: pointer;
`

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  height: 34px;
`

const Desc = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.subText};
  height: 36px;

  display: block;
  display: -webkit-box;
  max-width: 100%;
  line-height: 12px;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  > p {
    margin: 0;
  }
`
const Time = styled.span`
  color: ${({ theme }) => theme.border};
  text-align: right;
  width: 100%;
`
const RowItem = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  flex: 1;
  justify-content: space-between;
  height: ${HEIGHT};
`

const Image = styled.img`
  width: ${HEIGHT};
  max-height: ${HEIGHT};
  border-radius: 8px;
  object-fit: contain;
`

export default function AnnouncementItem({
  announcement,
  onRead,
  style,
}: {
  announcement: Announcement
  onRead: () => void
  style: CSSProperties
}) {
  const { isRead, templateBody } = announcement

  const navigate = useNavigate()
  const { name, startAt, content, thumbnailImageURL, actionURL } = templateBody

  const onClick = () => {
    try {
      onRead()
      if (!actionURL) return
      const { pathname, host } = new URL(actionURL)
      if (window.location.host === host) {
        navigate(pathname)
      } else {
        window.open(actionURL)
      }
    } catch (error) {}
  }

  return (
    <Wrapper isRead={isRead} onClick={onClick} style={style}>
      <Image src={thumbnailImageURL || kyberCrystal} />
      <RowItem>
        <Column gap="6px">
          <Title>{name} </Title>
          <Desc dangerouslySetInnerHTML={{ __html: content }} />
        </Column>
        <Time>{formatTime(startAt)}</Time>
      </RowItem>
    </Wrapper>
  )
}
