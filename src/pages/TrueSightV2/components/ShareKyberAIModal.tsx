import { Trans } from '@lingui/macro'
import html2canvas from 'html2canvas'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import modalBackground from 'assets/images/truesight-v2/modal_background.png'
import Icon from 'components/Icons/Icon'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

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
  width: 760px;
  height: 424px;
  background-color: ${({ theme }) => theme.background};
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 12px;
  position: relative;
  :before {
    content: ' ';
    position: absolute;
    inset: 0 0 0 0;
    opacity: 0.25;
    background: url(${modalBackground});
    background-size: cover;
  }
`

const SHARING_API = 'https://share-with-image-server.vercel.app'

export default function ShareKyberAIModal() {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.KYBERAI_SHARE)
  const toggle = useToggleModal(ApplicationModal.KYBERAI_SHARE)
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [sharingUrl, setSharingUrl] = useState('')

  const handleGenerateImage = async () => {
    if (ref.current && loading && sharingUrl === '') {
      try {
        const canvas = await html2canvas(ref.current)
        const formData = new FormData()
        formData.append('file', canvas.toDataURL())
        const res = await fetch(SHARING_API + '/upload', {
          method: 'post',
          body: formData,
          mode: 'cors',
        })
        const url = await res.text()
        const sharingUrl = `${SHARING_API}/?imageurl=${url}&redirecturl=${window.location.href}`
        setSharingUrl(sharingUrl)
        setLoading(false)
      } catch (err) {
        console.log(err)
        setLoading(false)
      }
    }
  }
  useEffect(() => {
    setTimeout(() => {
      handleGenerateImage()
    }, 3000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const handleDismiss = () => {
    setLoading(true)
    setSharingUrl('')
  }
  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} width="800px" maxWidth="800px">
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
          <IconButton>
            <Icon id="copy" size={20} />
          </IconButton>
        </Row>
        <ImageWrapper ref={ref}>
          <RowBetween>
            <Text>BTC</Text>
          </RowBetween>
          <NumberofTradesChart />
        </ImageWrapper>
        <RowBetween style={{ color: theme.subText }}>
          <IconButton>
            <Icon id="devices" size={20} />
          </IconButton>
          {loading && 'Loading...'}
          <RowFit gap="12px">
            <IconButton>
              <Icon id="download" size={20} />
            </IconButton>
            <IconButton>
              <Icon id="copy" size={20} />
            </IconButton>
          </RowFit>
        </RowBetween>
      </Wrapper>
    </Modal>
  )
}
