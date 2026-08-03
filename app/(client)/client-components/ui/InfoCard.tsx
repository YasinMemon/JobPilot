import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function InfoCard({ title, children }: Props) {
  return (
    <div className="rounded-2xl border p-6">
      <h3 className="mb-6 text-lg font-semibold">{title}</h3>

      {children}
    </div>
  );
}
