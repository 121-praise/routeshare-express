import { NavLink, useLocation } from "react-router-dom";
import { Home, Package, MapPin, User, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

const customerItems: Item[] = [
  { to: "/customer", label: "Home", icon: Home },
  { to: "/customer/history", label: "Orders", icon: Package },
  { to: "/customer/profile", label: "Profile", icon: User },
];

const riderItems: Item[] = [
  { to: "/rider", label: "Trips", icon: MapPin },
  { to: "/rider/earnings", label: "Earnings", icon: Package },
  { to: "/rider/profile", label: "Profile", icon: User },
];

const moverItems: Item[] = [
  { to: "/mover", label: "Jobs", icon: Truck },
  { to: "/mover/earnings", label: "Earnings", icon: Package },
  { to: "/mover/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  const isRider = pathname.startsWith("/rider");
  const isMover = pathname.startsWith("/mover");
  const items = isMover ? moverItems : isRider ? riderItems : customerItems;

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="grid grid-cols-3">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
