import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./routes/Login.jsx";
import ProviderHome from "./routes/ProviderHome.jsx";
import ScanPage from "./routes/ScanPage.jsx";
import ToiletDetailProvider from "./routes/ToiletDetailProvider.jsx";
import AdminDashboard from "./routes/AdminDashboard.jsx";
import AdminToiletDetail from "./routes/AdminToiletDetail.jsx";
import ReportsPage from "./routes/ReportsPage.jsx";
import NotFound from "./pages/NotFound";
import AdminManageProviders from "./routes/AdminManageProviders.jsx";
import AdminManageToilets from "./routes/AdminManageToilets.jsx";
import Register from "./routes/Register.jsx";

// Simple error boundary for Router issues
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Router Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          background: '#f9fafb',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '2rem' }}>
            ⚠️ Application Error
          </h1>
          <p style={{ marginBottom: '1rem', textAlign: 'center', color: '#6b7280' }}>
            There was an issue loading the application. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '0.75rem 1.5rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/provider" element={<ProviderHome />} />
        <Route path="/provider/scan" element={<ScanPage />} />
        <Route path="/provider/scan/:toiletId" element={<ToiletDetailProvider />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/toilet/:toiletId" element={<AdminToiletDetail />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/manage-providers" element={<AdminManageProviders />} />
        <Route path="/admin/manage-toilets" element={<AdminManageToilets />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;