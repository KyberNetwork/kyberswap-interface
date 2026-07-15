import Picker from 'react-date-picker'

export default function DatePicker({ onChange, value }: { value: Date; onChange: (date: Date) => void }) {
  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dateKey = `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`

  return (
    <div className="ks-date-picker">
      <Picker
        key={dateKey}
        calendarIcon={null}
        clearIcon={null}
        autoFocus
        calendarProps={{ className: 'custom-calendar' }}
        className="custom-date-picker"
        value={value}
        closeCalendar={false}
        onChange={onChange as any}
        minDate={minDate}
      />
    </div>
  )
}
