// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 70; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation link highlighting
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.find-card, .explore-text, .about-text');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Counter animation for pricing
function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Trigger counter animation when pricing section is visible
const pricingObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const priceValues = entry.target.querySelectorAll('.price-value');
            priceValues.forEach(priceValue => {
                const text = priceValue.textContent;
                if (text.includes('₱3,300')) {
                    animateCounter(priceValue, 0, 3300, 2000);
                } else if (text.includes('₱300')) {
                    animateCounter(priceValue, 0, 300, 1500);
                } else if (text.includes('₱3,000')) {
                    animateCounter(priceValue, 0, 3000, 1800);
                }
            });
            pricingObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', function() {
    const pricingInfo = document.querySelector('.pricing-info');
    if (pricingInfo) {
        pricingObserver.observe(pricingInfo);
    }
});

// Parallax effect for hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Add some interactive hover effects
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.find-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Add click effect to buttons
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .booking-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add ripple effect CSS
const style = document.createElement('style');
style.textContent = `
    .btn-primary, .btn-secondary, .booking-btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Booking Status Check Function
window.checkBookingStatus = async function() {
    const bookingId = document.getElementById('bookingIdInput').value.trim();
    const resultDiv = document.getElementById('bookingStatusResult');
    
    if (!bookingId) {
        showBookingResult('error', 'Please enter a booking ID');
        return;
    }
    
    // Show loading state
    resultDiv.innerHTML = '<div class="loading">Checking booking status...</div>';
    resultDiv.style.display = 'block';
    resultDiv.className = 'status-result';
    
    try {
        // Import Firebase functions
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js');
        const { getFirestore, collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCgr15-PAggrpDfczz_KS3dXgENdnIWK4w",
            authDomain: "booking-47007.firebaseapp.com",
            projectId: "booking-47007",
            storageBucket: "booking-47007.firebasestorage.app",
            messagingSenderId: "941466249313",
            appId: "1:941466249313:web:55719f70aaadae8d252220",
            measurementId: "G-B9RG31V3CM"
        };
        
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Query Firebase for booking using document ID
        const bookingsRef = collection(db, 'bookings');
        
        // Try to get the document directly by ID
        let bookingDoc;
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingSnapshot = await getDoc(bookingRef);
            
            if (!bookingSnapshot.exists()) {
                showBookingResult('error', 'Booking not found. Please check your booking ID and try again.');
                return;
            }
            
            bookingDoc = bookingSnapshot;
        } catch (error) {
            console.error('Error fetching booking:', error);
            showBookingResult('error', 'Error checking booking status. Please try again later.');
            return;
        }
        
        // Format booking data
        const bookingData = bookingDoc.data();
        const booking = {
            id: bookingDoc.id, // Use Firebase document ID consistently
            customerName: bookingData.customer_name || bookingData.customerName,
            phoneNumber: bookingData.phone_number || bookingData.phoneNumber,
            email: bookingData.email,
            checkIn: bookingData.check_in || bookingData.checkIn,
            checkOut: bookingData.check_out || bookingData.checkOut,
            guests: bookingData.guests,
            extraBeds: bookingData.extra_beds || bookingData.extraBeds,
            totalAmount: bookingData.total_amount || bookingData.totalAmount,
            status: bookingData.status,
            createdAt: bookingData.createdAt ? bookingData.createdAt.toDate().toISOString() : new Date().toISOString()
        };
        
        // Calculate days and nights
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 3600 * 24));
        const nights = days - 1;
        
        // Display booking information
        const statusClass = booking.status === 'confirmed' ? 'success' : 
                          booking.status === 'pending' ? 'pending' : 'error';
        
        resultDiv.innerHTML = `
            <div class="booking-info">
                <h3>Booking Found!</h3>
                <div class="info-row">
                    <span class="info-label">Booking ID:</span>
                    <span class="info-value">${booking.id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Customer Name:</span>
                    <span class="info-value">${booking.customerName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${booking.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${booking.phoneNumber}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Check-in Date:</span>
                    <span class="info-value">${formatDate(booking.checkIn)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Check-out Date:</span>
                    <span class="info-value">${formatDate(booking.checkOut)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${days} days, ${nights} nights</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Number of Guests:</span>
                    <span class="info-value">${booking.guests}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Extra Beds:</span>
                    <span class="info-value">${booking.extraBeds}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Amount:</span>
                    <span class="info-value">₱${booking.totalAmount.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">
                        <span class="status-badge ${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Created At:</span>
                    <span class="info-value">${formatDateTime(booking.createdAt)}</span>
                </div>
            </div>
        `;
        
        resultDiv.className = `status-result ${statusClass}`;
        
    } catch (error) {
        console.error('Error checking booking status:', error);
        showBookingResult('error', 'Error checking booking status. Please try again later.');
    }
}

function showBookingResult(type, message) {
    const resultDiv = document.getElementById('bookingStatusResult');
    resultDiv.innerHTML = `<div class="booking-info"><h3>${message}</h3></div>`;
    resultDiv.className = `status-result ${type}`;
    resultDiv.style.display = 'block';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Copy Booking ID Function
window.copyBookingId = function(bookingId) {
    navigator.clipboard.writeText(bookingId).then(() => {
        // Show success message
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#3498db';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy booking ID:', err);
        alert('Failed to copy booking ID. Please copy manually: ' + bookingId);
    });
}
