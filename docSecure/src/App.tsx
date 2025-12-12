import { Route, Routes } from 'react-router-dom'
import { NavBar } from './modules/ui/NavBar.tsx'
import { LoginPage } from './modules/auth/LoginPage.tsx'
import { RegisterPage } from './modules/auth/RegisterPage.tsx'
import { DashboardPage } from './modules/dashboard/DashboardPage.tsx'
import { DocumentsPage } from './modules/documents/DocumentsPage.tsx'
import { AdminPage } from './modules/admin/AdminPage.tsx'
import { Error404 } from './modules/ui/Error404.tsx'
import { ProtectedRoute } from './modules/auth/ProtectedRoute.tsx'
import { ProfilePage } from './modules/profile/ProfilePage.tsx'
import { SplashScreen } from './modules/ui/SplashScreen.tsx'
import { useEffect, useState } from 'react'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <div className={`mx-auto flex max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 ${showSplash ? 'opacity-60 blur-sm pointer-events-none' : ''}`}>
        <NavBar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Error404 />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
