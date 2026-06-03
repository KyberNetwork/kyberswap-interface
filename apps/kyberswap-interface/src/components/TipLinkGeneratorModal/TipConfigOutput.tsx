import { Check, Copy, Loader } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { LINK_PLACEHOLDER, enablePreview } from 'components/TipLinkGeneratorModal/shared'
import Toggle from 'components/Toggle'

type Props = {
  canGenerate: boolean
  copied: boolean
  generatedLink: string
  isLoading: boolean
  onCopy: () => void
  onGenerate: () => void
  onShortLinkChange: () => void
  shortLink: boolean
}

export default function TipConfigOutput({
  canGenerate,
  copied,
  generatedLink,
  isLoading,
  onCopy,
  onGenerate,
  onShortLinkChange,
  shortLink,
}: Props) {
  return (
    <Stack className="gap-5">
      <ButtonPrimary
        disabled={!canGenerate || isLoading}
        onClick={onGenerate}
        className="h-10 w-full rounded-full text-sm font-semibold"
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : 'Generate Link'}
      </ButtonPrimary>

      <Stack className="gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-2 text-[11px] font-semibold uppercase text-primary">
            <span className="size-2 rounded-full bg-primary" />
            Generated Link
          </HStack>
          {enablePreview && (
            <HStack className="items-center gap-2 text-xs text-subText">
              <Toggle isActive={shortLink} toggle={onShortLinkChange} size="sm" />
              Short Link
            </HStack>
          )}
        </HStack>
        <HStack className="items-center gap-2">
          <div className="min-w-0 flex-1 truncate text-sm text-subText">{generatedLink || LINK_PLACEHOLDER}</div>
          <HStack
            as="button"
            onClick={onCopy}
            disabled={!generatedLink}
            className="h-7 items-center gap-1 rounded-full bg-white/10 px-3 text-xs font-semibold text-text transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </HStack>
        </HStack>
      </Stack>
    </Stack>
  )
}
