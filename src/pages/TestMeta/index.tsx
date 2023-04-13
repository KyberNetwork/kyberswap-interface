import { Helmet } from 'react-helmet'

export default function TestMeta() {
  return (
    <>
      <Helmet>
        <meta
          property="og:image"
          content="https://res.cloudinary.com/practicaldev/image/fetch/s--m3NhTjlt--/c_imagga_scale,f_auto,fl_progressive,h_420,q_auto,w_1000/https://dev-to-uploads.s3.amazonaws.com/i/ex55rcnso95kwnf87tqv.jpg"
        />
      </Helmet>
    </>
  )
}
