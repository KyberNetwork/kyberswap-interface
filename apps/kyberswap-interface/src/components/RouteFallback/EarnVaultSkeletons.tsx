import { ControlSkeleton } from 'components/RouteFallback/common'
import Skeleton from 'components/Skeleton'

/**
 * Route-level stand-ins for the three vault pages, shaped like the real layouts but built from plain
 * classes: these ship in the main bundle, so they cannot import the pages' own style modules.
 *
 * The pages keep their own, higher-fidelity skeletons for data loading — the same split PoolDetail
 * uses between `DetailPageSkeleton` here and `PoolDetailPageSkeleton` in the page chunk.
 */

/** The API serves three vaults, so three placeholders is the honest number. */
const VAULT_ROWS = 3

const VaultPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full flex-1 flex-col gap-5">{children}</div>
)

/** Chain + protocol pills, sort control and view toggle on the left, search on the right. */
const VaultFilterRowSkeleton = ({ withSort = true }: { withSort?: boolean }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
    <div className="flex flex-wrap items-center gap-3 max-sm:w-full">
      <ControlSkeleton width={140} rounded />
      {withSort && (
        <>
          <ControlSkeleton width={140} rounded />
          <ControlSkeleton width={130} rounded />
          <ControlSkeleton width={72} />
        </>
      )}
    </div>
    <ControlSkeleton width={320} rounded />
  </div>
)

const VaultCardSkeleton = () => (
  <div className="flex flex-col gap-4 rounded-[20px] bg-background p-5">
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-1">
        <Skeleton circle width={24} height={24} />
        <Skeleton width={40} height={18} />
        <Skeleton width={30} height={18} />
      </div>
      <Skeleton width={80} height={28} />
    </div>

    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <Skeleton width={30} height={16} />
        <Skeleton width={80} height={32} />
      </div>
      <Skeleton width="100%" height={28} containerClassName="block" />
    </div>

    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <Skeleton width={30} height={16} />
        <Skeleton width={60} height={24} />
      </div>
      <Skeleton width="100%" height={49} containerClassName="block" />
    </div>

    <Skeleton width={140} height={22} />
  </div>
)

const VaultCardsGridSkeleton = () => (
  <div className="grid grid-cols-3 gap-x-10 gap-y-8 max-lg:grid-cols-2 max-lg:gap-6 max-sm:grid-cols-1 max-sm:gap-4">
    {Array.from({ length: VAULT_ROWS }, (_, index) => (
      <VaultCardSkeleton key={index} />
    ))}
  </div>
)

export const EarnVaultsSkeleton = () => (
  <VaultPageWrapper>
    <Skeleton width={120} height={32} />
    <VaultFilterRowSkeleton />
    <VaultCardsGridSkeleton />
  </VaultPageWrapper>
)

const MyVaultCardSkeleton = () => (
  <div className="flex flex-col gap-4 rounded-[20px] bg-background p-5">
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <Skeleton circle width={24} height={24} />
        <Skeleton width={40} height={18} />
        <Skeleton width={30} height={18} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton width={72} height={28} />
        <Skeleton width={80} height={28} />
      </div>
    </div>

    {/* Balance, value and earnings rows. */}
    {[
      [80, 100],
      [50, 80],
      [100, 120],
    ].map(([label, value], index) => (
      <div key={index} className="flex items-center justify-between gap-3">
        <Skeleton width={label} height={16} />
        <Skeleton width={value} height={16} />
      </div>
    ))}

    <div className="flex items-center justify-between gap-3">
      <Skeleton width={80} height={16} />
      <Skeleton width={80} height={16} />
    </div>
    <Skeleton width={140} height={22} />
  </div>
)

export const EarnMyVaultsSkeleton = () => (
  <VaultPageWrapper>
    <Skeleton width={140} height={32} />
    <VaultFilterRowSkeleton withSort={false} />
    <div className="grid grid-cols-3 gap-x-10 gap-y-8 max-lg:grid-cols-2 max-lg:gap-6 max-sm:grid-cols-1 max-sm:gap-4">
      {Array.from({ length: VAULT_ROWS }, (_, index) => (
        <MyVaultCardSkeleton key={index} />
      ))}
    </div>
  </VaultPageWrapper>
)

/** Charts column on the left, deposit/withdraw card on the right — the detail page's two tracks. */
export const EarnVaultDetailSkeleton = () => (
  <div className="flex w-full flex-1 flex-col gap-5">
    <div className="flex items-center gap-3">
      <Skeleton width={24} height={24} />
      <Skeleton circle width={32} height={32} />
      <Skeleton width={180} height={28} />
      <div className="ml-auto flex items-center gap-2">
        <Skeleton width={72} height={28} />
      </div>
    </div>

    <div className="grid w-full grid-cols-[minmax(0,1fr)_480px] items-start gap-4 max-lg:grid-cols-[minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-5 rounded-xl bg-background p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton circle width={24} height={24} />
              <Skeleton width={160} height={20} />
            </div>
            <Skeleton width={150} height={24} />
          </div>

          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Skeleton width={120} height={18} />
                <Skeleton width={160} height={28} />
              </div>
              <Skeleton width="100%" height={240} containerClassName="block" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col rounded-xl bg-background max-lg:w-full">
        <div className="flex gap-1 border-b border-solid border-white-08 p-1">
          <Skeleton width={148} height={40} />
          <Skeleton width={148} height={40} />
        </div>
        <div className="flex flex-col gap-4 p-5">
          <Skeleton width="100%" height={96} containerClassName="block" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <Skeleton width={110} height={16} />
              <Skeleton width={80} height={16} />
            </div>
          ))}
          <Skeleton width="100%" height={44} containerClassName="block" />
        </div>
      </div>
    </div>
  </div>
)
