import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Check, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { SHARE_TYPE, useCreateShareLinkMutation } from 'services/social'
import styled, { css } from 'styled-components'

import Icon from 'components/Icons/Icon'
import LoadingIcon from 'components/Loader'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { getSocialShareUrls } from 'components/ShareModal'
import NodeContents from 'components/ShareModal/ShareImageModal/NodeContents'
import { SIZES } from 'components/ShareModal/ShareImageModal/const'
import { ENV_LEVEL } from 'constants/env'
import { ENV_TYPE } from 'constants/type'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useShareImage from 'hooks/useShareImage'
import useTheme from 'hooks/useTheme'
import LoadingTextAnimation from 'pages/TrueSightV2/components/LoadingTextAnimation'
import { MEDIA_WIDTHS } from 'theme'
import { downloadImage } from 'utils/index'

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
      <InputWrapper style={{ visibility: sharingUrl ? 'visible' : 'hidden' }}>
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
export type RenderContentFn = (mobileMode?: boolean) => ReactNode
export default function ShareImageModal({
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
  content?: RenderContentFn | RenderContentFn[]
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

  const [loadingType, setLoadingType] = useState<ShareType>()
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
        setLoadingType(undefined)
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
    shareType,
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
