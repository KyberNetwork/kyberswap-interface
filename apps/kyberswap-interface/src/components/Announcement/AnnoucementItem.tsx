import { rgba } from 'polished'
import styled, { CSSProperties, css } from 'styled-components'

import NotificationImage from 'assets/images/notification_default.png'
import { Announcement } from 'components/Announcement/type'
import { escapeScriptHtml } from 'utils/string'
import { formatTime } from 'utils/time'

const HEIGHT = '92px'

const Wrapper = styled.div<{ isRead: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  font-size: 12px;
  padding: 16px 20px;
  gap: 14px;
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  ${({ isRead }) =>
    !isRead
      ? css`
          background-color: ${({ theme }) => rgba(theme.primary, 0.1)};
          :hover {
            background-color: ${({ theme }) => rgba(theme.primary, 0.12)};
          }
        `
      : css`
          :hover {
            background-color: ${({ theme }) => theme.buttonBlack};
          }
        `}
`

const Title = styled.div<{ isRead: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, isRead }) => (isRead ? theme.text : theme.primary)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`

const Desc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  word-break: break-word;
  display: block;
  display: -webkit-box;
  max-width: 100%;
  line-height: 16px;
  height: 34px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  > * {
    margin: 0;
  }
`

const Time = styled.span`
  color: ${({ theme }) => theme.subText};
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
  overflow: hidden;
  height: ${HEIGHT};
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`

const Image = styled.img`
  width: 140px;
  max-height: ${HEIGHT};
  border-radius: 8px;
  object-fit: scale-down;
`

const Dot = styled.span`
  background-color: ${({ theme }) => theme.primary};
  border-radius: 999px;
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
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
  const { templateBody, isRead } = announcement

  const { name, startAt, content, thumbnailImageURL } = templateBody
  return (
    <Wrapper onClick={onRead} style={style} isRead={isRead}>
      <Image src={thumbnailImageURL || NotificationImage} />
      <RowItem style={{ maxWidth: '100%', maxHeight: '100%' }}>
        <TitleRow>
          <Title isRead={isRead}>{name}</Title>
          {!isRead && <Dot />}
        </TitleRow>
        <Desc dangerouslySetInnerHTML={{ __html: escapeScriptHtml(content) }} />
        <Time>{formatTime(startAt)}</Time>
      </RowItem>
    </Wrapper>
  )
}
