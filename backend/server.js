const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Обработка preflight запросов
app.options('*', cors());

app.use(express.json());

// Улучшенное логирование
app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.headers.authorization) {
        console.log('Auth token:', req.headers.authorization.substring(0, 30) + '...');
    }
    next();
});

// Подключение к БД
let pool;

async function initDB() {
    try {
        console.log('=== НАСТРОЙКА БАЗЫ ДАННЫХ ===');
        console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
        console.log('DB_USER:', process.env.DB_USER || 'root');
        console.log('DB_NAME:', process.env.DB_NAME || 'coffeeshop_db');

        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coffeeshop_db',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000
        });

        const connection = await pool.getConnection();
        console.log('✅ Подключено к MySQL');

        // Проверяем таблицы
        const [tables] = await connection.query('SHOW TABLES');
        console.log('📋 Таблицы в БД:');
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });

        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения к БД:', error.message);
        console.log('⚠️  Используется режим без БД');
        return false;
    }
}

// Middleware проверки JWT (УПРОЩЕННАЯ ВЕРСИЯ)
const authenticateToken = (req, res, next) => {
    console.log(`🔐 Проверка токена для: ${req.method} ${req.path}`);

    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        console.log('❌ Нет заголовка Authorization');
        return res.status(401).json({
            success: false,
            error: 'Требуется авторизация'
        });
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    if (!token) {
        console.log('❌ Токен не найден');
        return res.status(401).json({
            success: false,
            error: 'Неверный формат токена'
        });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || 'coffee-shop-jwt-secret-key-2024';
        const decoded = jwt.verify(token, jwtSecret);

        console.log('✅ Токен валиден. Пользователь:', decoded.username);
        req.user = decoded;

        // Автоматически даем права админа если username содержит 'admin'
        if (req.user.username.includes('admin')) {
            req.user.role = 'admin';
        }

        next();
    } catch (error) {
        console.log('❌ Ошибка верификации токена:', error.message);
        return res.status(403).json({
            success: false,
            error: 'Недействительный токен'
        });
    }
};

// Middleware проверки админа (УПРОЩЕННАЯ)
const authenticateAdmin = (req, res, next) => {
    console.log('👑 Проверка прав админа для:', req.user?.username);

    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Пользователь не аутентифицирован'
        });
    }

    // В режиме разработки разрешаем доступ всем пользователям с именем admin
    if (process.env.NODE_ENV === 'development') {
        if (req.user.username.includes('admin') || req.user.role === 'admin') {
            console.log('✅ Разрешен доступ (режим разработки)');
            return next();
        }
    }

    if (req.user.role !== 'admin' && !req.user.username.includes('admin')) {
        console.log('❌ Нет прав администратора');
        return res.status(403).json({
            success: false,
            error: 'Требуются права администратора'
        });
    }

    console.log('✅ Пользователь является администратором');
    next();
};

// Мок-данные для разработки
const mockProducts = [
    {
        id: 1,
        name: 'Flat White',
        category: 'hot-coffee',
        price: 3.50,
        description: 'Velvety milk, perfectly pulled shots.',
        image: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb',
        popular: true,
        rating: 4.8,
        stock: 50,
        is_available: true,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Cold Brew',
        category: 'cold-coffee',
        price: 4.00,
        description: 'Slow-steeped for smooth clarity.',
        image: 'https://images.unsplash.com/photo-1568649929103-28ffbefaca1e',
        popular: true,
        rating: 4.6,
        stock: 30,
        is_available: true,
        created_at: new Date().toISOString()
    }
];

const mockOrders = [
    {
        id: 1,
        customer_name: 'John Doe',
        customer_phone: '+1234567890',
        total_amount: 15.50,
        status: 'pending',
        created_at: new Date().toISOString()
    }
];

const mockUsers = [
    {
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        full_name: 'User One'
    }
];

// ========== ОСНОВНЫЕ МАРШРУТЫ ==========

app.get('/', (req, res) => {
    res.json({
        message: '☕ Coffee Shop API',
        version: '2.0.0',
        status: 'online',
        timestamp: new Date().toISOString(),
        endpoints: {
            client: {
                auth: '/api/auth/*',
                products: '/api/products/*',
                orders: '/api/orders/*'
            },
            admin: {
                auth: '/api/admin/login, /api/admin/verify',
                dashboard: '/api/admin/stats, /api/admin/products, /api/admin/orders, /api/admin/users'
            }
        }
    });
});

// Проверка здоровья
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'Coffee Shop API',
        database: pool ? 'connected' : 'mock mode',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ========== АУТЕНТИФИКАЦИЯ ПОЛЬЗОВАТЕЛЕЙ ==========

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Заполните все поля'
            });
        }

        if (!pool) {
            // Мок регистрация
            const token = jwt.sign(
                { id: Date.now(), username, email, role: 'user' },
                process.env.JWT_SECRET || 'coffee-shop-jwt-secret-key-2024',
                { expiresIn: '7d' }
            );

            return res.json({
                success: true,
                token,
                user: { id: 1, username, email },
                message: 'Регистрация успешна (мок)'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        const token = jwt.sign(
            { id: result.insertId, username, email, role: 'user' },
            process.env.JWT_SECRET || 'coffee-shop-jwt-secret-key-2024',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { id: result.insertId, username, email },
            message: 'Регистрация успешна'
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка регистрации'
        });
    }
});

// Вход пользователя
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Заполните все поля'
            });
        }

        if (!pool) {
            // Мок вход
            if (username === 'user' && password === 'user123') {
                const token = jwt.sign(
                    { id: 1, username: 'user', email: 'user@example.com', role: 'user' },
                    process.env.JWT_SECRET || 'coffee-shop-jwt-secret-key-2024',
                    { expiresIn: '7d' }
                );

                return res.json({
                    success: true,
                    token,
                    user: { id: 1, username: 'user', email: 'user@example.com' },
                    message: 'Вход успешен (мок)'
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Неверные данные'
            });
        }

        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Неверные данные'
            });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Неверные данные'
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: 'user' },
            process.env.JWT_SECRET || 'coffee-shop-jwt-secret-key-2024',
            { expiresIn: '7d' }
        );

        const { password_hash, ...userData } = user;

        res.json({
            success: true,
            token,
            user: userData,
            message: 'Вход успешен'
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка входа'
        });
    }
});

// Профиль пользователя
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        if (!pool) {
            return res.json({
                success: true,
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email
                }
            });
        }

        const [users] = await pool.query(
            'SELECT id, username, email, full_name, phone FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// ========== ПРОДУКТЫ (КЛИЕНТ) ==========

app.get('/api/products', async (req, res) => {
    try {
        if (!pool) {
            return res.json(mockProducts);
        }

        const [products] = await pool.query(
            'SELECT * FROM products WHERE is_available = TRUE ORDER BY category, name'
        );

        res.json(products);
    } catch (error) {
        console.error('Ошибка получения продуктов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

app.get('/api/products/popular', async (req, res) => {
    try {
        if (!pool) {
            return res.json(mockProducts.filter(p => p.popular));
        }

        const [products] = await pool.query(
            'SELECT * FROM products WHERE popular = TRUE AND is_available = TRUE LIMIT 6'
        );

        res.json(products);
    } catch (error) {
        console.error('Ошибка получения популярных продуктов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/products/category/:category', async (req, res) => {
    try {
        if (!pool) {
            return res.json(mockProducts.filter(p => p.category === req.params.category));
        }

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

app.get('/api/products/:id', async (req, res) => {
    try {
        if (!pool) {
            const product = mockProducts.find(p => p.id === parseInt(req.params.id));
            if (!product) return res.status(404).json({ error: 'Продукт не найден' });
            return res.json(product);
        }

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

// ========== ЗАКАЗЫ (КЛИЕНТ) ==========

app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, total_amount, notes } = req.body;

        if (!items || items.length === 0 || !total_amount) {
            return res.status(400).json({
                success: false,
                error: 'Неверные данные заказа'
            });
        }

        if (!pool) {
            return res.json({
                success: true,
                orderId: Date.now(),
                message: 'Заказ создан (мок)'
            });
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [orderResult] = await connection.query(
                `INSERT INTO orders (user_id, customer_name, customer_phone, customer_email, total_amount, notes)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.user.id, 'Customer', '0000000000', req.user.email || '', total_amount, notes || '']
            );

            const orderId = orderResult.insertId;

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
                message: 'Заказ создан успешно!'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка создания заказа'
        });
    }
});

app.get('/api/user/orders', authenticateToken, async (req, res) => {
    try {
        if (!pool) {
            return res.json({
                success: true,
                orders: mockOrders
            });
        }

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения заказов'
        });
    }
});

// ========== АДМИН ПАНЕЛЬ ==========

// Вход админа
app.post('/api/admin/login', async (req, res) => {
    console.log('\n🔐 ЗАПРОС НА ВХОД АДМИНА');
    console.log('Данные:', req.body);

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Введите логин и пароль'
            });
        }

        if (!pool) {
            // Мок вход для админа
            if (username === 'admin' && password === 'admin123') {
                const token = jwt.sign(
                    { id: 1, username: 'admin', role: 'admin' },
                    process.env.JWT_SECRET || 'coffee-shop-jwt-secret-key-2024',
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    token: token,
                    admin: {
                        id: 1,
                        username: 'admin',
                        email: 'admin@coffeeshop.com',
                        role: 'admin'
                    },
                    message: 'Вход успешен (мок)'
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Неверные данные'
            });
        }

        const [admins] = await pool.query(
            'SELECT * FROM admins WHERE username = ?',
            [username]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Администратор не найден'
            });
        }

        const admin = admins[0];
        const validPassword = await bcrypt.compare(password, admin.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Неверный пароль'
            });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.role || 'admin' },
            process.env.JWT_SECRET || 'coffee-shop-jwt-secret-key-2024',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role || 'admin'
            },
            message: 'Вход успешен'
        });
    } catch (error) {
        console.error('Ошибка входа админа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Проверка токена админа
app.get('/api/admin/verify', authenticateToken, authenticateAdmin, (req, res) => {
    res.json({
        success: true,
        admin: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role || 'admin'
        }
    });
});

// Статистика
app.get('/api/admin/stats', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        if (!pool) {
            return res.json({
                success: true,
                overview: {
                    total_orders: 156,
                    total_revenue: 5423.89,
                    today_orders: 12,
                    today_revenue: 342.50,
                    total_products: 24,
                    active_users: 89
                },
                recent_orders: [],
                top_products: [],
                message: 'Мок данные'
            });
        }

        const [[totalOrders]] = await pool.query('SELECT COUNT(*) as count FROM orders');
        const [[totalRevenue]] = await pool.query(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != "cancelled"'
        );
        const [[todayOrders]] = await pool.query(
            'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()'
        );
        const [[todayRevenue]] = await pool.query(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = CURDATE() AND status != "cancelled"'
        );
        const [[totalProducts]] = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_available = TRUE');
        const [[activeUsers]] = await pool.query('SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE user_id IS NOT NULL');

        res.json({
            success: true,
            overview: {
                total_orders: totalOrders.count || 0,
                total_revenue: parseFloat(totalRevenue.total) || 0,
                today_orders: todayOrders.count || 0,
                today_revenue: parseFloat(todayRevenue.total) || 0,
                total_products: totalProducts.count || 0,
                active_users: activeUsers.count || 0
            }
        });
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Продукты для админа
app.get('/api/admin/products', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        if (!pool) {
            return res.json(mockProducts);
        }

        const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');

        res.json({
            success: true,
            count: products.length,
            products: products
        });
    } catch (error) {
        console.error('Ошибка получения продуктов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Заказы для админа
app.get('/api/admin/orders', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        if (!pool) {
            return res.json({
                success: true,
                orders: mockOrders,
                pagination: {
                    total: 1,
                    page: page,
                    limit: limit,
                    pages: 1
                }
            });
        }

        const [orders] = await pool.query(
            'SELECT o.*, u.username as customer_username FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const [[total]] = await pool.query('SELECT COUNT(*) as count FROM orders');

        res.json({
            success: true,
            orders: orders,
            pagination: {
                total: total.count,
                page: page,
                limit: limit,
                pages: Math.ceil(total.count / limit)
            }
        });
    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Пользователи для админа (ДОБАВЛЕНО)
app.get('/api/admin/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        if (!pool) {
            return res.json({
                success: true,
                users: mockUsers,
                pagination: {
                    total: 1,
                    page: page,
                    limit: limit,
                    pages: 1
                }
            });
        }

        const [users] = await pool.query(
            'SELECT id, username, email, full_name, phone, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const [[total]] = await pool.query('SELECT COUNT(*) as count FROM users');

        res.json({
            success: true,
            users: users,
            pagination: {
                total: total.count,
                page: page,
                limit: limit,
                pages: Math.ceil(total.count / limit)
            }
        });
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Обновить статус заказа
app.put('/api/admin/orders/:id/status', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Укажите статус'
            });
        }

        if (!pool) {
            return res.json({
                success: true,
                message: 'Статус обновлен (мок)'
            });
        }

        await pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        res.json({
            success: true,
            message: 'Статус заказа обновлен'
        });
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Создать продукт
app.post('/api/admin/products', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { name, description, price, category, image } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                error: 'Заполните обязательные поля'
            });
        }

        if (!pool) {
            const newProduct = {
                id: Date.now(),
                name,
                description: description || '',
                price,
                category,
                image: image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
                popular: false,
                rating: 0,
                stock: 0,
                is_available: true,
                created_at: new Date().toISOString()
            };

            return res.json({
                success: true,
                product: newProduct,
                message: 'Продукт создан (мок)'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO products (name, description, price, category, image)
             VALUES (?, ?, ?, ?, ?)`,
            [name, description || '', price, category, image || '']
        );

        const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

        res.json({
            success: true,
            product: newProduct[0],
            message: 'Продукт создан'
        });
    } catch (error) {
        console.error('Ошибка создания продукта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Обновить продукт
app.put('/api/admin/products/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { name, description, price, category, image, popular, stock, is_available } = req.body;

        if (!pool) {
            return res.json({
                success: true,
                message: 'Продукт обновлен (мок)'
            });
        }

        await pool.query(
            `UPDATE products
             SET name = ?, description = ?, price = ?, category = ?,
                 image = ?, popular = ?, stock = ?, is_available = ?
             WHERE id = ?`,
            [name, description, price, category, image, popular, stock, is_available, req.params.id]
        );

        res.json({
            success: true,
            message: 'Продукт обновлен'
        });
    } catch (error) {
        console.error('Ошибка обновления продукта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Удалить продукт
app.delete('/api/admin/products/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        if (!pool) {
            return res.json({
                success: true,
                message: 'Продукт удален (мок)'
            });
        }

        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Продукт удален'
        });
    } catch (error) {
        console.error('Ошибка удаления продукта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// ========== ОБРАБОТЧИКИ ОШИБОК ==========

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Маршрут не найден'
    });
});

app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
    });
});

// ========== ЗАПУСК СЕРВЕРА ==========

async function startServer() {
    await initDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════╗
║      ☕ COFFEE SHOP API SERVER        ║
╠═══════════════════════════════════════╣
║  📡 Сервер: http://localhost:${PORT}       ║
║  🏥 Health: http://localhost:${PORT}/health ║
║  🔧 Admin:  http://localhost:${PORT}/admin  ║
╚═══════════════════════════════════════╝
        `);
        console.log('✅ Сервер запущен!');
        console.log('\n📋 Тестовые учетные записи:');
        console.log('   👤 Клиент: user / user123');
        console.log('   👑 Админ:  admin / admin123');
        console.log('\n🚀 Готов к работе!');
    });
}

startServer().catch(console.error);