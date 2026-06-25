import { Token as TokenSchema } from '@kyber/schema'
import { CSSProperties, useRef, useState } from 'react'
import { Check, ChevronDown, Copy, Download, Image as ImageIcon, Loader, UploadCloud } from 'react-feather'

import FileInput from 'components/FileInput'
import { Center, HStack, Stack } from 'components/Stack'
import { BackgroundMode, SOLID_COLORS, SectionLabel } from 'components/TipLinkGeneratorModal/shared'
import { cn } from 'utils/cn'

type Props = {
  backgroundColor: string
  backgroundMode: BackgroundMode
  customColorLabel: string
  defaultBackgroundImage: string
  imageFile?: File
  imagePreview: string
  inputToken: TokenSchema
  isCustomColor: boolean
  onBackgroundColorChange: (color: string) => void
  onBackgroundModeChange: (mode: BackgroundMode) => void
  onImageChange: (preview: string, file: File) => void
  onRemoveImage: () => void
  onToggle: () => void
  outputToken?: TokenSchema
  previewStyle: CSSProperties
  previewTitle: string
  show: boolean
}

export default function TipConfigPreview({
  backgroundColor,
  backgroundMode,
  customColorLabel,
  defaultBackgroundImage,
  imageFile,
  imagePreview,
  inputToken,
  isCustomColor,
  onBackgroundColorChange,
  onBackgroundModeChange,
  onImageChange,
  onRemoveImage,
  onToggle,
  outputToken,
  previewStyle,
  previewTitle,
  show,
}: Props) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [isCopyingImage, setIsCopyingImage] = useState(false)
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [isImageCopied, setIsImageCopied] = useState(false)
  const [isImageDownloaded, setIsImageDownloaded] = useState(false)

  const generateCanvas = async () => {
    if (!previewRef.current) return
    const html2canvas = (await import('html2canvas')).default
    return html2canvas(previewRef.current, {
      allowTaint: true,
      useCORS: true,
      scale: 3,
      backgroundColor: null,
      logging: false,
    })
  }

  const handleCopyImage = async () => {
    if (!navigator?.clipboard) return
    setIsCopyingImage(true)
    try {
      const canvas = await generateCanvas()
      if (!canvas) return
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) return
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setIsImageCopied(true)
      window.setTimeout(() => setIsImageCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy preview image:', error)
    } finally {
      setIsCopyingImage(false)
    }
  }

  const handleDownloadImage = async () => {
    setIsDownloadingImage(true)
    try {
      const canvas = await generateCanvas()
      if (!canvas) return
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = 'kyberswap-tip-link.png'
      link.click()
      setIsImageDownloaded(true)
      window.setTimeout(() => setIsImageDownloaded(false), 1500)
    } catch (error) {
      console.error('Failed to download preview image:', error)
    } finally {
      setIsDownloadingImage(false)
    }
  }

  return (
    <Stack className="gap-3">
      <HStack
        as="button"
        onClick={onToggle}
        className="group w-fit items-center gap-1.5 rounded-md text-left transition-colors hover:text-text"
      >
        <SectionLabel>Preview</SectionLabel>
        <ChevronDown
          size={16}
          className={cn('text-subText transition-[color,transform] group-hover:text-text', show && 'rotate-180')}
        />
      </HStack>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity,padding] duration-300 ease-in-out',
          show ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <Stack className="gap-3 rounded-lg border border-border p-2">
            <div
              ref={previewRef}
              style={previewStyle}
              className="relative aspect-[1200/630] overflow-hidden rounded-lg"
            >
              <Stack className="size-full items-center justify-center gap-3 px-5 text-center text-white">
                <HStack className="items-center gap-3">
                  {inputToken.logo && (
                    <img src={inputToken.logo} alt="" className="size-11 rounded-full bg-white p-1" />
                  )}
                  <span className="text-primary">-&gt;</span>
                  {outputToken?.logo && (
                    <img src={outputToken.logo} alt="" className="size-11 rounded-full bg-white p-1" />
                  )}
                </HStack>
                <div className="text-lg font-medium">{previewTitle}</div>
                <div className="text-sm text-white/45">Powered by KyberSwap</div>
              </Stack>
            </div>

            <HStack className="justify-center gap-3">
              <HStack
                as="button"
                onClick={handleCopyImage}
                disabled={isCopyingImage}
                className={cn(
                  'h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-xs font-medium text-subText transition-colors hover:bg-white/15 hover:text-text disabled:cursor-not-allowed disabled:opacity-60',
                  isImageCopied && 'bg-primary/15 text-primary',
                )}
              >
                {isImageCopied ? (
                  <Check size={13} />
                ) : isCopyingImage ? (
                  <Loader size={13} className="animate-spin" />
                ) : (
                  <Copy size={13} />
                )}
                {isImageCopied ? 'Copied' : 'Copy Image'}
              </HStack>
              <HStack
                as="button"
                onClick={handleDownloadImage}
                disabled={isDownloadingImage}
                className={cn(
                  'h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-xs font-medium text-subText transition-colors hover:bg-white/15 hover:text-text disabled:cursor-not-allowed disabled:opacity-60',
                  isImageDownloaded && 'bg-primary/15 text-primary',
                )}
              >
                {isImageDownloaded ? (
                  <Check size={13} />
                ) : isDownloadingImage ? (
                  <Loader size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                {isImageDownloaded ? 'Downloaded' : 'Download Image'}
              </HStack>
            </HStack>

            <Stack className="gap-2">
              <div className="text-sm font-medium text-subText">Solid Color</div>
              <HStack className="flex-wrap items-center gap-2">
                <Center
                  as="button"
                  onClick={() => onBackgroundModeChange('default')}
                  style={{ backgroundImage: `url(${defaultBackgroundImage})`, backgroundPosition: '100% center' }}
                  className={cn(
                    'size-6 rounded-md border bg-cover bg-center transition-[border-color,box-shadow] hover:border-subText/50',
                    backgroundMode === 'default'
                      ? 'border-primary shadow-[0_0_0_2px_rgba(49,203,158,0.22)]'
                      : 'border-transparent',
                  )}
                />
                {imagePreview && (
                  <Center
                    as="button"
                    onClick={() => onBackgroundModeChange('image')}
                    style={{ backgroundImage: `url(${imagePreview})` }}
                    className={cn(
                      'size-6 rounded-md border bg-cover bg-center transition-[border-color,box-shadow] hover:border-subText/50',
                      backgroundMode === 'image'
                        ? 'border-primary shadow-[0_0_0_2px_rgba(49,203,158,0.22)]'
                        : 'border-transparent',
                    )}
                  />
                )}
                {SOLID_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      onBackgroundColorChange(color)
                      onBackgroundModeChange('solid')
                    }}
                    style={{ backgroundColor: color }}
                    className={cn(
                      'size-6 rounded-md border transition-[border-color,box-shadow] hover:border-subText/50',
                      backgroundMode === 'solid' && backgroundColor === color
                        ? 'border-primary shadow-[0_0_0_2px_rgba(49,203,158,0.22)]'
                        : 'border-transparent',
                    )}
                  />
                ))}
                <HStack
                  as="label"
                  className={cn(
                    'relative h-6 w-[68px] cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-[#202020] px-1 text-xs transition-[border-color,box-shadow,color] hover:border-subText/50 hover:text-text',
                    isCustomColor
                      ? 'border-primary text-primary shadow-[0_0_0_2px_rgba(49,203,158,0.22)]'
                      : 'border-border text-subText',
                  )}
                >
                  <span className="truncate">{customColorLabel}</span>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={event => {
                      onBackgroundColorChange(event.target.value)
                      onBackgroundModeChange('solid')
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </HStack>
              </HStack>
            </Stack>

            <Stack className="gap-2">
              <div className="text-sm font-medium text-subText">Or Upload Image Background</div>
              <FileInput image onImgChange={onImageChange} width="100%">
                <HStack className="items-center gap-3 rounded-lg border border-dashed border-border bg-[#252525] p-2 transition-colors hover:bg-[#303030]">
                  <Center className="size-9 rounded border border-border text-subText">
                    {imagePreview ? <ImageIcon size={20} /> : <UploadCloud size={20} />}
                  </Center>
                  <Stack className="min-w-0 flex-1">
                    <div className="truncate text-sm text-subText">
                      {imageFile ? 'Image background selected' : 'Drop Image here'}
                    </div>
                    <div className="text-xs text-subText/70">
                      {imageFile
                        ? `${imageFile.type.replace('image/', '').toUpperCase()} - ${Math.ceil(
                            imageFile.size / 1024,
                          )} KB`
                        : 'PNG, JPG, WebP - max 1MB'}
                    </div>
                  </Stack>
                  {imageFile ? (
                    <button
                      type="button"
                      onClick={event => {
                        event.preventDefault()
                        event.stopPropagation()
                        onRemoveImage()
                      }}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-subText transition-colors hover:bg-white/15 hover:text-text"
                    >
                      Remove
                    </button>
                  ) : (
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-subText">Browse</div>
                  )}
                </HStack>
              </FileInput>
            </Stack>
          </Stack>
        </div>
      </div>
    </Stack>
  )
}
