import { Home, FileText, BarChart3 } from "lucide-react";
import { NavLink } from "./NavLink";

const navigation = [
  { name: "Última criação", href: "/", icon: Home },
  { name: "Roteiros", href: "/scripts", icon: FileText },
  { name: "Estatísticas", href: "/stats", icon: BarChart3 },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around px-4 py-3">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground min-w-[80px]"
            activeClassName="text-primary"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
