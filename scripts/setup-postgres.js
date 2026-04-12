require("dotenv").config({ path: ".env.local" });

const { Client } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL. Set it before running setup.");
  process.exit(1);
}

function isLocalHost(url) {
  try {
    const normalized = url
      .trim()
      .replace(/^postgresql:\/\//i, "http://")
      .replace(/^postgres:\/\//i, "http://");
    const parsed = new URL(normalized);
    const host = (parsed.hostname || "").toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: isLocalHost(databaseUrl)
    ? undefined
    : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" },
});

const sql = `
DO $$
BEGIN
  CREATE TYPE user_role_type AS ENUM ('user','hospital','admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE verification_type_type AS ENUM ('email','phone');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE otp_type_type AS ENUM ('email','phone','forgot_password');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE blood_group_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE urgency_type AS ENUM ('low','medium','high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE request_status_type AS ENUM ('active','fulfilled','cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL DEFAULT '' UNIQUE,
  password VARCHAR(255) NOT NULL,
  role user_role_type NOT NULL DEFAULT 'user',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_type verification_type_type,
  last_donation_date DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS users_verification_type_idx ON users (verification_type);
CREATE INDEX IF NOT EXISTS users_last_donation_idx ON users (last_donation_date);

CREATE TABLE IF NOT EXISTS otps (
  id BIGSERIAL PRIMARY KEY,
  contact VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  type otp_type_type NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  email VARCHAR(255),
  phone VARCHAR(255),
  verification_session VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS otps_contact_type_idx ON otps (contact, type);
CREATE INDEX IF NOT EXISTS otps_expires_idx ON otps (expires_at);
CREATE INDEX IF NOT EXISTS otps_verification_session_idx ON otps (verification_session);

CREATE TABLE IF NOT EXISTS donors (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  blood_group blood_group_type NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  availability BOOLEAN NOT NULL DEFAULT TRUE,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  city VARCHAR(255),
  district VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS donors_search_idx ON donors (location, blood_group);
CREATE INDEX IF NOT EXISTS donors_location_idx ON donors (lat, lng);
CREATE INDEX IF NOT EXISTS donors_city_idx ON donors (city);
CREATE INDEX IF NOT EXISTS donors_district_idx ON donors (district);
CREATE INDEX IF NOT EXISTS donors_city_district_idx ON donors (city, district);

CREATE TABLE IF NOT EXISTS requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL,
  blood_group blood_group_type NOT NULL,
  units INT NOT NULL,
  hospital VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  district VARCHAR(255),
  urgency urgency_type NOT NULL DEFAULT 'medium',
  status request_status_type NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS requests_city_blood_idx ON requests (city, blood_group);
CREATE INDEX IF NOT EXISTS requests_status_idx ON requests (status);
CREATE INDEX IF NOT EXISTS requests_district_idx ON requests (district);
CREATE INDEX IF NOT EXISTS requests_city_district_idx ON requests (city, district);

CREATE TABLE IF NOT EXISTS donations (
  id BIGSERIAL PRIMARY KEY,
  donor_id BIGINT NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  request_id BIGINT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (donor_id, request_id)
);

CREATE INDEX IF NOT EXISTS donations_donor_idx ON donations (donor_id);
CREATE INDEX IF NOT EXISTS donations_request_idx ON donations (request_id);

CREATE TABLE IF NOT EXISTS donor_rewards (
  id BIGSERIAL PRIMARY KEY,
  donor_id BIGINT NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS donor_rewards_donor_idx ON donor_rewards (donor_id);
CREATE INDEX IF NOT EXISTS donor_rewards_type_idx ON donor_rewards (reward_type);

CREATE TABLE IF NOT EXISTS hospitals (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_inventory (
  id BIGSERIAL PRIMARY KEY,
  hospital_id BIGINT REFERENCES hospitals(id) ON DELETE CASCADE,
  blood_group blood_group_type,
  units INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (hospital_id, blood_group)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_donors_updated_at ON donors;
CREATE TRIGGER trg_donors_updated_at
BEFORE UPDATE ON donors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_requests_updated_at ON requests;
CREATE TRIGGER trg_requests_updated_at
BEFORE UPDATE ON requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_blood_inventory_updated_at ON blood_inventory;
CREATE TRIGGER trg_blood_inventory_updated_at
BEFORE UPDATE ON blood_inventory
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
`;

async function run() {
  console.log("Setting up PostgreSQL schema...");
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("PostgreSQL schema setup completed.");
}

run().catch(async (err) => {
  console.error("Schema setup failed:", err.message || err);
  try {
    await client.end();
  } catch {
    // no-op
  }
  process.exit(1);
});
