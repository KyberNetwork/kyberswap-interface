import UnknownToken from "../assets/unknown-token.svg?url";
import { cn } from "@kyber/utils/tailwind-helpers";

const TokenLogo = ({
  src,
  alt,
  className,
  size = 16,
  style,
}: {
  src?: string;
  alt?: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}) => (
  <img
    src={src || UnknownToken}
    style={style}
    className={cn("rounded-full", className)}
    width={size}
    height={size}
    alt={alt || ""}
    onError={({ currentTarget }) => {
      currentTarget.onerror = null; // prevents looping
      currentTarget.src = UnknownToken;
    }}
  />
);

export default TokenLogo;
