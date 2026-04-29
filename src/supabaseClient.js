import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://odkompvyhkoupkxbbexd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka29tcHZ5aGtvdXBreGJiZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MzI3MzksImV4cCI6MjA5MzAwODczOX0.4hm41Vad4tAaMW_OHk8iLxuEqSJQAOXxbmdBUdg3Wv0'

export const supabase = createClient(supabaseUrl, supabaseKey)
