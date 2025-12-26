// menu.js - Логика страницы меню с интеграцией API

class MenuManager {
    constructor() {
        this.menuItems = [];
        this.filteredItems = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.isLoading = false;
        this.useServerData = true; // Флаг для использования данных с сервера
        this.apiBaseUrl = 'http://localhost:5000/api';

        this.init();
    }

    async init() {
        // Load menu items from API
        await this.loadMenuItems();

        // Register cart update callback
        if (window.cart) {
            window.cart.onCartUpdate(() => {
                this.updateCartButtons();
            });
        }

        // Render initial menu
        this.renderMenu();

        // Bind events
        this.bindEvents();

        // Hide loading
        this.hideLoading();
    }

    // Load menu items from API or fallback to local data
    async loadMenuItems() {
        this.showLoading();

        // Если есть API сервис, пробуем загрузить с сервера
        if (window.apiService && this.useServerData) {
            try {
                // Проверяем доступность сервера
                const serverAvailable = await this.checkServerStatus();

                if (serverAvailable) {
                    // Загружаем с сервера
                    console.log('🔄 Loading products from server...');
                    this.menuItems = await window.apiService.getProducts();

                    if (this.menuItems && this.menuItems.length > 0) {
                        console.log(`✅ Loaded ${this.menuItems.length} products from server`);

                        // Нормализуем данные (на случай если API возвращает другой формат)
                        this.normalizeProductsData();
                    } else {
                        throw new Error('No products received from server');
                    }
                } else {
                    throw new Error('Server unavailable');
                }
            } catch (error) {
                console.warn('⚠️ Failed to load from API, using local data:', error.message);
                this.useServerData = false;
                this.menuItems = this.getLocalProducts();
            }
        } else {
            // Используем локальные данные
            console.log('📦 Using local products data');
            this.menuItems = this.getLocalProducts();
        }

        this.filteredItems = [...this.menuItems];
        this.hideLoading();
    }

    // Проверка статуса сервера
    async checkServerStatus() {
        try {
            if (!window.apiService) {
                console.log('API service not available');
                return false;
            }

            const status = await window.apiService.checkHealth();
            return status.ok;
        } catch (error) {
            console.warn('Server status check failed:', error);
            return false;
        }
    }

    // Нормализация данных продуктов
    normalizeProductsData() {
        this.menuItems = this.menuItems.map(item => ({
            id: item.id || 0,
            name: item.name || 'Unknown Item',
            category: item.category || 'other',
            price: parseFloat(item.price) || 0,
            description: item.description || 'No description available',
            image: item.image || 'default.jpg',
            popular: Boolean(item.popular) || false,
            rating: parseFloat(item.rating) || 0.0,
            is_available: item.is_available !== false
        }));
    }

    // Локальные данные для fallback
    getLocalProducts() {
        return [
            {
                id: 1,
                name: "Flat White",
                category: "hot-coffee",
                price: 3.50,
                description: "Velvety milk, perfectly pulled shots.",
                image: "FlatWhite.jpg",
                popular: true,
                rating: 4.8
            },
            {
                id: 2,
                name: "Cold Brew",
                category: "cold-coffee",
                price: 4.00,
                description: "Slow-steeped for smooth clarity.",
                image: "https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: true,
                rating: 4.6
            },
            {
                id: 3,
                name: "Almond Croissant",
                category: "pastries",
                price: 2.75,
                description: "Buttery, flaky, house-made almond filling.",
                image: "AlmondCroissant.jpeg",
                popular: true,
                rating: 4.9
            },
            {
                id: 4,
                name: "Latte",
                category: "hot-coffee",
                price: 3.25,
                description: "Balanced, creamy — customizable syrups.",
                image: "Latte.jpg",
                popular: true,
                rating: 4.7
            },
            {
                id: 5,
                name: "Espresso",
                category: "hot-coffee",
                price: 2.00,
                description: "Single origin shots; intense and clean.",
                image: "espresso.jpg",
                popular: false,
                rating: 4.5
            },
            {
                id: 6,
                name: "Blueberry Muffin",
                category: "pastries",
                price: 2.50,
                description: "Moist, with a crisp sugar top.",
                image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: false,
                rating: 4.4
            },
            {
                id: 7,
                name: "Mocha",
                category: "hot-coffee",
                price: 4.50,
                description: "Chocolate and espresso harmony.",
                image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: false,
                rating: 4.6
            },
            {
                id: 8,
                name: "Caramel Macchiato",
                category: "cold-coffee",
                price: 4.25,
                description: "Sweet caramel drizzle over smooth espresso.",
                image: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: true,
                rating: 4.8
            },
            {
                id: 9,
                name: "Matcha Latte",
                category: "tea",
                price: 4.00,
                description: "Organic matcha blended with creamy milk.",
                image: "MatchaLatte.jpg",
                popular: false,
                rating: 4.7
            },
            {
                id: 10,
                name: "Banana Bread",
                category: "pastries",
                price: 2.80,
                description: "Soft, moist, baked fresh every morning.",
                image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: false,
                rating: 4.3
            },
            {
                id: 11,
                name: "Cappuccino",
                category: "hot-coffee",
                price: 3.75,
                description: "Perfectly balanced espresso with foamed milk.",
                image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: true,
                rating: 4.8
            },
            {
                id: 12,
                name: "Iced Americano",
                category: "cold-coffee",
                price: 3.00,
                description: "Double shot of espresso over ice.",
                image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: false,
                rating: 4.5
            },
            {
                id: 13,
                name: "Pumpkin Spice Latte",
                category: "specials",
                price: 4.75,
                description: "Seasonal favorite with pumpkin and spices.",
                image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: true,
                rating: 4.9
            },
            {
                id: 14,
                name: "Chai Tea",
                category: "tea",
                price: 3.50,
                description: "Spiced black tea with steamed milk.",
                image: "chai.webp",
                popular: false,
                rating: 4.6
            },
            {
                id: 15,
                name: "Chocolate Chip Cookie",
                category: "pastries",
                price: 2.25,
                description: "Freshly baked with dark chocolate chunks.",
                image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                popular: false,
                rating: 4.7
            }
        ];
    }

    // Обновление кнопок корзины
    updateCartButtons() {
        if (!window.cart) return;

        // Обновление на странице меню
        document.querySelectorAll('.menu-item').forEach(menuItem => {
            const itemId = parseInt(menuItem.dataset.id);
            const isInCart = window.cart.items.some(item => item.id === itemId);
            const button = menuItem.querySelector('.add-to-cart-btn');
            const qtyDisplay = menuItem.querySelector('.qty-display');

            if (button) {
                if (isInCart) {
                    const cartItem = window.cart.items.find(item => item.id === itemId);
                    button.innerHTML = '<i class="fas fa-check"></i> Added';
                    button.classList.add('added');
                    button.disabled = true;

                    if (qtyDisplay) {
                        qtyDisplay.textContent = cartItem.quantity || 1;
                    }
                } else {
                    button.innerHTML = '<i class="fas fa-plus"></i> Add to Cart';
                    button.classList.remove('added');
                    button.disabled = false;

                    if (qtyDisplay) {
                        qtyDisplay.textContent = '1';
                    }
                }
            }
        });

        // Обновление на главной странице (featured items)
        this.updateFeaturedCartButtons();
    }

    // Filter menu items
    filterItems(filter = 'all') {
        this.currentFilter = filter;
        this.currentPage = 1;

        if (filter === 'all') {
            this.filteredItems = [...this.menuItems];
        } else {
            this.filteredItems = this.menuItems.filter(item =>
                item.category === filter && item.is_available !== false
            );
        }

        this.renderMenu();
        this.updateLoadMoreButton();
    }

    // Search menu items
    searchItems(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            this.filterItems(this.currentFilter);
            return;
        }

        this.filteredItems = this.menuItems.filter(item =>
            (item.name && item.name.toLowerCase().includes(searchTerm)) ||
            (item.description && item.description.toLowerCase().includes(searchTerm)) ||
            (item.category && item.category.toLowerCase().includes(searchTerm))
        );

        this.currentPage = 1;
        this.renderMenu();
        this.updateLoadMoreButton();
    }

    // Render menu items
    renderMenu() {
        const menuGrid = document.getElementById('menuGrid');
        if (!menuGrid) return;

        // Calculate items to show
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const itemsToShow = this.filteredItems.slice(0, endIndex);

        if (itemsToShow.length === 0) {
            menuGrid.innerHTML = `
                <div class="empty-menu">
                    <i class="fas fa-coffee"></i>
                    <p>No items found</p>
                    <p class="muted">Try a different search or filter</p>
                </div>
            `;
            return;
        }

        let menuHTML = '';

        itemsToShow.forEach(item => {
            // Check if item is available
            if (item.is_available === false) {
                return; // Skip unavailable items
            }

            // Check if item is in cart
            const isInCart = window.cart?.items.some(cartItem => cartItem.id === item.id);
            const cartItem = isInCart ? window.cart.items.find(cartItem => cartItem.id === item.id) : null;

            menuHTML += `
                <div class="menu-item" data-id="${item.id}" data-category="${item.category}">
                    <img src="${item.image}" alt="${item.name}" class="menu-item-img" loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                    <div class="menu-item-content">
                        <div class="menu-item-header">
                            <h3>${item.name}</h3>
                            <div class="menu-price">$${item.price.toFixed(2)}</div>
                        </div>
                        <span class="menu-item-category">${this.getCategoryLabel(item.category)}</span>
                        <p class="menu-item-description">${item.description}</p>

                        ${item.popular ? `<div class="popular-badge"><i class="fas fa-star"></i> Popular</div>` : ''}

                        ${item.rating ? `<div class="rating-badge">
                            <i class="fas fa-star"></i> ${item.rating.toFixed(1)}
                        </div>` : ''}

                        <div class="menu-item-footer">
                            <div class="quantity-controls">
                                <button class="qty-btn" onclick="menu.decreaseQuantity(${item.id})">-</button>
                                <span class="qty-display" id="qty-${item.id}">${cartItem ? cartItem.quantity : 1}</span>
                                <button class="qty-btn" onclick="menu.increaseQuantity(${item.id})">+</button>
                            </div>
                            <button class="add-to-cart-btn ${isInCart ? 'added' : ''}"
                                    onclick="menu.addToCart(${item.id})"
                                    ${isInCart ? 'disabled' : ''}>
                                <i class="fas fa-${isInCart ? 'check' : 'plus'}"></i>
                                ${isInCart ? 'Added' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        menuGrid.innerHTML = menuHTML;

        // Trigger animations
        setTimeout(() => {
            document.querySelectorAll('.menu-item').forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
                item.classList.add('animate');
            });
        }, 100);
    }

    // Get category label
    getCategoryLabel(category) {
        const labels = {
            'hot-coffee': 'Hot Coffee',
            'cold-coffee': 'Cold Coffee',
            'tea': 'Tea',
            'pastries': 'Pastries',
            'specials': 'Seasonal Special',
            'coffee': 'Coffee',
            'dessert': 'Dessert',
            'drinks': 'Drinks'
        };
        return labels[category] || category.replace('-', ' ').toUpperCase();
    }

    // Quantity controls
    decreaseQuantity(itemId) {
        const qtyElement = document.getElementById(`qty-${itemId}`);
        if (!qtyElement) return;

        let quantity = parseInt(qtyElement.textContent);
        if (quantity > 1) {
            quantity--;
            qtyElement.textContent = quantity;
        }
    }

    increaseQuantity(itemId) {
        const qtyElement = document.getElementById(`qty-${itemId}`);
        if (!qtyElement) return;

        let quantity = parseInt(qtyElement.textContent);
        quantity++;
        qtyElement.textContent = quantity;
    }

    // Add item to cart
    addToCart(itemId) {
        const item = this.menuItems.find(i => i.id === itemId);
        if (!item || !window.cart) return;

        const qtyElement = document.getElementById(`qty-${itemId}`);
        const quantity = qtyElement ? parseInt(qtyElement.textContent) : 1;

        // Add to cart
        window.cart.addItem(item, quantity);

        // Обновляем кнопку сразу (корзина сама вызовет updateCartButtons через коллбэк)
        const button = document.querySelector(`.menu-item[data-id="${itemId}"] .add-to-cart-btn`);
        if (button) {
            button.innerHTML = '<i class="fas fa-check"></i> Added';
            button.classList.add('added');
            button.disabled = true;
        }
    }

    // Load more items
    loadMore() {
        if (this.isLoading) return;

        this.currentPage++;
        this.renderMenu();
        this.updateLoadMoreButton();
    }

    // Update load more button visibility
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;

        const totalItems = this.filteredItems.length;
        const loadedItems = this.currentPage * this.itemsPerPage;

        if (loadedItems >= totalItems) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    // Show loading state
    showLoading() {
        this.isLoading = true;
        const loadingElement = document.getElementById('menuLoading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-coffee fa-spin"></i>
                    <p>Loading menu...</p>
                </div>
            `;
        }
    }

    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        const loadingElement = document.getElementById('menuLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // Bind events
    bindEvents() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Update active button
                document.querySelectorAll('.filter-btn').forEach(btn =>
                    btn.classList.remove('active')
                );
                button.classList.add('active');

                // Apply filter
                const filter = button.dataset.filter;
                this.filterItems(filter);
            });
        });

        // Search input
        const searchInput = document.getElementById('menuSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchItems(e.target.value);
            });

            // Debounce search
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.searchItems(e.target.value);
                }, 300);
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMore();
            });
        }

        // Refresh button (если есть)
        const refreshBtn = document.getElementById('refreshMenu');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                this.useServerData = true;
                await this.loadMenuItems();
                this.filterItems(this.currentFilter);

                if (typeof showToast === 'function') {
                    showToast('Menu refreshed from server', 'success');
                }
            });
        }
    }
}

// Initialize menu manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('menuGrid')) {
        window.menu = new MenuManager();
    }
});

// For homepage featured items
async function initFeaturedItems() {
    const featuredGrid = document.querySelector('.featured-grid');
    if (!featuredGrid) return;

    try {
        let featuredItems = [];

        // Пробуем загрузить с сервера
        if (window.apiService) {
            try {
                const serverAvailable = await checkServerStatus(false);
                if (serverAvailable) {
                    // Получаем популярные товары или первые 3 товара
                    featuredItems = await window.apiService.getProducts();
                    featuredItems = featuredItems
                        .filter(item => item.popular || item.is_available !== false)
                        .slice(0, 3);
                } else {
                    throw new Error('Server unavailable');
                }
            } catch (error) {
                console.log('Using local featured items');
                featuredItems = getLocalFeaturedItems();
            }
        } else {
            featuredItems = getLocalFeaturedItems();
        }

        displayFeaturedItems(featuredItems);
    } catch (error) {
        console.error('Error loading featured items:', error);
        displayFeaturedItems(getLocalFeaturedItems());
    }
}

function displayFeaturedItems(items) {
    const featuredGrid = document.querySelector('.featured-grid');
    if (!featuredGrid) return;

    let featuredHTML = '';

    items.forEach(item => {
        const isInCart = window.cart?.items.some(cartItem => cartItem.id === item.id);

        featuredHTML += `
            <div class="featured-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="featured-img" loading="lazy"
                     onerror="this.src='https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                <div class="featured-content">
                    <h3>${item.name}</h3>
                    <p class="muted">${item.description}</p>
                    <span class="featured-category">${getCategoryLabelForFeatured(item.category)}</span>
                    <div class="featured-price">$${parseFloat(item.price).toFixed(2)}</div>
                    <button class="add-to-cart-btn ${isInCart ? 'added' : ''}"
                            onclick="addFeaturedToCart(${item.id})"
                            ${isInCart ? 'disabled' : ''}
                            style="margin-top: 10px; padding: 8px 16px; font-size: 14px;">
                        <i class="fas fa-${isInCart ? 'check' : 'plus'}"></i>
                        ${isInCart ? 'Added' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `;
    });

    featuredGrid.innerHTML = featuredHTML;
}

function getCategoryLabelForFeatured(category) {
    const labels = {
        'hot-coffee': 'Hot Coffee',
        'cold-coffee': 'Cold Coffee',
        'tea': 'Tea',
        'pastries': 'Pastry',
        'specials': 'Special',
        'coffee': 'Coffee',
        'dessert': 'Dessert'
    };
    return labels[category] || category;
}

function getLocalFeaturedItems() {
    return [
        {
            id: 1,
            name: "Flat White",
            category: "hot-coffee",
            price: 3.50,
            description: "Velvety milk, perfectly pulled shots.",
            image: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 2,
            name: "Cold Brew",
            category: "cold-coffee",
            price: 4.00,
            description: "Slow-steeped for smooth clarity.",
            image: "https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 3,
            name: "Almond Croissant",
            category: "pastries",
            price: 2.75,
            description: "Buttery, flaky, house-made almond filling.",
            image: "https://images.unsplash.com/photo-1555507036-ab794f27d2e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }
    ];
}

// Add featured item to cart
function addFeaturedToCart(itemId) {
    // Ищем товар среди загруженных в меню
    let item = null;

    if (window.menu && window.menu.menuItems) {
        item = window.menu.menuItems.find(i => i.id === itemId);
    }

    // Если не нашли в меню, используем локальные данные
    if (!item) {
        const featuredItems = getLocalFeaturedItems();
        item = featuredItems.find(i => i.id === itemId);
    }

    if (!item || !window.cart) return;

    window.cart.addItem(item);

    // Update button
    const button = document.querySelector(`.featured-item[data-id="${itemId}"] .add-to-cart-btn`);
    if (button) {
        button.innerHTML = '<i class="fas fa-check"></i> Added';
        button.classList.add('added');
        button.disabled = true;
    }
}

// Проверка статуса сервера (вспомогательная функция)
async function checkServerStatus(showNotification = true) {
    if (!window.apiService) return false;

    try {
        const status = await window.apiService.checkHealth();

        if (!status.ok && showNotification) {
            console.warn('Server status:', status.message);

            if (typeof showToast === 'function') {
                showToast(`Server: ${status.message}`, 'warning', 3000);
            }
        }

        return status.ok;
    } catch (error) {
        console.error('Error checking server status:', error);
        return false;
    }
}

// Initialize featured items on homepage
if (document.querySelector('.featured-grid')) {
    document.addEventListener('DOMContentLoaded', initFeaturedItems);
}

// Экспорт для тестирования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuManager;
}