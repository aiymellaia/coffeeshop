// API сервис для работы с сервером
class CoffeeShopAPI {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
    }

    async getProducts() {
        try {
            const response = await fetch(`${this.baseURL}/products`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки продуктов:', error);
            throw error;
        }
    }

    async getProductsByCategory(category) {
        try {
            const response = await fetch(`${this.baseURL}/products/category/${category}`);
            return await response.json();
        } catch (error) {
            console.error(`Ошибка загрузки продуктов категории ${category}:`, error);
            throw error;
        }
    }

    async getPopularProducts() {
        try {
            const response = await fetch(`${this.baseURL}/products/popular`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки популярных продуктов:', error);
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            return await response.json();
        } catch (error) {
            console.error('Ошибка создания заказа:', error);
            throw error;
        }
    }

    async getOrderStatus(orderId) {
        try {
            const response = await fetch(`${this.baseURL}/orders/${orderId}`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения статуса заказа:', error);
            throw error;
        }
    }

    // Проверка здоровья сервера
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return await response.json();
        } catch (error) {
            console.error('Сервер недоступен:', error);
            return { status: 'error', message: 'Сервер недоступен' };
        }
    }
}

// Создаем глобальный экземпляр API
window.CoffeeShopAPI = new CoffeeShopAPI();