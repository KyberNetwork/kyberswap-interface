import { ChangeEvent, ReactNode, useRef } from 'react'

export default function FileInput({
  onChange,
  children,
  onImgChange,
  image,
  disabled,
}: {
  image?: boolean
  children: ReactNode
  onImgChange?: (imgUrl: string, file: File) => void
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
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
      <div
        onClick={disabled ? undefined : onClick}
        style={{ cursor: disabled ? 'default' : 'pointer', width: 'fit-content' }}
      >
        {children}
      </div>
      <input
        ref={fileRef}
        type="file"
        onChange={handleFileChange}
        style={{ visibility: 'hidden', height: 0, width: 0 }}
        accept={image ? 'image/*' : undefined}
      />
    </>
  )
}
