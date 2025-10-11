-- Создание таблицы для отслеживания онлайн-пользователей
CREATE TABLE IF NOT EXISTS online_users (
    user_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по времени последней активности
CREATE INDEX idx_online_users_heartbeat ON online_users(last_heartbeat);

-- Создание таблицы для смен диспетчеров
CREATE TABLE IF NOT EXISTS dispatcher_shifts (
    id SERIAL PRIMARY KEY,
    dispatcher_id VARCHAR(50) NOT NULL,
    dispatcher_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска активных смен
CREATE INDEX idx_dispatcher_shifts_active ON dispatcher_shifts(is_active) WHERE is_active = TRUE;