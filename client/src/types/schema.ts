export const ROLES = {
  user: 'user',
  obrero: 'obrero',
  admin: 'admin',
} as const

export interface TeamMember {
  id: number
  name: string
  role: string
  description?: string
  verse?: string
  initials?: string
}
