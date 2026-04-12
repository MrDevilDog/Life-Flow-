-- USERS
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL DEFAULT '',
  password VARCHAR(255) NOT NULL,
  role ENUM('user','hospital','admin') NOT NULL DEFAULT 'user',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_type ENUM('email','phone') NULL, -- NEW: Track verification method
  last_donation_date DATE NULL, -- NEW: Track last donation for 90-day cooldown
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  UNIQUE KEY users_phone_unique (phone),
  INDEX users_verification_type_idx (verification_type),
  INDEX users_last_donation_idx (last_donation_date)
);

-- OTP VERIFICATION
CREATE TABLE otps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  type ENUM('email','phone','forgot_password') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX otps_contact_type_idx (contact, type),
  INDEX otps_expires_idx (expires_at)
);

-- DONORS
CREATE TABLE donors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  availability BOOLEAN NOT NULL DEFAULT TRUE,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  UNIQUE KEY donors_user_unique (user_id),

  CONSTRAINT donors_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  INDEX donors_search_idx (location, blood_group),
  INDEX donors_location_idx (lat, lng)
);

-- REQUESTS
CREATE TABLE requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  units INT UNSIGNED NOT NULL,
  hospital VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  urgency ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status ENUM('active','fulfilled','cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT requests_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  INDEX requests_city_blood_idx (city, blood_group),
  INDEX requests_status_idx (status)
);

-- DONATIONS
CREATE TABLE donations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  donor_id BIGINT UNSIGNED NOT NULL,
  request_id BIGINT UNSIGNED NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT donations_donor_fk
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE,

  CONSTRAINT donations_request_fk
    FOREIGN KEY (request_id) REFERENCES requests(id)
    ON DELETE CASCADE,

  UNIQUE KEY donations_unique (donor_id, request_id),

  INDEX donations_donor_idx (donor_id),
  INDEX donations_request_idx (request_id)
);

-- DONOR REWARDS
CREATE TABLE donor_rewards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  donor_id BIGINT UNSIGNED NOT NULL,
  reward_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  
  CONSTRAINT donor_rewards_donor_fk
    FOREIGN KEY (donor_id) REFERENCES donors(id)
    ON DELETE CASCADE,
    
  INDEX donor_rewards_donor_idx (donor_id),
  INDEX donor_rewards_type_idx (reward_type)
);