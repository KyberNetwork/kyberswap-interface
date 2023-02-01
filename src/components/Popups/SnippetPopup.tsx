import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ChevronsUp, X } from 'react-feather'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'
import { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'

const IMAGE_HEIGHT = '140px'
const PADDING_MOBILE = '16px'

const ItemWrapper = styled.div<{ expand: boolean }>`
  background-color: ${({ theme }) => theme.tabActive};
  height: ${IMAGE_HEIGHT};
  border-radius: 8px;
  display: flex;
  position: relative;
  ${({ expand }) =>
    expand &&
    css`
      height: unset;
      padding: 20px 20px 12px 20px;
    `};
`

const Image = styled.img<{ expand: boolean }>`
  max-width: ${IMAGE_HEIGHT};
  height: ${IMAGE_HEIGHT};
  border-radius: 8px;
  object-fit: cover;
  ${({ expand }) =>
    expand &&
    css`
      display: none;
    `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
     display: none;
  `}
`

const Desc = styled.div<{ expand: boolean }>`
  max-width: 100%;
  line-height: 14px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  ${({ expand }) =>
    !expand &&
    css`
      display: block;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    `};
`

const Title = styled.div<{ expand: boolean }>`
  max-width: 100%;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  ${({ expand }) =>
    !expand &&
    css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `};
`

const SeeMore = styled.div<{ expand: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  ${({ expand }) =>
    expand &&
    css`
      position: absolute;
      right: 0;
    `};
`

function SnippetPopupItem({
  data,
  expand,
  setExpand,
}: {
  expand: boolean
  data: any
  setExpand: (v: boolean) => void
}) {
  const toggle = () => {
    setExpand(!expand)
  }

  return (
    <ItemWrapper expand={expand}>
      <Image expand={expand} src="https://media.vneconomy.vn/images/upload/2022/07/11/gettyimages-1207206237.jpg" />
      <AutoColumn gap="14px" style={{ padding: expand ? '14px' : '14px 40px 14px 14px' }}>
        <Title expand={expand}>
          mẹ bã sợ bị cô dít bã làm 1 đống nước cam, gừng các thứ kêu cạ nhà ún hơ hơ mẹ bã sợ bị cô dít bã làm 1 đống
          nước cam, gừng các thứ kêu cạ nhà ún hơ hơ
        </Title>
        <Desc expand={expand}>
          mẹ bã sợ bị cô dít bã làm 1 đống nước cam, gừng các thứ kêu cạ nhà ún hơ hơmẹ bã sợ bị cô dít bã làm 1 đống
          nước cam, gừng các thứ kêu cạ nhà ún hơ hơ
        </Desc>
        <Flex alignItems="center" style={{ position: 'relative', justifyContent: expand ? 'center' : 'space-between' }}>
          <ButtonPrimary width="140px" height="36px">
            Enter Now
          </ButtonPrimary>
          <SeeMore onClick={toggle} expand={expand}>
            <ChevronsUp size={16} />
            {expand ? <Trans>See Less</Trans> : <Trans>See More</Trans>}
          </SeeMore>
        </Flex>
      </AutoColumn>
    </ItemWrapper>
  )
}

const Wrapper = styled.div<{ expand: boolean }>`
  position: fixed;
  left: 30px;
  bottom: 30px;
  z-index: ${Z_INDEXS.POPUP_NOTIFICATION};
  width: 640px;

  // custom swiper below
  --swiper-navigation-size: 12px;
  .swiper-button-prev,
  .swiper-button-next {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => rgba(theme.border, 0.8)};
    width: 24px;
    height: 24px;
    margin-top: 0;
    border-radius: 50%;
    transform: translateY(-50%);
  }
  .swiper-pagination {
    top: 10px;
    bottom: unset;
    ${({ expand }) =>
      !expand &&
      css`
        width: ${IMAGE_HEIGHT};
      `}
    .swiper-pagination-bullet {
      width: 8px;
      height: 8px;
      opacity: 1;
      background: none;
      border: 1px solid ${({ theme }) => theme.subText};
      &.swiper-pagination-bullet-active {
        background: ${({ theme }) => theme.primary};
        border: none;
      }
    }
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    ${css`
      left: 0;
      right: 0;
      width: 100%;
      padding: 0px ${PADDING_MOBILE};
      --swiper-navigation-size: 10px;
      .swiper-pagination {
        width: 100%;
      }
    `}`}
`

const Close = styled(X)`
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    right: calc(12px + ${PADDING_MOBILE});
  `}
`
export default function SnippetPopup({ announcements }: { announcements: any }) {
  const theme = useTheme()
  const [expand, setExpand] = useState(false)

  const closeAll = () => {
    //
  }

  return (
    <Wrapper expand={expand}>
      <Swiper slidesPerView={1} navigation={true} pagination={true} loop={true} modules={[Navigation, Pagination]}>
        {announcements.map((banner: any, index: number) => (
          <SwiperSlide key={index}>
            <SnippetPopupItem expand={expand} setExpand={setExpand} data={banner} key={index} />
          </SwiperSlide>
        ))}
      </Swiper>
      <Close size={18} color={theme.subText} onClick={closeAll} />
    </Wrapper>
  )
}
