// homepage.js - Функции для главной страницы

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация featured items
    initFeaturedItems();

    // Инициализация countdown
    initCountdown();

    // Инициализация форм на homepage
    initHomepageForms();
});

// Инициализация featured items
function initFeaturedItems() {
    const featuredGrid = document.querySelector('.featured-grid');
    if (!featuredGrid) return;

    // Sample featured items
    const featuredItems = [
        {
            id: 1,
            name: "Flat White",
            category: "hot-coffee",
            price: 3.50,
            description: "Velvety milk, perfectly pulled shots.",
            image: "FlatWhite.jpg",
            popular: true
        },
        {
            id: 2,
            name: "Cold Brew",
            category: "cold-coffee",
            price: 4.00,
            description: "Slow-steeped for smooth clarity.",
            image: "https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            popular: true
        },
        {
            id: 3,
            name: "Almond Croissant",
            category: "pastries",
            price: 2.75,
            description: "Buttery, flaky, house-made almond filling.",
            image: "AlmondCroissant.jpeg",
            popular: true
        },
        {
            id: 4,
            name: "Matcha Latte",
            category: "tea",
            price: 4.00,
            description: "Organic matcha blended with creamy milk.",
            image: "MatchaLatte.jpg",
            popular: false
        }
    ];

    let featuredHTML = '';

    featuredItems.forEach(item => {
        // Check if item is in cart
        const cart = JSON.parse(localStorage.getItem('brewAndCoCart')) || [];
        const isInCart = cart.some(cartItem => cartItem.id === item.id);

        featuredHTML += `
            <div class="featured-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="featured-img" loading="lazy">
                <div class="featured-content">
                    <h3>${item.name}</h3>
                    <p class="muted">${item.description}</p>
                    <span class="featured-category">${getCategoryLabel(item.category)}</span>
                    <div class="featured-price">$${item.price.toFixed(2)}</div>
                    <button class="btn add-to-cart-btn ${isInCart ? 'added' : ''}"
                            onclick="addFeaturedToCart(${item.id})"
                            ${isInCart ? 'disabled' : ''}
                            style="margin-top: 10px; padding: 10px 20px; font-size: 14px;">
                        <i class="fas fa-${isInCart ? 'check' : 'plus'}"></i>
                        ${isInCart ? 'Added' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `;
    });

    featuredGrid.innerHTML = featuredHTML;
}

// Helper function to get category label
function getCategoryLabel(category) {
    const labels = {
        'hot-coffee': 'Hot Coffee',
        'cold-coffee': 'Cold Coffee',
        'tea': 'Tea',
        'pastries': 'Pastry',
        'specials': 'Seasonal Special'
    };
    return labels[category] || category;
}

// Add featured item to cart
window.addFeaturedToCart = function(itemId) {
    const featuredItems = [
        {
            id: 1,
            name: "Flat White",
            category: "hot-coffee",
            price: 3.50,
            image: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 2,
            name: "Cold Brew",
            category: "cold-coffee",
            price: 4.00,
            image: "https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 3,
            name: "Almond Croissant",
            category: "pastries",
            price: 2.75,
            image: "https://images.unsplash.com/photo-1555507036-ab794f27d2e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 4,
            name: "Matcha Latte",
            category: "tea",
            price: 4.00,
            image: "https://images.unsplash.com/photo-1567396915305-84332f5d5c8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        }
    ];

    const item = featuredItems.find(i => i.id === itemId);
    if (!item) return;

    // Get existing cart
    const cart = JSON.parse(localStorage.getItem('brewAndCoCart')) || [];

    // Check if item already in cart
    const existingItem = cart.find(i => i.id === itemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }

    // Save to localStorage
    localStorage.setItem('brewAndCoCart', JSON.stringify(cart));

    // Update cart count
    updateCartCount();

    // Show notification
    if (typeof showToast === 'function') {
        showToast(`${item.name} added to cart!`, 'success');
    }

    // Update button
    const button = document.querySelector(`.featured-item[data-id="${itemId}"] .add-to-cart-btn`);
    if (button) {
        button.innerHTML = '<i class="fas fa-check"></i> Added';
        button.classList.add('added');
        button.disabled = true;
    }
};

// Update cart count
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count');
    const cart = JSON.parse(localStorage.getItem('brewAndCoCart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = totalItems;
        }
    });
}

// Countdown timer
function initCountdown() {
    const countdownEl = document.getElementById('blackFridayCountdown');
    if (!countdownEl) return;

    function updateTimer() {
        const now = new Date();
        const target = new Date(now.getFullYear(), 10, 29); // November 29

        // If current date is past November 29, target next year
        if (now.getMonth() === 10 && now.getDate() > 29) {
            target.setFullYear(target.getFullYear() + 1);
        } else if (now.getMonth() > 10) {
            target.setFullYear(target.getFullYear() + 1);
        }

        const diff = target - now;

        if (diff <= 0) {
            countdownEl.innerHTML = '<span style="color: var(--gold); font-weight: 700;">Sale is live! 🎉</span>';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.innerHTML = `
            <div class="countdown-unit">
                <span class="value">${days.toString().padStart(2, '0')}</span>
                <span class="label">Days</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="value">${hours.toString().padStart(2, '0')}</span>
                <span class="label">Hours</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="value">${minutes.toString().padStart(2, '0')}</span>
                <span class="label">Minutes</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="value">${seconds.toString().padStart(2, '0')}</span>
                <span class="label">Seconds</span>
            </div>
        `;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// Initialize homepage forms
function initHomepageForms() {
    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();

            if (!email) {
                showToast('Please enter your email', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }

            // Simulate subscription
            emailInput.disabled = true;
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';

            setTimeout(() => {
                showToast('Thanks for subscribing! Check your email for confirmation.', 'success');
                emailInput.value = '';
                emailInput.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1500);
        });
    }

    // Event registration form (if exists)
    const eventBtn = document.querySelector('.event-card .btn');
    if (eventBtn) {
        eventBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('Event registration feature coming soon!', 'info');
        });
    }
}

// Email validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Toast function (if not already defined)
if (typeof showToast === 'undefined') {
    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ⓘ'}</div>
            <div class="toast-message">${message}</div>
        `;

        document.body.appendChild(toast);

        // Style the toast
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' :
                        type === 'error' ? '#EF4444' :
                        '#3B82F6'};
            color: white;
            padding: 16px 24px;
            border-radius: var(--radius-md);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            z-index: 2100;
            max-width: 350px;
        `;

        // Show toast
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(150%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    };
}