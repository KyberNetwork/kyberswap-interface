import { Trans } from '@lingui/macro'
import html2canvas from 'html2canvas'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import modalBackground from 'assets/images/truesight-v2/modal_background.png'
import Icon from 'components/Icons/Icon'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

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
`

const Input = styled.input`
  padding-left: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  height: 36px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  flex: 1;
  color: ${({ theme }) => theme.text};
`

const IconButton = styled.div`
  height: 36px;
  width: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.subText + '32'};
  color: ${({ theme }) => theme.subText};
  border-radius: 18px;
  cursor: pointer;
  :hover {
    filter: brightness(1.2);
  }
  :active {
    box-shadow: 0 2px 4px 4px rgba(0, 0, 0, 0.2);
  }
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
    z-index: 1;
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

const SHARING_API = 'https://share-with-image-server.vercel.app'

export default function ShareKyberAIModal({ token }: { token?: ITokenOverview }) {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.KYBERAI_SHARE)
  const toggle = useToggleModal(ApplicationModal.KYBERAI_SHARE)
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [sharingUrl, setSharingUrl] = useState('')
  const canvasRef = useRef<string | null>(null)
  const handleGenerateImage = async () => {
    if (isOpen && ref.current && loading && sharingUrl === '') {
      try {
        const canvasData = await html2canvas(ref.current)
        const dataUrl = canvasData.toDataURL()
        canvasRef.current = dataUrl
        const formData = new FormData()
        formData.append('file', dataUrl)
        const res = await fetch(SHARING_API + '/upload', {
          method: 'post',
          body: formData,
          mode: 'cors',
        })
        if (res.ok) {
          const url = await res.text()
          const sharingUrl = `${SHARING_API}/?imageurl=${url}&redirecturl=${window.location.href}`
          setSharingUrl(sharingUrl)
          setLoading(false)
        } else {
          console.log(res)
          setLoading(false)
        }
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
    }, 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const [, staticCopy] = useCopyClipboard()
  const handleCopyClick = () => {
    staticCopy(sharingUrl)
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
          <Input value={sharingUrl} />
          <IconButton>
            <Icon id="telegram" size={20} />
          </IconButton>
          <IconButton>
            <Icon id="twitter" size={20} />
          </IconButton>
          <IconButton>
            <Icon id="facebook" size={20} />
          </IconButton>
          <IconButton>
            <Icon id="discord" size={20} />
          </IconButton>
          <IconButton onClick={handleCopyClick}>
            <Icon id="copy" size={20} />
          </IconButton>
        </Row>
        <ImageWrapper>
          <ImageInner ref={ref}>
            <>
              {loading && (
                <>
                  <RowBetween style={{ zIndex: 2 }}>
                    <RowFit gap="8px" style={{ paddingLeft: '16px' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
                          <Logo
                            srcs={['https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=024']}
                            style={{ width: '36px', height: '36px', background: 'white', display: 'block' }}
                          />
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            borderRadius: '50%',
                            border: `1px solid ${theme.background}`,
                          }}
                        >
                          <img
                            src="https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/512/Ethereum-ETH-icon.png"
                            alt="eth"
                            width="16px"
                            height="16px"
                            style={{ display: 'block' }}
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
                  <Row style={{ zIndex: 2, width: '100%', height: '100%', alignItems: 'stretch' }}>
                    <NumberofTradesChart noTimeframe noAnimation />
                  </Row>
                </>
              )}
            </>
          </ImageInner>
          <>{canvasRef.current && <img src={canvasRef.current} alt="KyberAI share" />}</>
          {loading && (
            <Loader>
              <AnimatedLoader />
            </Loader>
          )}
        </ImageWrapper>
        <RowBetween style={{ color: theme.subText }}>
          <IconButton>
            <Icon id="devices" size={20} />
          </IconButton>
          <RowFit gap="12px">
            <IconButton>
              <Icon id="download" size={20} />
            </IconButton>
            <IconButton onClick={handleCopyClick}>
              <Icon id="copy" size={20} />
            </IconButton>
          </RowFit>
        </RowBetween>
      </Wrapper>
    </Modal>
  )
}
