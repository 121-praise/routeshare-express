import { Link } from "react-router-dom";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Package, Bike, ChevronRight, ShieldCheck } from "lucide-react";

const RoleSelect = () => {
  const roles = [
    {
      to: "/auth/signup?role=customer",
      title: "I'm sending packages",
      desc: "Browse routes, join one, and track your delivery.",
      icon: Package,
      tag: "Customer",
    },
    {
      to: "/auth/signup?role=rider",
      title: "I'm a rider",
      desc: "Create routes and earn from shared deliveries.",
      icon: Bike,
      tag: "Rider",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-secondary/40">
      <div className="app-shell flex flex-col">
        <ScreenHeader title="Choose your role" back />
        <div className="screen-pad pt-4 flex-1 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            You can always switch later in settings.
          </p>

          {roles.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="group rounded-3xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-secondary grid place-items-center">
                  <r.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <span className="pill bg-secondary text-foreground/70">{r.tag}</span>
                  <h3 className="mt-2 font-semibold text-base">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}

          <Link
            to="/admin"
            className="mt-2 rounded-2xl border border-dashed border-border p-4 flex items-center gap-3 text-sm text-muted-foreground hover:bg-secondary/60 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Open admin dashboard (preview)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
