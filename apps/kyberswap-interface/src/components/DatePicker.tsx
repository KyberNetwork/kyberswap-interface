import { useEffect, useState } from 'react'
import Picker from 'react-date-picker'

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

/**
 * The calendar is the control here, not the text field: the CSS collapses the input and shows the
 * calendar inline. `isOpen` therefore drives it rather than focus — the picker renders no calendar at
 * all until it has been opened, so leaving that to focus hides it the moment focus moves elsewhere.
 */
export default function DatePicker({ onChange, value }: { value: Date; onChange: (date: Date) => void }) {
  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  /**
   * Which month is on screen. The calendar keeps its own copy the moment the user pages through
   * months, and that copy then outranks `value` — so a date chosen elsewhere (a preset, say) would
   * change the selection while leaving the user looking at an unrelated month. Following `value`
   * here re-anchors the view on every change; paging within an unchanged `value` is untouched.
   */
  const valueTime = value.getTime()
  const [activeStartDate, setActiveStartDate] = useState(() => startOfMonth(value))
  useEffect(() => {
    setActiveStartDate(startOfMonth(new Date(valueTime)))
  }, [valueTime])

  return (
    <div className="ks-date-picker">
      <Picker
        isOpen
        calendarIcon={null}
        clearIcon={null}
        calendarProps={{
          className: 'custom-calendar',
          activeStartDate,
          onActiveStartDateChange: ({ activeStartDate: next }) => next && setActiveStartDate(next),
        }}
        className="custom-date-picker"
        value={value}
        closeCalendar={false}
        onChange={onChange as any}
        minDate={minDate}
      />
    </div>
  )
}
