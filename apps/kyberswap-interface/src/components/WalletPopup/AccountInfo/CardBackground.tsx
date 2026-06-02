import { ReactComponent as KyberLogo } from 'assets/svg/kyber/kyber_logo.svg'

type Props = {
  noLogo: boolean
}
const CardBackground: React.FC<Props> = ({ noLogo }) => {
  return (
    <div
      // `isolation: isolate` creates a new stacking context so the inner
      // `mix-blend-mode: overlay` layers blend against the dark `bg-background`
      // sibling below them, NOT against whatever element sits behind the popup.
      // This matches prod's appearance regardless of the page underneath.
      className="absolute left-0 top-0 size-full overflow-hidden rounded-[20px] [isolation:isolate]"
      style={{
        boxShadow: 'inset 0px 1px 1px rgba(255, 255, 255, 0.15), inset -1px -1px 1px rgba(0, 0, 0, 0.08)',
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
      }}
    >
      {/* Match the surface color of the popup wrapper (`bg-tabActive`) so the
          overlay-blended gradients reproduce prod's appearance — prod relied
          on the overlay blending against the popup's tabActive backdrop. */}
      <div className="absolute inset-0 bg-tabActive" />
      {/* mix-blend-mode lives on the wrapper (not the individual layers) so
          the two gradients composite first, then the combined result blends
          with the tabActive backdrop in a single overlay step. */}
      <div className="absolute inset-0" style={{ mixBlendMode: 'overlay' }}>
        <div
          className="absolute left-0 top-0 size-full opacity-80"
          style={{ background: 'linear-gradient(143.08deg, #31CB9E 41.26%, rgba(0, 0, 0, 0) 112.51%)' }}
        />
        <div
          className="absolute left-0 top-0 size-full opacity-60"
          style={{
            background: 'linear-gradient(135.08deg, rgba(255, 255, 255, 0.6) -83%, rgba(0, 0, 0, 0) 118.53%)',
            filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
          }}
        />
      </div>
      {!noLogo && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <KyberLogo width="94px" height="auto" />
        </div>
      )}
    </div>
  )
}

export default CardBackground
