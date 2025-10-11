CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crews (
    id SERIAL PRIMARY KEY,
    unit_name VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    location VARCHAR(255),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calls (
    id SERIAL PRIMARY KEY,
    call_number VARCHAR(50) UNIQUE NOT NULL,
    call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address VARCHAR(255) NOT NULL,
    call_type VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    assigned_crew_id INTEGER REFERENCES crews(id),
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    log_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    details TEXT
);

INSERT INTO users (username, password, full_name, role, email, phone) VALUES
('manager', 'Manager2024!', 'Петров Петр Петрович', 'manager', 'manager@mdc.system', '+7 (999) 000-11-22'),
('dispatcher', 'Disp2024!', 'Иванов Иван Иванович', 'dispatcher', 'dispatcher@mdc.system', '+7 (999) 123-45-67');

INSERT INTO crews (unit_name, status, location) VALUES
('NU-10', 'available', 'Станция №3'),
('NU-12', 'en-route', 'ул. Ленина, 45'),
('NU-15', 'on-scene', 'пр. Мира, 120'),
('NU-07', 'available', 'Станция №1'),
('NU-22', 'unavailable', 'Техобслуживание'),
('NU-18', 'en-route', 'ул. Гагарина, 78');