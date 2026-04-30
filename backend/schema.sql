-- Database Schema for Simple Multiplayer Game

-- 1. Table for User accounts
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table for Player game state (X, Y positions)
-- This allows persistent position even after logging out
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    x FLOAT DEFAULT 0.0,
    y FLOAT DEFAULT 0.0,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    diamonds INTEGER DEFAULT 0,
    inventory JSONB DEFAULT '{}',
    color VARCHAR(20) DEFAULT '#6366f1',
    last_online TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint to ensure we don't have multiple players for one user in this simple game
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);


-- 3. Table for Chat Messages (Persistent History)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
