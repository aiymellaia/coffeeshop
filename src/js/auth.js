// auth.js - Authentication manager (ИСПРАВЛЕННАЯ ВЕРСИЯ)
class AuthManager {
    constructor() {
        this.currentUser = null;
        // Проверяем оба типа токенов для совместимости
        this.token = localStorage.getItem('user_token') || localStorage.getItem('authToken');
        this.init();
    }

    init() {
        // Проверяем токен при загрузке
        if (this.token) {
            this.fetchCurrentUser();
        }

        this.updateAuthUI();
    }

    // Регистрация (ИСПРАВЛЕННАЯ)
    async register(userData) {
        try {
            console.log('Registering user:', { ...userData, password: '[HIDDEN]' });

            // Преобразуем данные для бэкенда
            const backendData = this.prepareRegistrationData(userData);

            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(backendData)
            });

            // Проверяем статус ответа
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: `Server error: ${response.status}`
                }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.token = result.token;
                this.currentUser = result.user;

                // Сохраняем в localStorage (универсально)
                localStorage.setItem('user_token', this.token);
                localStorage.setItem('authToken', this.token); // Для совместимости с админкой
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));

                this.updateAuthUI();

                // Показываем уведомление
                if (typeof showToast === 'function') {
                    showToast('Registration successful! Welcome!', 'success');
                }

                return {
                    success: true,
                    data: result,
                    user: result.user,
                    token: result.token
                };
            } else {
                // Ошибка от сервера
                return {
                    success: false,
                    error: result.error || 'Registration failed',
                    details: result
                };
            }
        } catch (error) {
            console.error('Registration error:', error);

            // Определяем тип ошибки
            let errorMessage = 'Connection error';
            if (error.message.includes('409')) {
                errorMessage = 'Username or email already exists';
            } else if (error.message.includes('400')) {
                errorMessage = 'Invalid data provided';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check if backend is running.';
            } else {
                errorMessage = error.message || 'Registration failed';
            }

            return {
                success: false,
                error: errorMessage,
                originalError: error.message
            };
        }
    }

    // Подготовка данных для бэкенда
    prepareRegistrationData(frontendData) {
        const data = {
            username: frontendData.username,
            email: frontendData.email,
            password: frontendData.password
        };

        // Добавляем full_name если есть firstName и lastName
        if (frontendData.firstName && frontendData.lastName) {
            data.full_name = `${frontendData.firstName} ${frontendData.lastName}`.trim();
        } else if (frontendData.full_name) {
            data.full_name = frontendData.full_name;
        } else if (frontendData.firstName) {
            data.full_name = frontendData.firstName;
        }

        // Добавляем phone если есть
        if (frontendData.phone) {
            data.phone = frontendData.phone;
        }

        // Добавляем address если есть
        if (frontendData.address) {
            data.address = frontendData.address;
        }

        return data;
    }

    // Вход (ИСПРАВЛЕННАЯ)
    async login(credentials) {
        try {
            console.log('Logging in:', { ...credentials, password: '[HIDDEN]' });

            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            // Проверяем статус ответа
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: `Server error: ${response.status}`
                }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.token = result.token;
                this.currentUser = result.user;

                // Сохраняем в localStorage (универсально)
                localStorage.setItem('user_token', this.token);
                localStorage.setItem('authToken', this.token); // Для совместимости с админкой
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));

                this.updateAuthUI();

                // Показываем уведомление
                if (typeof showToast === 'function') {
                    showToast('Login successful!', 'success');
                }

                return {
                    success: true,
                    data: result,
                    user: result.user,
                    token: result.token
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Invalid credentials',
                    details: result
                };
            }
        } catch (error) {
            console.error('Login error:', error);

            // Определяем тип ошибки
            let errorMessage = 'Connection error';
            if (error.message.includes('401')) {
                errorMessage = 'Invalid username or password';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check if backend is running.';
            } else {
                errorMessage = error.message || 'Login failed';
            }

            return {
                success: false,
                error: errorMessage,
                originalError: error.message
            };
        }
    }

    // Вход администратора (НОВАЯ ФУНКЦИЯ)
    async adminLogin(credentials) {
        try {
            const response = await fetch('http://localhost:5000/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: `Server error: ${response.status}`
                }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Для админов используем другой ключ
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('admin', JSON.stringify(result.admin));

                return {
                    success: true,
                    data: result,
                    admin: result.admin,
                    token: result.token
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Admin login failed'
                };
            }
        } catch (error) {
            console.error('Admin login error:', error);
            return {
                success: false,
                error: 'Admin connection error'
            };
        }
    }

    // Выход (УЛУЧШЕННАЯ)
    logout() {
        this.token = null;
        this.currentUser = null;

        // Очищаем все токены
        localStorage.removeItem('user_token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user_data');
        localStorage.removeItem('admin');

        this.updateAuthUI();

        if (typeof showToast === 'function') {
            showToast('Logged out successfully', 'info');
        }

        // Перенаправляем на главную
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // Получить текущего пользователя (УЛУЧШЕННАЯ)
    async fetchCurrentUser() {
        if (!this.token) return null;

        try {
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                // Если токен невалиден, выходим
                if (response.status === 401 || response.status === 403) {
                    this.logout();
                    return null;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                return this.currentUser;
            } else {
                this.logout();
                return null;
            }
        } catch (error) {
            console.error('Fetch user error:', error);

            // При ошибке сети не выходим автоматически
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                console.warn('Network error, keeping cached user data');
                return this.currentUser; // Возвращаем кэшированные данные
            }

            this.logout();
            return null;
        }
    }

    // Проверить авторизован ли пользователь (УЛУЧШЕННАЯ)
    isAuthenticated() {
        // Проверяем оба типа токенов
        const userToken = localStorage.getItem('user_token');
        const adminToken = localStorage.getItem('authToken');
        const hasToken = !!(userToken || adminToken);

        // Проверяем наличие данных пользователя
        const userData = localStorage.getItem('user_data');
        const adminData = localStorage.getItem('admin');
        const hasUserData = !!(userData || adminData);

        return hasToken && hasUserData;
    }

    // Получить текущего пользователя (клиент или админ)
    getCurrentUser() {
        try {
            // Пытаемся получить клиента
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                user.role = 'customer'; // Добавляем роль
                return user;
            }

            // Пытаемся получить админа
            const adminData = localStorage.getItem('admin');
            if (adminData) {
                const admin = JSON.parse(adminData);
                admin.role = 'admin'; // Добавляем роль
                return admin;
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }

        return null;
    }

    // Обновить UI в зависимости от статуса (УЛУЧШЕННАЯ)
    updateAuthUI() {
        const authElements = document.querySelectorAll('.auth-element');
        const isAuthenticated = this.isAuthenticated();
        const user = this.getCurrentUser();

        authElements.forEach(element => {
            if (isAuthenticated) {
                // Пользователь авторизован
                if (element.classList.contains('auth-show-when-logged-out')) {
                    element.style.display = 'none';
                }
                if (element.classList.contains('auth-show-when-logged-in')) {
                    element.style.display = 'block';
                }

                // Заполняем данные пользователя
                if (element.dataset.userField === 'username' && user) {
                    element.textContent = user.username;
                }
                if (element.dataset.userField === 'email' && user) {
                    element.textContent = user.email;
                }
                if (element.dataset.userField === 'full_name' && user) {
                    element.textContent = user.full_name || user.username;
                }
                if (element.dataset.userField === 'role' && user) {
                    element.textContent = user.role === 'admin' ? 'Administrator' : 'Customer';
                }
            } else {
                // Пользователь не авторизован
                if (element.classList.contains('auth-show-when-logged-out')) {
                    element.style.display = 'block';
                }
                if (element.classList.contains('auth-show-when-logged-in')) {
                    element.style.display = 'none';
                }
            }
        });
    }

    // Получить токен для API запросов (УЛУЧШЕННАЯ)
    getAuthHeader() {
        const userToken = localStorage.getItem('user_token');
        const adminToken = localStorage.getItem('authToken');
        const token = userToken || adminToken;

        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // Проверить, является ли пользователь администратором
    isAdmin() {
        const adminData = localStorage.getItem('admin');
        if (adminData) {
            try {
                const admin = JSON.parse(adminData);
                return admin.role === 'admin';
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    // Проверить, заполнен ли профиль (для заказов)
    isProfileComplete() {
        const user = this.getCurrentUser();

        if (!user) return false;

        if (user.role === 'admin') {
            // Админам не нужны full_name и phone для заказов
            return true;
        }

        // Клиентам нужны full_name и phone
        return !!(user.full_name && user.phone);
    }

    // Обновить профиль пользователя
    async updateProfile(profileData) {
        try {
            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Обновляем данные пользователя
                await this.fetchCurrentUser();

                if (typeof showToast === 'function') {
                    showToast('Profile updated successfully', 'success');
                }

                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: 'Failed to update profile' };
        }
    }
}

// Создаем глобальный экземпляр
window.auth = new AuthManager();

// Экспорт для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}