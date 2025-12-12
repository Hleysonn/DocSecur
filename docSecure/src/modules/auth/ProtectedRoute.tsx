import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

type Props = {
  children: React.ReactNode
  roles?: Array<'USER' | 'MANAGER' | 'ADMIN'>
}

export function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}


