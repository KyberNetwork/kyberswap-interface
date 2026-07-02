import { AnimatePresence, motion } from 'framer-motion'

export default function DropzoneOverlay({ show, text }: { show: boolean; text: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          className="absolute inset-[-6px] z-[2] flex items-center justify-center rounded-lg bg-buttonBlack text-sm font-medium"
          transition={{ duration: 0.15 }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
