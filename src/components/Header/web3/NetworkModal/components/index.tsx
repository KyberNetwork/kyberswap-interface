import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'styled-components'

export const DropzoneOverlay = ({ show, text }: { show: boolean; text: string }) => {
  const theme = useTheme()
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            inset: '-6px',
            background: theme.buttonBlack,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 500,
            borderRadius: '8px',
          }}
          transition={{ duration: 0.1 }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
