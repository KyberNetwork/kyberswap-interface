import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { isDesktop } from 'react-device-detect'
import { CheckCircle, Copy, Download, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { SHARE_TYPE } from 'services/social'
import styled, { css } from 'styled-components'

import BgShare from 'assets/images/bg_share_my_earning.png'
import BgShareMobile from 'assets/images/bg_share_my_earning_mb.png'
import { ReactComponent as DesktopIcon } from 'assets/svg/desktop_mobile_icon.svg'
import { Telegram } from 'components/Icons'
import Discord from 'components/Icons/Discord'
import Facebook from 'components/Icons/Facebook'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Loader from 'components/Loader'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { getSocialShareUrls } from 'components/ShareModal'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useShareImage from 'hooks/useShareImage'
import useTheme from 'hooks/useTheme'
import { ButtonText, MEDIA_WIDTHS } from 'theme'
import { downloadImage } from 'utils'
import { getProxyTokenLogo } from 'utils/tokenInfo'

const formatValue = (num: number, isSharePc: boolean) => {
  const notation = (num > 1_000_000 && !isSharePc) || (num > 100_000_000 && isSharePc) ? 'compact' : 'standard'
  const formatter = new Intl.NumberFormat('en-US', {
    notation,
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return formatter.format(num)
}

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
  font-weight: 500;
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
  height: fit-content;
  overflow-y: scroll;
  overflow-x: hidden;
  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
  }
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
  DOWNLOAD,
}

type Props = {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  title: string
  value: number
  poolInfo?: {
    token0: {
      symbol: string
      logoURI: string
    }
    token1: {
      symbol: string
      logoURI: string
    }
    feePercent: string
  }
}

export default function ShareModal({ isOpen, setIsOpen, title, value, poolInfo }: Props) {
  const toggle = () => setIsOpen(!isOpen)
  const theme = useTheme()
  const [isSharePc, setIsSharePc] = useState(isDesktop)
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [isCopied, setIsCopy] = useCopyClipboard()
  const shareImage = useShareImage()
  const ref = useRef<HTMLDivElement>(null)
  const [shareUrlState, setShareUrl] = useState('')
  const [imageUrlState, setImageUrl] = useState('')
  const [loadingType, setLoading] = useState<ShareType>()

  useEffect(() => {
    setShareUrl('')
    setImageUrl('')
  }, [isOpen, isSharePc])

  const generateImageUrlByMethod = async (type: ShareType) => {
    if (loadingType) return
    try {
      setLoading(type)
      let shareUrl: string | undefined = shareUrlState
      let imageUrl: string | undefined = imageUrlState
      if (!shareUrl) {
        const data = await shareImage(ref.current, SHARE_TYPE.MY_EARNINGS)
        shareUrl = data.shareUrl
        imageUrl = data.imageUrl
      }
      if (!shareUrl) return
      setShareUrl(shareUrl)
      setImageUrl(imageUrl)
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
        case ShareType.DOWNLOAD:
          downloadImage(imageUrl, 'your_earning.png')
          break
      }
    } catch (error) {
      console.log('share err', error)
    } finally {
      setLoading(undefined)
    }
  }

  const containerWith = isSharePc ? '760px' : '220px'
  const tokenLogoSize = isSharePc ? 24 : 20

  const listShare = [
    {
      type: ShareType.TELEGRAM,
      icon: <Telegram size={20} color={theme.subText} />,
    },
    {
      type: ShareType.TWITTER,
      icon: <TwitterIcon width={20} height={20} color={theme.subText} />,
    },
    {
      type: ShareType.FB,
      icon: <Facebook color={theme.subText} size={20} />,
    },
    {
      type: ShareType.DISCORD,
      icon: <Discord width={20} height={20} color={theme.subText} />,
    },
    {
      type: ShareType.DOWNLOAD,
      icon: <Download width={20} height={20} color={theme.subText} />,
    },
    {
      type: ShareType.COPY,
      icon: isCopied ? <CheckCircle size={20} color={theme.subText} /> : <Copy size={20} color={theme.subText} />,
    },
  ]

  const renderPool = () => {
    if (!poolInfo) {
      return null
    }

    return (
      <Flex alignItems="center" sx={{ gap: isSharePc ? '8px' : '4px' }} flexWrap="wrap">
        <Flex alignItems="center">
          <Logo
            style={{ width: tokenLogoSize, height: tokenLogoSize, borderRadius: '999px', overflow: 'hidden' }}
            srcs={[getProxyTokenLogo(poolInfo.token0.logoURI)]}
          />
          <Logo
            style={{ width: tokenLogoSize, height: tokenLogoSize, borderRadius: '999px', overflow: 'hidden' }}
            srcs={[getProxyTokenLogo(poolInfo.token1.logoURI)]}
          />
        </Flex>
        <Text fontWeight="500" fontSize={isSharePc ? 16 : 12} color={theme.white}>
          <Trans>
            {poolInfo.token0.symbol} - {poolInfo.token1.symbol}
          </Trans>
        </Text>
        <FeeWrapper mobile={!isSharePc}>Fee {poolInfo.feePercent}</FeeWrapper>
      </Flex>
    )
  }

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
          <img src={BgShare} style={{ display: isSharePc ? 'block' : 'none' }} alt="my earning" width={containerWith} />
          <img
            src={BgShareMobile}
            style={{ display: !isSharePc ? 'block' : 'none' }}
            alt="my earning"
            width={containerWith}
          />
          <InnerContent mobile={!isSharePc}>
            <Text fontSize={isSharePc ? 26 : 16} fontWeight="500" color={theme.white}>
              {title}
            </Text>

            {renderPool()}

            <Text fontSize={isSharePc ? 50 : 30} fontWeight="500" color={theme.primary}>
              {formatValue(value, isSharePc)}
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
            {listShare.map(({ icon, type }, index) => (
              <ButtonWrapper key={index} onClick={() => generateImageUrlByMethod(type)}>
                {loadingType === type ? <Loader /> : icon}
              </ButtonWrapper>
            ))}
          </ShareContainer>
        </RowBetween>
      </Flex>
    </Modal>
  )
}
