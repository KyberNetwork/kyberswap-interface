import { ExternalLink, Loader } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import { HStack, Stack } from 'components/Stack'
import { LINK_PLACEHOLDER, enablePreview } from 'components/TipLinkGeneratorModal/shared'
import Toggle from 'components/Toggle'

type Props = {
  canGenerate: boolean
  generatedLink: string
  isLoading: boolean
  onGenerate: () => void
  onShortLinkChange: () => void
  shortLink: boolean
}

export default function TipConfigOutput({
  canGenerate,
  generatedLink,
  isLoading,
  onGenerate,
  onShortLinkChange,
  shortLink,
}: Props) {
  return (
    <Stack className="gap-5">
      <ButtonPrimary
        disabled={!canGenerate || isLoading}
        onClick={onGenerate}
        className="h-10 w-full rounded-full text-sm font-medium"
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : 'Generate Link'}
      </ButtonPrimary>

      <Stack className="gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-2 text-[11px] font-medium uppercase text-primary">
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
          {generatedLink && (
            <a
              href={generatedLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open generated link in new tab"
              title="Open in new tab"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-text transition-colors hover:bg-white/15"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <CopyHelper
            toCopy={generatedLink}
            margin="0"
            size={13}
            text="Copy"
            className={
              generatedLink
                ? 'h-7 rounded-full bg-white/10 px-3 text-xs font-medium text-text transition-colors hover:bg-white/15'
                : 'pointer-events-none h-7 cursor-not-allowed rounded-full bg-white/10 px-3 text-xs font-medium text-text opacity-50'
            }
          />
        </HStack>
      </Stack>
    </Stack>
  )
}
