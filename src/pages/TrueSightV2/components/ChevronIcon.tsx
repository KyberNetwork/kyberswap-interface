const ChevronIcon = ({ color, rotate }: { color: string; rotate: string }) => {
  return (
    <svg fill={color} height="14px" width="14px" viewBox="0 0 24 24" style={{ rotate }}>
      <path d="M18.0566 8H5.94336C5.10459 8 4.68455 9.02183 5.27763 9.61943L11.3343 15.7222C11.7019 16.0926 12.2981 16.0926 12.6657 15.7222L18.7223 9.61943C19.3155 9.02183 18.8954 8 18.0566 8Z" />
    </svg>
  )
}

export default ChevronIcon
