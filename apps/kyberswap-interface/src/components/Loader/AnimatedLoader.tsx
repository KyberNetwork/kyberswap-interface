import LoadingLogo from 'assets/svg/kyber/kyber_logo.svg'

function AnimateLoader({ size = 160 }: { size?: number }) {
  const dotShadow = `0 ${size >= 200 ? '3px' : '2px'} 0 0 var(--ks-primary)`

  return (
    <div className="inline-block overflow-hidden bg-transparent" style={{ width: size, height: size }}>
      <div
        className="relative flex size-full items-center justify-center [backface-visibility:hidden]
                   [transform-origin:0_0] [transform:translateZ(0)_scale(1)] [&>div]:absolute
                   [&>div]:box-content [&>div]:animate-spin [&>div]:rounded-full"
        style={
          {
            '--dot-size': `${size * 0.8}px`,
            '--dot-offset': `${size * 0.1}px`,
            '--dot-origin-x': `${size * 0.4}px`,
            '--dot-origin-y': `${size * 0.41}px`,
            '--dot-shadow': dotShadow,
          } as React.CSSProperties
        }
      >
        <div
          style={{
            width: 'var(--dot-size)',
            height: 'var(--dot-size)',
            top: 'var(--dot-offset)',
            left: 'var(--dot-offset)',
            boxShadow: 'var(--dot-shadow)',
            transformOrigin: 'var(--dot-origin-x) var(--dot-origin-y)',
          }}
        />
        <div
          style={{
            width: 'var(--dot-size)',
            height: 'var(--dot-size)',
            top: 'var(--dot-offset)',
            left: 'var(--dot-offset)',
            boxShadow: 'var(--dot-shadow)',
            transformOrigin: 'var(--dot-origin-x) var(--dot-origin-y)',
          }}
        />
        <img src={LoadingLogo} width="30%" alt="" />
      </div>
    </div>
  )
}

export default AnimateLoader
