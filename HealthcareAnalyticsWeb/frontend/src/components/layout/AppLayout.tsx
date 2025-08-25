import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Settings,
  Search,
  GitBranch,
  Activity
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarNav,
  SidebarNavItem,
} from '../ui/sidebar';
import { ThemeToggle } from '../ui/theme-toggle';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const menuItems = [
  { text: 'Dashboard', icon: <Home />, path: '/' },
  { text: 'System Diagnostics', icon: <Settings />, path: '/diagnostics' },
  { text: 'User Journeys', icon: <Search />, path: '/user-journeys' },
  { text: 'Screen Flow', icon: <GitBranch />, path: '/screen-flow' },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title = 'Healthcare Analytics' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Professional Sidebar */}
      <Sidebar className="border-r border-border">
        <SidebarHeader className="border-b border-border">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Healthcare Analytics</span>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarNav>
            {menuItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                isActive={location.pathname === item.path}
                icon={item.icon}
                onClick={() => handleNavigate(item.path)}
              >
                {item.text}
              </SidebarNavItem>
            ))}
          </SidebarNav>
        </SidebarContent>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-accent"></div>
              <span className="text-sm text-muted-foreground">Live Data</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};