import { Trans } from '@lingui/macro'
import qrcode from 'qrcode-generator'
import { useEffect, useRef, useState } from 'react'

import { cn } from 'utils/cn'

type Props = {
  id?: string
  value?: string
  size?: number
  quietZone?: number
  ecLevel?: 'L' | 'M' | 'Q' | 'H'
  logoImage?: string
  logoWidth?: number
  logoHeight?: number
  className?: string
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

export default function QRCodeWithLogo({
  id,
  value,
  size = 200,
  quietZone = 14,
  ecLevel = 'M',
  logoImage,
  logoWidth = 32,
  logoHeight = 32,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasError, setHasError] = useState(false)
  const canvasSize = size + quietZone * 2

  useEffect(() => {
    if (!value) return

    let cancelled = false

    const draw = async () => {
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!canvas || !context) {
        setHasError(true)
        return
      }

      try {
        const pixelRatio = window.devicePixelRatio || 1

        canvas.width = canvasSize * pixelRatio
        canvas.height = canvasSize * pixelRatio
        canvas.style.width = `${canvasSize}px`
        canvas.style.height = `${canvasSize}px`

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        context.clearRect(0, 0, canvasSize, canvasSize)
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvasSize, canvasSize)

        const qr = qrcode(0, ecLevel)
        qr.addData(value)
        qr.make()

        const moduleCount = qr.getModuleCount()
        const cellSize = size / moduleCount

        context.fillStyle = '#000000'
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
              context.fillRect(quietZone + col * cellSize, quietZone + row * cellSize, cellSize, cellSize)
            }
          }
        }

        if (logoImage) {
          try {
            const logo = await loadImage(logoImage)
            if (cancelled) return

            const logoX = (canvasSize - logoWidth) / 2
            const logoY = (canvasSize - logoHeight) / 2
            const logoPadding = 4

            context.fillStyle = '#ffffff'
            context.fillRect(
              logoX - logoPadding,
              logoY - logoPadding,
              logoWidth + logoPadding * 2,
              logoHeight + logoPadding * 2,
            )
            context.drawImage(logo, logoX, logoY, logoWidth, logoHeight)
          } catch {}
        }

        if (!cancelled) setHasError(false)
      } catch {
        if (!cancelled) setHasError(true)
      }
    }

    draw()

    return () => {
      cancelled = true
    }
  }, [canvasSize, ecLevel, logoHeight, logoImage, logoWidth, quietZone, size, value])

  if (!value) {
    return <div className={className} style={{ height: canvasSize, width: canvasSize }} />
  }

  return (
    <>
      {hasError && (
        <div
          className="flex items-center justify-center rounded-2xl border-2 border-solid border-border text-center text-sm text-subText"
          style={{ height: canvasSize, width: canvasSize }}
        >
          <Trans>
            Something went wrong,
            <br />
            please try again
          </Trans>
        </div>
      )}
      <canvas
        id={id}
        ref={canvasRef}
        aria-label="QR code"
        className={cn('rounded-2xl', hasError && 'hidden', className)}
        style={{ height: canvasSize, width: canvasSize }}
      />
    </>
  )
}
