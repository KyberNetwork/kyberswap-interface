import { useCallback, useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const RefetchIndicator = ({ visible: propVisible }: { visible: boolean }) => {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const pendingHide = useRef(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (propVisible) {
      pendingHide.current = false
      setFading(false)
      setVisible(true)
    } else if (visible) {
      if (prefersReducedMotion()) {
        setFading(true)
        timer = setTimeout(() => setVisible(false), 300)
      } else {
        pendingHide.current = true
      }
    }
    return () => clearTimeout(timer)
  }, [propVisible, visible])

  const onAnimationIteration = useCallback(() => {
    // Loading finished mid-cycle: hide as soon as the bar completes its current pass (it's already
    // off-screen at the iteration boundary), so it never starts a partial, faded-out second pass.
    if (pendingHide.current) {
      pendingHide.current = false
      setVisible(false)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="absolute inset-x-0 top-0 z-[2] h-0.5 overflow-hidden transition-opacity duration-300 ease-linear"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div
        onAnimationIteration={onAnimationIteration}
        className="absolute left-0 top-0 h-full w-1/4 rounded-sm bg-primary [animation:ks-progress-slide_1.2s_ease-in-out_infinite] motion-reduce:animate-none"
      />
    </div>
  )
}

export default RefetchIndicator
