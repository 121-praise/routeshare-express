import { Link } from "react-router-dom";
import { Bike, ShieldCheck, Zap } from "lucide-react";

const Splash = () => {
  return (
    <div className="min-h-screen w-full bg-secondary/40">
      <div className="app-shell flex flex-col bg-gradient-hero text-primary-foreground">
        <div className="screen-pad pt-14 flex-1 flex flex-col">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-accent grid place-items-center">
              <Bike className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">RouteShare</span>
          </div>

          <div className="mt-16 animate-slide-up">
            <p className="text-accent text-sm font-semibold uppercase tracking-widest">Lagos · Mobile-first</p>
            <h1 className="h-display text-5xl mt-3 leading-[1.05]">
              Share the route. <br />
              <span className="text-accent">Split the cost.</span>
            </h1>
            <p className="mt-5 text-white/70 text-[15px] leading-relaxed max-w-[320px]">
              Send packages along rider routes already going your way. Pay in-app, get a 4-digit OTP, track in real time.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "Instant" },
              { icon: Bike, label: "Shared rides" },
              { icon: ShieldCheck, label: "OTP secured" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                <Icon className="h-5 w-5 text-accent" />
                <p className="mt-2 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto pb-10 pt-10 space-y-3">
            <Link
              to="/role"
              className="block w-full text-center rounded-2xl bg-accent text-accent-foreground py-4 font-bold text-base shadow-glow"
            >
              Get started
            </Link>
            <Link to="/auth/login" className="block w-full text-center text-white/80 py-2 text-sm font-medium">
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
