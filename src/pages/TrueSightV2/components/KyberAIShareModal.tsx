import { Trans } from '@lingui/macro'
import axios from 'axios'
import html2canvas from 'html2canvas'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { QRCode } from 'react-qrcode-logo'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useCreateShareLinkMutation, useUploadImageMutation } from 'services/kyberAISubscription'
import styled, { css } from 'styled-components'

import modalBackground from 'assets/images/truesight-v2/modal_background.png'
import Icon from 'components/Icons/Icon'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { KYBER_AI_GOOGLE_BUCKETS_ID } from 'constants/env'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

import { NETWORK_IMAGE_URL } from '../constants'
import { useTokenDetailQuery } from '../hooks/useKyberAIData'
import KyberSwapShareLogo from './KyberSwapShareLogo'

const Wrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  .timeframelegend {
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
const ImageWrapper = styled.div`
  border-radius: 8px;
  width: 840px;
  height: 490px;
  overflow: hidden;
  position: relative;
`
const ImageInner = styled.div`
  width: 1050px;
  height: 612px;
  zoom: 0.8;

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
`

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateRandomString(length: number) {
  let result = ''
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

export default function KyberAIShareModal({
  title,
  content,
  isOpen,
  onClose,
}: {
  title?: string
  content?: ReactNode
  isOpen: boolean
  onClose?: () => void
}) {
  const theme = useTheme()

  const ref = useRef<HTMLDivElement>(null)
  const tokenImgRef = useRef<HTMLImageElement>(null)
  const [loading, setLoading] = useState(true)
  const [sharingUrl, setSharingUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isError, setIsError] = useState(false)
  const { chain, address } = useParams()
  const { data: tokenOverview } = useTokenDetailQuery({ chain, address })
  const [uploadImage] = useUploadImageMutation()
  const [createShareLink] = useCreateShareLinkMutation()
  const [blob, setBlob] = useState<Blob>()
  const handleGenerateImage = async () => {
    if (isOpen && ref.current && loading && sharingUrl === '' && tokenImgRef.current) {
      setIsError(false)
      try {
        const canvasData = await html2canvas(ref.current, {
          allowTaint: true,
          useCORS: true,
        })
        // const context = canvasData.getContext('2d')
        // const img = new Image()
        // const offsets = tokenImgRef.current?.getBoundingClientRect()
        // const imgTop = offsets?.top || 0
        // const imgLeft = offsets?.left || 0

        // const offsetsContainer = ref.current?.getBoundingClientRect()
        // const imageLeft = imgLeft - (offsetsContainer.left || 0)
        // const imageTop = imgTop - (offsetsContainer.top || 0)
        // img.src = tokenImgRef.current?.src || ''
        // img.onload = () => {
        //   context?.drawImage(img, imageLeft, imageTop) // draws the image at the specified x and y location
        // }

        canvasData.toBlob(async blob => {
          if (blob) {
            setBlob(blob)
            const fileName = `${generateRandomString(16)}.png`
            const file = new File([blob], fileName, { type: 'image/png' })
            const res: any = await uploadImage({
              fileName,
            })
            if (res.data.code === 0) {
              const url = res.data.data.signedURL
              await axios({
                url,
                method: 'PUT',
                data: file,
                headers: {
                  'Content-Type': 'image/png',
                },
              })
              const imageUrl = `https://storage.googleapis.com/${KYBER_AI_GOOGLE_BUCKETS_ID}/${fileName}`
              setImageUrl(imageUrl)
              const res2: any = await createShareLink({ metaImageUrl: imageUrl, redirectURL: window.location.href })
              if (res2?.data?.code === 0) {
                setSharingUrl(res2.data.data.link)
              } else {
                setIsError(true)
              }
            } else {
              setIsError(true)
            }
            setLoading(false)
          }
        }, 'image/png')
      } catch (err) {
        console.log(err)
        setLoading(false)
        setIsError(true)
      }
    }
  }
  useEffect(() => {
    if (!isOpen) {
      setBlob(undefined)
      setLoading(true)
      setSharingUrl('')
      setImageUrl('')
      setIsError(false)
    }
    setTimeout(() => {
      handleGenerateImage()
    }, 1000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const [, staticCopy] = useCopyClipboard()
  const handleCopyClick = () => {
    staticCopy(sharingUrl)
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

  return (
    <Modal isOpen={isOpen} width="880px" maxWidth="880px">
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
          <IconButton disabled={!sharingUrl}>
            <ExternalLink href={'https://telegram.me/share/url?url=' + encodeURIComponent(sharingUrl)}>
              <Icon id="telegram" size={20} />
            </ExternalLink>
          </IconButton>
          <IconButton disabled={!sharingUrl}>
            <ExternalLink href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(sharingUrl)}>
              <Icon id="twitter" size={20} />
            </ExternalLink>
          </IconButton>
          <IconButton disabled={!sharingUrl}>
            <ExternalLink href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(sharingUrl)}>
              <Icon id="facebook" size={20} />
            </ExternalLink>
          </IconButton>
          <IconButton disabled={!sharingUrl}>
            <ExternalLink href="https://discord.com/app/">
              <Icon id="discord" size={20} />
            </ExternalLink>
          </IconButton>
          <IconButton disabled={!sharingUrl} onClick={handleCopyClick}>
            <Icon id="copy" size={20} />
          </IconButton>
        </Row>
        <ImageWrapper>
          {true && (
            <ImageInner ref={ref}>
              <RowBetween style={{ zIndex: 2 }}>
                <RowFit gap="8px" style={{ paddingLeft: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
                      <img
                        src={tokenOverview?.logo}
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
                  <Text fontSize={24} color={theme.text} fontWeight={500}>
                    {tokenOverview?.name} ({tokenOverview?.symbol.toUpperCase()})
                  </Text>
                </RowFit>
                <RowFit gap="20px">
                  <KyberSwapShareLogo />
                  <div style={{ marginTop: '-20px', marginRight: '-20px', borderRadius: '6px', overflow: 'hidden' }}>
                    <QRCode
                      value={'41241231231230120312301230'}
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
              <Row style={{ zIndex: 2, width: '100%', height: '100%', alignItems: 'stretch' }}>{content}</Row>
            </ImageInner>
          )}
          {/* {loading ? (
            <Loader>
              <AnimatedLoader />
            </Loader>
          ) : isError ? (
            <Loader>
              <Text>Some errors have occurred, please try again later!</Text>
            </Loader>
          ) : (
            <>{imageUrl && <img src={imageUrl} alt="KyberAI share" style={{ height: '100%', width: '100%' }} />}</>
          )} */}
        </ImageWrapper>
        <RowBetween style={{ color: theme.subText }}>
          <IconButton disabled={!imageUrl}>
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
