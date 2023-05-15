import { Trans } from '@lingui/macro'
import axios from 'axios'
import html2canvas from 'html2canvas'
import { QRCodeSVG } from 'qrcode.react'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useCreateShareLinkMutation, useUploadImageMutation } from 'services/kyberAISubscription'
import styled, { css } from 'styled-components'

import modalBackground from 'assets/images/truesight-v2/modal_background.png'
import Icon from 'components/Icons/Icon'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import { NETWORK_IMAGE_URL } from '../constants'
import { ITokenOverview } from '../types'
import KyberSwapShareLogo from './KyberSwapShareLogo'
import { NumberofTradesChart } from './chart'

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
  height: 612.5px;
  zoom: 0.8;

  background-color: ${({ theme }) => theme.background};
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 16px;
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

export default function ShareKyberAIModal({
  token,
  title,
  content,
}: {
  token?: ITokenOverview
  title?: string
  content?: ReactNode
}) {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.KYBERAI_SHARE)
  const toggle = useToggleModal(ApplicationModal.KYBERAI_SHARE)
  const ref = useRef<HTMLDivElement>(null)
  const tokenImgRef = useRef<HTMLImageElement>(null)
  const [loading, setLoading] = useState(true)
  const [sharingUrl, setSharingUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const { chain } = useParams()
  const [uploadImage] = useUploadImageMutation()
  const [createShareLink] = useCreateShareLinkMutation()
  const handleGenerateImage = async () => {
    if (isOpen && ref.current && loading && sharingUrl === '' && tokenImgRef.current) {
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
              const imageUrl = `https://storage.googleapis.com/ks-setting-a3aa20b7/${fileName}`
              setImageUrl(imageUrl)
              const res2: any = await createShareLink({ metaImageUrl: imageUrl, redirectURL: window.location.href })
              if (res2?.data?.code === 0) {
                setSharingUrl(res2.data.data.link)
              }
              setLoading(false)
            }
          }
        }, 'image/png')
      } catch (err) {
        console.log(err)
        setLoading(false)
      }
    }
  }
  useEffect(() => {
    if (!isOpen) {
      setLoading(true)
      setSharingUrl('')
    }
    setTimeout(() => {
      handleGenerateImage()
    }, 2000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const [, staticCopy] = useCopyClipboard()
  const handleCopyClick = () => {
    staticCopy(sharingUrl)
  }
  const handleImageCopyClick = () => {
    console.log(1)
  }
  const handleDownloadClick = () => {
    if (imageUrl) {
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'kyberAI_share_image.png' // Set a custom filename if desired
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
        .catch(err => console.log(err))
    }
  }

  return (
    <Modal isOpen={isOpen} width="880px" maxWidth="880px">
      <Wrapper>
        <RowBetween>
          <Text>
            <Trans>Share this with your friends!</Trans>
          </Text>
          <X style={{ cursor: 'pointer' }} onClick={toggle} />
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
          {loading && (
            <ImageInner ref={ref}>
              <RowBetween style={{ zIndex: 2 }}>
                <RowFit gap="8px" style={{ paddingLeft: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
                      <img
                        src={token?.logo}
                        width="36px"
                        height="36px"
                        style={{ background: 'white', display: 'block' }}
                        crossOrigin="anonymous"
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
                    {token?.name} ({token?.symbol.toUpperCase()})
                  </Text>
                </RowFit>
                <RowFit gap="20px">
                  <KyberSwapShareLogo />
                  <QRCodeSVG
                    value={window.location.href}
                    size={80}
                    bgColor="transparent"
                    fgColor={theme.text}
                    level="M"
                  />
                </RowFit>
              </RowBetween>
              <Row>
                <Text fontSize="24px" lineHeight="28px">
                  {title}
                </Text>
              </Row>
              <Row style={{ zIndex: 2, width: '100%', height: '100%', alignItems: 'stretch' }}>
                {content || <NumberofTradesChart noAnimation />}
              </Row>
            </ImageInner>
          )}
          {loading ? (
            <Loader>
              <AnimatedLoader />
            </Loader>
          ) : (
            <>{imageUrl && <img src={imageUrl} alt="KyberAI share" style={{ height: '100%', width: '100%' }} />}</>
          )}
        </ImageWrapper>
        <RowBetween style={{ color: theme.subText }}>
          <IconButton disabled={!imageUrl}>
            <Icon id="devices" size={20} />
          </IconButton>
          <RowFit gap="12px">
            <IconButton disabled={!imageUrl} onClick={handleDownloadClick}>
              <Icon id="download" size={20} />
            </IconButton>
            <IconButton disabled={!imageUrl} onClick={handleImageCopyClick}>
              <Icon id="copy" size={20} />
            </IconButton>
          </RowFit>
        </RowBetween>
      </Wrapper>
    </Modal>
  )
}
