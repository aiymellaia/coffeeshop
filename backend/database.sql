CREATE DATABASE IF NOT EXISTS coffeeshop_db;
USE coffeeshop_db;

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image VARCHAR(255),
    popular BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 1) DEFAULT 0.0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_id (order_id)
);

CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'manager') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, description, price, category, image, popular, rating) VALUES
('Flat White', 'Velvety milk, perfectly pulled shots.', 3.50, 'hot-coffee', 'FlatWhite.jpg', TRUE, 4.8),
('Cold Brew', 'Slow-steeped for smooth clarity.', 4.00, 'cold-coffee', 'https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', TRUE, 4.6),
('Almond Croissant', 'Buttery, flaky, house-made almond filling.', 2.75, 'pastries', 'AlmondCroissant.jpeg', TRUE, 4.9),
('Latte', 'Balanced, creamy — customizable syrups.', 3.25, 'hot-coffee', 'Latte.jpg', TRUE, 4.7),
('Espresso', 'Single origin shots; intense and clean.', 2.00, 'hot-coffee', 'espresso.jpg', FALSE, 4.5),
('Blueberry Muffin', 'Moist, with a crisp sugar top.', 2.50, 'pastries', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', FALSE, 4.4),
('Mocha', 'Chocolate and espresso harmony.', 4.50, 'hot-coffee', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', FALSE, 4.6),
('Caramel Macchiato', 'Sweet caramel drizzle over smooth espresso.', 4.25, 'cold-coffee', 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', TRUE, 4.8),
('Matcha Latte', 'Organic matcha blended with creamy milk.', 4.00, 'tea', 'MatchaLatte.jpg', FALSE, 4.7),
('Banana Bread', 'Soft, moist, baked fresh every morning.', 2.80, 'pastries', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', FALSE, 4.3),
('Cappuccino', 'Perfectly balanced espresso with foamed milk.', 3.75, 'hot-coffee', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', TRUE, 4.8),
('Iced Americano', 'Double shot of espresso over ice.', 3.00, 'cold-coffee', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', FALSE, 4.5),
('Pumpkin Spice Latte', 'Seasonal favorite with pumpkin and spices.', 4.75, 'specials', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', TRUE, 4.9),
('Chai Tea', 'Spiced black tea with steamed milk.', 3.50, 'tea', 'chai.webp', FALSE, 4.6),
('Chocolate Chip Cookie', 'Freshly baked with dark chocolate chunks.', 2.25, 'pastries', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', FALSE, 4.7);

INSERT INTO admins (username, password_hash, email, role) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@coffeeshop.com', 'admin');

CREATE USER IF NOT EXISTS 'coffeeshop_user'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON coffeeshop_db.* TO 'coffeeshop_user'@'localhost';
FLUSH PRIVILEGES;