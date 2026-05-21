import { ReactComponent as KyberLogo } from 'assets/svg/kyber/kyber_logo.svg'

type Props = {
  noLogo: boolean
}
const CardBackground: React.FC<Props> = ({ noLogo }) => {
  return (
    <div
      className="absolute left-0 top-0 size-full overflow-hidden rounded-[20px]"
      style={{
        boxShadow: 'inset 0px 1px 1px rgba(255, 255, 255, 0.15), inset -1px -1px 1px rgba(0, 0, 0, 0.08)',
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        mixBlendMode: 'overlay',
      }}
    >
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
      {!noLogo && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <KyberLogo width="94px" height="auto" />
        </div>
      )}
    </div>
  )
}

export default CardBackground
