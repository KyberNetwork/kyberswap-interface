import { Head, Html, Main, NextScript } from 'next/document'

// Read the persisted theme synchronously before React hydrates so returning
// users with `light` stored don't see a dark flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem('demoAppTheme');if(t==='dark'||(!t))document.documentElement.classList.add('dark')}catch(e){}})()`

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
