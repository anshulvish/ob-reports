import React from 'react';
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
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Engagement Analysis', icon: <AnalyticsIcon />, path: '/engagement' },
  { text: 'User Journeys', icon: <SearchIcon />, path: '/journeys' },
  { text: 'Screen Flow', icon: <FlowIcon />, path: '/flow' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export const Layout: React.FC<LayoutProps> = ({ children, title = 'Aya Healthcare Analytics' }) => {
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
              🏥 Aya Healthcare Analytics
            </Typography>
          </Toolbar>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
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