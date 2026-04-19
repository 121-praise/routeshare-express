import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

export const ScreenHeader = ({ title, subtitle, back = true, right }: ScreenHeaderProps) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
      <div className="screen-pad flex items-center gap-3 h-14">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="-ml-2 p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
};
