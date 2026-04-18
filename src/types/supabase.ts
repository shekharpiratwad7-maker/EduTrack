export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: 'admin' | 'teacher' | 'student' | 'parent'
          email: string | null
          phone: string | null
          dob: string | null
          city: string | null
          class_grade: string | null
          class_section: string | null
          roll_number: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'admin' | 'teacher' | 'student' | 'parent'
          email?: string | null
          phone?: string | null
          dob?: string | null
          city?: string | null
          class_grade?: string | null
          class_section?: string | null
          roll_number?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'admin' | 'teacher' | 'student' | 'parent'
          email?: string | null
          phone?: string | null
          dob?: string | null
          city?: string | null
          class_grade?: string | null
          class_section?: string | null
          roll_number?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      classes: {
        Row: {
          id: string
          grade: string
          section: string
          teacher_id: string | null
          room: string | null
          created_at: string
        }
        Insert: {
          grade: string
          section: string
          teacher_id?: string | null
          room?: string | null
        }
        Update: {
          grade?: string
          section?: string
          teacher_id?: string | null
          room?: string | null
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          class_id: string | null
          date: string
          subject: string | null
          status: 'present' | 'absent' | 'late'
          created_at: string
        }
        Insert: {
          student_id: string
          class_id?: string | null
          date: string
          subject?: string | null
          status?: 'present' | 'absent' | 'late'
        }
        Update: {
          student_id?: string
          class_id?: string | null
          date?: string
          subject?: string | null
          status?: 'present' | 'absent' | 'late'
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          class_id: string | null
          subject: string
          exam_type: string
          score: number | null
          max_score: number | null
          grade: string | null
          teacher_id: string | null
          created_at: string
        }
        Insert: {
          student_id: string
          class_id?: string | null
          subject: string
          exam_type: string
          score?: number | null
          max_score?: number | null
          grade?: string | null
          teacher_id?: string | null
        }
        Update: {
          student_id?: string
          class_id?: string | null
          subject?: string
          exam_type?: string
          score?: number | null
          max_score?: number | null
          grade?: string | null
          teacher_id?: string | null
        }
      }
      leave_applications: {
        Row: {
          id: string
          student_id: string
          type: string | null
          start_date: string
          end_date: string
          reason: string | null
          status: 'pending' | 'approved' | 'rejected'
          documents: string[]
          teacher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          student_id: string
          type?: string | null
          start_date: string
          end_date: string
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          documents?: string[]
          teacher_id?: string | null
        }
        Update: {
          student_id?: string
          type?: string | null
          start_date?: string
          end_date?: string
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          documents?: string[]
          teacher_id?: string | null
        }
      }
      assignments: {
        Row: {
          id: string
          class_id: string
          title: string
          subject: string
          description: string | null
          due_date: string
          teacher_id: string
          created_at: string
        }
        Insert: {
          class_id: string
          title: string
          subject: string
          description?: string | null
          due_date: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          title?: string
          subject?: string
          description?: string | null
          due_date?: string
          teacher_id?: string
        }
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          title: string
          message: string
          type: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          recipient_id: string
          title: string
          message: string
          type?: string | null
          read_at?: string | null
        }
        Update: {
          recipient_id?: string
          title?: string
          message?: string
          type?: string | null
          read_at?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          parent_id: string
          teacher_id: string | null
          subject: string | null
          category: string | null
          message: string
          created_at: string
        }
        Insert: {
          parent_id: string
          teacher_id?: string | null
          subject?: string | null
          category?: string | null
          message: string
        }
        Update: {
          parent_id?: string
          teacher_id?: string | null
          subject?: string | null
          category?: string | null
          message?: string
        }
      }
    }
  }
}

