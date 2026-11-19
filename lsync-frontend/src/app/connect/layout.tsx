import { AuthGate } from "@/components/shell/AuthGate";

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
