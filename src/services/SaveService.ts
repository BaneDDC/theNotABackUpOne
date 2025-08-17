import { supabase } from '../config/supabase'
import { AuthService } from './AuthService'

export class SaveService {
  private static instance: SaveService
  private authService: AuthService

  private constructor() {
    this.authService = AuthService.getInstance()
  }

  static getInstance(): SaveService {
    if (!SaveService.instance) {
      SaveService.instance = new SaveService()
    }
    return SaveService.instance
  }

  async saveGame(saveData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.authService.getUserId()
      if (!userId) {
        return { success: false, error: 'User not authenticated' }
      }

      // Check if save already exists for this user
      const { data: existingSave } = await supabase
        .from('game_saves')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existingSave) {
        // Update existing save
        const { error } = await supabase
          .from('game_saves')
          .update({
            save_data: saveData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (error) {
          return { success: false, error: error.message }
        }
      } else {
        // Create new save
        const { error } = await supabase
          .from('game_saves')
          .insert([
            {
              user_id: userId,
              save_data: saveData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])

        if (error) {
          return { success: false, error: error.message }
        }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Save failed' }
    }
  }

  async loadGame(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const userId = await this.authService.getUserId()
      if (!userId) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data, error } = await supabase
        .from('game_saves')
        .select('save_data')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No save found
          return { success: false, error: 'No save data found' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: data.save_data }
    } catch (error) {
      return { success: false, error: 'Load failed' }
    }
  }

  async hasSaveData(): Promise<boolean> {
    try {
      const userId = await this.authService.getUserId()
      if (!userId) return false

      const { data } = await supabase
        .from('game_saves')
        .select('id')
        .eq('user_id', userId)
        .single()

      return !!data
    } catch (error) {
      return false
    }
  }

  async deleteSave(): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.authService.getUserId()
      if (!userId) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await supabase
        .from('game_saves')
        .delete()
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Delete failed' }
    }
  }
}
