import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useNavigate } from 'react-router-dom'
import { api, registerTokenRefreshed, setAccessToken } from '../http/api'

type User = {
  id: string
  role: 'USER' | 'MANAGER' | 'ADMIN'
}

type AuthState = {
  user: User | null
  accessToken: string | null
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
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return {
          user: parsed.user ?? null,
          accessToken: parsed.accessToken ?? null
        }
      } catch {
        return { user: null, accessToken: null }
      }
    }
    return { user: null, accessToken: null }
  })

  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(state))
  }, [state])

  useEffect(() => {
    setAccessToken(state.accessToken)
  }, [state.accessToken])

  useEffect(() => {
    registerTokenRefreshed((token) => {
      setState((prev) => ({ ...prev, accessToken: token }))
    })
  }, [])

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const res = await api.post('/auth/login', { email, password })
      setState({
        user: { id: res.userId, role: res.role },
        accessToken: res.accessToken
      })
      navigate('/')
    },
    [navigate]
  )

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {}).catch(() => {})
    setState({ user: null, accessToken: null })
    navigate('/login')
  }, [navigate])

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

