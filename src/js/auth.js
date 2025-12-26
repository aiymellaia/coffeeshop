// auth.js - Authentication manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('user_token');
        this.init();
    }

    init() {
        // Проверяем токен при загрузке
        if (this.token) {
            this.fetchCurrentUser();
        }

        this.updateAuthUI();
    }

    // Регистрация
    async register(userData) {
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                this.token = result.token;
                this.currentUser = result.user;

                // Сохраняем в localStorage
                localStorage.setItem('user_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));

                this.updateAuthUI();
                return { success: true, data: result };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Connection error' };
        }
    }

    // Вход
    async login(credentials) {
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                this.token = result.token;
                this.currentUser = result.user;

                localStorage.setItem('user_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));

                this.updateAuthUI();
                return { success: true, data: result };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Connection error' };
        }
    }

    // Выход
    logout() {
        this.token = null;
        this.currentUser = null;

        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');

        this.updateAuthUI();

        if (typeof showToast === 'function') {
            showToast('Logged out successfully', 'info');
        }

        // Перенаправляем на главную
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // Получить текущего пользователя
    async fetchCurrentUser() {
        if (!this.token) return null;

        try {
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

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
            return null;
        }
    }

    // Проверить авторизован ли пользователь
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // Обновить UI в зависимости от статуса
    updateAuthUI() {
        const authElements = document.querySelectorAll('.auth-element');

        authElements.forEach(element => {
            if (this.isAuthenticated()) {
                // Пользователь авторизован
                if (element.classList.contains('auth-show-when-logged-out')) {
                    element.style.display = 'none';
                }
                if (element.classList.contains('auth-show-when-logged-in')) {
                    element.style.display = 'block';
                }

                // Заполняем данные пользователя
                if (element.dataset.userField === 'username' && this.currentUser) {
                    element.textContent = this.currentUser.username;
                }
                if (element.dataset.userField === 'email' && this.currentUser) {
                    element.textContent = this.currentUser.email;
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

    // Получить токен для API запросов
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
}

// Создаем глобальный экземпляр
window.auth = new AuthManager();