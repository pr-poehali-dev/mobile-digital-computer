-- Таблица для участников экипажей
CREATE TABLE IF NOT EXISTS t_p48049793_mobile_digital_compu.crew_members (
    id SERIAL PRIMARY KEY,
    crew_id INTEGER NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON t_p48049793_mobile_digital_compu.crew_members(crew_id);