import styled from 'styled-components'

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

export default function AnnouncementItem({ announcement, onRead }: { announcement: Announcement; onRead: () => void }) {
  const { isRead, name, startAt: time } = announcement
  return (
    <Wrapper isRead={isRead} onClick={onRead}>
      <Image src="https://media.vneconomy.vn/images/upload/2022/07/11/gettyimages-1207206237.jpg" />
      <RowItem>
        <Column gap="6px">
          <Title>{name} hahah haha haha</Title>
          <Desc>
            800 USDC to be won for 40 Winners in total! All users in the qualified field will be 800 USDC to be won for
            40 Winners in total! All users in the qualified field will be. 40 Winners in total! All users in the
            qualified field will be. 40 Winners in total! All users in the qualified field will be.
          </Desc>
        </Column>
        <Time>{time}</Time>
      </RowItem>
    </Wrapper>
  )
}
