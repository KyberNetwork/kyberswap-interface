import { Trans } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { X } from 'react-feather'
import { QRCode } from 'react-qrcode-logo'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { SHARE_TYPE, useCreateShareLinkMutation } from 'services/social'
import styled, { css } from 'styled-components'

import modalBackground from 'assets/images/truesight-v2/modal_background.png'
import modalBackgroundMobile from 'assets/images/truesight-v2/modal_background_mobile.png'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useShareImage from 'hooks/useShareImage'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { toDataURL } from 'utils/file'

import { NETWORK_IMAGE_URL } from '../constants'
import { useTokenDetailQuery } from '../hooks/useKyberAIData'
import KyberSwapShareLogo from './KyberSwapShareLogo'
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
          height: 620px;
          aspect-ratio: 1/2;
        `
      : css`
          height: 490px;
          width: 840px;
        `}
`
const ImageInner = styled.div`
  width: 1050px;
  height: 612px;
  zoom: 0.8;
  aspect-ratio: 1050/612;
  overflow: visible;
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
  width: 420px;
  height: 840px;
  aspect-ratio: 1/2;
  zoom: 0.7;
  background-color: ${({ theme }) => theme.background};
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 10px;
  position: relative;
  :before {
    content: ' ';
    position: absolute;
    inset: 0 0 0 0;
    opacity: 0.25;
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
  .recharts-responsive-container {
    height: 490px !important;
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
`

type ShareData = {
  shareUrl?: string
  imageUrl?: string
  blob?: Blob
}

export default function KyberAIShareModal({
  title,
  content,
  isOpen,
  onClose,
  onShareClick,
}: {
  title?: string
  content?: (mobileMode?: boolean) => ReactNode
  isOpen: boolean
  onClose?: () => void
  onShareClick?: (network: string) => void
}) {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { data: tokenOverview } = useTokenDetailQuery({ chain, address }, { skip: !chain || !address })

  const ref = useRef<HTMLDivElement>(null)
  const [, setTokenLogoData] = useState<string | null>(null)
  const refMobile = useRef<HTMLDivElement>(null)
  const tokenImgRef = useRef<HTMLImageElement>(null)
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isMobileMode, setIsMobileMode] = useState(isMobile)
  const [mobileData, setMobileData] = useState<ShareData>({})
  const [desktopData, setDesktopData] = useState<ShareData>({})
  const shareImage = useShareImage()
  const [createShareLink] = useCreateShareLinkMutation()

  const sharingUrl = (isMobileMode ? mobileData.shareUrl : desktopData.shareUrl) || ''
  const imageUrl = (isMobileMode ? mobileData.imageUrl : desktopData.imageUrl) || ''
  const blob = isMobileMode ? mobileData.blob : desktopData.blob

  const handleGenerateImageDesktop = useCallback(
    async (shareUrl: string) => {
      if (ref.current) {
        setIsError(false)
        const shareId = shareUrl?.split('/').pop()

        if (!shareId) {
          setLoading(false)
          setIsError(true)
        }
        try {
          const { imageUrl, blob } = await shareImage(ref.current, SHARE_TYPE.KYBER_AI, shareId)
          setLoading(false)
          setDesktopData(prev => {
            return { ...prev, imageUrl, blob }
          })
        } catch (err) {
          console.log(err)
          setLoading(false)
          setIsError(true)
        }
      } else {
        setLoading(false)
      }
    },
    [shareImage],
  )

  const handleGenerateImageMobile = useCallback(
    async (shareUrl: string) => {
      if (refMobile.current) {
        setIsError(false)
        const shareId = shareUrl?.split('/').pop()
        if (!shareId) return
        try {
          const { imageUrl, blob } = await shareImage(refMobile.current, SHARE_TYPE.KYBER_AI, shareId)
          setMobileData(prev => {
            return { ...prev, imageUrl, blob }
          })
          setLoading(false)
        } catch (err) {
          console.log(err)
          setLoading(false)
          setIsError(true)
        }
      } else {
        setLoading(false)
      }
    },
    [shareImage],
  )

  useEffect(() => {
    const run = async () => {
      if (tokenOverview?.logo) {
        const tokenLogoData = await toDataURL(tokenOverview.logo)
        if (tokenLogoData === null || typeof tokenLogoData === 'string') setTokenLogoData(tokenLogoData)
        else setTokenLogoData(Array.prototype.slice.call(new Uint8Array(tokenLogoData)).join(''))
      }
    }
    run()
  }, [tokenOverview?.logo])

  useEffect(() => {
    const createShareFunction = async () => {
      if (!isOpen) {
        setTimeout(() => {
          setLoading(true)
          setIsError(false)
          setIsMobileMode(isMobile)
          setDesktopData({})
          setMobileData({})
        }, 400)
      }
      if (isOpen) {
        if ((isMobileMode && !mobileData.shareUrl) || (!isMobileMode && !desktopData.shareUrl)) {
          setLoading(true)
          setIsError(false)
          const shareUrl = await createShareLink({
            redirectURL: window.location.href,
            type: SHARE_TYPE.KYBER_AI,
          }).unwrap()
          if (isMobileMode && !mobileData.shareUrl) {
            setMobileData({ shareUrl })
          } else {
            setDesktopData({ shareUrl })
          }
          setTimeout(() => {
            isMobileMode ? handleGenerateImageMobile(shareUrl) : handleGenerateImageDesktop(shareUrl)
          }, 1000)
        }
      }
    }
    createShareFunction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isMobileMode])

  const [, staticCopy] = useCopyClipboard()
  const handleCopyClick = () => {
    staticCopy(sharingUrl || '')
    onShareClick?.('copy to clipboard')
  }
  const handleImageCopyClick = () => {
    if (blob) {
      const clipboardItem = new ClipboardItem({ ['image/png']: blob })
      navigator.clipboard.write([clipboardItem])
    }
  }
  const handleDownloadClick = () => {
    if (blob) {
      const link = document.createElement('a')
      link.download = 'kyberAI_share_image.png'
      link.href = URL.createObjectURL(blob)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const TokenInfo = () => (
    <>
      {tokenOverview && (
        <>
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
              <img
                src={`https://proxy.kyberswap.com/token-logo?url=${tokenOverview.logo}`}
                width="36px"
                height="36px"
                style={{ background: 'white', display: 'block' }}
                ref={tokenImgRef}
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
                crossOrigin="anonymous"
              />
            </div>
          </div>
          <Text fontSize={24} color={theme.text} fontWeight={500} style={{ whiteSpace: 'nowrap' }}>
            {tokenOverview?.name} ({tokenOverview?.symbol?.toUpperCase()})
          </Text>
        </>
      )}
    </>
  )

  return (
    <Modal isOpen={isOpen} width="fit-content" maxWidth="100vw" maxHeight="80vh">
      <Wrapper>
        <RowBetween>
          <Text>
            <Trans>Share this with your friends!</Trans>
          </Text>
          <X style={{ cursor: 'pointer' }} onClick={() => onClose?.()} />
        </RowBetween>
        <Row gap="12px">
          <InputWrapper>
            <Input value={sharingUrl} autoFocus={false} disabled={!sharingUrl} />
          </InputWrapper>
          <IconButton disabled={!sharingUrl} onClick={() => onShareClick?.('telegram')}>
            <ExternalLink href={'https://telegram.me/share/url?url=' + encodeURIComponent(sharingUrl)}>
              <Icon id="telegram" size={20} />
            </ExternalLink>
          </IconButton>
          <IconButton disabled={!sharingUrl} onClick={() => onShareClick?.('twitter')}>
            <ExternalLink href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(sharingUrl)}>
              <Icon id="twitter" size={20} />
            </ExternalLink>
          </IconButton>
          <IconButton disabled={!sharingUrl} onClick={() => onShareClick?.('facebook')}>
            <ExternalLink href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(sharingUrl)}>
              <Icon id="facebook" size={20} />
            </ExternalLink>
          </IconButton>
          <IconButton disabled={!sharingUrl} onClick={() => onShareClick?.('discord')}>
            <ExternalLink href="https://discord.com/app/">
              <Icon id="discord" size={20} />
            </ExternalLink>
          </IconButton>
          <IconButton disabled={!sharingUrl} onClick={handleCopyClick}>
            <Icon id="copy" size={20} />
          </IconButton>
        </Row>
        <ImageWrapper isMobileMode={isMobileMode}>
          {loading &&
            (isMobileMode ? (
              <ImageInnerMobile ref={refMobile}>
                <RowFit gap="8px">
                  <TokenInfo />
                </RowFit>

                <Column
                  style={{
                    zIndex: 2,
                    width: '100%',
                    overflow: 'hidden',
                    flex: 1,
                    justifyContent: 'center',
                  }}
                  gap="20px"
                >
                  <Row>
                    <Text fontSize="24px" lineHeight="28px">
                      {title}
                    </Text>
                  </Row>
                  {content?.(true)}
                </Column>
                <Row>
                  <RowBetween gap="20px">
                    <KyberSwapShareLogo height="48" width="137" />
                    <div style={{ borderRadius: '6px', overflow: 'hidden' }}>
                      <QRCode
                        value={sharingUrl}
                        size={70}
                        quietZone={4}
                        ecLevel="L"
                        style={{ display: 'block', borderRadius: '6px' }}
                      />
                    </div>
                  </RowBetween>
                </Row>
              </ImageInnerMobile>
            ) : (
              <ImageInner ref={ref}>
                <RowBetween style={{ zIndex: 2 }}>
                  <RowFit gap="8px" style={{ paddingLeft: '16px' }}>
                    <TokenInfo />
                  </RowFit>
                  <RowFit gap="20px">
                    <KyberSwapShareLogo />
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
                <Row style={{ zIndex: 2, width: '100%', alignItems: 'stretch', flex: 1 }}>{content?.(false)}</Row>
              </ImageInner>
            ))}
          {loading ? (
            <Loader>
              <AnimatedLoader />
            </Loader>
          ) : isError ? (
            <Loader>
              <Text>Some errors have occurred, please try again later!</Text>
            </Loader>
          ) : (
            <>
              {imageUrl && (
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
              )}
            </>
          )}
        </ImageWrapper>
        <RowBetween style={{ color: theme.subText }}>
          <IconButton onClick={() => setIsMobileMode(prev => !prev)}>
            <Icon id="devices" size={20} />
          </IconButton>
          <RowFit gap="12px">
            <IconButton disabled={!blob} onClick={handleDownloadClick}>
              <Icon id="download" size={20} />
            </IconButton>
            <IconButton disabled={!blob} onClick={handleImageCopyClick}>
              <Icon id="copy" size={20} />
            </IconButton>
          </RowFit>
        </RowBetween>
      </Wrapper>
    </Modal>
  )
}
