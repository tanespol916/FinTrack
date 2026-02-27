-- Insert predefined categories for FinTrack
-- Income Categories
INSERT INTO Category (name, type, icon, color, createdAt, updatedAt) VALUES
('Salary', 'income', '💰', '#10b981', NOW(), NOW()),
('Freelance', 'income', '💻', '#3b82f6', NOW(), NOW()),
('Investment', 'income', '📈', '#8b5cf6', NOW(), NOW()),
('Business', 'income', '🏢', '#f59e0b', NOW(), NOW()),
('Rent Income', 'income', '🏠', '#06b6d4', NOW(), NOW()),
('Gift', 'income', '🎁', '#ec4899', NOW(), NOW()),
('Bonus', 'income', '🎯', '#84cc16', NOW(), NOW()),
('Other Income', 'income', '💵', '#6b7280', NOW(), NOW());

-- Expense Categories
INSERT INTO Category (name, type, icon, color, createdAt, updatedAt) VALUES
('Food & Dining', 'expense', '🍽️', '#ef4444', NOW(), NOW()),
('Transportation', 'expense', '🚗', '#f97316', NOW(), NOW()),
('Shopping', 'expense', '🛍️', '#a855f7', NOW(), NOW()),
('Entertainment', 'expense', '🎬', '#06b6d4', NOW(), NOW()),
('Bills & Utilities', 'expense', '📱', '#3b82f6', NOW(), NOW()),
('Healthcare', 'expense', '🏥', '#10b981', NOW(), NOW()),
('Education', 'expense', '📚', '#f59e0b', NOW(), NOW()),
('Travel', 'expense', '✈️', '#8b5cf6', NOW(), NOW()),
('Insurance', 'expense', '🛡️', '#6b7280', NOW(), NOW()),
('Home & Garden', 'expense', '🏡', '#84cc16', NOW(), NOW()),
('Personal Care', 'expense', '💇', '#ec4899', NOW(), NOW()),
('Subscriptions', 'expense', '📦', '#f97316', NOW(), NOW()),
('Pets', 'expense', '🐾', '#06b6d4', NOW(), NOW()),
('Charity', 'expense', '❤️', '#ef4444', NOW(), NOW()),
('Other Expense', 'expense', '📝', '#6b7280', NOW(), NOW());
