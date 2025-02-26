-- First drop existing tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS kid_assignments;
DROP TABLE IF EXISTS driver_assignments;
DROP TABLE IF EXISTS activity_instances;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS kids;
DROP TABLE IF EXISTS drivers;

-- Now create tables
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    family_name VARCHAR(255) NOT NULL,
    seat_capacity INTEGER NOT NULL
);

CREATE TABLE kids (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    day INTEGER NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    is_one_time BOOLEAN DEFAULT false
);

CREATE TABLE activity_instances (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities(id),
    date DATE NOT NULL,
    is_cancelled BOOLEAN DEFAULT false
);

-- Add the unique constraint
ALTER TABLE activity_instances 
ADD CONSTRAINT unique_activity_date 
UNIQUE (activity_id, date);

CREATE TABLE driver_assignments (
    id SERIAL PRIMARY KEY,
    activity_instance_id INTEGER REFERENCES activity_instances(id),
    driver_id INTEGER REFERENCES drivers(id)
);

CREATE TABLE kid_assignments (
    id SERIAL PRIMARY KEY,
    driver_assignment_id INTEGER REFERENCES driver_assignments(id),
    kid_id INTEGER REFERENCES kids(id)
);

-- Insert some sample data
INSERT INTO drivers (family_name, seat_capacity) VALUES
    ('Smith', 4),
    ('Johnson', 6),
    ('Williams', 3);

INSERT INTO kids (name) VALUES
    ('Alex Smith'),
    ('Emma Johnson'),
    ('Oliver Williams'),
    ('Sophia Smith');

INSERT INTO activities (name, day, time, location) VALUES
    ('Soccer Practice', 1, '15:00', 'Main Field'),
    ('Swimming', 3, '16:30', 'Community Pool'),
    ('Piano Lessons', 2, '14:00', 'Music School'); 
