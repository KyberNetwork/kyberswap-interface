import { ReactNode } from "react";

export function InfoBox({
  message,
  icon,
}: {
  message?: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="h-full justify-center">
      {icon}
      {message && (
        <div className="font-bold text-xl text-center pt-1 text-subText">
          {message}
        </div>
      )}
    </div>
  );
}
