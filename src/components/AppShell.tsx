import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const AppShell = ({ children, hideNav }: AppShellProps) => {
  return (
    <div className="min-h-screen w-full bg-secondary/40">
      <div className="app-shell flex flex-col">
        <main className="flex-1 flex flex-col">{children}</main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
};
