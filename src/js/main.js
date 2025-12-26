// main.js - Общие функции для всех страниц

document.addEventListener('DOMContentLoaded', function() {
    // Hide preloader
    hidePreloader();

    // Set current year in footer
    setCurrentYear();

    // Initialize mobile menu
    initMobileMenu();

    // Initialize scroll animations
    initScrollAnimations();

    // Initialize toast system
    initToastSystem();

    // Update cart count on all pages
    updateCartCount();
});

// Preloader functions
function hidePreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 300);
        }, 800);
    }
}

// Set current year in footer
function setCurrentYear() {
    const yearElements = document.querySelectorAll('#currentYear');
    const currentYear = new Date().getFullYear();
    yearElements.forEach(element => {
        if (element) {
            element.textContent = currentYear;
        }
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.className = navMenu.classList.contains('active')
                    ? 'fas fa-times'
                    : 'fas fa-bars';
            }
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                if (mobileToggle.querySelector('i')) {
                    mobileToggle.querySelector('i').className = 'fas fa-bars';
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('nav') && !event.target.closest('.mobile-toggle')) {
                navMenu.classList.remove('active');
                if (mobileToggle.querySelector('i')) {
                    mobileToggle.querySelector('i').className = 'fas fa-bars';
                }
            }
        });
    }
}

// Scroll animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Observe cards
    document.querySelectorAll('.card, .menu-item, .featured-item').forEach(item => {
        observer.observe(item);
    });
}

// Toast notification system
function initToastSystem() {
    window.showToast = function(message, type = 'success', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ⓘ'}
            </div>
            <div class="toast-message">${message}</div>
        `;

        document.body.appendChild(toast);

        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' :
                        type === 'error' ? '#EF4444' :
                        type === 'info' ? '#3B82F6' : '#FFFFFF'};
            color: white;
            padding: 16px 24px;
            border-radius: var(--radius-md);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(150%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 2000;
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
        }, duration);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.transform = 'translateX(150%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });
    };
}

// Cart count functionality (shared across pages)
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const cart = JSON.parse(localStorage.getItem('brewAndCoCart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

// Black Friday countdown (for homepage)
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

// Contact form validation (shared)
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const message = document.getElementById('message')?.value.trim();

        if (!name || !email || !message) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        // Simulate form submission
        const submitBtn = this.querySelector('.send-btn');
        if (!submitBtn) return;

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            this.reset();
            showToast('Message sent successfully! We\'ll reply within 24 hours.', 'success');
        }, 1500);
    });
}

// Email validation helper
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Initialize countdown on homepage
if (document.getElementById('blackFridayCountdown')) {
    initCountdown();
}

// Initialize contact form if exists
if (document.getElementById('contactForm')) {
    initContactForm();
}

// Функция для динамического расчета отступа сверху
// В main.js или отдельный script
document.addEventListener('DOMContentLoaded', function() {
    // Простой расчет отступа
    function updateMainPadding() {
        const main = document.querySelector('main.container');
        if (!main) return;

        // Фиксированные высоты
        const headerHeight = 80;
        const bannerHeight = 50; // Или измеряем динамически

        const banner = document.querySelector('.countdown-banner');
        const actualBannerHeight = banner ? banner.offsetHeight : bannerHeight;

        // Итоговый отступ
        const totalPadding = headerHeight + actualBannerHeight;

        // Применяем
        main.style.paddingTop = `${totalPadding}px`;

        console.log('Padding updated:', totalPadding + 'px');
    }

    // Вызываем сразу и при ресайзе
    updateMainPadding();
    window.addEventListener('resize', updateMainPadding);

    // Также обновляем через короткую задержку
    setTimeout(updateMainPadding, 100);
    setTimeout(updateMainPadding, 500);
});

function updateAllAddToCartButtons() {
    if (window.cart) {
        window.cart.updateMenuButtons();
    }
}

// Вызывать при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (window.cart) {
        setTimeout(() => {
            window.cart.updateMenuButtons();
        }, 100);
    }
});