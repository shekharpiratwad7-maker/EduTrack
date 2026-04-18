import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awvorymvzuworimeknmv.supabase.co',
  'sb_publishable_3SAoYn6ty7ZDFmiSewdQlQ_TB1dBfFI'
)

export default supabase