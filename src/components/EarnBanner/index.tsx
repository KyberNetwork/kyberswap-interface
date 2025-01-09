import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useExplorerLandingQuery } from 'services/zapEarn'
import styled, { css, keyframes } from 'styled-components'

import earnLargeBg from 'assets/images/earn_background_large.png'
import earnSmallBg from 'assets/images/earn_background_small.png'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { formatAprNumber } from 'pages/Earns/utils'

const EarnBannerContainer = styled.div`
  padding: 1px;
  position: relative;
  background-clip: padding-box;
  overflow: hidden;
  margin-bottom: 20px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;

  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1px;
    background: linear-gradient(306.9deg, #262525 38.35%, rgba(148, 117, 203, 0.2) 104.02%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(130, 71, 229, 0.6) 0%, rgba(130, 71, 229, 0) 100%);
    mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    z-index: -1;
  }
`

const EarnBannerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 22px 18px 22px 68px;

  background-image: url(${earnLargeBg});
  background-position: center;
  background-size: cover;

  ${({ theme }) => theme.mediaWidth.upToXL`
    padding: 20px 18px;
  `}

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    background-image: url(${earnSmallBg});
    padding: 20px 24px;
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    background-image: url(${earnLargeBg});
    padding: 20px 18px 20px 60px;
  `}

  @media screen and (max-width: 900px) {
    padding: 20px 18px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    background-image: url(${earnSmallBg});
    padding: 20px 24px;
  `}
`

const Description = styled(Text)`
  width: 400px;

  ${({ theme }) => theme.mediaWidth.upToXL`
    width: unset;
  `}
`

const PrimaryText = styled.span`
  color: ${({ theme }) => theme.primary};
`

const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

const PoolButton = styled.div<{ animate: boolean }>`
  border-radius: 40px;
  padding: 10px 20px;
  background: #1d5b49cc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid rgba(25, 103, 80, 1);

  ${({ animate }) =>
    animate &&
    css`
      animation: ${pulse} 0.6s;
    `}

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: unset;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    padding: 10px 16px;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 10px 12px;
  `}
`

const TokenImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  box-shadow: 0 4px 8px 0 rgba(11, 46, 36, 1);

  &:nth-child(1) {
    margin-right: -8px;
  }
`

const PoolAprWrapper = styled.div`
  border-radius: 20px;
  box-shadow: 0 8px 8px 0 rgba(0, 0, 0, 0.3);
  padding-bottom: 1px;
  width: auto;
  overflow: hidden;
  background-image: linear-gradient(
    to right,
    rgba(102, 102, 102, 0),
    rgba(102, 102, 102, 0),
    rgba(162, 233, 212, 1),
    rgba(102, 102, 102, 0),
    rgba(102, 102, 102, 0)
  );
`

const PoolApr = styled.div`
  display: flex;
  font-weight: 600;
  background-color: #000;
  color: ${({ theme }) => theme.primary};
  padding: 4px 16px;
  width: max-content;
`

const AprText = styled.span`
  margin-left: 6px;
  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    display: none;
  `}
`

let indexInterval: NodeJS.Timeout

export default function EarnBanner() {
  const navigate = useNavigate()
  const { mixpanelHandler } = useMixpanel()
  const { account } = useActiveWeb3React()
  const { data } = useExplorerLandingQuery({ userAddress: account })

  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(false)

  const pool = useMemo(() => data?.data.highlightedPools[index] || null, [data, index])

  const handleClickBanner = () => {
    mixpanelHandler(MIXPANEL_TYPE.EARN_BANNER_CLICK, {
      banner_name: 'HomePage_Earn_Banner',
      page: 'HomePage',
      destination_url: '/earn',
    })
    navigate({ pathname: APP_PATHS.EARN })
  }

  const handleClickBannerPool = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pool) return
    e.stopPropagation()
    mixpanelHandler(MIXPANEL_TYPE.EARN_BANNER_POOL_CLICK, {
      banner_name: 'HomePage_Pool_Banner',
      page: 'HomePage',
      pool_pair: `${pool.tokens[0].symbol}-${pool.tokens[1].symbol}`,
      destination_url: `/pools/${pool.tokens[0].symbol}-${pool.tokens[1].symbol}`,
    })
    navigate({ pathname: APP_PATHS.EARN, search: `?openPool=${index}` })
  }

  useEffect(() => {
    const handleIndexChange = () => {
      setAnimate(true)
      setTimeout(() => setIndex(prev => (prev >= 9 ? 0 : prev + 1)), 200)
      setTimeout(() => setAnimate(false), 1000)
    }
    indexInterval = setInterval(handleIndexChange, 4000)

    return () => clearInterval(indexInterval)
  }, [])

  return (
    <EarnBannerContainer>
      <EarnBannerWrapper onClick={handleClickBanner}>
        <Description>
          Explore and Add Liquidity to High-APR Pools <PrimaryText>Instantly</PrimaryText> with{' '}
          <PrimaryText>Any Token(s)</PrimaryText> or <PrimaryText>Position</PrimaryText> you choose!
        </Description>
        <PoolButton animate={animate} onClick={handleClickBannerPool}>
          {!!pool && (
            <>
              <Flex>
                <TokenImage src={pool.tokens[0].logoURI} alt="" />
                <TokenImage src={pool.tokens[1].logoURI} alt="" />
                <Text fontSize={18} marginLeft={2}>
                  {pool.tokens[0].symbol}/{pool.tokens[1].symbol}
                </Text>
              </Flex>
              <PoolAprWrapper>
                <PoolApr>
                  {formatAprNumber(pool.apr)}% <AprText>APR</AprText>
                </PoolApr>
              </PoolAprWrapper>
            </>
          )}
        </PoolButton>
      </EarnBannerWrapper>
    </EarnBannerContainer>
  )
}
