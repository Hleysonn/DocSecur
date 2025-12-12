import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../http/api'

type User = {
  id: string
  role: 'USER' | 'MANAGER' | 'ADMIN'
}

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
}

type AuthContextValue = {
  user: User | null
  login: (params: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  accessToken: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = localStorage.getItem('auth')
    return stored ? JSON.parse(stored) : { user: null, accessToken: null, refreshToken: null }
  })

  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(state))
  }, [state])

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const res = await api.post('/auth/login', { email, password })
      setState({
        user: { id: res.userId, role: res.role },
        accessToken: res.accessToken,
        refreshToken: res.refreshToken
      })
      navigate('/')
    },
    [navigate]
  )

  const logout = useCallback(async () => {
    if (state.refreshToken) {
      await api.post('/auth/logout', { refreshToken: state.refreshToken }).catch(() => {})
    }
    setState({ user: null, accessToken: null, refreshToken: null })
    navigate('/login')
  }, [state.refreshToken, navigate])

  const value = useMemo(
    () => ({
      user: state.user,
      login,
      logout,
      isAuthenticated: Boolean(state.user),
      accessToken: state.accessToken
    }),
    [state.user, state.accessToken, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}

