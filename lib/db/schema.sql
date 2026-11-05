CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    position TEXT NOT NULL,
    alt_positions TEXT,
    club TEXT NOT NULL,
    league TEXT NOT NULL,
    nation TEXT NOT NULL,
    pace INTEGER DEFAULT 75,
    shooting INTEGER DEFAULT 70,
    passing INTEGER DEFAULT 72,
    dribbling INTEGER DEFAULT 75,
    defending INTEGER DEFAULT 65,
    physical INTEGER DEFAULT 70,
    card_type TEXT NOT NULL DEFAULT 'gold',
    xbox_bin INTEGER NOT NULL DEFAULT 1000,
    trend_24h REAL DEFAULT 0,
    playstyles TEXT,
    roles_plus TEXT,
    photo_url TEXT,
    club_badge_url TEXT,
    nation_flag_url TEXT,
    height_cm INTEGER DEFAULT 182,
    acceleration INTEGER DEFAULT 75,
    sprint_speed INTEGER DEFAULT 75,
    strength INTEGER DEFAULT 75,
    agility INTEGER DEFAULT 75
);

CREATE INDEX IF NOT EXISTS idx_players_rating ON players(rating);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_club ON players(club);
CREATE INDEX IF NOT EXISTS idx_players_league ON players(league);
CREATE INDEX IF NOT EXISTS idx_players_nation ON players(nation);
CREATE INDEX IF NOT EXISTS idx_players_xbox_bin ON players(xbox_bin);
