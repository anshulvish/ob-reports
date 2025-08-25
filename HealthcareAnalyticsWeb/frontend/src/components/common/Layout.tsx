import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  AccountTree as FlowIcon,
  Search as SearchIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
});

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', disabled: false },
  { text: 'System Diagnostics', icon: <AnalyticsIcon />, path: '/diagnostics', disabled: false },
  { text: 'User Journeys', icon: <SearchIcon />, path: '/user-journeys', disabled: false },
  { text: 'Screen Flow', icon: <FlowIcon />, path: '/screen-flow', disabled: false },
];

export const Layout: React.FC<LayoutProps> = ({ children, title = 'Aya Healthcare Analytics' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{ 
            width: `calc(100% - ${drawerWidth}px)`, 
            ml: `${drawerWidth}px`,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              {title}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Toolbar>
            <Typography variant="h6" noWrap sx={{ color: 'white', fontWeight: 'bold' }}>
              🏥 Aya Healthcare
            </Typography>
          </Toolbar>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  disabled={item.disabled}
                  onClick={() => !item.disabled && handleNavigate(item.path)}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                      },
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'white' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
            minHeight: '100vh',
          }}
        >
          <Toolbar />
          <Container maxWidth="xl">
            {children}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};