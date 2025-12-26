const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL, 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());

// Подключение к БД
let pool;
async function initDB() {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const connection = await pool.getConnection();
        console.log('✅ Подключено к MySQL базе данных');
        connection.release();
    } catch (error) {
        console.error('❌ Ошибка подключения к БД:', error.message);
        process.exit(1);
    }
}

// Middleware проверки JWT (для админ-панели)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// ==================== АУТЕНТИФИКАЦИЯ ПОЛЬЗОВАТЕЛЕЙ ====================

// Регистрация пользователя
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone, address } = req.body;

        // Валидация
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email and password are required' });
        }

        // Проверяем, существует ли пользователь
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Хешируем пароль
        const passwordHash = await bcrypt.hash(password, 10);

        // Создаем пользователя
        const [result] = await pool.query(
            `INSERT INTO users (username, email, password_hash, full_name, phone, address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, passwordHash, full_name || null, phone || null, address || null]
        );

        // Создаем JWT токен
        const token = jwt.sign(
            { id: result.insertId, username: username, email: email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: token,
            user: {
                id: result.insertId,
                username: username,
                email: email,
                full_name: full_name,
                phone: phone
            },
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Вход пользователя
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Ищем пользователя по username или email
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Создаем JWT токен
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Убираем password_hash из ответа
        const { password_hash, ...userData } = user;

        res.json({
            success: true,
            token: token,
            user: userData,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Получить текущего пользователя
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, phone, address, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// Обновить профиль пользователя
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;

        await pool.query(
            `UPDATE users
             SET full_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [full_name || null, phone || null, address || null, req.user.id]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ==================== API ДЛЯ КЛИЕНТСКОГО САЙТА ====================

// 1. Получить все продукты
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE is_available = TRUE ORDER BY category, name'
        );
        res.json(products);
    } catch (error) {
        console.error('Ошибка получения продуктов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 2. Получить продукты по категории
app.get('/api/products/category/:category', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE category = ? AND is_available = TRUE',
            [req.params.category]
        );
        res.json(products);
    } catch (error) {
        console.error('Ошибка получения продуктов по категории:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 3. Получить популярные продукты
app.get('/api/products/popular', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE popular = TRUE AND is_available = TRUE LIMIT 6'
        );
        res.json(products);
    } catch (error) {
        console.error('Ошибка получения популярных продуктов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 4. Получить один продукт по ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }

        res.json(products[0]);
    } catch (error) {
        console.error('Ошибка получения продукта:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 5. Создать заказ
// Создать заказ (теперь с привязкой к пользователю)
app.post('/api/orders', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { items, total_amount, notes } = req.body;
        const userId = req.user.id;

        // Получаем данные пользователя
        const [users] = await connection.query(
            'SELECT full_name, phone, email FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            throw new Error('User not found');
        }

        const user = users[0];

        // Создаем заказ с user_id
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, customer_name, customer_phone, customer_email, total_amount, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, user.full_name, user.phone, user.email, total_amount, notes || '']
        );

        const orderId = orderResult.insertId;

        // Добавляем элементы заказа
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
                 VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.id, item.name, item.quantity, item.price]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            orderId: orderId,
            message: 'Order created successfully!'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        connection.release();
    }
});

// Получить заказы пользователя
app.get('/api/user/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT o.*,
                COUNT(oi.id) as items_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// 6. Получить статус заказа
app.get('/api/orders/:id', async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        const [items] = await pool.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        res.json({
            order: orders[0],
            items: items
        });
    } catch (error) {
        console.error('Ошибка получения заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== API ДЛЯ АДМИН-ПАНЕЛИ ====================

// 7. Авторизация админа
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [admins] = await pool.query(
            'SELECT * FROM admins WHERE username = ?',
            [username]
        );

        if (admins.length === 0) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        const admin = admins[0];
        const validPassword = await bcrypt.compare(password, admin.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        // Создаем JWT токен
        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 8. Получить все заказы (только для админов)
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
    try {
        const { status, start_date, end_date, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM orders';
        const conditions = [];
        const params = [];

        if (status && status !== 'all') {
            conditions.push('status = ?');
            params.push(status);
        }

        if (start_date) {
            conditions.push('DATE(created_at) >= ?');
            params.push(start_date);
        }

        if (end_date) {
            conditions.push('DATE(created_at) <= ?');
            params.push(end_date);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [orders] = await pool.query(query, params);

        // Получаем общее количество
        let countQuery = 'SELECT COUNT(*) as total FROM orders';
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        const [[count]] = await pool.query(countQuery, params.slice(0, -2));

        res.json({
            orders: orders,
            pagination: {
                total: count.total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count.total / limit)
            }
        });
    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 9. Обновить статус заказа
app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;

        await pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        res.json({ success: true, message: 'Статус заказа обновлен' });
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 10. Получить детали заказа с товарами
app.get('/api/admin/orders/:id/details', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        const [items] = await pool.query(
            `SELECT oi.*, p.image
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [req.params.id]
        );

        res.json({
            order: orders[0],
            items: items
        });
    } catch (error) {
        console.error('Ошибка получения деталей заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 11. Получить все продукты (админ)
app.get('/api/admin/products', authenticateToken, async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products ORDER BY category, name');
        res.json(products);
    } catch (error) {
        console.error('Ошибка получения продуктов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 12. Добавить продукт
app.post('/api/admin/products', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, category, image, popular, rating } = req.body;

        const [result] = await pool.query(
            `INSERT INTO products (name, description, price, category, image, popular, rating)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description, price, category, image, popular || false, rating || 0]
        );

        res.json({
            success: true,
            id: result.insertId,
            message: 'Продукт добавлен'
        });
    } catch (error) {
        console.error('Ошибка добавления продукта:', error);
        res.status(500).json({ error: 'Ошибка добавления продукта' });
    }
});

// 13. Обновить продукт
app.put('/api/admin/products/:id', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, category, image, popular, rating, is_available } = req.body;

        await pool.query(
            `UPDATE products
             SET name = ?, description = ?, price = ?, category = ?,
                 image = ?, popular = ?, rating = ?, is_available = ?
             WHERE id = ?`,
            [name, description, price, category, image, popular, rating, is_available, req.params.id]
        );

        res.json({ success: true, message: 'Продукт обновлен' });
    } catch (error) {
        console.error('Ошибка обновления продукта:', error);
        res.status(500).json({ error: 'Ошибка обновления продукта' });
    }
});

// 14. Получить статистику
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        // Общая статистика
        const [[totalOrders]] = await pool.query(
            'SELECT COUNT(*) as count FROM orders'
        );

        const [[totalRevenue]] = await pool.query(
            'SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"'
        );

        const [[todayOrders]] = await pool.query(
            'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()'
        );

        const [[todayRevenue]] = await pool.query(
            'SELECT SUM(total_amount) as total FROM orders WHERE DATE(created_at) = CURDATE() AND status != "cancelled"'
        );

        res.json({
            overview: {
                total_orders: totalOrders.count,
                total_revenue: totalRevenue.total || 0,
                today_orders: todayOrders.count,
                today_revenue: todayRevenue.total || 0
            }
        });
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Coffee Shop API'
    });
});

// Инициализация и запуск
async function startServer() {
    await initDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
        console.log(`📊 API доступен по: http://localhost:${PORT}/api`);
        console.log(`🌐 Клиент: ${process.env.CLIENT_URL}`);
        console.log(`🔧 Админ-панель: ${process.env.ADMIN_URL}`);
        console.log(`🏥 Проверка здоровья: http://localhost:${PORT}/api/health`);
    });
}

startServer().catch(console.error);