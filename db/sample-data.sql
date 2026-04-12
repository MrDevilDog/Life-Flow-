-- Sample emergency requests for testing
-- First, ensure we have some users
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'John Doe', 'john@example.com', 'password123', 'user'),
(2, 'City Hospital', 'hospital@city.com', 'password123', 'user'),
(3, 'Jane Smith', 'jane@example.com', 'password123', 'user');

-- Sample emergency requests
INSERT IGNORE INTO requests (user_id, patient_name, blood_group, units, hospital, city, urgency, status) VALUES
(1, 'Emergency Patient 1', 'O+', 2, 'City General Hospital', 'New York', 'high', 'active'),
(2, 'Emergency Patient 2', 'A-', 1, 'City Medical Center', 'Los Angeles', 'medium', 'active'),
(3, 'Emergency Patient 3', 'B+', 3, 'Regional Hospital', 'Chicago', 'high', 'active'),
(1, 'Emergency Patient 4', 'AB+', 1, 'Community Hospital', 'Houston', 'low', 'active'),
(2, 'Emergency Patient 5', 'O-', 2, 'St. Mary Hospital', 'Phoenix', 'medium', 'active');
