import questionImg from "@/assets/svg/question.svg?url";
import { cn } from "@kyber/utils/tailwind-helpers";

export const Image = ({
  src,
  className,
}: {
  src: string | undefined;
  className?: string;
}) => {
  return (
    <img
      src={src || ""}
      alt=""
      className={cn("w-4 h-4", className)}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null; // prevents looping
        currentTarget.src = questionImg;
      }}
    />
  );
};
