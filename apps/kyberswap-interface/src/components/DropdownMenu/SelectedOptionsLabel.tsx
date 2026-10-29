import { MenuOption } from 'components/DropdownMenu'
import { ItemIcon } from 'components/DropdownMenu/styles'

/**
 * The trigger of a multi-select filter: the marks of whatever is picked, then the one option's name
 * or a count of them. The "All …" entry carries no mark, so an unnarrowed filter reads as words
 * alone.
 */
const SelectedOptionsLabel = ({
  options,
  value,
  allLabel,
  manyLabel,
}: {
  options: MenuOption[]
  value: string
  allLabel: string
  /** Stands in for the names once more than one option is picked, e.g. `3 chains`. */
  manyLabel: (count: number) => string
}) => {
  const selectedValues = value.split(',').filter(Boolean)
  const selected = options.filter(option => option.value && selectedValues.includes(option.value))

  if (selected.length === 0) return <>{allLabel}</>

  // An option list without marks keeps the wording on its own rather than showing empty images.
  const marked = selected.filter(option => option.icon)

  return (
    <span className="flex items-center gap-1.5">
      {marked.length > 0 ? (
        <span className="flex">
          {marked.map((option, index) => (
            <ItemIcon key={option.value} src={option.icon} alt={option.label} style={{ marginLeft: index ? -8 : 0 }} />
          ))}
        </span>
      ) : null}
      {selected.length > 1 ? manyLabel(selected.length) : selected[0].label}
    </span>
  )
}

export default SelectedOptionsLabel
