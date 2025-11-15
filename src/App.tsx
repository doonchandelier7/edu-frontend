import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { LiveMarketProvider } from './contexts/LiveMarketContext';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TradingPage from './pages/Trading/TradingPage';
import CryptoPage from './pages/Trading/CryptoPage';
import StockPage from './pages/Trading/StockPage';
import LearnPage from './pages/Learning/LearnPage';
import CoursesPage from './pages/Learning/CoursesPage';
import CourseDetailPage from './pages/Learning/CourseDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PortfolioPage from './pages/PortfolioPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoutes from './pages/Admin/AdminRoutes';
import AuthDebug from './components/AuthDebug';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LiveMarketProvider>
          <Router>
          <div className="min-h-screen">
            <AuthDebug />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminRoutes />} />
              
              {/* Protected Routes */}
              <Route path="/app" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                
                {/* Trading Routes */}
                <Route path="trading" element={
                  <ProtectedRoute>
                    <TradingPage />
                  </ProtectedRoute>
                } />
                <Route path="trading/crypto" element={
                  <ProtectedRoute>
                    <CryptoPage />
                  </ProtectedRoute>
                } />
                <Route path="trading/stock" element={
                  <ProtectedRoute>
                    <StockPage />
                  </ProtectedRoute>
                } />
                
                {/* Learning Routes */}
                <Route path="learn" element={
                  <ProtectedRoute>
                    <LearnPage />
                  </ProtectedRoute>
                } />
                <Route path="courses" element={
                  <ProtectedRoute>
                    <CoursesPage />
                  </ProtectedRoute>
                } />
                <Route path="courses/:id" element={
                  <ProtectedRoute>
                    <CourseDetailPage />
                  </ProtectedRoute>
                } />
                
                {/* Other Routes */}
                <Route path="portfolio" element={
                  <ProtectedRoute>
                    <PortfolioPage />
                  </ProtectedRoute>
                } />
                <Route path="leaderboard" element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Legacy routes - redirect to /app routes with Layout */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/trading" element={
                <ProtectedRoute>
                  <Layout>
                    <TradingPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/trading/crypto" element={
                <ProtectedRoute>
                  <Layout>
                    <CryptoPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/trading/stock" element={
                <ProtectedRoute>
                  <Layout>
                    <StockPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/learn" element={
                <ProtectedRoute>
                  <Layout>
                    <LearnPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/courses" element={
                <ProtectedRoute>
                  <Layout>
                    <CoursesPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/courses/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <CourseDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/portfolio" element={
                <ProtectedRoute>
                  <Layout>
                    <PortfolioPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Layout>
                    <LeaderboardPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </Router>
        </LiveMarketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;