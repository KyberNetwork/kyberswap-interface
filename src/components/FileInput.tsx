import { ChangeEvent, ReactNode, useRef } from 'react'

export default function FileInput({
  onChange,
  children,
  onImgChange,
  image,
}: {
  image?: boolean
  children: ReactNode
  onImgChange?: (imgUrl: string, file: File) => void
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const onClick = () => fileRef.current?.click()
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    if (e.target.files && image) {
      const selectedFile = e.target.files[0]
      const reader = new FileReader()
      reader.onload = function (event) {
        event.target && onImgChange?.(event.target.result as string, selectedFile)
      }
      reader.readAsDataURL(selectedFile)
    }
  }
  return (
    <>
      <div onClick={onClick} style={{ cursor: 'pointer', width: 'fit-content' }}>
        {children}
      </div>
      <input
        ref={fileRef}
        type="file"
        onChange={handleFileChange}
        style={{ visibility: 'hidden' }}
        accept={image ? 'image/*' : undefined}
      />
    </>
  )
}
