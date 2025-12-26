// menu.js - Логика страницы меню

class MenuManager {
    constructor() {
        this.menuItems = [];
        this.filteredItems = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.isLoading = false;

        this.init();
    }

    async init() {
        // Load menu items
        await this.loadMenuItems();

        // Render initial menu
        this.renderMenu();

        // Bind events
        this.bindEvents();

        // Hide loading
        this.hideLoading();
    }

    // Load menu items (in real app, this would be an API call)
    async loadMenuItems() {
        this.showLoading();

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        this.menuItems = [
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

        this.filteredItems = [...this.menuItems];
    }

    // Filter menu items
    filterItems(filter = 'all') {
        this.currentFilter = filter;
        this.currentPage = 1;

        if (filter === 'all') {
            this.filteredItems = [...this.menuItems];
        } else {
            this.filteredItems = this.menuItems.filter(item =>
                item.category === filter
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
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
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
            // Check if item is in cart
            const isInCart = window.cart?.items.some(cartItem => cartItem.id === item.id);

            menuHTML += `
                <div class="menu-item" data-id="${item.id}" data-category="${item.category}">
                    <img src="${item.image}" alt="${item.name}" class="menu-item-img" loading="lazy">
                    <div class="menu-item-content">
                        <div class="menu-item-header">
                            <h3>${item.name}</h3>
                            <div class="menu-price">$${item.price.toFixed(2)}</div>
                        </div>
                        <span class="menu-item-category">${this.getCategoryLabel(item.category)}</span>
                        <p class="menu-item-description">${item.description}</p>

                        ${item.popular ? `<div class="popular-badge"><i class="fas fa-star"></i> Popular</div>` : ''}

                        <div class="menu-item-footer">
                            <div class="quantity-controls">
                                <button class="qty-btn" onclick="menu.decreaseQuantity(${item.id})">-</button>
                                <span class="qty-display" id="qty-${item.id}">${isInCart ? window.cart.items.find(i => i.id === item.id)?.quantity || 1 : 1}</span>
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
            'specials': 'Seasonal Special'
        };
        return labels[category] || category;
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
        if (!item) return;

        const qtyElement = document.getElementById(`qty-${itemId}`);
        const quantity = qtyElement ? parseInt(qtyElement.textContent) : 1;

        // Add to cart
        if (window.cart) {
            window.cart.addItem(item, quantity);

            // Обновление состояния кнопки теперь делается через Cart
            // Не нужно делать это здесь, Cart сам обновит
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
    }
}

// Initialize menu manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('menuGrid')) {
        window.menu = new MenuManager();
    }
});

// For homepage featured items
function initFeaturedItems() {
    const featuredGrid = document.querySelector('.featured-grid');
    if (!featuredGrid) return;

    // Sample featured items (would come from API in real app)
    const featuredItems = [
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

    let featuredHTML = '';

    featuredItems.forEach(item => {
        const isInCart = window.cart?.items.some(cartItem => cartItem.id === item.id);

        featuredHTML += `
            <div class="featured-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="featured-img" loading="lazy">
                <div class="featured-content">
                    <h3>${item.name}</h3>
                    <p class="muted">${item.description}</p>
                    <span class="featured-category">${item.category === 'hot-coffee' ? 'Hot Coffee' :
                                                     item.category === 'cold-coffee' ? 'Cold Coffee' :
                                                     item.category === 'pastries' ? 'Pastry' : item.category}</span>
                    <div class="featured-price">$${item.price.toFixed(2)}</div>
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

// Add featured item to cart
function addFeaturedToCart(itemId) {
    const featuredItems = [
        {
            id: 1,
            name: "Flat White",
            category: "hot-coffee",
            price: 3.50,
            image: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 2,
            name: "Cold Brew",
            category: "cold-coffee",
            price: 4.00,
            image: "https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 3,
            name: "Almond Croissant",
            category: "pastries",
            price: 2.75,
            image: "https://images.unsplash.com/photo-1555507036-ab794f27d2e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }
    ];

    const item = featuredItems.find(i => i.id === itemId);
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

// Initialize featured items on homepage
if (document.querySelector('.featured-grid')) {
    document.addEventListener('DOMContentLoaded', initFeaturedItems);
}