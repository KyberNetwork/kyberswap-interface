import questionImg from "../assets/icons/question.svg?url";

export function Image({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      style={style}
      className={className}
      src={src}
      alt={alt}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null; // prevents looping
        currentTarget.src = questionImg;
      }}
    />
  );
}
