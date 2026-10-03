CREATE DATABASE Daily_Routine_Tracker;

USE Daily_Routine_Tracker;


-- ============================================
-- 1. USERS TABLE
-- ============================================

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);


-- ============================================
-- 2. TASKS TABLE
-- ============================================

CREATE TABLE Tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);


-- ============================================
-- 3. DAILY PROGRESS TABLE
-- ============================================

CREATE TABLE Daily_Progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    task_id INT NOT NULL,

    progress_date DATE NOT NULL,

    completed BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (task_id)
        REFERENCES Tasks(task_id)
        ON DELETE CASCADE,

    UNIQUE (user_id, task_id, progress_date)
);


-- ============================================
-- INSERT DEFAULT ROUTINES
-- ============================================

INSERT INTO Tasks
(task_name, description)
VALUES

('Wake Up Early',
 'Wake up before 7:00 AM'),

('Gym / Exercise',
 'Complete daily exercise'),

('Study',
 'Complete daily study'),

('Bath',
 'Take daily bath'),

('Drink Water',
 'Drink 4-5 litres of water'),

('Walking',
 'Complete daily walking'),

('Reading',
 'Read for some time'),

('Sleep On Time',
 'Sleep at scheduled time');


-- ============================================
-- CHECK TASKS
-- ============================================

SELECT * FROM Tasks;


-- ============================================
-- CHECK TABLES
-- ============================================

SHOW TABLES;