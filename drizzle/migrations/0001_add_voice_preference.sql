-- Add voice preference column to users table
-- Supports three voice options: 'fast' (Inworld), 'nostalgic' (ElevenLabs), 'none' (text only)
ALTER TABLE `users` ADD COLUMN `voicePreference` ENUM('fast', 'nostalgic', 'none') NOT NULL DEFAULT 'fast';
