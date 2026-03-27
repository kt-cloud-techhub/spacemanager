-- SpaceManager Database Schema (PostgreSQL)

-- 1. Organizations (Recursive Structure)
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL, -- 0:Company, 1:Division, 2:Dept, 3:Team
    parent_id BIGINT REFERENCES organizations(id),
    is_executive_unit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Executives, Leaders, Members)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Executive, Leader, Member
    org_id BIGINT REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Floors
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 4F, 7F, 11F
    map_image_url TEXT,
    layout_data JSONB, -- Seating coordinates and metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seats
CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    floor_id INTEGER REFERENCES floors(id),
    seat_number VARCHAR(20) NOT NULL,
    x_pos DOUBLE PRECISION NOT NULL,
    y_pos DOUBLE PRECISION NOT NULL,
    is_executive_seat BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(floor_id, seat_number)
);

-- 5. Space Assignments (Team Boundaries)
CREATE TABLE space_assignments (
    id BIGSERIAL PRIMARY KEY,
    floor_id INTEGER REFERENCES floors(id),
    org_id BIGINT REFERENCES organizations(id),
    area_polygon TEXT, -- WKT or JSON representation of the polygon
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Seat Reservations
CREATE TABLE seat_reservations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    seat_id BIGINT REFERENCES seats(id),
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(seat_id) -- One seat per reservation (Simplified for now)
);

-- Indexes for performance
CREATE INDEX idx_org_parent ON organizations(parent_id);
CREATE INDEX idx_user_org ON users(org_id);
CREATE INDEX idx_seat_floor ON seats(floor_id);
CREATE INDEX idx_assignment_org ON space_assignments(org_id);
