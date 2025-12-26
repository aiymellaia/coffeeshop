// cart.js - Логика корзины покупок (ИСПРАВЛЕННЫЙ)

class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.updateCallbacks = []; // Массив коллбэков для обновления UI
        this.init();
    }

    init() {
        this.updateCartCount();
        this.renderCart();
        this.bindEvents();

        // Инициализация обновления кнопок
        this.triggerCartUpdate();
    }

    // Load cart from localStorage
    loadCart() {
        try {
            const cartData = localStorage.getItem('brewAndCoCart');
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem('brewAndCoCart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Add item to cart
    addItem(item, quantity = 1) {
        const existingItem = this.items.find(i => i.id === item.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                ...item,
                quantity: quantity
            });
        }

        this.saveCart();
        this.updateCartCount();
        this.renderCart();
        this.triggerCartUpdate(); // Обновляем кнопки

        // Show notification
        if (typeof showToast === 'function') {
            showToast(`${item.name} added to cart!`, 'success');
        }

        return this;
    }

    // Update item quantity
    updateQuantity(itemId, quantity) {
        const item = this.items.find(i => i.id === itemId);

        if (!item) return this;

        if (quantity <= 0) {
            this.removeItem(itemId);
        } else {
            item.quantity = quantity;
            this.saveCart();
            this.updateCartCount();
            this.renderCart();
            this.triggerCartUpdate(); // Обновляем кнопки
        }

        return this;
    }

    // Remove item from cart
    removeItem(itemId) {
        this.items = this.items.filter(i => i.id !== itemId);
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
        this.triggerCartUpdate(); // Обновляем кнопки

        // Show notification
        if (typeof showToast === 'function') {
            showToast('Item removed from cart', 'info');
        }

        return this;
    }

    // Clear entire cart
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
        this.triggerCartUpdate(); // Обновляем кнопки

        // Show notification
        if (typeof showToast === 'function') {
            showToast('Cart cleared', 'info');
        }

        return this;
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    // Get item count
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Update cart count in header
    updateCartCount() {
        const countElements = document.querySelectorAll('#cart-count');
        const itemCount = this.getItemCount();

        countElements.forEach(element => {
            if (element) {
                element.textContent = itemCount;
            }
        });

        return this;
    }

    // Render cart on page
    renderCart() {
        // For menu page
        this.renderCartSection();
    }

    // Render cart section (menu page)
    renderCartSection() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartSubtotalEl = document.getElementById('cartSubtotal');
        const cartTaxEl = document.getElementById('cartTax');
        const cartTotalEl = document.getElementById('cartTotal');

        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <p class="muted">Add some delicious items from our menu!</p>
                </div>
            `;

            if (cartSubtotalEl) cartSubtotalEl.textContent = '0.00';
            if (cartTaxEl) cartTaxEl.textContent = '0.00';
            if (cartTotalEl) cartTotalEl.textContent = '0.00';

            return;
        }

        let cartHTML = '';
        const subtotal = this.getTotal();
        const tax = subtotal * 0.085; // 8.5% tax
        const total = subtotal + tax;

        this.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            cartHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-category">${item.category || 'Coffee'}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <span class="qty-display">${item.quantity}</span>
                            <button class="qty-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                        <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
                        <button class="cart-remove-btn" onclick="cart.removeItem(${item.id})" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = cartHTML;

        if (cartSubtotalEl) cartSubtotalEl.textContent = subtotal.toFixed(2);
        if (cartTaxEl) cartTaxEl.textContent = tax.toFixed(2);
        if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
    }

    // Обновить состояние кнопок добавления в корзину
    updateAddToCartButtons() {
        // Обновление на странице меню
        document.querySelectorAll('.menu-item').forEach(menuItem => {
            const itemId = parseInt(menuItem.dataset.id);
            const isInCart = this.items.some(item => item.id === itemId);
            const button = menuItem.querySelector('.add-to-cart-btn');
            const qtyDisplay = menuItem.querySelector('.qty-display');

            if (button) {
                if (isInCart) {
                    const cartItem = this.items.find(item => item.id === itemId);
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

    // Обновить кнопки на главной странице
    updateFeaturedCartButtons() {
        document.querySelectorAll('.featured-item').forEach(itemElement => {
            const itemId = parseInt(itemElement.dataset.id);
            const cartButton = itemElement.querySelector('.add-to-cart-btn');

            if (!cartButton) return;

            const isInCart = this.items.some(item => item.id === itemId);

            if (isInCart) {
                cartButton.innerHTML = '<i class="fas fa-check"></i> Added';
                cartButton.classList.add('added');
                cartButton.disabled = true;
            } else {
                cartButton.innerHTML = '<i class="fas fa-plus"></i> Add to Cart';
                cartButton.classList.remove('added');
                cartButton.disabled = false;
            }
        });
    }

    // Зарегистрировать коллбэк для обновления
    onCartUpdate(callback) {
        if (typeof callback === 'function') {
            this.updateCallbacks.push(callback);
        }
    }

    // Вызвать все коллбэки обновления
    triggerCartUpdate() {
        // Обновляем кнопки сразу
        this.updateAddToCartButtons();

        // Вызываем зарегистрированные коллбэки
        this.updateCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in cart update callback:', error);
            }
        });
    }

    // Bind cart events
    bindEvents() {
        // Clear cart button
        const clearCartBtn = document.getElementById('clearCart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your cart?')) {
                    this.clearCart();
                }
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.items.length === 0) {
                    if (typeof showToast === 'function') {
                        showToast('Your cart is empty!', 'error');
                    }
                    return;
                }

                // For demo purposes - in real app, this would redirect to checkout
                if (typeof showToast === 'function') {
                    showToast('Proceeding to checkout...', 'info');
                }

                // Simulate checkout process
                setTimeout(() => {
                    if (typeof showToast === 'function') {
                        showToast('Order placed successfully!', 'success');
                    }
                    this.clearCart();
                }, 2000);
            });
        }
    }

    // Get cart summary for order
    getOrderSummary() {
        const items = this.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        }));

        const subtotal = this.getTotal();
        const tax = subtotal * 0.085;
        const total = subtotal + tax;

        return {
            items,
            subtotal,
            tax,
            total,
            itemCount: this.getItemCount()
        };
    }
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();

    // Обновить кнопки после небольшой задержки (чтобы все элементы успели загрузиться)
    setTimeout(() => {
        if (window.cart) {
            window.cart.updateAddToCartButtons();
        }
    }, 500);
});

// Также добавим функцию для обновления кнопок при навигации
if (typeof window !== 'undefined') {
    // При смене страницы через SPA или при загрузке новой страницы
    window.addEventListener('pageshow', () => {
        if (window.cart) {
            setTimeout(() => {
                window.cart.updateAddToCartButtons();
            }, 100);
        }
    });
}

// Export cart instance for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}