import sprite from 'assets/svg/sprite.svg'

export default function Icon({ id, size }: { id: string; size?: number | string }) {
  return (
    <div>
      <svg width={size || 24} height={size || 24} display="block">
        <use href={`${sprite}#${id}`} width={size || 24} height={size || 24} />
      </svg>
    </div>
  )
}
