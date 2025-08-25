import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';
import { UserJourneys } from './pages/UserJourneys';
import { ScreenFlow } from './pages/ScreenFlow';

function App() {
  return (
    <Router>
      <Layout title="Aya Healthcare Analytics Dashboard">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/user-journeys" element={<UserJourneys />} />
          <Route path="/screen-flow" element={<ScreenFlow />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;