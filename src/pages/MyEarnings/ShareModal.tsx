import { Trans } from '@lingui/macro'
import html2canvas from 'html2canvas'
import { rgba } from 'polished'
import { useRef, useState } from 'react'
import { CheckCircle, Copy, Download, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import BgShare from 'assets/images/bg_share_my_earning.png'
import BgShareMobile from 'assets/images/bg_share_my_earning_mb.png'
import { ReactComponent as DesktopIcon } from 'assets/svg/desktop_mobile_icon.svg'
import { Telegram } from 'components/Icons'
import Discord from 'components/Icons/Discord'
import Facebook from 'components/Icons/Facebook'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { getSocialShareUrls } from 'components/ShareModal'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { ButtonText, MEDIA_WIDTHS } from 'theme'
import { formattedNum } from 'utils'

const ButtonWrapper = styled.div`
  text-align: center;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  width: 36px;
  height: 36px;
  border-radius: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`

const FeeWrapper = styled.div<{ mobile: boolean }>`
  background-color: ${({ theme }) => rgba(theme.blue, 0.2)};
  color: ${({ theme }) => theme.blue};
  border-radius: 44px;
  padding: 4px 8px;
  font-size: 14px;
  ${({ mobile }) =>
    mobile &&
    css`
      padding: 2px 4px;
      font-size: 10px;
    `};
`
const Content = styled.div<{ width: string }>`
  position: relative;
  width: ${({ width }) => width};
`
const InnerContent = styled.div<{ mobile: boolean }>`
  position: absolute;
  top: 28%;
  left: 30px;
  margin: auto;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 10px;
  ${({ mobile }) =>
    mobile &&
    css`
      left: 16px;
      top: 18%;
      gap: 20px;
    `};
`

const ShareContainer = styled.div`
  display: flex;
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    height: unset;
    justify-content: space-around;
    flex: 1;
  `};
`

enum ShareType {
  TELEGRAM,
  FB,
  DISCORD,
  TWITTER,
  COPY,
}
export default function ShareModal({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const toggle = () => setIsOpen(!isOpen)
  const theme = useTheme()
  const [isSharePc, setIsSharePc] = useState(false)
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [isCopied, setIsCopy] = useCopyClipboard()

  const generateImageUrl = (type: ShareType) => {
    // todo: generate image => call api to get upload image => share image URL
    const shareUrl = 'http://localhost:3000/logo-dark.svg'
    const { telegram, facebook, discord, twitter } = getSocialShareUrls(shareUrl)
    switch (type) {
      case ShareType.COPY:
        setIsCopy(shareUrl)
        break
      case ShareType.TELEGRAM:
        window.open(telegram)
        break
      case ShareType.DISCORD:
        window.open(discord)
        break
      case ShareType.FB:
        window.open(facebook)
        break
      case ShareType.TWITTER:
        window.open(twitter)
        break
    }
  }

  const ref = useRef<HTMLDivElement>(null)
  const downloadImage = async () => {
    try {
      if (!ref.current) return
      const canvas: HTMLCanvasElement = await html2canvas(ref.current)
      if (!canvas) return
      const link = document.createElement('a')
      link.download = 'your_earning.png'
      link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
      link.click()
    } catch (error) {
      console.error(error)
    }
  }

  const containerWith = isSharePc ? '760px' : '220px'
  const tokenLogoSize = isSharePc ? 32 : 20

  const listShare = [
    {
      name: 'Telegram',
      onClick: () => generateImageUrl(ShareType.TELEGRAM),
      icon: <Telegram size={20} color={theme.subText} />,
    },
    {
      name: 'Twitter',
      onClick: () => generateImageUrl(ShareType.TWITTER),
      icon: <TwitterIcon width={20} height={20} color={theme.subText} />,
    },
    {
      name: 'Facebook',
      onClick: () => generateImageUrl(ShareType.FB),
      icon: <Facebook color={theme.subText} size={20} />,
    },
    {
      name: 'Discord',
      onClick: () => generateImageUrl(ShareType.DISCORD),
      icon: <Discord width={20} height={20} color={theme.subText} />,
    },
    {
      name: 'Download',
      icon: <Download width={20} height={20} color={theme.subText} />,
      onClick: downloadImage,
    },
    {
      name: 'Copy',
      onClick: () => generateImageUrl(ShareType.COPY),
      icon: isCopied ? <CheckCircle size={20} color={theme.subText} /> : <Copy size={20} color={theme.subText} />,
    },
  ]
  return (
    <Modal isOpen={isOpen} onDismiss={toggle} maxWidth="800px" width="800px">
      <Flex
        flexDirection="column"
        alignItems="center"
        width="100%"
        sx={{ gap: '16px', padding: '20px 16px', width: containerWith }}
      >
        <RowBetween>
          <Text fontSize={18} fontWeight={500}>
            <Trans>Share this with your friends!</Trans>
          </Text>
          <ButtonText onClick={toggle}>
            <X color={theme.text} />
          </ButtonText>
        </RowBetween>

        <Content width={containerWith} ref={ref}>
          <img src={isSharePc ? BgShare : BgShareMobile} alt="my earning" width={containerWith} />
          <InnerContent mobile={!isSharePc}>
            <Flex alignItems="center" sx={{ gap: isSharePc ? '8px' : '4px' }}>
              <Logo
                style={{ width: tokenLogoSize, height: tokenLogoSize }}
                srcs={[
                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                ]}
              />
              <Logo
                style={{ width: tokenLogoSize, height: tokenLogoSize }}
                srcs={[
                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                ]}
              />
              <Text fontWeight="500" fontSize={isSharePc ? 16 : 12} color={theme.text}>
                <Trans>KNC - ETH</Trans>
              </Text>
              <FeeWrapper mobile={!isSharePc}>Fee 0.03%</FeeWrapper>
            </Flex>

            <Text fontSize={isSharePc ? 26 : 16} fontWeight="500" color={theme.text}>
              <Trans>My Pool Earnings</Trans>
            </Text>

            <Text fontSize={isSharePc ? 50 : 30} fontWeight="500" color={theme.primary}>
              {formattedNum('1234565', true)}
            </Text>
          </InnerContent>
        </Content>
        <RowBetween>
          {!isMobile && (
            <ButtonWrapper onClick={() => setIsSharePc(!isSharePc)}>
              <DesktopIcon color={theme.subText} />
            </ButtonWrapper>
          )}
          <ShareContainer>
            {listShare.map(({ name, icon, onClick }) => (
              <ButtonWrapper key={name} onClick={onClick}>
                {icon}
              </ButtonWrapper>
            ))}
          </ShareContainer>
        </RowBetween>
      </Flex>
    </Modal>
  )
}
