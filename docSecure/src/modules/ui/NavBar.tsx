import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useState } from 'react'



export function NavBar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
 

  const links = [
    { to: '/', label: 'Dashboard', protected: true },
    { to: '/documents', label: 'Documents', protected: true },
    { to: '/profile', label: 'Profil', protected: true },
    { to: '/admin', label: 'Admin', protected: true, roles: ['ADMIN'] },
  
  ]

  const visibleLinks = links
    .filter((link) => !link.protected || isAuthenticated)
    .filter((link) => !link.roles || link.roles.includes(user?.role ?? ''))
  

  return (
    <header className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-blue-600/20 px-2 py-1 text-sm font-semibold text-blue-200">
            SD
          </div>
          <div className='flex items-center'>
          <p className='text-lg font-bold text-slate-300'>Doc
            <span className='text-lg font-bold text-amber-700/80'>Secure</span>
          </p>
          </div>
          {/* <span className="text-sm text-slate-300">SecureDocs</span> */}
        </div>
        <button
          className="sm:hidden rounded-md border border-slate-700 px-2 py-1 text-slate-100"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
        <div className="hidden sm:flex items-center gap-3 text-sm">
          <NavLinks visibleLinks={visibleLinks} pathname={pathname} />
          <AuthButtons
            isAuthenticated={isAuthenticated}
            userRole={user?.role}
            userName={user?.name}
            logout={logout}
          />
        </div>
      </div>
      {open && (
        <div className="mt-3 flex flex-col gap-3 sm:hidden text-sm ">
          <NavLinks visibleLinks={visibleLinks} pathname={pathname} onNavigate={() => setOpen(false)} />
          <AuthButtons
            isAuthenticated={isAuthenticated}
            userRole={user?.role}
            userName={user?.name}
            logout={() => {
              logout()
              setOpen(false)
            }}
          />
        </div>
      )}
    </header>
  )
}

function NavLinks({
  visibleLinks,
  pathname,
  onNavigate
}: {
  visibleLinks: Array<{ to: string; label: string }>
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {visibleLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className={`rounded-lg px-3 py-1 ${
            pathname === link.to ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

function AuthButtons({
  isAuthenticated,
  userRole,
  userName,
  logout
}: {
  isAuthenticated: boolean
  userRole?: string
  userName?: string
  logout: () => void | Promise<void>
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 text-sm">
      {isAuthenticated && userRole ? (
        <>
          <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-200">
            {userName ?? 'Utilisateur'}
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-3 py-1 text-slate-100 hover:border-slate-500"
          >
            Déconnexion
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="rounded-lg border border-slate-700 px-3 py-1 font-semibold text-slate-100 hover:border-slate-500"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-500"
          >
            Inscription
          </Link>
        </>
      )}
    </div>
  )
}

