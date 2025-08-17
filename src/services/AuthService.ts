import { supabase } from '../config/supabase'

export class AuthService {
  private static instance: AuthService
  private currentUser: any = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async registerUser(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { success: false, error: 'Username already exists' }
      }

      // Create user with email (using username@game.local as email)
      const email = `${username}@game.local`
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: authData.user?.id,
            username: username,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }
        ])

      if (profileError) {
        return { success: false, error: profileError.message }
      }

      this.currentUser = authData.user
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Registration failed' }
    }
  }

  async loginUser(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const email = `${username}@game.local`
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Update last login
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user?.id)

      this.currentUser = data.user
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Login failed' }
    }
  }

  async logoutUser(): Promise<void> {
    await supabase.auth.signOut()
    this.currentUser = null
  }

  async getCurrentUser(): Promise<any> {
    if (this.currentUser) {
      return this.currentUser
    }

    const { data: { user } } = await supabase.auth.getUser()
    this.currentUser = user
    return user
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return !!user
  }

  async getUserId(): Promise<string | null> {
    const user = await this.getCurrentUser()
    return user?.id || null
  }

  async getUsername(): Promise<string | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    const { data } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    return data?.username || null
  }
}
