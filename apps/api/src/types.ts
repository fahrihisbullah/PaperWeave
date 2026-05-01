export type AppUser = {
  id: string
  email: string
  name: string | null
}

export type AppEnv = {
  Variables: {
    requestId: string
    user: AppUser | null
  }
}
