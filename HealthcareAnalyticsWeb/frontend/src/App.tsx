import React from 'react';
import { Layout } from './components/common/Layout';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <Layout title="Aya Healthcare Analytics Dashboard">
      <Dashboard />
    </Layout>
  );
}

export default App;