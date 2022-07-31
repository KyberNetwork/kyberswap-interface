import React from 'react'

const NotificationIcon = ({ size, color }: { size?: number | string; color?: string }) => {
  return (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.82 2.5 11.99 2.5C11.16 2.5 10.5 3.17 10.5 4V4.68C7.62998 5.36 5.99998 7.92 5.99998 11V16L4.69998 17.29C4.06998 17.92 4.50998 19 5.39998 19H18.57C19.46 19 19.91 17.92 19.28 17.29L18 16ZM11.99 22C13.09 22 13.99 21.1 13.99 20H9.98998C9.98998 21.1 10.88 22 11.99 22ZM6.76998 4.73C7.18998 4.35 7.19998 3.7 6.79998 3.3C6.41998 2.92 5.79998 2.91 5.40998 3.28C3.69998 4.84 2.51998 6.96 2.13998 9.34C2.04998 9.95 2.51998 10.5 3.13998 10.5C3.61998 10.5 4.03998 10.15 4.11998 9.67C4.41998 7.73 5.37998 6 6.76998 4.73ZM18.6 3.28C18.2 2.91 17.58 2.92 17.2 3.3C16.8 3.7 16.82 4.34 17.23 4.72C18.61 5.99 19.58 7.72 19.88 9.66C19.95 10.14 20.37 10.49 20.86 10.49C21.47 10.49 21.95 9.94 21.85 9.33C21.47 6.96 20.3 4.85 18.6 3.28Z"
        fill={color || 'currentColor'}
      />
    </svg>
  )
}

export default NotificationIcon
