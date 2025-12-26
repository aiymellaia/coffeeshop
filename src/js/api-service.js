// api-service.js - Service for API communication with better error handling

class ApiService {
    constructor(baseUrl = 'http://localhost:5000/api') {
        this.baseUrl = baseUrl;
        this.cache = {
            products: null,
            lastFetch: null,
            categories: null
        };
        this.maxCacheAge = 5 * 60 * 1000; // 5 minutes
    }

    // === PRODUCTS API ===

    // Get all products
    async getProducts(forceRefresh = false) {
        // Check cache first
        if (!forceRefresh && this.isCacheValid('products')) {
            console.log('📦 Using cached products');
            return this.cache.products;
        }

        try {
            console.log('🔄 Fetching products from server...');
            const response = await fetch(`${this.baseUrl}/products`, {
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await this.getErrorText(response)}`);
            }

            const products = await response.json();

            // Validate and normalize products
            const normalizedProducts = this.normalizeProducts(products);

            // Update cache
            this.cache.products = normalizedProducts;
            this.cache.lastFetch = Date.now();

            console.log(`✅ Loaded ${normalizedProducts.length} products from server`);
            return normalizedProducts;
        } catch (error) {
            console.error('❌ Error fetching products:', error.message);

            // If we have cached data, return it even if stale
            if (this.cache.products) {
                console.log('⚠️ Using cached products due to error');
                return this.cache.products;
            }

            // Return empty array instead of throwing
            return this.getFallbackProducts();
        }
    }

    // Get products by category
    async getProductsByCategory(category) {
        try {
            const response = await fetch(`${this.baseUrl}/products/category/${encodeURIComponent(category)}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await this.getErrorText(response)}`);
            }

            const products = await response.json();
            return this.normalizeProducts(products);
        } catch (error) {
            console.error(`Error fetching products for category ${category}:`, error);

            // Fallback: filter from cached products
            if (this.cache.products) {
                return this.cache.products.filter(p => p.category === category);
            }

            return this.getFallbackProducts().filter(p => p.category === category);
        }
    }

    // Get popular products
    async getPopularProducts() {
        try {
            const response = await fetch(`${this.baseUrl}/products/popular`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await this.getErrorText(response)}`);
            }

            const products = await response.json();
            return this.normalizeProducts(products);
        } catch (error) {
            console.error('Error fetching popular products:', error);

            // Fallback: filter popular from cached products
            if (this.cache.products) {
                return this.cache.products.filter(p => p.popular === true);
            }

            return this.getFallbackProducts().filter(p => p.popular === true);
        }
    }

    // Get single product by ID
    async getProduct(id) {
        try {
            const response = await fetch(`${this.baseUrl}/products/${id}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await this.getErrorText(response)}`);
            }

            const product = await response.json();
            return this.normalizeProduct(product);
        } catch (error) {
            console.error(`Error fetching product ${id}:`, error);

            // Fallback: find in cached products
            if (this.cache.products) {
                return this.cache.products.find(p => p.id === id) || this.createDefaultProduct(id);
            }

            return this.getFallbackProducts().find(p => p.id === id) || this.createDefaultProduct(id);
        }
    }

    // === ORDERS API ===

    // Create new order
    async createOrder(orderData) {
        try {
            console.log('📤 Submitting order:', orderData);

            const response = await fetch(`${this.baseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP ${response.status}: Order creation failed`);
            }

            console.log('✅ Order created successfully:', responseData);
            return responseData;
        } catch (error) {
            console.error('❌ Error creating order:', error);
            throw error; // Re-throw for cart.js to handle
        }
    }

    // Get order by ID
    async getOrder(orderId) {
        try {
            const response = await fetch(`${this.baseUrl}/orders/${orderId}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await this.getErrorText(response)}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching order ${orderId}:`, error);
            throw error;
        }
    }

    // === ADMIN API ===

    // Admin login
    async adminLogin(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: Login failed`);
            }

            return data;
        } catch (error) {
            console.error('Error during admin login:', error);
            throw error;
        }
    }

    // === HEALTH & UTILITY ===

    // Health check with timeout
    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${this.baseUrl}/health`, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                return {
                    ok: true,
                    status: response.status,
                    message: data.message || 'Server is healthy',
                    data: data
                };
            } else {
                return {
                    ok: false,
                    status: response.status,
                    message: `Server responded with ${response.status}`,
                    data: null
                };
            }
        } catch (error) {
            let message = 'Server is unreachable';

            if (error.name === 'AbortError') {
                message = 'Server timeout (3s)';
            } else if (error.message.includes('Failed to fetch')) {
                message = 'Network error or CORS issue';
            } else {
                message = error.message;
            }

            return {
                ok: false,
                status: 0,
                message: message,
                data: null
            };
        }
    }

    // Clear cache
    clearCache() {
        this.cache = {
            products: null,
            lastFetch: null,
            categories: null
        };
        console.log('🧹 Cache cleared');
    }

    // === PRIVATE HELPERS ===

    // Check if cache is valid
    isCacheValid(key) {
        return this.cache[key] &&
               this.cache.lastFetch &&
               (Date.now() - this.cache.lastFetch) < this.maxCacheAge;
    }

    // Get error text from response
    async getErrorText(response) {
        try {
            const error = await response.text();
            return error || response.statusText;
        } catch {
            return response.statusText;
        }
    }

    // Normalize product data from API
    normalizeProducts(products) {
        if (!Array.isArray(products)) {
            console.warn('Products data is not an array:', products);
            return [];
        }

        return products.map(product => this.normalizeProduct(product));
    }

    // Normalize single product
    normalizeProduct(product) {
        return {
            id: product.id || 0,
            name: product.name || 'Unknown Product',
            category: product.category || 'other',
            price: parseFloat(product.price) || 0,
            description: product.description || 'No description available',
            image: product.image || this.getDefaultImage(product.category),
            popular: Boolean(product.popular) || false,
            rating: parseFloat(product.rating) || 0.0,
            is_available: product.is_available !== false,
            created_at: product.created_at || null,
            updated_at: product.updated_at || null
        };
    }

    // Get default image based on category
    getDefaultImage(category) {
        const categoryImages = {
            'hot-coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'cold-coffee': 'https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'tea': 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'pastries': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'specials': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        };

        return categoryImages[category] || 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }

    // Fallback products when server is down
    getFallbackProducts() {
        console.log('🔄 Using fallback products data');
        return [
            {
                id: 1,
                name: "Flat White",
                category: "hot-coffee",
                price: 3.50,
                description: "Velvety milk, perfectly pulled shots.",
                image: "FlatWhite.jpg",
                popular: true,
                rating: 4.8,
                is_available: true
            },
            {
                id: 2,
                name: "Cold Brew",
                category: "cold-coffee",
                price: 4.00,
                description: "Slow-steeped for smooth clarity.",
                image: "https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: true,
                rating: 4.6,
                is_available: true
            }
            // Add more fallback products as needed
        ];
    }

    // Create default product when not found
    createDefaultProduct(id) {
        return {
            id: id,
            name: `Product #${id}`,
            category: "other",
            price: 0,
            description: "Product information unavailable",
            image: this.getDefaultImage("other"),
            popular: false,
            rating: 0,
            is_available: false
        };
    }
}

// Create global instance with error handling
try {
    window.apiService = new ApiService();
    console.log('✅ API Service initialized');
} catch (error) {
    console.error('❌ Failed to initialize API Service:', error);
    // Create a minimal fallback service
    window.apiService = {
        getProducts: async () => [],
        getProductsByCategory: async () => [],
        getProduct: async () => null,
        createOrder: async () => { throw new Error('API Service not available'); },
        checkHealth: async () => ({ ok: false, message: 'API Service failed to initialize' }),
        clearCache: () => {}
    };
}

// Helper function to check server status
async function checkServerStatus(showNotification = true) {
    if (!window.apiService) {
        console.error('API Service not available');
        return false;
    }

    try {
        const health = await window.apiService.checkHealth();

        if (health.ok) {
            console.log('✅ Server is healthy:', health.message);
            return true;
        } else {
            console.warn('⚠️ Server issue:', health.message);

            if (showNotification && typeof showToast === 'function') {
                showToast(`Server: ${health.message}`, 'warning', 5000);
            }

            return false;
        }
    } catch (error) {
        console.error('❌ Error checking server status:', error);

        if (showNotification && typeof showToast === 'function') {
            showToast('Cannot connect to server', 'error', 5000);
        }

        return false;
    }
}

// Helper function to test API connection on page load
function initializeApiService() {
    // Check server status after a short delay
    setTimeout(async () => {
        const isHealthy = await checkServerStatus(true);

        if (!isHealthy) {
            console.warn('⚠️ API connection issues detected');

            // You can add retry logic here if needed
            setTimeout(() => checkServerStatus(false), 10000); // Retry after 10 seconds
        }
    }, 2000);

    // Clear cache on page refresh
    window.addEventListener('beforeunload', () => {
        if (window.apiService && window.apiService.clearCache) {
            window.apiService.clearCache();
        }
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApiService);
} else {
    initializeApiService();
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}