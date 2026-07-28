import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Role } from '@gig/shared';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { CompanyPage } from './pages/CompanyPage';
import { RiderPage } from './pages/RiderPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute roles={[Role.ADMIN]} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={[Role.COMPANY]} />}>
              <Route path="/company" element={<CompanyPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={[Role.RIDER]} />}>
              <Route path="/rider" element={<RiderPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
