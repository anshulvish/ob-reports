import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Search,
  GitBranch,
  Home,
  Settings
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
} from '../ui/sidebar';
import { ThemeToggle } from '../ui/theme-toggle';


interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const menuItems = [
  { text: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/', disabled: false },
  { text: 'System Diagnostics', icon: <BarChart3 className="h-5 w-5" />, path: '/diagnostics', disabled: false },
  { text: 'User Journeys', icon: <Search className="h-5 w-5" />, path: '/user-journeys', disabled: false },
  { text: 'Screen Flow', icon: <GitBranch className="h-5 w-5" />, path: '/screen-flow', disabled: false },
];

export const Layout: React.FC<LayoutProps> = ({ children, title = 'Aya Healthcare Analytics' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <h2 className="text-lg font-bold">📊 Aya Onboarding</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav>
            {menuItems.map((item) => (
              <SidebarNavItem
                key={item.text}
                isActive={location.pathname === item.path}
                disabled={item.disabled}
                onClick={() => !item.disabled && handleNavigate(item.path)}
                icon={item.icon}
              >
                {item.text}
              </SidebarNavItem>
            ))}
          </SidebarNav>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-primary text-primary-foreground shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{title}</h1>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};