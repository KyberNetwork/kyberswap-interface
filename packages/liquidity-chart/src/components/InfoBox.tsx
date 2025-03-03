import type { ReactNode } from "react";

export default function InfoBox({
  message,
  icon = null,
}: {
  message?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="h-full justify-center">
      {icon}
      {message ? (
        <div className="font-bold text-xl text-center pt-1 text-subText">
          {message}
        </div>
      ) : null}
    </div>
  );
}
