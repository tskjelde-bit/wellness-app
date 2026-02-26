import { IPhoneFrame } from "@/components/iphone-frame";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IPhoneFrame>{children}</IPhoneFrame>;
}
