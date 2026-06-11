import { HTMLMotionProps, motion, useReducedMotion } from 'framer-motion'

type RevealOnScrollProps = HTMLMotionProps<'div'> & {
  /** Extra delay (seconds) before the reveal starts — use to stagger siblings. */
  delay?: number
}

/**
 * Fades + slides its children up when they scroll into view (and immediately for content already in the
 * viewport on load). Reveals once and stays put. Honors `prefers-reduced-motion` by skipping the motion.
 */
const RevealOnScroll = ({ delay = 0, transition, ...rest }: RevealOnScrollProps) => {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay, ...transition }}
      {...rest}
    />
  )
}

export default RevealOnScroll
