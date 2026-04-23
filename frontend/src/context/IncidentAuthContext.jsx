import { createContext, useContext, useMemo, useEffect } from 'react'
import { setIncidentUser } from '../api/ticketApi'

const IncidentAuthContext = createContext(null)

/**
 * Wraps the main app's user and exposes the same shape
 * that all incident components expect (isAdmin, isTechnician, etc.)
 */
export function IncidentAuthProvider({ user, children }) {
  const value = useMemo(() => {
    if (!user) return { user: null, isAdmin: false, isTechnician: false, isUser: true, loading: false }

    // Map main-app roles (ROLE_ADMIN) → incident roles (ADMIN)
    const roles = user.roles || []
    const isAdmin      = roles.includes('ROLE_ADMIN')
    const isTechnician = roles.includes('ROLE_TECHNICIAN')
    const isUser       = !isAdmin && !isTechnician

    const incidentRole = isAdmin ? 'ADMIN' : isTechnician ? 'TECHNICIAN' : 'USER'

    const incidentUser = {
      id:       user.id,
      fullName: user.name || user.username || 'User',
      email:    user.email || '',
      role:     incidentRole,
    }

    return { user: incidentUser, isAdmin, isTechnician, isUser, loading: false }
  }, [user])

  useEffect(() => {
    setIncidentUser(value.user)
  }, [value.user])

  return (
    <IncidentAuthContext.Provider value={value}>
      {children}
    </IncidentAuthContext.Provider>
  )
}

export const useAuth = () => useContext(IncidentAuthContext)
