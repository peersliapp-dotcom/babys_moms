-- Live Chat Assistant tables

-- Conversations (one per visitor/customer)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_id text,
  guest_name text,
  guest_email text,
  status text NOT NULL DEFAULT 'active',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status, last_message_at);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "chat_conv_select_own" ON public.chat_conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "chat_conv_insert_own" ON public.chat_conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_conv_update_own" ON public.chat_conversations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "chat_conv_delete_admin" ON public.chat_conversations FOR DELETE
  TO authenticated USING (public.is_admin());

-- Messages policies
CREATE POLICY "chat_msg_select_own" ON public.chat_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "chat_msg_insert_own" ON public.chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "chat_msg_update_admin" ON public.chat_messages FOR UPDATE
  TO authenticated USING (public.is_admin());

CREATE POLICY "chat_msg_delete_admin" ON public.chat_messages FOR DELETE
  TO authenticated USING (public.is_admin());

-- Allow anon to create guest conversations and messages
CREATE POLICY "chat_conv_anon_insert" ON public.chat_conversations FOR INSERT
  TO anon WITH CHECK (guest_id IS NOT NULL);

CREATE POLICY "chat_conv_anon_select" ON public.chat_conversations FOR SELECT
  TO anon USING (guest_id IS NOT NULL);

CREATE POLICY "chat_msg_anon_insert" ON public.chat_messages FOR INSERT
  TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND c.guest_id IS NOT NULL
    )
  );

CREATE POLICY "chat_msg_anon_select" ON public.chat_messages FOR SELECT
  TO anon USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND c.guest_id IS NOT NULL
    )
  );