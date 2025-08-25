import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';
import { UserJourneys } from './pages/UserJourneys';
import { ScreenFlow } from './pages/ScreenFlow';

function App() {
  return (
    <Router>
      <AppLayout title="Healthcare Analytics Dashboard">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/user-journeys" element={<UserJourneys />} />
          <Route path="/screen-flow" element={<ScreenFlow />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;