import { motion, stagger, useAnimate, useInView } from 'framer-motion'
import { rgba } from 'polished'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useGetPromoteBannersQuery } from 'services/commonService'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { EMPTY_ARRAY } from 'constants/index'
import { ExternalLink } from 'theme'

function BoxInViewMotion({
  delay = 0,
  stagger: staggerDuration = 0.2,
  children,
  ...rest
}: {
  delay?: number
  stagger?: number
  children: ReactNode
}) {
  const [scope, animate] = useAnimate()
  const isInView = useInView(scope, { once: true, margin: '40px' })

  useEffect(() => {
    if (isInView) {
      try {
        animate(
          '.inViewChild',
          { opacity: 1, transform: 'translateY(0px)' },
          {
            ease: [0.12, 0.33, 0.33, 1],
            duration: 0.8,
            delay: stagger(staggerDuration, { startDelay: delay }),
          },
        )
      } catch (e) {}
    }
  }, [isInView, animate, delay, staggerDuration])

  return (
    <div ref={scope} {...rest}>
      {children}
    </div>
  )
}
const variants = {
  left: {
    x: -300,
    filter: 'brightness(0.4)',
    zIndex: 1,
    opacity: 0.8,
    scale: 0.7,
    boxShadow: '0 0 0 0 #00000040',
  },
  center: {
    scale: 1,
    opacity: 1,
    zIndex: 2,
    boxShadow: '0 0 10px 2px #00000040',
  },
  right: {
    x: 300,
    filter: 'brightness(0.4)',
    zIndex: 1,
    opacity: 0.8,
    scale: 0.7,
    boxShadow: '0 0 0 0 #00000040',
  },
}
const BannerWrapper = ({ children, ...rest }: { children: ReactNode; animate: string }) => {
  return (
    <motion.div
      variants={variants}
      transition={{ type: 'spring', damping: 60, stiffness: 400 }}
      style={{ position: 'absolute', overflow: 'hidden', aspectRatio: 60 / 34 }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

const Image = styled.img`
  object-fit: contain;
  border-radius: 16px;
  width: 600px;
  user-select: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`
const ArrowIcon = styled(DropdownSVG)`
  transform: rotate(90deg);
  transition: 0.2s all;
  position: absolute;
  z-index: 4;
  width: 32px;
  height: 32px;
  left: 0px;
  cursor: pointer;
  border-radius: 100%;
  background: ${({ theme }) => rgba(theme.border, 0.5)};
`

const View = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  height: auto;
  aspect-ratio: 60 / 34;
  width: 600px;
  overflow: visible;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100vw;
    overflow: hidden;
  `}
`
const animationName = ['center', 'right', 'left']

export default function BannerCarousel() {
  const { data = EMPTY_ARRAY } = useGetPromoteBannersQuery()
  const banners = useMemo(() => {
    const [item1, item2, item3] = data
    return [item1, item2 || item1, item3 || item1].filter(Boolean)
  }, [data])

  const [count, setCount] = useState(99999)
  useEffect(() => {
    const nextStep = () => {
      setCount(prev => ++prev)
    }
    const timeout = setTimeout(() => {
      nextStep()
    }, 10_000)
    return () => {
      timeout && clearTimeout(timeout)
    }
  }, [count])

  if (!banners.length) return null

  return (
    <BoxInViewMotion delay={0.5}>
      <View className="inViewChild">
        {banners.map((el, i) => (
          <BannerWrapper key={i} animate={animationName[(count + i) % 3]}>
            <ExternalLink href={el.ctaUrl}>
              <Image src={el.url} alt="banner" />
            </ExternalLink>
          </BannerWrapper>
        ))}
        {banners.length > 1 && (
          <>
            <ArrowIcon onClick={() => setCount(prev => prev - 1)} />
            <ArrowIcon
              style={{
                transform: 'rotate(-90deg)',
                left: 'unset',
                right: 0,
              }}
              onClick={() => setCount(prev => prev + 1)}
            />
          </>
        )}
      </View>
    </BoxInViewMotion>
  )
}
