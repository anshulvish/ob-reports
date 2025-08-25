import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/theme-provider';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';
import { UserJourneys } from './pages/UserJourneys';
import { ScreenFlow } from './pages/ScreenFlow';
import { configureChartDefaults } from './utils/chartDefaults';

function App() {
  useEffect(() => {
    // Configure Chart.js defaults after DOM is ready
    configureChartDefaults();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <AppLayout title="Onboarding Analytics Dashboard">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/diagnostics" element={<Diagnostics />} />
            <Route path="/user-journeys" element={<UserJourneys />} />
            <Route path="/screen-flow" element={<ScreenFlow />} />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;