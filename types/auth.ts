export interface User {
  id: string
  email?: string
  name?: string
  image?: string
}

export interface AuthState {
  user: User | null
  signOut: () => Promise<void>
}
