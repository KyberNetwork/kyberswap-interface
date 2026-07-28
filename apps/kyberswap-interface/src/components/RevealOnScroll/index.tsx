import { HTMLMotionProps, motion } from 'framer-motion'

type RevealOnScrollProps = HTMLMotionProps<'div'> & {
  /** Extra delay (seconds) before the reveal starts — use to stagger siblings. */
  delay?: number
}

/**
 * Reveal motion is temporarily disabled while route fallback geometry is being tuned.
 */
const RevealOnScroll = ({ delay = 0, transition, ...rest }: RevealOnScrollProps) => {
  return <motion.div initial={false} transition={{ duration: 0, delay, ...transition }} {...rest} />
}

export default RevealOnScroll
