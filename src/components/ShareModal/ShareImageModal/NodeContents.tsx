import { ReactNode } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { SHARE_TYPE } from 'services/social'
import styled from 'styled-components'
import { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import BgKyberAi from 'assets/images/share/background_kyberai.png'
import BgKyberAIMobile from 'assets/images/share/background_mobile_kyberai.png'
import BgPortfolioMobile from 'assets/images/share/background_mobile_portfolio.png'
import BgPortfolio from 'assets/images/share/background_portfolio.png'
import Column from 'components/Column'
import Row, { RowBetween, RowFit } from 'components/Row'
import { RenderContentFn } from 'components/ShareModal/ShareImageModal'
import { SIZES } from 'components/ShareModal/ShareImageModal/const'
import KyberSwapShareLogo from 'pages/TrueSightV2/components/KyberSwapShareLogo'
import { InfoWrapper, LegendWrapper } from 'pages/TrueSightV2/components/chart'
import { MEDIA_WIDTHS } from 'theme'

const getScale = (currentSize: number, expectSize: number) =>
  (currentSize / expectSize) ** (currentSize > expectSize ? -1 : 1)

const ImageInner = styled.div<{ bg: string }>`
  width: ${SIZES.WIDTH_PC}px;
  height: ${SIZES.HEIGH_PC}px;
  aspect-ratio: ${SIZES.WIDTH_PC} / ${SIZES.HEIGH_PC};
  background-color: ${({ theme }) => theme.background};
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 10px;
  position: relative;
  :before {
    content: ' ';
    position: absolute;
    inset: 0 0 0 0;
    opacity: 0.25;
    background: url(${({ bg }) => bg});
    background-size: cover;
    z-index: -1;
  }
`

const ImageInnerMobile = styled.div<{ bg: string }>`
  width: 400px;
  height: ${SIZES.HEIGHT_MB}px;
  aspect-ratio: 1/2;
  background-color: ${({ theme }) => theme.background};
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;
  position: relative;
  :before {
    content: ' ';
    position: absolute;
    inset: 0 0 0 0;
    opacity: 1;
    background: url(${({ bg }) => bg});
    background-size: cover;
    z-index: -1;
  }

  ${LegendWrapper} {
    position: initial;
    justify-content: flex-start;
  }
  ${InfoWrapper} {
    position: initial;
    gap: 12px;
    font-size: 12px;
    justify-content: space-between;
  }
`

type ContentProps = {
  content?: RenderContentFn | RenderContentFn[]
  isMobileMode: boolean
  kyberswapLogoTitle: ReactNode
  leftLogo: ReactNode
  title?: string
  sharingUrl: string
  shareType: SHARE_TYPE
  setShareIndex: (v: number) => void
  imageHeight: number | undefined
  imageNodes: React.MutableRefObject<HTMLDivElement[]>
}

const BG_BY_TYPE: Partial<{ [k in SHARE_TYPE]: { mobile: string; pc: string } }> = {
  [SHARE_TYPE.KYBER_AI]: { mobile: BgKyberAIMobile, pc: BgKyberAi },
  [SHARE_TYPE.PORTFOLIO]: { mobile: BgPortfolioMobile, pc: BgPortfolio },
}

type RenderSlideProps = {
  render: RenderContentFn
  scale?: number
  index: number
}
function NodeContents({
  content,
  isMobileMode,
  setShareIndex,
  kyberswapLogoTitle,
  leftLogo,
  title,
  sharingUrl,
  shareType,
  imageHeight,
  imageNodes,
}: ContentProps) {
  const upToSmall = useMedia(`(max-width:${MEDIA_WIDTHS.upToSmall}px)`)

  const renderMobile = ({ render, scale, index }: RenderSlideProps) => (
    <ImageInnerMobile
      ref={ref => {
        if (ref) imageNodes.current[index] = ref
      }}
      className="share-mobile"
      style={scale ? { transform: `scale(${scale})` } : undefined}
      bg={BG_BY_TYPE[shareType]?.mobile || ''}
    >
      <RowFit gap="8px">{leftLogo}</RowFit>

      <Column
        style={{
          zIndex: 2,
          width: '100%',
          overflow: 'hidden',
          flex: 1,
          justifyContent: 'center',
        }}
        gap="24px"
      >
        <Row>
          <Text fontSize="24px" lineHeight="28px" style={{ whiteSpace: 'nowrap' }}>
            {title}
          </Text>
        </Row>
        {render?.(true)}
      </Column>
      <Row>
        <RowBetween gap="20px">
          <KyberSwapShareLogo width={200} title={kyberswapLogoTitle} />
          <div style={{ borderRadius: '6px', overflow: 'hidden' }}>
            <QRCode
              value={sharingUrl || 'https://kyberswap.com'}
              size={100}
              quietZone={4}
              ecLevel="L"
              style={{ display: 'block', borderRadius: '6px' }}
            />
          </div>
        </RowBetween>
      </Row>
    </ImageInnerMobile>
  )

  const renderPc = ({ render, scale, index }: RenderSlideProps) => (
    <ImageInner
      ref={ref => {
        if (ref) imageNodes.current[index] = ref
      }}
      className="share-pc"
      style={scale ? { transform: `scale(${scale})` } : undefined}
      bg={BG_BY_TYPE[shareType]?.pc || ''}
    >
      <RowBetween style={{ zIndex: 2 }}>
        <RowFit gap="8px" style={{ paddingLeft: '16px' }}>
          {leftLogo}
        </RowFit>
        <RowFit gap="20px">
          <KyberSwapShareLogo title={kyberswapLogoTitle} />
          <div style={{ marginTop: '-20px', marginRight: '-20px', borderRadius: '6px', overflow: 'hidden' }}>
            <QRCode
              value={sharingUrl || 'https://kyberswap.com'}
              size={100}
              quietZone={4}
              ecLevel="L"
              style={{ display: 'block', borderRadius: '6px' }}
            />
          </div>
        </RowFit>
      </RowBetween>
      <Row>
        <Text fontSize="24px" lineHeight="28px">
          {title}
        </Text>
      </Row>
      <Row style={{ zIndex: 2, width: '100%', alignItems: 'stretch', flex: 1 }}>{render?.(false)}</Row>
    </ImageInner>
  )

  if (Array.isArray(content) && content.length > 1)
    return (
      <Swiper
        style={{ maxHeight: '100%', height: imageHeight }}
        slidesPerView={1}
        navigation={true}
        pagination={true}
        loop={true}
        modules={[Navigation, Pagination]}
        onSlideChangeTransitionEnd={val => {
          setShareIndex(val.realIndex)
        }}
      >
        {content.map((render, index) => {
          const contentWidth = upToSmall ? window.innerWidth - 40 : SIZES.VIEW_WIDTH_PC
          const contentHeight = imageHeight || SIZES.HEIGHT_MB

          const scale = isMobileMode
            ? getScale(SIZES.HEIGHT_MB, contentHeight)
            : upToSmall
            ? getScale(contentWidth, SIZES.WIDTH_PC)
            : getScale(SIZES.HEIGH_PC, contentHeight)

          const props = { render, scale, index }
          return (
            <SwiperSlide key={index} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {isMobileMode ? renderMobile(props) : renderPc(props)}
            </SwiperSlide>
          )
        })}
      </Swiper>
    )

  const params = { render: content as RenderContentFn, index: 0 }
  return isMobileMode ? renderMobile(params) : renderPc(params)
}
export default NodeContents
