import { Trans } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { ChevronsUp, X } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'
import { Autoplay, Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react'

import IconFailure from 'assets/svg/notification_icon_failure.svg'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import IconWarning from 'assets/svg/notification_icon_warning.svg'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Row, { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { NotificationType } from 'state/application/hooks'

const HEIGHT = '150px'

const Image = styled.img`
  max-width: ${HEIGHT};
  height: ${HEIGHT};
  border-radius: 8px;
  object-fit: cover;
`

const ItemWrapper = styled.div<{ expand: boolean }>`
  background-color: ${({ theme }) => theme.tabActive};
  height: ${({ expand }) => (expand ? 'unset' : HEIGHT)};
  border-radius: 8px;
  display: flex;
`

const Desc = styled.div<{ expand: boolean }>`
  display: block;
  max-width: 100%;
  line-height: 16px;
  ${({ expand }) =>
    !expand &&
    css`
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    `};

  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`
function SnippetPopupItem({ data, closeAll }: { data: any; closeAll: () => void }) {
  const theme = useTheme()
  const [expand, setExpand] = useState(false)
  const toggle = () => {
    setExpand(!expand)
  }

  return (
    <ItemWrapper expand={expand}>
      <Image src="https://media.vneconomy.vn/images/upload/2022/07/11/gettyimages-1207206237.jpg" />
      <AutoColumn gap="14px" style={{ padding: '14px' }}>
        <RowBetween align="flex-end">
          <Text fontSize="16px" fontWeight={500} color={theme.text}>
            tesst
          </Text>
          <X color={theme.subText} cursor="pointer" onClick={closeAll} />
        </RowBetween>
        <Desc expand={expand}>
          tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss
          tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss
          tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss
          tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss tssss
          tssss tssss
        </Desc>
        <RowBetween align="center">
          <ButtonPrimary width="140px" height="36px">
            Enter Now
          </ButtonPrimary>
          <Flex
            alignItems={'center'}
            color={theme.subText}
            sx={{ cursor: 'pointer', userSelect: 'none' }}
            fontSize="12px"
            onClick={toggle}
          >
            <ChevronsUp size={16} />
            {expand ? <Trans>See Less</Trans> : <Trans>See More</Trans>}
          </Flex>
        </RowBetween>
      </AutoColumn>
    </ItemWrapper>
  )
}

const Wrapper = styled.div`
  position: fixed;
  left: 30px;
  bottom: 30px;
  z-index: 3; // todo
`
export default function SnippetPopup({ announcements }: { announcements: any }) {
  const theme = useTheme()
  const closeAll = () => {
    //
  }
  // return (
  //   <Wrapper>
  //     {announcements.map((banner: any, index: number) => (
  //       <SnippetPopupItem data={banner} key={index} closeAll={closeAll} />
  //     ))}
  //   </Wrapper>
  // )
  return (
    <Wrapper>
      <Swiper slidesPerView={1} navigation={true} pagination={true} loop={true} modules={[Navigation, Pagination]}>
        {announcements.map((banner: any, index: number) => (
          <SwiperSlide key={index} style={{ width: '640px' }}>
            <SnippetPopupItem data={banner} key={index} closeAll={closeAll} />
          </SwiperSlide>
        ))}
      </Swiper>
    </Wrapper>
  )
}
