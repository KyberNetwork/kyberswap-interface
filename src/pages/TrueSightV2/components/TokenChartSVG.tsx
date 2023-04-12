export default function TokenChart({ isBearish }: { isBearish?: boolean }) {
  return (
    <>
      {isBearish ? (
        <svg width="142" height="41" viewBox="0 0 142 41" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M141 41V26.4915L117.667 17.678L94.3333 20.1186L71 6.83051L47.6667 8.59322L24.3333 6.01695L1 1V41H141Z"
            fill="url(#paint0_linear_4401_34238)"
          />
          <path
            d="M141 26.4386L117.655 17.6146L94.2384 19.9995L70.9644 6.78627L47.6192 8.3914L24.274 6.04543L1 1"
            stroke="#FF537B"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="1.5" cy="1.5" r="1.5" transform="matrix(-1 0 0 1 119 16)" fill="#FF537B" />
          <circle cx="1.5" cy="1.5" r="1.5" transform="matrix(-1 0 0 1 142 25)" fill="#FF537B" />
          <circle cx="1.5" cy="1.5" r="1.5" transform="matrix(-1 0 0 1 96 18)" fill="#FF537B" />
          <circle cx="1.5" cy="1.5" r="1.5" transform="matrix(-1 0 0 1 73 6)" fill="#FF537B" />
          <circle cx="1.5" cy="1.5" r="1.5" transform="matrix(-1 0 0 1 49 7)" fill="#FF537B" />
          <circle cx="1.5" cy="1.5" r="1.5" transform="matrix(-1 0 0 1 27 5)" fill="#FF537B" />
          <circle cx="1.5" cy="1.5" r="1.5" transform="matrix(-1 0 0 1 3 0)" fill="#FF537B" />
          <defs>
            <linearGradient id="paint0_linear_4401_34238" x1="71" y1="1" x2="71" y2="41" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF537B" stopOpacity="0.4" />
              <stop offset="1" stopColor="#FF537B" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      ) : (
        <svg width="142" height="41" viewBox="0 0 142 41" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1 41V26.4915L24.3333 17.678L47.6667 20.1186L71 6.83051L94.3333 8.59322L117.667 6.01695L141 1V41H1Z"
            fill="url(#paint0_linear_4105_68065)"
          />
          <path
            d="M1 26.4386L24.3452 17.6146L47.7616 19.9995L71.0356 6.78627L94.3808 8.3914L117.726 6.04543L141 1"
            stroke="#31CB9E"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24.5" cy="17.5" r="1.5" fill="#31CB9E" />
          <circle cx="1.5" cy="26.5" r="1.5" fill="#31CB9E" />
          <circle cx="47.5" cy="19.5" r="1.5" fill="#31CB9E" />
          <circle cx="70.5" cy="7.5" r="1.5" fill="#31CB9E" />
          <circle cx="94.5" cy="8.5" r="1.5" fill="#31CB9E" />
          <circle cx="116.5" cy="6.5" r="1.5" fill="#31CB9E" />
          <circle cx="140.5" cy="1.5" r="1.5" fill="#31CB9E" />
          <defs>
            <linearGradient id="paint0_linear_4105_68065" x1="71" y1="1" x2="71" y2="41" gradientUnits="userSpaceOnUse">
              <stop stopColor="#31CB9E" stopOpacity="0.4" />
              <stop offset="1" stopColor="#31CB9E" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      )}
    </>
  )
}
