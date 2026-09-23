import { t } from '@lingui/macro'

import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import { CloseButton } from 'pages/Earns/components/VaultDeposit/ConfirmDeposit'
import {
  ButtonGroup,
  Field,
  FieldRow,
  FieldSeam,
  FieldStack,
  InfoList,
  InfoRow,
  ModalHeader,
  ModalTitle,
  ModalTitleRow,
  PillRange,
  ReceiveField,
} from 'pages/Earns/components/VaultDeposit/styles'
import { cn } from 'utils/cn'

export type VaultFormKind = 'deposit' | 'withdraw'

const PILL_COUNT = 4

/** The percent pills and the balance beside them, which both forms open with. */
const AmountFieldHeadSkeleton = () => (
  <FieldRow className="items-start">
    <PillRange className="gap-2">
      {Array.from({ length: PILL_COUNT }).map((_, index) => (
        <ValueSkeleton key={index} className="h-4 w-8" />
      ))}
    </PillRange>
    <ValueSkeleton className="h-5 w-20" />
  </FieldRow>
)

/** A typed amount on the left, the token it is denominated in on the right. */
const AmountFieldBodySkeleton = () => (
  <FieldRow>
    <ValueSkeleton className="h-7 w-32" />
    <ValueSkeleton className="h-10 w-28 rounded-xl" />
  </FieldRow>
)

/**
 * One whole amount field. Exported because the deposit form opens with no token on it — the opening
 * pick is still being read — and the row has to hold its place until it arrives.
 */
export const AmountFieldSkeleton = () => (
  <Field>
    <AmountFieldHeadSkeleton />
    <AmountFieldBodySkeleton />
  </Field>
)

/** `rowHeight` reserves what the real row takes: the slippage control is taller than a plain one. */
const InfoRowSkeleton = ({ labelWidth, rowHeight = 'h-5' }: { labelWidth: string; rowHeight?: string }) => (
  <InfoRow className={rowHeight}>
    <ValueSkeleton className={cn('h-5', labelWidth)} />
    <ValueSkeleton className="h-5 w-28" />
  </InfoRow>
)

/** Two lines of the small italic note both withdraw paths carry. */
const NoteSkeleton = () => (
  <div className="flex w-full flex-col gap-1">
    <ValueSkeleton className="h-3.5 w-full" />
    <ValueSkeleton className="h-3.5 w-2/3" />
  </div>
)

const ButtonsSkeleton = () => (
  <ButtonGroup>
    <ValueSkeleton className="h-[42px] flex-1 rounded-[20px]" />
    <ValueSkeleton className="h-[42px] flex-1 rounded-[20px]" />
  </ButtonGroup>
)

/**
 * Everything between the vault's name and the action button, which the vault page's own tab shows
 * without a modal around it.
 */
export const VaultFieldsSkeleton = ({ kind }: { kind: VaultFormKind }) => (
  <>
    {kind === 'deposit' ? (
      <>
        <AmountFieldSkeleton />

        <ValueSkeleton className="h-5 w-28" />

        <ReceiveField>
          <ValueSkeleton className="h-5 w-20" />
          <FieldRow>
            <ValueSkeleton className="h-7 w-32" />
            <ValueSkeleton className="h-10 w-28" />
          </FieldRow>
        </ReceiveField>

        <ValueSkeleton className="h-4 w-52" />
      </>
    ) : (
      <FieldStack>
        <AmountFieldSkeleton />

        <FieldSeam />

        <Field className="gap-3">
          <ValueSkeleton className="h-9 w-full rounded-xl" />
          <NoteSkeleton />
          <FieldRow>
            <ValueSkeleton className="h-8 w-24 rounded-xl" />
            <ValueSkeleton className="h-8 w-28" />
          </FieldRow>
        </Field>
      </FieldStack>
    )}

    <InfoList>
      <InfoRowSkeleton labelWidth="w-32" rowHeight={kind === 'deposit' ? 'h-5' : 'h-[22px]'} />
      <InfoRowSkeleton labelWidth="w-24" rowHeight={kind === 'deposit' ? 'h-8' : 'h-[22px]'} />
    </InfoList>

    {/* The queue path, which a withdrawal opens on, closes with a note about the payout. */}
    {kind === 'withdraw' ? <NoteSkeleton /> : null}
  </>
)

/**
 * The shape of a vault form while the vault it acts on is still loading. Built from the same
 * primitives as the forms themselves, so the spacing it reserves is the spacing they arrive into.
 * The title and the close button are real: neither waits on the vault, and the modal has to stay
 * dismissable.
 */
const VaultFormSkeleton = ({ kind, onClose }: { kind: VaultFormKind; onClose: () => void }) => (
  <>
    <ModalHeader>
      <ModalTitleRow>
        <ModalTitle>{kind === 'deposit' ? t`Deposit` : t`Withdraw`}</ModalTitle>
        <CloseButton onClose={onClose} />
      </ModalTitleRow>
    </ModalHeader>

    <div className="flex w-full items-center gap-2">
      <ValueSkeleton className="size-5 rounded-full" />
      <ValueSkeleton className="h-6 w-24" />
      <ValueSkeleton className="h-5 w-20 rounded-2xl" />
    </div>

    <VaultFieldsSkeleton kind={kind} />

    <ButtonsSkeleton />
  </>
)

export default VaultFormSkeleton
