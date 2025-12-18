import badgeDiamond from 'assets/recap/badge-diamond.png'
import badgeMover from 'assets/recap/badge-mover.png'
import badgeWhale from 'assets/recap/badge-whale.png'

export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`
  }
  return `$${volume.toFixed(2)}`
}

export const formatUsers = (users: number): string => {
  if (users >= 1e6) {
    return `${(users / 1e6).toFixed(1)}M`
  }
  if (users >= 1e3) {
    return `${(users / 1e3).toFixed(1)}K`
  }
  return users.toString()
}

export const formatTradingVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`
  }
  return `$${volume.toLocaleString()}`
}

export const getBadgeImage = (top: number): string => {
  if (top >= 1 && top <= 5) {
    return badgeWhale
  }
  if (top >= 6 && top <= 20) {
    return badgeDiamond
  }
  return badgeMover
}

// Date constants for recap availability
const AUTO_OPEN_END_DATE = new Date('2026-01-03T23:59:59.999Z') // End of Jan 3, 2026 UTC
const RECAP_END_DATE = new Date('2026-01-10T23:59:59.999Z') // End of Jan 10, 2026 UTC

/**
 * Check if auto-open popup is still available (until Jan 3, 2026)
 */
export const isAutoOpenAvailable = (): boolean => {
  const now = new Date()
  return now <= AUTO_OPEN_END_DATE
}

/**
 * Check if recap feature is still available (until Jan 10, 2026)
 */
export const isRecapAvailable = (): boolean => {
  const now = new Date()
  return now <= RECAP_END_DATE
}

/**
 * Capture screenshot of a container element with fixed desktop size (640x640)
 * This ensures the output is always 640x640 regardless of the actual container size
 * Hides progress bar and action buttons during capture
 */
export const captureScreenshot = async (containerElement: HTMLElement): Promise<string> => {
  const html2canvas = (await import('html2canvas')).default

  // Target size is always 640x640
  const targetSize = 640

  // Get current dimensions
  const currentWidth = containerElement.offsetWidth
  const currentHeight = containerElement.offsetHeight

  // Get elements to ignore during capture (but keep them visible on screen)
  const progressBar = containerElement.querySelector('.progress-bar-container') as HTMLElement
  const controlsContainer = containerElement.querySelector('.controls-container') as HTMLElement
  const shareButtonsContainer = containerElement.querySelector('.share-buttons-container') as HTMLElement

  // Calculate the scale needed to capture at target size
  const maxDimension = Math.max(currentWidth, currentHeight)
  const scale = targetSize / maxDimension

  // Capture screenshot with calculated scale
  // Use ignoreElements to exclude UI elements from capture, but keep them visible on screen
  const canvas = await html2canvas(containerElement, {
    width: currentWidth,
    height: currentHeight,
    scale: scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#0f0f0f',
    logging: false,
    ignoreElements: element => {
      // Ignore progress bar, controls, and share buttons during capture
      return (
        element === progressBar ||
        element === controlsContainer ||
        element === shareButtonsContainer ||
        progressBar?.contains(element) ||
        controlsContainer?.contains(element) ||
        shareButtonsContainer?.contains(element)
      )
    },
  })

  // Create output canvas with exact 640x640 dimensions
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = targetSize
  outputCanvas.height = targetSize
  const ctx = outputCanvas.getContext('2d')

  if (ctx) {
    // Draw the captured canvas scaled to exactly 640x640
    ctx.drawImage(canvas, 0, 0, targetSize, targetSize)
  }

  return outputCanvas.toDataURL('image/png', 1.0)
}

/**
 * Copy image to clipboard
 */
export const copyImageToClipboard = async (dataUrl: string): Promise<void> => {
  try {
    // Convert data URL to blob with a fresh fetch to avoid caching issues
    const response = await fetch(dataUrl, { cache: 'no-store' })
    const blob = await response.blob()

    // Create a new blob with explicit type to ensure it's fresh
    const imageBlob = new Blob([blob], { type: 'image/png' })

    // Clear clipboard first to avoid stale data
    try {
      await navigator.clipboard.writeText('')
    } catch {
      // Ignore errors when clearing clipboard
    }

    // Small delay to ensure clipboard is cleared
    await new Promise(resolve => setTimeout(resolve, 50))

    // Copy new image to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': imageBlob,
      }),
    ])
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error)
    throw error
  }
}

/**
 * Download image
 */
export const downloadImage = (dataUrl: string, filename = 'recap.png'): void => {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
