// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');
const navMenuClose = document.getElementById('navMenuClose');
const navOverlay = document.getElementById('navOverlay');
const navLinks = document.querySelectorAll('.nav-link');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

// Open menu
mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.add('active');
    navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// Close menu
function closeMenu() {
    navMenu.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

navMenuClose.addEventListener('click', closeMenu);
navOverlay.addEventListener('click', closeMenu);

// Close menu on link click
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        closeMenu();
    });
});

// Dropdown toggle on mobile
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 968) {
            e.preventDefault();
            const dropdown = toggle.parentElement;
            dropdown.classList.toggle('active');
        }
    });
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission
document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Спасибо за заявку! Мы свяжемся с вами в ближайшее время.');
    this.reset();
});

// Phone mask
const phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value[0] === '7' || value[0] === '8') {
            value = value.substring(1);
        }
        let formattedValue = '+7';
        if (value.length > 0) formattedValue += ' (' + value.substring(0, 3);
        if (value.length >= 3) formattedValue += ') ' + value.substring(3, 6);
        if (value.length >= 6) formattedValue += '-' + value.substring(6, 8);
        if (value.length >= 8) formattedValue += '-' + value.substring(8, 10);
        e.target.value = formattedValue;
    }
});

// Set minimum date to today
const dateInput = document.getElementById('eventDate');
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

// Scroll animation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
                entry.target.classList.add('animate');
            }, delay);
        }
    });
}, observerOptions);

const animatedElements = document.querySelectorAll('.service-card, .service-item, .staff-card, .beer-category, .gallery-item, .video-item, .calendar-info, .contact-info, .contact-form');

animatedElements.forEach((el) => {
    const parent = el.parentElement;
    const siblings = Array.from(parent.children).filter(child =>
        child.classList.contains(el.classList[0])
    );
    const siblingIndex = siblings.indexOf(el);
    el.dataset.delay = siblingIndex * 100;

    observer.observe(el);
});
