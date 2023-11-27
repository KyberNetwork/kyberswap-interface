import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Check, X } from 'react-feather'
import { QRCode } from 'react-qrcode-logo'
import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { SHARE_TYPE, useCreateShareLinkMutation } from 'services/social'
import styled, { css } from 'styled-components'
import { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import modalBackground from 'assets/images/truesight-v2/modal_background.png'
import modalBackgroundMobile from 'assets/images/truesight-v2/modal_background_mobile.png'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import LoadingIcon from 'components/Loader'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { getSocialShareUrls } from 'components/ShareModal'
import { ENV_LEVEL } from 'constants/env'
import { ENV_TYPE } from 'constants/type'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useShareImage from 'hooks/useShareImage'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { downloadImage } from 'utils/index'
import { getProxyTokenLogo } from 'utils/tokenInfo'

import { NETWORK_IMAGE_URL } from '../constants'
import useKyberAIAssetOverview from '../hooks/useKyberAIAssetOverview'
import KyberSwapShareLogo from './KyberSwapShareLogo'
import LoadingTextAnimation from './LoadingTextAnimation'
import { InfoWrapper, LegendWrapper } from './chart'

const Wrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  min-width: min(50vw, 880px);
  .time-frame-legend {
    display: none;
  }
`

const Input = styled.input`
  background-color: transparent;
  height: 34px;
  color: ${({ theme }) => theme.text};
  :focus {
  }
  outline: none;
  box-shadow: none;
  width: 95%;
  border: none;
`
const InputWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  height: 36px;
  padding-left: 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  flex: 1;
  display: flex;
`

const IconButton = styled.div<{ disabled?: boolean }>`
  height: 36px;
  width: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.subText + '32'};
  border-radius: 18px;
  cursor: pointer;
  :hover {
    filter: brightness(1.2);
  }
  :active {
    box-shadow: 0 2px 4px 4px rgba(0, 0, 0, 0.2);
  }
  color: ${({ theme }) => theme.subText} !important;

  a {
    color: ${({ theme }) => theme.subText} !important;
  }
  ${({ disabled }) =>
    disabled &&
    css`
      cursor: default;
      pointer-events: none;
      color: ${({ theme }) => theme.subText + '80'} !important;
      a {
        color: ${({ theme }) => theme.subText + '80'} !important;
      }
    `}
`

const SIZES = {
  VIEW_WIDTH_PC: 840,
  WIDTH_PC: 1050,

  HEIGHT_MB: 800,
  VIEW_HEIGHT_MB: 620,

  THRESHOLD_HEIGHT_MB_SMALL: 1000,
  HEIGHT_MB_SMALL: 480,

  THRESHOLD_HEIGHT_MB_XX_SMALL: 700,
  HEIGHT_MB_XX_SMALL: 410,
}

const getSmallHeightSize = (size: number) => css`
  height: ${size}px;
  .swiper-wrapper {
    height: ${size}px;
    max-height: 100%;
  }
`
const ImageWrapper = styled.div<{ isMobileMode?: boolean }>`
  max-height: 80vh;
  position: relative;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  ${({ isMobileMode }) =>
    isMobileMode
      ? css`
          aspect-ratio: 1/2;
          ${getSmallHeightSize(SIZES.VIEW_HEIGHT_MB)}
        `
      : css`
          width: ${SIZES.VIEW_WIDTH_PC}px;
          ${getSmallHeightSize(490)}
        `}

  @media screen and (max-height: ${SIZES.THRESHOLD_HEIGHT_MB_SMALL}px) {
    ${getSmallHeightSize(SIZES.HEIGHT_MB_SMALL)}
  }
  @media screen and (max-height: ${SIZES.THRESHOLD_HEIGHT_MB_XX_SMALL}px) {
    ${getSmallHeightSize(SIZES.HEIGHT_MB_XX_SMALL)}
  }

  --swiper-navigation-size: 12px;

  .swiper-button-prev,
  .swiper-button-next {
    color: #ffffff;
    background: ${({ theme }) => rgba(theme.subText, 0.2)};
    width: 32px;
    height: 32px;
    margin-top: 0;
    border-radius: 50%;
    transform: translateY(-50%);
    :hover {
      filter: brightness(1.2);
    }
  }

  .swiper-pagination-bullet {
    background: ${({ theme }) => theme.subText};
  }

  .swiper-pagination-bullet-active {
    border-radius: 4px;
    background: ${({ theme }) => theme.primary};
  }
`

const ImageInner = styled.div`
  width: ${SIZES.WIDTH_PC}px;
  height: 612px;
  aspect-ratio: 1050/612;
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
    background: url(${modalBackground});
    background-size: cover;
    z-index: -1;
  }
`

const ImageInnerMobile = styled.div`
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
    background: url(${modalBackgroundMobile});
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
  /* .recharts-responsive-container {
    height: 490px !important;
  } */
`

const Loader = styled.div`
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.buttonBlack};
  z-index: 4;
  border-radius: 8px;
  padding: 0 12px;
`

type ShareData = {
  shareUrl?: string[]
  imageUrl?: string[]
  blob?: Blob[]
}

export default function KyberAIShareModal(props: {
  title?: string
  content?: (mobileMode?: boolean) => ReactNode
  isOpen: boolean
  onClose?: () => void
  onShareClick?: (network: string) => void
}) {
  const theme = useTheme()
  const { chain } = useParams()
  const { data: tokenOverview } = useKyberAIAssetOverview()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const TokenInfo = () => (
    <>
      {tokenOverview && (
        <>
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
              <img
                src={getProxyTokenLogo(tokenOverview.logo)}
                width="36px"
                height="36px"
                style={{ background: 'white', display: 'block' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                borderRadius: '50%',
                border: `1px solid ${theme.background}`,
                background: theme.tableHeader,
              }}
            >
              <img
                src={NETWORK_IMAGE_URL[chain || 'ethereum']}
                alt="eth"
                width="16px"
                height="16px"
                style={{ display: 'block' }}
              />
            </div>
          </div>
          <Text
            fontSize={24}
            color={theme.text}
            fontWeight={500}
            style={{
              whiteSpace: above768 ? 'nowrap' : 'unset',
            }}
          >
            {tokenOverview?.name} ({tokenOverview?.symbol?.toUpperCase()})
          </Text>
        </>
      )}
    </>
  )

  return (
    <ShareModal
      {...props}
      shareType={SHARE_TYPE.KYBER_AI}
      titleLogo={<TokenInfo />}
      imageName="kyberAI_share_image.png"
      kyberswapLogoTitle={
        <Trans>
          <Text as="span" color={theme.text}>
            KyberAI |
          </Text>{' '}
          <Text color={theme.subText} as={'span'}>
            Ape Smart
          </Text>
        </Trans>
      }
    />
  )
}

const ShareUrlPanel = ({
  sharingUrl,
  disabled,
  isCopied,
  loadingType,
  onClickShareSocial,
}: {
  sharingUrl: string
  disabled: boolean
  isCopied: boolean | undefined
  loadingType: ShareType | undefined
  onClickShareSocial: (v: ShareType) => void
}) => {
  const theme = useTheme()
  return (
    <Row gap="12px">
      <InputWrapper>
        <Input value={sharingUrl} autoFocus={false} disabled={!sharingUrl} />
      </InputWrapper>
      {itemShares.map(type => (
        <IconButton disabled={disabled} key={type} onClick={() => onClickShareSocial?.(type)}>
          {loadingType === type ? <LoadingIcon /> : <Icon id={type as any} size={20} />}
        </IconButton>
      ))}
      <IconButton disabled={disabled} onClick={() => onClickShareSocial?.(ShareType.COPY)}>
        {loadingType === ShareType.COPY ? (
          <LoadingIcon />
        ) : isCopied ? (
          <Check size={'20px'} color={theme.primary} />
        ) : (
          <Icon id="copy" size={20} />
        )}
      </IconButton>
    </Row>
  )
}

const ShareImage = ({ imageUrl }: { imageUrl: string }) =>
  imageUrl ? (
    <div
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        height: '100%',
        width: '100%',
        borderRadius: '8px',
      }}
    />
  ) : null

type ContentProps = {
  content?: RenderContent | RenderContent[]
  isMobileMode: boolean
  kyberswapLogoTitle: ReactNode
  titleLogo: ReactNode
  title?: string
  sharingUrl: string
  shareIndex: number
  setShareIndex: (v: number) => void
}

type RenderSlideProps = { render: RenderContent; scale?: number; ref?: React.ForwardedRef<HTMLDivElement> }
const NodeContents = forwardRef<HTMLDivElement, ContentProps>(
  ({ content, isMobileMode, setShareIndex, kyberswapLogoTitle, titleLogo, title, sharingUrl, shareIndex }, ref) => {
    const upToSmall = useMedia(`(max-width:${MEDIA_WIDTHS.upToSmall}px)`)
    const mobileSmall = useMedia(`(max-height:${SIZES.THRESHOLD_HEIGHT_MB_SMALL}px)`)
    const mobileXXSmall = useMedia(`(max-height:${SIZES.THRESHOLD_HEIGHT_MB_XX_SMALL}px)`)

    const renderMobile = ({ render, scale, ref }: RenderSlideProps) => (
      <ImageInnerMobile ref={ref} className="share-mobile" style={scale ? { transform: `scale(${scale})` } : undefined}>
        <RowFit gap="8px">{titleLogo}</RowFit>

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
                value={sharingUrl}
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

    const renderPc = ({ render, scale, ref }: RenderSlideProps) => (
      <ImageInner ref={ref} className="share-pc" style={scale ? { transform: `scale(${scale})` } : undefined}>
        <RowBetween style={{ zIndex: 2 }}>
          <RowFit gap="8px" style={{ paddingLeft: '16px' }}>
            {titleLogo}
          </RowFit>
          <RowFit gap="20px">
            <KyberSwapShareLogo title={kyberswapLogoTitle} />
            <div style={{ marginTop: '-20px', marginRight: '-20px', borderRadius: '6px', overflow: 'hidden' }}>
              <QRCode
                value={sharingUrl}
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
          style={{ maxHeight: '100%' }}
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
            // todo move this to css ???
            const contentWidth = upToSmall ? window.innerWidth - 40 : SIZES.VIEW_WIDTH_PC
            const contentHeight = mobileXXSmall
              ? SIZES.HEIGHT_MB_XX_SMALL
              : mobileSmall
              ? SIZES.HEIGHT_MB_SMALL
              : SIZES.VIEW_HEIGHT_MB

            const getScale = (currentSize: number, expectSize: number) =>
              (currentSize / expectSize) ** (currentSize > expectSize ? -1 : 1)

            const scale = isMobileMode
              ? getScale(SIZES.HEIGHT_MB, contentHeight)
              : getScale(contentWidth, SIZES.WIDTH_PC)
            const props = { render, scale, ref: index === shareIndex ? ref : null }
            return (
              <SwiperSlide key={index} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isMobileMode ? renderMobile(props) : renderPc(props)}
              </SwiperSlide>
            )
          })}
        </Swiper>
      )

    const params = { render: content as RenderContent, ref }
    return isMobileMode ? renderMobile(params) : renderPc(params)
  },
)

const debug = false
// todo move another file, check open popup auto upload image ???, my earning, split file
enum ShareType {
  TELEGRAM = 'telegram',
  FB = 'facebook',
  DISCORD = 'discord',
  TWITTER = 'twitter',
  COPY = 'copy to clipboard',
  DOWNLOAD_IMAGE = 'download image',
  COPY_IMAGE = 'copy image',
}
const itemShares = [ShareType.TELEGRAM, ShareType.TWITTER, ShareType.FB, ShareType.DISCORD]
type ShareResponse = { imageUrl?: string; blob?: Blob; shareUrl?: string }
type RenderContent = (mobileMode?: boolean) => ReactNode
export function ShareModal({
  title,
  content,
  isOpen,
  onClose,
  onShareClick,
  shareType,
  imageName,
  titleLogo,
  kyberswapLogoTitle,
}: {
  title?: string
  content?: RenderContent | RenderContent[]
  isOpen: boolean
  onClose?: () => void
  onShareClick?: (network: string) => void
  shareType: SHARE_TYPE
  imageName: string
  titleLogo: ReactNode
  kyberswapLogoTitle: ReactNode
}) {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const refImgWrapper = useRef<HTMLDivElement>(null)
  const autoUpload = !(debug || Array.isArray(content))

  const [loading, setLoading] = useState(autoUpload)
  const [isError, setIsError] = useState(false)
  const [isMobileMode, setIsMobileMode] = useState(isMobile)
  const [mobileData, setMobileData] = useState<ShareData>({})
  const [desktopData, setDesktopData] = useState<ShareData>({})
  const shareImage = useShareImage()
  const [createShareLink] = useCreateShareLinkMutation()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  const [shareIndex, setShareIndex] = useState(0)
  const shareData = isMobileMode ? mobileData : desktopData

  const blob = shareData?.blob?.[shareIndex]
  const imageUrl = shareData?.imageUrl?.[shareIndex] || ''
  const sharingUrl = shareData?.shareUrl?.[shareIndex] || ''

  const handleGenerateImage = useCallback(
    async (shareUrl: string, mobile: boolean): Promise<ShareResponse> => {
      const element = ref.current
      if (element) {
        setIsError(false)
        const shareId = shareUrl?.split('/').pop()

        if (!shareId) {
          setLoading(false)
          setIsError(true)
        }
        try {
          const { imageUrl, blob } = await shareImage(element, shareType, shareId)
          const fn = (prev: ShareData) => {
            const imageUrls = prev.imageUrl || []
            const blobs = prev.blob || []
            imageUrls[shareIndex] = imageUrl
            blobs[shareIndex] = blob
            return { ...prev, imageUrl: imageUrls, blob: blobs }
          }
          mobile ? setMobileData(fn) : setDesktopData(fn)
          return { imageUrl, blob, shareUrl }
        } catch (err) {
          console.log(err)
          setLoading(false)
          setIsError(true)
        }
      } else {
        setLoading(false)
      }
      return {}
    },
    [shareImage, shareType, shareIndex],
  )

  const timeout = useRef<NodeJS.Timeout>()
  const createShareFunction = async (callback?: (data: ShareResponse) => void) => {
    if (loading && !autoUpload) return
    timeout.current && clearTimeout(timeout.current)
    if (!isOpen) {
      timeout.current = setTimeout(() => {
        setLoading(true)
        setIsError(false)
        setIsMobileMode(isMobile)
        setDesktopData({})
        setMobileData({})
      }, 400)
      return
    }
    if (sharingUrl) return
    setLoading(true)
    setIsError(false)
    const shareUrl = await createShareLink({
      redirectURL: ENV_LEVEL === ENV_TYPE.LOCAL ? 'https://kyberswap.com' : window.location.href,
      type: shareType,
    }).unwrap()
    const fn = (prev: ShareData) => {
      const shareUrls = prev.shareUrl || []
      shareUrls[shareIndex] = shareUrl
      return { ...prev, shareUrl: shareUrls }
    }
    if (isMobileMode) {
      setMobileData(fn)
    } else {
      setDesktopData(fn)
    }
    timeout.current = setTimeout(async () => {
      const data = await handleGenerateImage(shareUrl, isMobileMode)
      callback?.(data)
    }, 1000)
  }

  useEffect(() => {
    autoUpload && createShareFunction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isMobileMode])

  const copyImage = (blob: Blob | undefined) => {
    if (blob) {
      const clipboardItem = new ClipboardItem({ ['image/png']: blob })
      navigator.clipboard.write([clipboardItem])
    }
  }

  const [loadingType, setLoadingType] = useState<ShareType>()
  const handleImageCopyClick = () => {
    if (!blob) {
      setLoadingType(ShareType.COPY_IMAGE)
      createShareFunction(({ blob }) => {
        copyImage(blob)
        setLoadingType(undefined)
      })
      return
    }
    copyImage(blob)
  }

  const [isCopied, setCopied] = useCopyClipboard(2000)
  const callbackShareSocial = (shareType: ShareType, sharingUrl = '') => {
    const { facebook, telegram, discord, twitter } = getSocialShareUrls(sharingUrl)
    onShareClick?.(shareType)
    switch (shareType) {
      case ShareType.FB:
        window.open(facebook)
        break
      case ShareType.TELEGRAM:
        window.open(telegram)
        break
      case ShareType.DISCORD:
        window.open(discord)
        break
      case ShareType.TWITTER:
        window.open(twitter)
        break
      case ShareType.COPY:
        setCopied(sharingUrl)
        break
    }
  }
  const onClickShareSocial = (shareType: ShareType) => {
    if (sharingUrl) callbackShareSocial(shareType, sharingUrl)
    else {
      setLoadingType(shareType)
      createShareFunction(({ shareUrl }) => {
        callbackShareSocial(shareType, shareUrl)
        setLoadingType(undefined)
      })
    }
  }

  const handleDownloadClick = () => {
    if (!blob) {
      setLoadingType(ShareType.DOWNLOAD_IMAGE)
      createShareFunction(({ blob }) => {
        downloadImage(blob, imageName)
        setLoadingType(undefined)
      })
      return
    }
    downloadImage(blob, imageName)
  }

  useEffect(() => {
    if (imageUrl) {
      const img = new Image()
      img.src = imageUrl
      img.onload = () => {
        setLoading(false)
      }
    }
  }, [imageUrl])

  const disableShareSocial = autoUpload ? !sharingUrl : false
  const disableDownloadImage = autoUpload ? !blob : false

  const propsContents = {
    isMobileMode,
    content,
    setShareIndex,
    kyberswapLogoTitle,
    titleLogo,
    title,
    sharingUrl,
    ref,
    shareIndex,
    isOpen,
  } // todo too many title
  return (
    <Modal isOpen={isOpen} width="fit-content" maxWidth="100vw" maxHeight={'90vh'} onDismiss={onClose}>
      <Wrapper>
        <RowBetween>
          <Text>
            <Trans>Share this with your friends!</Trans>
          </Text>
          <X style={{ cursor: 'pointer' }} onClick={() => onClose?.()} />
        </RowBetween>
        <ShareUrlPanel
          {...{
            sharingUrl,
            disabled: disableShareSocial,
            isCopied: !!isCopied,
            loadingType,
            onClickShareSocial,
          }}
        />

        <ImageWrapper isMobileMode={isMobileMode} ref={refImgWrapper}>
          {loading ? (
            <>
              <NodeContents {...propsContents} />
              <Loader>
                <Text fontSize={above768 ? '16px' : '12px'} textAlign="center">
                  <LoadingTextAnimation />
                </Text>
              </Loader>
            </>
          ) : isError ? (
            <Loader>
              <Text>Some errors have occurred, please try again later!</Text>
            </Loader>
          ) : !autoUpload ? (
            <NodeContents {...propsContents} />
          ) : (
            <ShareImage imageUrl={imageUrl} />
          )}
        </ImageWrapper>

        <RowBetween style={{ color: theme.subText }}>
          <IconButton onClick={() => setIsMobileMode(prev => !prev)}>
            <Icon id="devices" size={20} />
          </IconButton>
          <RowFit gap="12px">
            <IconButton disabled={disableDownloadImage} onClick={handleDownloadClick}>
              {loadingType === ShareType.DOWNLOAD_IMAGE ? <LoadingIcon /> : <Icon id="download" size={20} />}
            </IconButton>
            <IconButton disabled={disableDownloadImage} onClick={handleImageCopyClick}>
              {loadingType === ShareType.COPY_IMAGE ? <LoadingIcon /> : <Icon id="copy" size={20} />}
            </IconButton>
          </RowFit>
        </RowBetween>
      </Wrapper>
    </Modal>
  )
}
