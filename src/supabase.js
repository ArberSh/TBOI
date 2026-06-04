import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://zczeouminjzkrcxyrgwk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjemVvdW1pbmp6a3JjeHlyZ3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjUyNzYsImV4cCI6MjA5NTcwMTI3Nn0.Zf1uSUeMHR_9VQaml9p8NIOFr9OuM39gsPs5v4yRSno'
)