import { useState, useEffect } from 'react'

export type User = {
  id: number
  username: string
  displayName?: string
  email?: string
  role: 'user' | 'obrero' | 'admin'
  avatarUrl?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Stub: En producción, obtendría el usuario de /api/auth/me
    // Por ahora retorna null (usuario no autenticado)
  }, [])

  function logout() {
    setUser(null)
    // Stub: En producción, llamaría al servidor
  }

  return { user, logout, isLoading: false }
}
