import { motion } from 'framer-motion'
import { CSSProperties } from 'react'
import { useTheme } from 'styled-components'

export const StarWithAnimation = ({
  loading,
  watched,
  onClick,
  size,
  disabled,
  wrapperStyle,
}: {
  watched: boolean
  loading: boolean
  onClick?: (e: any) => void
  size?: number
  disabled?: boolean
  wrapperStyle?: CSSProperties
}) => {
  const theme = useTheme()
  const variants = {
    unWatched: {
      fill: '#ffffff00',
      stroke: theme.subText,
    },
    watched: {
      fill: theme.primary,
      stroke: theme.primary,
    },
  }

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      whileTap={disabled ? undefined : { scale: 1 }}
      whileHover={disabled ? undefined : { scale: 1.1 }}
      transition={{ scale: { type: 'spring', damping: 10, stiffness: 800, restDelta: 0.2 } }}
      style={{ ...wrapperStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      onClick={e => {
        e.stopPropagation()
        if (!disabled) {
          onClick?.(e)
        }
      }}
      animate={watched ? 'watched' : 'unWatched'}
    >
      <motion.svg
        width={size || '20'}
        height={size || '20'}
        style={{ display: 'block' }}
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 1, scale: 1 }}
        variants={variants}
      >
        {loading ? (
          <motion.polygon
            initial={{ pathLength: 0, stroke: theme.text }}
            animate={{ pathLength: 1, stroke: theme.warning }}
            transition={{ type: 'spring', duration: 1, stiffness: 15, repeat: Infinity }}
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          ></motion.polygon>
        ) : (
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        )}
      </motion.svg>
    </motion.div>
  )
}
