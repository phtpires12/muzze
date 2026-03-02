import { Home, FileText, List, BarChart3 } from "lucide-react";
import { NavLink } from "./NavLink";
import muzzeLogo from "@/assets/muzze-logo.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Roteiros", href: "/scripts", icon: FileText },
  { name: "Shot Lists", href: "/shot-lists", icon: List },
  { name: "Estatísticas", href: "/stats", icon: BarChart3 },
];

export const Sidebar = () => {
  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <img 
            src={muzzeLogo} 
            alt="Muzze Logo" 
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            Muzze
          </h1>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-3 py-2 bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs font-medium text-muted-foreground">Dica do dia</p>
          <p className="text-sm mt-1 text-foreground">
            Consistência é a chave para o sucesso!
          </p>
        </div>
      </div>
    </div>
  );
};
