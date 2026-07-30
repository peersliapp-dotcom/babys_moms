/*
# Add Telegram bot configuration to site settings

1. Modified Tables
- `site_settings`: adds three new columns for Telegram integration:
  - `telegram_bot_token` (text, nullable) — the Telegram Bot API token from @BotFather
  - `telegram_chat_id` (text, nullable) — the Telegram chat ID where new order notifications are sent (the store admin's chat)
  - `telegram_bot_username` (text, nullable) — the bot's username (without @), used to build the customer-facing "Chat on Telegram" link
2. Security
- No new RLS policies needed — the new columns are covered by existing site_settings policies.
3. Notes
- All three fields are nullable so the feature is opt-in. When the bot token is empty, Telegram features are disabled in the UI.
*/

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS telegram_bot_token text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS telegram_bot_username text;
