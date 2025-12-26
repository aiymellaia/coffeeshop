// cart.js - Логика корзины покупок с интеграцией API

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

    // Загрузка корзины из localStorage
    loadCart() {
        try {
            const savedCart = localStorage.getItem('brewAndCoCart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    // Сохранение корзины в localStorage
    saveCart() {
        try {
            localStorage.setItem('brewAndCoCart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Проверка авторизации (универсальная для клиентов и админов)
    isUserAuthenticated() {
        // Проверяем оба типа токенов
        const userToken = localStorage.getItem('user_token');
        const adminToken = localStorage.getItem('authToken');

        // Проверяем, есть ли данные пользователя
        const userData = localStorage.getItem('user_data');
        const adminData = localStorage.getItem('admin');

        return !!(userToken || adminToken);
    }

    // Получение текущего пользователя
    getCurrentUser() {
        // Пытаемся получить клиента
        try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                user.role = 'customer'; // Добавляем роль
                return user;
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }

        // Пытаемся получить админа
        try {
            const adminData = localStorage.getItem('admin');
            if (adminData) {
                const admin = JSON.parse(adminData);
                admin.role = 'admin'; // Добавляем роль
                return admin;
            }
        } catch (e) {
            console.error('Error parsing admin data:', e);
        }

        return null;
    }

    // Получение токена для авторизации
    getAuthToken() {
        // Пробуем получить токен клиента
        const userToken = localStorage.getItem('user_token');
        if (userToken) return userToken;

        // Пробуем получить токен админа
        const adminToken = localStorage.getItem('authToken');
        if (adminToken) return adminToken;

        return null;
    }

    async submitOrderToServer() {
        // ========== УНИВЕРСАЛЬНАЯ ПРОВЕРКА АВТОРИЗАЦИИ ==========
        if (!this.isUserAuthenticated()) {
            if (typeof showToast === 'function') {
                showToast('Please login or register to place an order', 'error');
            }

            // Предлагаем войти или зарегистрироваться
            setTimeout(() => {
                if (confirm('You need to login to place an order. Go to login page?')) {
                    window.location.href = 'login.html';
                }
            }, 1000);

            return { success: false, message: 'Not authenticated' };
        }

        if (this.items.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Your cart is empty!', 'error');
            }
            return { success: false, message: 'Cart is empty' };
        }

        // Получаем данные пользователя
        const user = this.getCurrentUser();

        // Проверяем, заполнены ли обязательные данные для КЛИЕНТА (админы могут заказывать без full_name и phone)
        if (user && user.role === 'customer') {
            if (!user.full_name || !user.phone) {
                if (typeof showToast === 'function') {
                    showToast('Please complete your profile information', 'error');
                }

                // Предлагаем заполнить профиль
                setTimeout(() => {
                    if (confirm('Please update your profile with name and phone number. Go to profile page?')) {
                        window.location.href = 'profile.html';
                    }
                }, 1000);

                return { success: false, message: 'Incomplete profile' };
            }
        }

        // Подготавливаем данные заказа
        const orderData = {
            items: this.items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            total_amount: this.getTotal(),
            notes: document.getElementById('orderNotes')?.value || '',
            // Для админов добавляем роль (необязательно)
            ...(user && user.role === 'admin' && { ordered_by_admin: true })
        };

        // Show loading state
        const checkoutBtn = document.getElementById('checkoutBtn') || document.querySelector('.checkout-btn');
        let originalText = 'Place Order';

        if (checkoutBtn) {
            originalText = checkoutBtn.innerHTML;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            checkoutBtn.disabled = true;
        }

        try {
            // Получаем токен для авторизации
            const token = this.getAuthToken();

            if (!token) {
                throw new Error('No authentication token found');
            }

            // Send to server WITH AUTH TOKEN
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            // Check if response is OK
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                // Save order ID
                const orderId = result.orderId;

                // Clear cart
                this.clearCart();

                // Show success message
                if (typeof showToast === 'function') {
                    showToast(`Order #${orderId} placed successfully!`, 'success');
                }

                // Show order confirmation with user details
                setTimeout(() => {
                    this.showOrderConfirmation(orderId, user);
                }, 1500);

                return { success: true, orderId: orderId, data: result };
            } else {
                if (typeof showToast === 'function') {
                    showToast('Order failed: ' + (result.error || 'Unknown error'), 'error');
                }
                return { success: false, message: result.error };
            }
        } catch (error) {
            console.error('Order submission error:', error);

            // Determine error type
            let errorMessage = 'Server connection error. Please try again later.';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Cannot connect to server. Please check your internet connection.';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = 'Session expired. Please login again.';
                // Очищаем токены если истекли
                this.clearAuthData();
            } else if (error.message.includes('404')) {
                errorMessage = 'Server not found. Please make sure the backend is running.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error. Please try again later.';
            }

            if (typeof showToast === 'function') {
                showToast(errorMessage, 'error');
            }

            return { success: false, message: errorMessage };
        } finally {
            // Always restore button state
            if (checkoutBtn) {
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
            }
        }
    }

    // Очистка данных авторизации
    clearAuthData() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('admin');
    }

    // Helper method for order confirmation
    showOrderConfirmation(orderId, user = null) {
        const userName = user ? user.full_name || user.username || 'Customer' : 'Customer';
        const userPhone = user ? user.phone : '';
        const userRole = user ? user.role : 'customer';

        // Create a nicer confirmation modal with user info
        const modalHTML = `
            <div class="order-confirmation-modal" style="
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <div style="color: #4CAF50; font-size: 4rem; margin-bottom: 1rem;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2 style="margin-bottom: 1rem; color: #333;">Order Confirmed!</h2>
                    <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">
                        Order <strong>#${orderId}</strong> has been received.
                    </p>
                    ${userRole === 'admin' ?
                        `<p style="color: #666; margin-bottom: 0.5rem;">
                            <i class="fas fa-user-shield"></i> Order placed by administrator
                        </p>` :
                        `<p style="color: #666; margin-bottom: 0.5rem;">
                            Customer: <strong>${userName}</strong>
                        </p>`
                    }
                    ${userPhone && userRole !== 'admin' ?
                        `<p style="color: #666; margin-bottom: 1rem;">
                            We will contact you at: <strong>${userPhone}</strong>
                        </p>` : ''
                    }
                    <p style="color: #666; margin-bottom: 2rem;">
                        Estimated pickup time: <strong>15-20 minutes</strong>
                    </p>
                    <button onclick="this.closest('.order-confirmation-modal').remove()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        font-size: 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: background 0.3s;
                        margin: 5px;
                    " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
                        Continue Shopping
                    </button>
                    ${userRole === 'customer' ?
                        `<button onclick="window.location.href='profile.html#orders'" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            font-size: 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: background 0.3s;
                            margin: 5px;
                        " onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">
                            View My Orders
                        </button>` : ''
                    }
                </div>
            </div>
        `;

        // Remove any existing modal first
        const existingModal = document.querySelector('.order-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
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
        const item = this.items.find(i => i.id === itemId);
        this.items = this.items.filter(i => i.id !== itemId);
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
        this.triggerCartUpdate(); // Обновляем кнопки

        // Show notification
        if (typeof showToast === 'function' && item) {
            showToast(`${item.name} removed from cart`, 'info');
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
        const countElements = document.querySelectorAll('#cart-count, .cart-count');
        const itemCount = this.getItemCount();

        countElements.forEach(element => {
            if (element) {
                element.textContent = itemCount;
                // Show/hide cart count badge
                const parent = element.parentElement;
                if (parent) {
                    if (itemCount > 0) {
                        parent.style.display = 'flex';
                        parent.style.display = 'inline-block';
                    } else {
                        parent.style.display = 'none';
                    }
                }
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
        const checkoutBtn = document.getElementById('checkoutBtn');

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
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.5';
            }

            return;
        }

        // Проверяем авторизацию для кнопки checkout
        const isAuthenticated = this.isUserAuthenticated();

        if (checkoutBtn) {
            checkoutBtn.disabled = !isAuthenticated || this.items.length === 0;
            checkoutBtn.style.opacity = isAuthenticated ? '1' : '0.5';
            checkoutBtn.title = isAuthenticated ? 'Place order' : 'Please login to place order';
        }

        let cartHTML = '';
        const subtotal = this.getTotal();
        const tax = subtotal * 0.085; // 8.5% tax
        const total = subtotal + tax;

        this.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            cartHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image || 'placeholder.jpg'}" alt="${item.name}" class="cart-item-img">
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
        return this;
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

        // Checkout button - ОБНОВЛЕННАЯ ВЕРСИЯ
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', async () => {
                if (this.items.length === 0) {
                    if (typeof showToast === 'function') {
                        showToast('Your cart is empty!', 'error');
                    }
                    return;
                }

                // Проверяем авторизацию
                if (!this.isUserAuthenticated()) {
                    if (typeof showToast === 'function') {
                        showToast('Please login to place an order', 'error');
                    }

                    // Сохраняем корзину перед редиректом
                    this.saveCart();

                    setTimeout(() => {
                        window.location.href = 'login.html?redirect=' +
                            encodeURIComponent(window.location.href) +
                            '&cart=' + encodeURIComponent(JSON.stringify(this.items));
                    }, 1500);
                    return;
                }

                // Проверяем заполнен ли профиль для клиентов
                const user = this.getCurrentUser();
                if (user && user.role === 'customer') {
                    if (!user.full_name || !user.phone) {
                        if (confirm('Please complete your profile with name and phone number before ordering. Go to profile page?')) {
                            window.location.href = 'profile.html';
                        }
                        return;
                    }
                }

                // Отправляем заказ
                await this.submitOrderToServer();
            });
        }

        // Обновляем состояние кнопки checkout при изменении корзины
        this.onCartUpdate(() => {
            if (checkoutBtn) {
                const isAuthenticated = this.isUserAuthenticated();
                checkoutBtn.disabled = !isAuthenticated || this.items.length === 0;
                checkoutBtn.style.opacity = isAuthenticated ? '1' : '0.5';
            }
        });
    }

    // Show customer form if not present (для неавторизованных пользователей)
    showCustomerForm() {
        // Проверяем, авторизован ли пользователь
        if (this.isUserAuthenticated()) {
            // Если авторизован, используем данные профиля
            return this.submitOrderToServer();
        }

        // Create modal for customer details для неавторизованных
        const modalHTML = `
            <div class="customer-form-modal" style="
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9998;
            ">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                ">
                    <h3 style="margin-bottom: 1.5rem; color: #333;">Enter Your Details</h3>
                    <p style="color: #666; margin-bottom: 1rem; font-size: 14px;">
                        <i class="fas fa-info-circle"></i> For faster checkout next time, consider <a href="register.html" style="color: #3498db;">creating an account</a>
                    </p>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Full Name *</label>
                        <input type="text" id="modalCustomerName" placeholder="John Doe" required style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #ddd;
                            border-radius: 8px;
                            font-size: 16px;
                            box-sizing: border-box;
                        ">
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Phone Number *</label>
                        <input type="tel" id="modalCustomerPhone" placeholder="+1 (555) 123-4567" required style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #ddd;
                            border-radius: 8px;
                            font-size: 16px;
                            box-sizing: border-box;
                        ">
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Email (optional)</label>
                        <input type="email" id="modalCustomerEmail" placeholder="john@example.com" style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #ddd;
                            border-radius: 8px;
                            font-size: 16px;
                            box-sizing: border-box;
                        ">
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Special Instructions</label>
                        <textarea id="modalOrderNotes" placeholder="Any special requests or delivery instructions..." rows="3" style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #ddd;
                            border-radius: 8px;
                            font-size: 16px;
                            box-sizing: border-box;
                            resize: vertical;
                        "></textarea>
                    </div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="this.closest('.customer-form-modal').remove()" style="
                            padding: 12px 24px;
                            background: #f0f0f0;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">Cancel</button>
                        <button onclick="cart.submitGuestOrder()" style="
                            padding: 12px 24px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                        ">Place Order as Guest</button>
                    </div>
                </div>
            </div>
        `;

        // Remove any existing modal first
        const existingModal = document.querySelector('.customer-form-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Submit order from modal form (для гостей)
    async submitGuestOrder() {
        // Get values from modal
        const customerName = document.getElementById('modalCustomerName')?.value.trim() || '';
        const customerPhone = document.getElementById('modalCustomerPhone')?.value.trim() || '';
        const customerEmail = document.getElementById('modalCustomerEmail')?.value.trim() || '';
        const orderNotes = document.getElementById('modalOrderNotes')?.value.trim() || '';

        // Validation
        if (!customerName) {
            if (typeof showToast === 'function') {
                showToast('Please enter your name', 'error');
            }
            return;
        }

        if (!customerPhone) {
            if (typeof showToast === 'function') {
                showToast('Please enter your phone number', 'error');
            }
            return;
        }

        // Remove modal
        const modal = document.querySelector('.customer-form-modal');
        if (modal) {
            modal.remove();
        }

        // Submit order as guest
        await this.submitOrderToServer();
    }

    // Get cart summary for order
    getOrderSummary() {
        const items = this.items.map(item => ({
            id: item.id,
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

    // Check if cart has items
    hasItems() {
        return this.items.length > 0;
    }

    // Get item by ID
    getItem(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    // Calculate item total
    getItemTotal(itemId) {
        const item = this.getItem(itemId);
        return item ? item.price * item.quantity : 0;
    }

    // Восстановить корзину из URL параметров
    restoreCartFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const cartParam = urlParams.get('cart');

        if (cartParam) {
            try {
                const restoredItems = JSON.parse(decodeURIComponent(cartParam));
                if (Array.isArray(restoredItems)) {
                    this.items = restoredItems;
                    this.saveCart();
                    this.updateCartCount();
                    this.renderCart();
                    this.triggerCartUpdate();

                    // Очищаем параметр из URL
                    const newUrl = window.location.pathname + window.location.search.replace(/[?&]cart=[^&]+/, '').replace(/^&/, '?');
                    window.history.replaceState({}, document.title, newUrl);

                    return true;
                }
            } catch (error) {
                console.error('Error restoring cart from URL:', error);
            }
        }
        return false;
    }
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();

    // Пробуем восстановить корзину из URL параметров
    window.cart.restoreCartFromUrl();

    // Обновить кнопки после небольшой задержки
    setTimeout(() => {
        if (window.cart) {
            window.cart.updateAddToCartButtons();

            // Проверяем авторизацию и показываем соответствующее сообщение
            if (!window.cart.isUserAuthenticated() && window.cart.hasItems()) {
                const checkoutBtn = document.getElementById('checkoutBtn');
                if (checkoutBtn) {
                    checkoutBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Checkout';
                }
            }
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