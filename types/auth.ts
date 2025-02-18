export interface User {
  id: string
  email: string | null
  name?: string | null
  image?: string | null
}

export interface AuthState {
  user: User | null
  signOut: () => Promise<void>
}