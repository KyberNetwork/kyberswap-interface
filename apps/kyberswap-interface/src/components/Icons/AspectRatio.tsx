function AspectRatio({ size }: { size?: number }) {
  return (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_196_19307)">
        <path
          d="M18 12C17.45 12 17 12.45 17 13V15H15C14.45 15 14 15.45 14 16C14 16.55 14.45 17 15 17H18C18.55 17 19 16.55 19 16V13C19 12.45 18.55 12 18 12ZM7 9H9C9.55 9 10 8.55 10 8C10 7.45 9.55 7 9 7H6C5.45 7 5 7.45 5 8V11C5 11.55 5.45 12 6 12C6.55 12 7 11.55 7 11V9ZM21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM20 19.01H4C3.45 19.01 3 18.56 3 18.01V5.99C3 5.44 3.45 4.99 4 4.99H20C20.55 4.99 21 5.44 21 5.99V18.01C21 18.56 20.55 19.01 20 19.01Z"
          fill="currentcolor"
        />
      </g>
    </svg>
  )
}

export default AspectRatio
