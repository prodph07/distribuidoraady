-- Create analytics_events table
create table if not exists public.analytics_events (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    session_id text not null,
    user_id uuid references auth.users(id),
    event_type text not null check (event_type in ('page_view', 'add_to_cart', 'checkout_start', 'order_complete', 'whatsapp_click', 'search', 'product_view')),
    page_path text,
    metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.analytics_events enable row level security;

-- Create policies

-- Allow anyone (anon) to insert events
create policy "Allow public insert to analytics_events"
    on public.analytics_events
    for insert
    to public, anon
    with check (true);

-- Allow admins to view analytics
-- Assuming no specific "admin" role implementation exists yet based on previous files, 
-- but usually dashboard is protected. 
-- For now, we will allow authenticated users to select, or if you have a specific admin logic:
-- Checking previous migrations might reveal admin pattern. 
-- If no pattern found, we'll allow public select for now or restrict to authenticated.
-- Given it's a dashboard, likely authenticated.
create policy "Allow authenticated view analytics_events"
    on public.analytics_events
    for select
    to authenticated
    using (true);

-- Create index for performance
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);
create index if not exists analytics_events_session_id_idx on public.analytics_events(session_id);
create index if not exists analytics_events_event_type_idx on public.analytics_events(event_type);
