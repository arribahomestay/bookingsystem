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

    // Initialize weather widget
    initializeWeatherWidget();
    
    // Initialize contact form
    initializeContactForm();
    
    // Initialize live sun/moon widget
    initializeSunMoonWidget();
    
    // Initialize draggable weather widget
    initializeDraggableWeatherWidget();
    
    // Initialize logo click functionality
    initializeLogoClick();
    
    // Initialize BOOK NOW button animation
    initializeBookNowAnimation();
    
    // Initialize homepage loading animation
    initializeHomepageLoading();
    
    // Initialize logo fade on scroll (mobile only)
    initializeLogoFadeOnScroll();
    
    // Initialize phone mockup scroll animation
    initializePhoneMockupScroll();
    
    // Initialize phone status bar
    initializePhoneStatusBar();
    
    // Initialize dynamic island interaction
    initializeDynamicIsland();
    
    // Initialize burger menu color change on scroll
    initializeBurgerMenuColor();
});

// Weather Widget Functionality
function initializeWeatherWidget() {
    const API_KEY = '040dfb484d82b8a6e81cdab825242a52';
    const CITY = 'Dapa,PH'; // Primary location for Siargao
    
    // Show loading state
    const weatherContent = document.getElementById('weatherContent');
    weatherContent.innerHTML = `
        <div class="weather-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading weather...</span>
        </div>
    `;
    
    console.log(`Fetching real-time weather for: ${CITY}`);
    
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.cod === 200) {
                console.log(`Successfully fetched real-time weather for: ${CITY}`);
                displayWeather(data);
            } else {
                console.error('Weather API error:', data.message);
                displayWeatherError();
            }
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            displayWeatherError();
        });
}

function displayWeather(data) {
    const weatherContent = document.getElementById('weatherContent');
    const weatherTempCompact = document.getElementById('weatherTempCompact');
    
    // Update compact temperature display
    weatherTempCompact.textContent = `${Math.round(data.main.temp)}°C`;
    
    // Get weather icon
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    // Get weather description
    const description = data.weather[0].description;
    const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);
    
    // Add weather background animation based on conditions
    addWeatherAnimation(data);
    
    weatherContent.innerHTML = `
        <div class="weather-details">
            <div class="weather-detail">
                <i class="fas fa-eye"></i>
                <span>${capitalizedDescription}</span>
            </div>
            <div class="weather-detail">
                <i class="fas fa-tint"></i>
                <span>${data.main.humidity}%</span>
            </div>
            <div class="weather-detail">
                <i class="fas fa-wind"></i>
                <span>${data.wind.speed} m/s</span>
            </div>
            <div class="weather-detail">
                <i class="fas fa-thermometer-half"></i>
                <span>Feels like ${Math.round(data.main.feels_like)}°C</span>
            </div>
        </div>
        <div class="weather-location">
            <i class="fas fa-map-marker-alt"></i>
            <span>Dapa, General Luna, Siargao</span>
        </div>
    `;
}

function displayWeatherError() {
    const weatherContent = document.getElementById('weatherContent');
    weatherContent.innerHTML = `
        <div class="weather-error">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Unable to load weather data</span>
            <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">
                <i class="fas fa-refresh"></i>
                <span>Please refresh the page to try again</span>
            </div>
        </div>
    `;
}

// Add weather background animations based on conditions
function addWeatherAnimation(data) {
    const weatherWidget = document.getElementById('weatherWidget');
    
    // Remove existing animations
    const existingAnimations = weatherWidget.querySelectorAll('.weather-widget-rain, .weather-widget-wind, .weather-widget-sun');
    existingAnimations.forEach(anim => anim.remove());
    
    const description = data.weather[0].description.toLowerCase();
    const temperature = data.main.temp;
    const windSpeed = data.wind.speed;
    
    // Rain animation for rainy conditions
    if (description.includes('rain') || description.includes('drizzle') || description.includes('shower')) {
        const rainContainer = document.createElement('div');
        rainContainer.className = 'weather-widget-rain';
        
        // Create multiple rain drops
        for (let i = 0; i < 15; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDelay = Math.random() * 2 + 's';
            drop.style.animationDuration = (Math.random() * 1 + 0.5) + 's';
            rainContainer.appendChild(drop);
        }
        
        weatherWidget.appendChild(rainContainer);
    }
    
    // Cloudy animation for cloudy conditions
    else if (description.includes('cloud') || description.includes('overcast') || description.includes('cloudy')) {
        const cloudsContainer = document.createElement('div');
        cloudsContainer.className = 'weather-widget-clouds';
        
        // Create multiple clouds of different sizes
        for (let i = 0; i < 8; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            
            // Random cloud size
            const cloudSizes = ['cloud-small', 'cloud-medium', 'cloud-large'];
            const randomSize = cloudSizes[Math.floor(Math.random() * cloudSizes.length)];
            cloud.classList.add(randomSize);
            
            // Position clouds in the background (avoid center where text is)
            const topPosition = Math.random() * 60 + 10; // 10% to 70% from top
            const leftPosition = Math.random() * 80 + 10; // 10% to 90% from left
            cloud.style.top = topPosition + '%';
            cloud.style.left = leftPosition + '%';
            cloud.style.animationDelay = Math.random() * 10 + 's';
            
            cloudsContainer.appendChild(cloud);
        }
        
        weatherWidget.appendChild(cloudsContainer);
    }
    
    // Wind animation for windy conditions
    else if (windSpeed > 3 || description.includes('wind')) {
        const windContainer = document.createElement('div');
        windContainer.className = 'weather-widget-wind';
        
        // Create wind particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'wind-particle';
            particle.style.top = Math.random() * 80 + 10 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            particle.style.animationDuration = (Math.random() * 2 + 1) + 's';
            windContainer.appendChild(particle);
        }
        
        weatherWidget.appendChild(windContainer);
    }
    
    // REMOVED: Hot sun animation for hot weather (sun rays removed as requested)
    // No animation for clear/sunny weather
}

// Toggle weather widget between compact and expanded view
function toggleWeatherWidget() {
    const weatherContent = document.getElementById('weatherContent');
    const weatherToggleIcon = document.getElementById('weatherToggleIcon');
    
    if (weatherContent.style.display === 'none') {
        // Expand
        weatherContent.style.display = 'block';
        weatherToggleIcon.style.transform = 'rotate(180deg)';
    } else {
        // Collapse
        weatherContent.style.display = 'none';
        weatherToggleIcon.style.transform = 'rotate(0deg)';
    }
}

// Contact Form Functionality
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }
}

function handleContactSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('contactName'),
        email: formData.get('contactEmail'),
        subject: formData.get('contactSubject'),
        message: formData.get('contactMessage'),
        submittedAt: new Date().toISOString(),
        status: 'new'
    };
    
    // Show loading state
    const submitBtn = e.target.querySelector('.tropical-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Save to Firebase
    saveContactMessage(contactData)
        .then(() => {
            showContactMessage('Thank you for your message! We\'ll get back to you soon.', 'success');
            e.target.reset();
        })
        .catch(error => {
            console.error('Error saving contact message:', error);
            showContactMessage('Sorry, there was an error sending your message. Please try again.', 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

async function saveContactMessage(contactData) {
    try {
        // Import Firestore functions
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        // Use the globally available db object
        if (!window.db) {
            throw new Error('Firebase not initialized');
        }
        
        const db = window.db;
        
        // Add document to suggestions collection
        const docRef = await addDoc(collection(db, 'suggestions'), contactData);
        console.log('Contact message saved with ID:', docRef.id);
        return docRef.id;
        
    } catch (error) {
        console.error('Error saving contact message:', error);
        throw error;
    }
}

function showContactMessage(message, type) {
    const messageDiv = document.getElementById('contactSubmitMessage');
    messageDiv.textContent = message;
    messageDiv.className = `contact-submit-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

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

// Live Sun/Moon Widget Functionality
function initializeSunMoonWidget() {
    const widget = document.getElementById('sunMoonWidget');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    const timeDisplay = document.getElementById('timeDisplay');
    const sunsetTime = document.getElementById('sunsetTime');
    
    // Siargao coordinates
    const LATITUDE = 9.7594;
    const LONGITUDE = 126.0531;
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    // Make widget draggable
    widget.addEventListener('mousedown', startDrag);
    widget.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
        isDragging = true;
        widget.style.cursor = 'grabbing';
        
        if (e.type === 'mousedown') {
            startX = e.clientX;
            startY = e.clientY;
        } else {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
        
        initialX = widget.offsetLeft;
        initialY = widget.offsetTop;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        let currentX, currentY;
        if (e.type === 'mousemove') {
            currentX = e.clientX;
            currentY = e.clientY;
        } else {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        }
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;
        
        // Keep widget within viewport with faster boundary detection
        const widgetWidth = widget.offsetWidth;
        const widgetHeight = widget.offsetHeight;
        const maxX = window.innerWidth - widgetWidth;
        const maxY = window.innerHeight - widgetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        // Use transform for smoother, faster movement
        widget.style.transform = `translate(${newX - initialX}px, ${newY - initialY}px)`;
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
        widget.style.cursor = 'move';
        
        // Finalize position
        const currentTransform = widget.style.transform;
        const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (translateMatch) {
            const deltaX = parseFloat(translateMatch[1]);
            const deltaY = parseFloat(translateMatch[2]);
            const finalX = initialX + deltaX;
            const finalY = initialY + deltaY;
            
            widget.style.left = finalX + 'px';
            widget.style.top = finalY + 'px';
            widget.style.transform = '';
        }
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
    }
    
    // Update time and sun/moon display
    function updateSunMoon() {
        const now = new Date();
        const philippinesTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
        
        // Update time display
        const timeString = philippinesTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        timeDisplay.textContent = timeString;
        
        // Calculate sunrise and sunset for today
        const sunrise = calculateSunrise(LATITUDE, LONGITUDE, philippinesTime);
        const sunset = calculateSunset(LATITUDE, LONGITUDE, philippinesTime);
        
        // Determine if it's day or night
        const currentHour = philippinesTime.getHours();
        const sunriseHour = sunrise.getHours();
        const sunsetHour = sunset.getHours();
        
        const isDay = currentHour >= sunriseHour && currentHour < sunsetHour;
        
        // Update sun/moon display
        if (isDay) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            widget.className = 'live-sun-moon-widget day';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            widget.className = 'live-sun-moon-widget night';
        }
    }
    
    // Calculate sunrise time
    function calculateSunrise(lat, lng, date) {
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
        const declination = 23.45 * Math.sin((284 + dayOfYear) * Math.PI / 180);
        const hourAngle = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(declination * Math.PI / 180));
        const sunrise = 12 - hourAngle * 12 / Math.PI;
        
        const sunriseDate = new Date(date);
        sunriseDate.setHours(Math.floor(sunrise));
        sunriseDate.setMinutes((sunrise % 1) * 60);
        
        return sunriseDate;
    }
    
    // Calculate sunset time
    function calculateSunset(lat, lng, date) {
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
        const declination = 23.45 * Math.sin((284 + dayOfYear) * Math.PI / 180);
        const hourAngle = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(declination * Math.PI / 180));
        const sunset = 12 + hourAngle * 12 / Math.PI;
        
        const sunsetDate = new Date(date);
        sunsetDate.setHours(Math.floor(sunset));
        sunsetDate.setMinutes((sunset % 1) * 60);
        
        return sunsetDate;
    }
    
    // Initialize and update every second
    updateSunMoon();
    setInterval(updateSunMoon, 1000);
}

// Draggable Weather Widget Functionality
function initializeDraggableWeatherWidget() {
    const widget = document.getElementById('weatherWidget');
    
    if (!widget) return;
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    // Make widget draggable
    widget.addEventListener('mousedown', startDrag);
    widget.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
        // Don't start drag if clicking on buttons or interactive elements
        if (e.target.closest('.weather-refresh-btn') || 
            e.target.closest('.weather-toggle-btn') ||
            e.target.closest('.weather-compact')) {
            return;
        }
        
        isDragging = true;
        widget.style.cursor = 'grabbing';
        
        if (e.type === 'mousedown') {
            startX = e.clientX;
            startY = e.clientY;
        } else {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
        
        initialX = widget.offsetLeft;
        initialY = widget.offsetTop;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        let currentX, currentY;
        if (e.type === 'mousemove') {
            currentX = e.clientX;
            currentY = e.clientY;
        } else {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        }
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;
        
        // Keep widget within viewport
        const widgetWidth = widget.offsetWidth;
        const widgetHeight = widget.offsetHeight;
        const maxX = window.innerWidth - widgetWidth;
        const maxY = window.innerHeight - widgetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        // Use transform for smoother, faster movement
        widget.style.transform = `translate(${newX - initialX}px, ${newY - initialY}px)`;
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
        widget.style.cursor = 'move';
        
        // Finalize position
        const currentTransform = widget.style.transform;
        const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (translateMatch) {
            const deltaX = parseFloat(translateMatch[1]);
            const deltaY = parseFloat(translateMatch[2]);
            const finalX = initialX + deltaX;
            const finalY = initialY + deltaY;
            
            widget.style.left = finalX + 'px';
            widget.style.top = finalY + 'px';
            widget.style.transform = '';
        }
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
    }
}

// Logo Click Functionality
function initializeLogoClick() {
    const logoLink = document.querySelector('.logo-link');
    
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Scroll to top of page smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Update active navigation link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#home') {
                    link.classList.add('active');
                }
            });
            
            // Close mobile menu if open
            const navMenu = document.getElementById('navMenu');
            const navToggle = document.getElementById('navToggle');
            if (navMenu && navToggle) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }
}

// BOOK NOW Button Animation
function initializeBookNowAnimation() {
    const bookNowButtons = document.querySelectorAll('.booking-btn');
    
    bookNowButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Prevent default navigation temporarily
            e.preventDefault();
            
            // Add animation class
            this.classList.add('animate');
            
            // Show loading bubble animation
            showLoadingBubble();
            
            // Wait for button animation to complete
            setTimeout(() => {
                // Remove button animation
                this.classList.remove('animate');
            }, 600);
            
            // Wait for complete loading animation, then navigate smoothly
            setTimeout(() => {
                // Smooth navigation to booking page
                const targetUrl = this.getAttribute('href');
                
                // Add smooth transition class to body
                document.body.style.transition = 'all 0.5s ease-in-out';
                document.body.style.opacity = '0.8';
                document.body.style.transform = 'scale(0.98)';
                
                // Navigate after smooth transition
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 300);
            }, 1800); // Total animation time: 0.6s button + 1.2s loading
        });
        
        // Add hover effect
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(52, 152, 219, 0.4)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.3)';
        });
    });
}

// Loading Bubble Animation
function showLoadingBubble() {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    
    // Create loading bubble
    const bubble = document.createElement('div');
    bubble.className = 'loading-bubble';
    
    // Add to page
    overlay.appendChild(bubble);
    document.body.appendChild(overlay);
    
    // Add smooth transition to body
    document.body.classList.add('smooth-transition');
    
    // Remove loading elements after animation completes
    setTimeout(() => {
        // Fade out the loading bubble smoothly
        overlay.style.transition = 'opacity 0.3s ease-out';
        overlay.style.opacity = '0';
        
        // Remove from DOM after fade
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            document.body.classList.remove('smooth-transition');
        }, 300);
    }, 1200);
}

// Homepage Loading Animation
function initializeHomepageLoading() {
    // Check if this is a return visit (not first load)
    const isReturnVisit = sessionStorage.getItem('homepageVisited');
    
    if (isReturnVisit) {
        // Show homepage loading animation
        showHomepageLoading();
    } else {
        // Mark as visited for future visits
        sessionStorage.setItem('homepageVisited', 'true');
    }
    
    // Add entrance animation to main content
    const mainContent = document.querySelector('.hero');
    if (mainContent) {
        mainContent.classList.add('homepage-entrance');
    }
}

// Show Homepage Loading Animation
function showHomepageLoading() {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'homepage-loading';
    
    // Add to page
    document.body.appendChild(loadingOverlay);
    
    // Remove loading after animation completes
    setTimeout(() => {
        if (loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
    }, 1500);
}

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
            adults: bookingData.adults,
            kids: bookingData.kids,
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
                    <span class="info-label">Number of Adults:</span>
                    <span class="info-value">${booking.adults}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Number of Kids:</span>
                    <span class="info-value">${booking.kids || 0}</span>
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
    if (!bookingId || bookingId.trim() === '') {
        alert('No booking ID available to copy');
        return;
    }
    
    // Try multiple copy methods
    const copyToClipboard = async (text) => {
        // Method 1: Modern Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.log('Clipboard API failed:', err);
            }
        }
        
        // Method 2: Fallback for older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                return true;
            }
        } catch (err) {
            console.log('Fallback copy failed:', err);
        }
        
        return false;
    };
    
    copyToClipboard(bookingId).then(success => {
        if (success) {
            // Show success message
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = '#27ae60';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#3498db';
            }, 2000);
        } else {
            // Show manual copy option
            const manualCopy = confirm(`Copy this booking ID manually:\n\n${bookingId}\n\nClick OK to select the text.`);
            if (manualCopy) {
                // Create a temporary input to select the text
                const tempInput = document.createElement('input');
                tempInput.value = bookingId;
                tempInput.style.position = 'fixed';
                tempInput.style.left = '-999999px';
                tempInput.style.top = '-999999px';
                document.body.appendChild(tempInput);
                tempInput.select();
                tempInput.setSelectionRange(0, 99999);
                document.body.removeChild(tempInput);
                
                alert('Booking ID selected! Press Ctrl+C (or Cmd+C on Mac) to copy.');
            }
        }
    }).catch(err => {
        console.error('Copy failed:', err);
        alert(`Failed to copy booking ID. Please copy manually: ${bookingId}`);
    });
}

// Review System Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeReviewSystem();
});

function initializeReviewSystem() {
    const reviewForm = document.getElementById('reviewForm');
    const imageInput = document.getElementById('reviewImages');
    const videoInput = document.getElementById('reviewVideos');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');

    // File upload handling
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
    
    if (videoInput) {
        videoInput.addEventListener('change', handleVideoUpload);
    }

    // Form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmission);
    }

    // Load approved reviews
    loadApprovedReviews();
}

function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    const imagePreview = document.getElementById('imagePreview');
    
    console.log('Image upload triggered. Files received:', files.length);
    console.log('Files details:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Clear previous previews
    imagePreview.innerHTML = '';
    
    // Limit to 5 images
    if (files.length > 5) {
        alert('You can only upload up to 5 images.');
        files.splice(5);
        event.target.files = createFileList(files);
    }
    
    files.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-file" onclick="removeFile(this, 'image', ${index})">×</button>
                `;
                imagePreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        }
    });
}

function handleVideoUpload(event) {
    const files = Array.from(event.target.files);
    const videoPreview = document.getElementById('videoPreview');
    
    // Clear previous previews
    videoPreview.innerHTML = '';
    
    // Limit to 2 videos and 50MB each
    if (files.length > 2) {
        alert('You can only upload up to 2 videos.');
        files.splice(2);
        event.target.files = createFileList(files);
    }
    
    files.forEach((file, index) => {
        if (file.type.startsWith('video/')) {
            // Check file size (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                alert(`Video "${file.name}" is too large. Maximum size is 50MB.`);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <video src="${e.target.result}" controls></video>
                    <button type="button" class="remove-file" onclick="removeFile(this, 'video', ${index})">×</button>
                `;
                videoPreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        }
    });
}

function createFileList(files) {
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    return dt.files;
}

function removeFile(button, type, index) {
    const previewContainer = button.closest('.preview-item').parentNode;
    button.closest('.preview-item').remove();
    
    // Update the file input
    const input = type === 'image' ? document.getElementById('reviewImages') : document.getElementById('reviewVideos');
    const files = Array.from(input.files);
    files.splice(index, 1);
    
    // Create new FileList and assign it
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    input.files = dt.files;
    
    console.log(`File removed. ${type} files remaining:`, input.files.length);
}

async function handleReviewSubmission(event) {
    event.preventDefault();
    
    const submitBtn = document.querySelector('.submit-review-btn');
    const submitMessage = document.getElementById('submitMessage');
    
    // Generate unique review ID
    const reviewId = generateReviewId();
    
    // Get form data
    const formData = new FormData(event.target);
    
    // Get files directly from the input elements
    const imageInput = document.getElementById('reviewImages');
    const videoInput = document.getElementById('reviewVideos');
    
    console.log('Image input files:', imageInput.files);
    console.log('Video input files:', videoInput.files);
    console.log('Image files length:', imageInput.files.length);
    console.log('Video files length:', videoInput.files.length);
    
    const reviewData = {
        reviewId: reviewId, // Add unique ID
        customerName: formData.get('customerName'),
        reviewText: formData.get('reviewText'),
        rating: formData.get('rating'),
        images: Array.from(imageInput.files),
        videos: Array.from(videoInput.files),
        status: 'pending', // All reviews start as pending
        submittedAt: new Date().toISOString()
    };
    
    // Validate required fields
    if (!reviewData.customerName || !reviewData.reviewText || !reviewData.rating) {
        showSubmitMessage('error', 'Please fill in all required fields.');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        console.log('Review data before upload:', reviewData);
        console.log('Images to upload:', reviewData.images);
        console.log('Videos to upload:', reviewData.videos);
        
        // Upload files to cloud storage with unique review ID
        const uploadedFiles = await uploadFilesToCloud(reviewData.images, reviewData.videos, reviewId);
        
        console.log('Uploaded files result:', uploadedFiles);
        
        // Save review to database
        const reviewToSave = {
            ...reviewData,
            images: uploadedFiles.images,
            videos: uploadedFiles.videos
        };
        
        console.log('Review data to save:', reviewToSave);
        await saveReviewToDatabase(reviewToSave);
        
        // Show success message
        showSubmitMessage('success', 'Thank you for your review!');
        
        // Reset form
        event.target.reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('videoPreview').innerHTML = '';
        
    } catch (error) {
        console.error('Error submitting review:', error);
        showSubmitMessage('error', 'Sorry, there was an error submitting your review. Please try again later.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
    }
}

// Generate unique review ID
function generateReviewId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `REV_${timestamp}_${random}`.toUpperCase();
}

async function uploadFilesToCloud(images, videos, reviewId) {
    const uploadedFiles = {
        images: [],
        videos: []
    };
    
    console.log('Upload function called with:', { images, videos, reviewId });
    
    // Only process files that actually exist and have content
    const validImages = images.filter(file => file && file.size > 0);
    const validVideos = videos.filter(file => file && file.size > 0);
    
    console.log('Valid images:', validImages.length, 'Valid videos:', validVideos.length);
    
    if (validImages.length === 0 && validVideos.length === 0) {
        console.log('No valid files to upload');
        return uploadedFiles; // No files to upload
    }
    
    // Upload images to Cloudinary
    for (let i = 0; i < validImages.length; i++) {
        const file = validImages[i];
        try {
            const imageUrl = await uploadToCloudinary(file, `reviews/${reviewId}/image_${i + 1}`);
            uploadedFiles.images.push(imageUrl);
            console.log(`Image ${i + 1} uploaded to Cloudinary:`, imageUrl);
        } catch (error) {
            console.error(`Error uploading image ${i + 1} to Cloudinary:`, error);
            // Continue with other files even if one fails
        }
    }
    
    // Upload videos to Cloudinary
    for (let i = 0; i < validVideos.length; i++) {
        const file = validVideos[i];
        try {
            const videoUrl = await uploadToCloudinary(file, `reviews/${reviewId}/video_${i + 1}`);
            uploadedFiles.videos.push(videoUrl);
            console.log(`Video ${i + 1} uploaded to Cloudinary:`, videoUrl);
        } catch (error) {
            console.error(`Error uploading video ${i + 1} to Cloudinary:`, error);
            // Continue with other files even if one fails
        }
    }
    
    return uploadedFiles;
}

// Upload file to Cloudinary
async function uploadToCloudinary(file, publicId) {
    console.log('Uploading to Cloudinary:', { fileName: file.name, publicId });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'arriba_receipts'); // Use existing preset
    formData.append('api_key', '435329188695635'); // Use same API key as receipts
    
    const response = await fetch('https://api.cloudinary.com/v1_1/djghkklph/image/upload', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload failed:', response.status, errorText);
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Cloudinary upload success:', data.secure_url);
    return data.secure_url;
}

async function saveReviewToDatabase(reviewData) {
    // This is a placeholder for database integration
    // In a real implementation, you would save to Firebase Firestore
    
    try {
        console.log('Saving review to database:', reviewData);
        
        // Import Firebase functions
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js');
        const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
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
        
        // Save review to Firestore
        const docRef = await addDoc(collection(db, 'reviews'), reviewData);
        
        console.log('Review saved to database with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving review to database:', error);
        throw error;
    }
}

// Pagination variables for reviews
let currentReviewsPage = 1;
const reviewsPerPage = 6; // Show 6 reviews per page
let totalReviews = 0;
let allReviews = [];

async function loadApprovedReviews(page = 1) {
    try {
        // Show loading state
        showReviewsLoading();
        
        // Import Firebase functions
        const { collection, query, where, getDocs, orderBy, limit, startAfter, limitToLast } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        // Use the globally available db object
        if (!window.db) {
            throw new Error('Firebase not initialized');
        }
        
        const db = window.db;
        
        // Query approved reviews - simplified to avoid index issues
        const reviewsRef = collection(db, 'reviews');
        
        // Get all approved reviews (exclude deleted ones)
        const allReviewsQuery = query(reviewsRef, where('status', '==', 'approved'));
        const allSnapshot = await getDocs(allReviewsQuery);
        
        allReviews = [];
        allSnapshot.forEach((doc) => {
            allReviews.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by submittedAt date (client-side sorting)
        allReviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        totalReviews = allReviews.length;
        
        // FOR PHONE MOCKUP - SHOW ALL REVIEWS FOR SCROLL EFFECT
        // Check if we're in phone view (phone container exists)
        const phoneContainer = document.querySelector('.phone-mockup-container');
        
        if (phoneContainer) {
            // Show all reviews in phone for continuous scroll
            displayReviews(allReviews, 1, true); // Pass true to indicate phone view
        } else {
            // Calculate pagination for regular view
            const startIndex = (page - 1) * reviewsPerPage;
            const endIndex = startIndex + reviewsPerPage;
            const pageReviews = allReviews.slice(startIndex, endIndex);
            
            displayReviews(pageReviews, page, false);
        }
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        showNoReviewsMessage();
    }
}

function showReviewsLoading() {
    const reviewsGrid = document.getElementById('approvedReviews');
    reviewsGrid.innerHTML = `
        <div class="reviews-loading">
            <i class="fas fa-spinner"></i>
            <p>Loading reviews...</p>
        </div>
    `;
}

function displayReviews(reviews, page = 1, isPhoneView = false) {
    const reviewsGrid = document.getElementById('approvedReviews');
    
    if (reviews.length === 0) {
        showNoReviewsMessage();
        return;
    }
    
    // Display reviews
    reviewsGrid.innerHTML = reviews.map(review => createReviewCard(review)).join('');
    
    // Only add pagination if not in phone view
    if (!isPhoneView) {
        addPaginationControls(page);
    }
    
    // Add click handlers for media viewing
    addMediaViewers();
    
    // RESTORE INSTAGRAM LIKES AND SAVES FROM LOCALSTORAGE
    if (isPhoneView) {
        setTimeout(() => {
            restoreInstagramLikes();
            restoreInstagramSaves();
        }, 100);
    }
}

function showNoReviewsMessage() {
    const reviewsGrid = document.getElementById('approvedReviews');
    reviewsGrid.innerHTML = `
        <div class="no-reviews-message">
            <i class="fas fa-star"></i>
            <h4>Be the First to Share Your Experience!</h4>
            <p>No reviews yet. Share your experience with Arriba Homestay and help other guests discover our amazing services.</p>
        </div>
    `;
}

function addPaginationControls(currentPage) {
    const reviewsGrid = document.getElementById('approvedReviews');
    const totalPages = Math.ceil(totalReviews / reviewsPerPage);
    
    // Only show pagination if there are multiple pages
    if (totalPages <= 1) {
        return;
    }
    
    const paginationHtml = `
        <div class="reviews-pagination">
            <button class="pagination-btn" onclick="loadApprovedReviews(1)" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-double-left"></i> First
            </button>
            <button class="pagination-btn" onclick="loadApprovedReviews(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-left"></i> Previous
            </button>
            <span class="pagination-info">
                Page ${currentPage} of ${totalPages} (${totalReviews} reviews)
            </span>
            <button class="pagination-btn" onclick="loadApprovedReviews(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fas fa-angle-right"></i>
            </button>
            <button class="pagination-btn" onclick="loadApprovedReviews(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
                Last <i class="fas fa-angle-double-right"></i>
            </button>
        </div>
    `;
    
    reviewsGrid.insertAdjacentHTML('beforeend', paginationHtml);
}

function createReviewCard(review) {
    const stars = Array(5).fill().map((_, i) => 
        i < review.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'
    ).join('');
    
    const date = new Date(review.submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // SHORT DATE FOR INSTAGRAM STYLE
    const shortDate = new Date(review.submittedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    
    let mediaHtml = '';
    
    // Only show images if they exist and have valid URLs
    if (review.images && review.images.length > 0 && review.images[0] !== '') {
        const validImages = review.images.filter(img => img && img !== '');
        mediaHtml += validImages.map(img => 
            `<img src="${img}" alt="Guest photo" class="review-image" onclick="openMediaModal('${img}', 'image')" onerror="this.style.display='none'; this.parentElement.style.display='none';">`
        ).join('');
    }
    
    // Only show videos if they exist and have valid URLs
    if (review.videos && review.videos.length > 0 && review.videos[0] !== '') {
        mediaHtml += review.videos.filter(vid => vid && vid !== '').map(vid => 
            `<video src="${vid}" class="review-video" controls onclick="openMediaModal('${vid}', 'video')" onerror="this.style.display='none'"></video>`
        ).join('');
    }
    
    // CHECK IF INSIDE PHONE MOCKUP - CREATE INSTAGRAM STYLE
    const phoneContainer = document.querySelector('.phone-mockup-container');
    const isInPhone = phoneContainer && document.getElementById('phoneReviewsContainer');
    
    if (isInPhone) {
        // GET INITIALS FOR AVATAR
        const initials = review.customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        // GENERATE UNIQUE ID FOR LIKE BUTTON (USE REVIEW ID OR CREATE HASH FROM NAME + DATE)
        const reviewId = review.id || `${review.customerName}-${review.submittedAt}`.replace(/[^a-zA-Z0-9]/g, '');
        const likeId = `like-${reviewId}`;
        const saveId = `save-${reviewId}`;
        
        return `
            <div class="review-card">
                <!-- INSTAGRAM POST HEADER -->
                <div class="instagram-post-header">
                    <div class="instagram-post-user">
                        <div class="instagram-avatar">${initials}</div>
                        <span class="instagram-username">${review.customerName}</span>
                    </div>
                    <button class="instagram-menu-btn">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
                
                <!-- INSTAGRAM POST MEDIA -->
                ${mediaHtml ? `
                    <div class="instagram-post-media">
                        ${mediaHtml}
                    </div>
                ` : ''}
                
                <!-- INSTAGRAM POST ACTIONS -->
                <div class="instagram-post-actions">
                    <button class="instagram-heart-btn" id="${likeId}" onclick="toggleInstagramLike('${likeId}', '${reviewId}')">
                        <i class="far fa-heart instagram-heart-icon"></i>
                    </button>
                    <button class="instagram-action-btn">
                        <i class="far fa-comment"></i>
                    </button>
                    <button class="instagram-action-btn">
                        <i class="far fa-paper-plane"></i>
                    </button>
                    <button class="instagram-action-btn instagram-save-btn" id="${saveId}" onclick="toggleInstagramSave('${saveId}', '${reviewId}')">
                        <i class="far fa-bookmark instagram-bookmark-icon"></i>
                    </button>
                </div>
                
                <!-- INSTAGRAM POST CAPTION -->
                <div class="instagram-post-caption">
                    <span class="instagram-username">${review.customerName}</span>
                    ${review.reviewText}
                </div>
                
                <!-- INSTAGRAM POST DATE -->
                <div class="instagram-post-date">${shortDate}</div>
            </div>
        `;
    }
    
    // REGULAR REVIEW CARD (NOT IN PHONE)
    return `
        <div class="review-card">
            <div class="review-header">
                <div class="reviewer-info">
                    <h4>${review.customerName}</h4>
                    <div class="rating-display">
                        ${stars}
                    </div>
                </div>
                <span class="review-date">${date}</span>
            </div>
            <p class="review-content">${review.reviewText}</p>
            ${mediaHtml ? `<div class="review-media">${mediaHtml}</div>` : ''}
        </div>
    `;
}

function addMediaViewers() {
    // Add modal for viewing images and videos
    if (!document.getElementById('mediaModal')) {
        const modal = document.createElement('div');
        modal.id = 'mediaModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <span class="close-modal" onclick="closeMediaModal()">&times;</span>
            <div class="modal-content">
                <img id="modalImage" style="display: none;">
                <video id="modalVideo" style="display: none;" controls>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function openMediaModal(src, type) {
    const modal = document.getElementById('mediaModal');
    const modalImage = document.getElementById('modalImage');
    const modalVideo = document.getElementById('modalVideo');
    
    if (type === 'image') {
        modalImage.src = src;
        modalImage.style.display = 'block';
        modalVideo.style.display = 'none';
    } else {
        modalVideo.src = src;
        modalVideo.style.display = 'block';
        modalImage.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

function closeMediaModal() {
    const modal = document.getElementById('mediaModal');
    modal.style.display = 'none';
    
    // Stop video playback
    const modalVideo = document.getElementById('modalVideo');
    modalVideo.pause();
    modalVideo.currentTime = 0;
}

function showSubmitMessage(type, message) {
    const submitMessage = document.getElementById('submitMessage');
    submitMessage.className = `submit-message ${type}`;
    submitMessage.textContent = message;
    submitMessage.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        submitMessage.style.display = 'none';
    }, 5000);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('mediaModal');
    if (event.target === modal) {
        closeMediaModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMediaModal();
    }
});

// Gallery Functionality
class Gallery {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.init();
    }
    
    init() {
        this.createSlides();
        this.bindEvents();
        this.updateGallery();
        this.startAutoPlay();
    }
    
    createSlides() {
        // Arriba Homestay gallery images
        this.slides = [
            {
                image: 'gallery/1.jpg',
                title: 'Welcome to Arriba Homestay',
                description: 'Experience the comfort and beauty of our homestay'
            },
            {
                image: 'gallery/2.jpg',
                title: 'Comfortable Living Space',
                description: 'Relax in our spacious and well-appointed living areas'
            },
            {
                image: 'gallery/3.jpg',
                title: 'Beach Access',
                description: 'Just steps away from the beautiful beaches of Siargao'
            },
            {
                image: 'gallery/4.jpg',
                title: 'Coastal Views',
                description: 'Breathtaking ocean views and pristine beachfront location'
            },
            {
                image: 'gallery/5.jpg',
                title: 'Tropical Relaxation',
                description: 'Chill and relax under swaying coconut trees in our peaceful tropical setting'
            }
        ];
        
        this.renderSlides();
        this.renderDots();
    }
    
    renderSlides() {
        const slidesContainer = document.getElementById('gallerySlides');
        if (!slidesContainer) return;
        
        slidesContainer.innerHTML = this.slides.map((slide, index) => `
            <div class="gallery-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
                <img src="${slide.image}" alt="${slide.title}" loading="lazy">
                <div class="gallery-slide-content">
                    <h3>${slide.title}</h3>
                    <p>${slide.description}</p>
                </div>
            </div>
        `).join('');
    }
    
    renderDots() {
        const dotsContainer = document.getElementById('galleryDots');
        if (!dotsContainer) return;
        
        dotsContainer.innerHTML = this.slides.map((_, index) => `
            <div class="gallery-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
        `).join('');
    }
    
    bindEvents() {
        // Navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Dot navigation
        const dots = document.querySelectorAll('.gallery-dot');
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Touch events for mobile
        const galleryContainer = document.querySelector('.gallery-container');
        if (galleryContainer) {
            galleryContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            galleryContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });
        
        // Pause autoplay on hover
        if (galleryContainer) {
            galleryContainer.addEventListener('mouseenter', () => this.stopAutoPlay());
            galleryContainer.addEventListener('mouseleave', () => this.startAutoPlay());
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }
    
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].clientX;
        this.handleSwipe();
    }
    
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }
    
    goToSlide(index) {
        if (this.isAnimating || index === this.currentSlide) return;
        
        this.isAnimating = true;
        this.currentSlide = index;
        this.updateGallery();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }
    
    nextSlide() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateGallery();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }
    
    prevSlide() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateGallery();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }
    
    updateGallery() {
        const slidesContainer = document.getElementById('gallerySlides');
        const dots = document.querySelectorAll('.gallery-dot');
        const currentSlideElement = document.getElementById('currentSlide');
        const totalSlidesElement = document.getElementById('totalSlides');
        const descriptionElement = document.getElementById('galleryDescription');
        
        if (slidesContainer) {
            slidesContainer.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        }
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
        
        // Update counter
        if (currentSlideElement) {
            currentSlideElement.textContent = this.currentSlide + 1;
        }
        
        if (totalSlidesElement) {
            totalSlidesElement.textContent = this.slides.length;
        }
        
        // Update description
        if (descriptionElement && this.slides[this.currentSlide]) {
            descriptionElement.textContent = this.slides[this.currentSlide].description;
        }
    }
    
    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
}

// Global variable to track Google Maps loading
window.googleMapsLoaded = false;

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize gallery
    window.gallery = new Gallery();
    
    // Add smooth scroll for Explore More button
    const exploreButton = document.querySelector('a[href="#explore"]');
    if (exploreButton) {
        exploreButton.addEventListener('click', function(e) {
            e.preventDefault();
            const exploreSection = document.getElementById('explore');
            if (exploreSection) {
                exploreSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
    
    // Initialize location input functionality
    initializeLocationInput();
});

// Google Maps callback function
function initMap() {
    window.googleMapsLoaded = true;
    console.log('Google Maps API loaded successfully');
}

// Location Input Functionality
function initializeLocationInput() {
    const userLocationInput = document.getElementById('userLocation');
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    const getDirectionsBtn = document.getElementById('getDirections');
    const directionsResult = document.getElementById('directionsResult');
    const autocompleteDropdown = document.getElementById('autocompleteDropdown');
    
    // Homestay coordinates
    const homestayCoords = {
        lat: 9.77125143535154,
        lng: 126.12964150776305,
        address: 'Purok 1 Malinao, General Luna, Siargao'
    };
    
    // Initialize Google Places Autocomplete
    let autocomplete;
    let placesService;
    
    // Wait for Google Maps to load
    function initAutocomplete() {
        if (window.googleMapsLoaded && typeof google !== 'undefined') {
            autocomplete = new google.maps.places.AutocompleteService();
            placesService = new google.maps.places.PlacesService(document.createElement('div'));
            setupAutocomplete();
        } else {
            // Retry after a short delay
            setTimeout(initAutocomplete, 500);
        }
    }
    
    // Setup autocomplete functionality
    function setupAutocomplete() {
        if (!autocomplete) return;
        
        let autocompleteTimeout;
        
        userLocationInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            if (query.length < 3) {
                hideAutocomplete();
                return;
            }
            
            clearTimeout(autocompleteTimeout);
            autocompleteTimeout = setTimeout(() => {
                searchPlaces(query);
            }, 300);
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userLocationInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
                hideAutocomplete();
            }
        });
    }
    
    // Search places using Google Places API
    function searchPlaces(query) {
        if (!autocomplete) return;
        
        const request = {
            input: query,
            types: ['geocode', 'establishment']
        };
        
        autocomplete.getPlacePredictions(request, function(predictions, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                showAutocomplete(predictions);
            } else {
                hideAutocomplete();
            }
        });
    }
    
    // Show autocomplete dropdown
    function showAutocomplete(predictions) {
        autocompleteDropdown.innerHTML = '';
        
        predictions.slice(0, 5).forEach((prediction, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <div class="item-text">
                    <div class="item-main">${prediction.structured_formatting.main_text}</div>
                    <div class="item-secondary">${prediction.structured_formatting.secondary_text}</div>
                </div>
            `;
            
            item.addEventListener('click', function() {
                userLocationInput.value = prediction.description;
                hideAutocomplete();
                getDirectionsBtn.disabled = false;
            });
            
            autocompleteDropdown.appendChild(item);
        });
        
        autocompleteDropdown.style.display = 'block';
    }
    
    // Hide autocomplete dropdown
    function hideAutocomplete() {
        autocompleteDropdown.style.display = 'none';
    }
    
    // Initialize autocomplete when Google Maps loads
    initAutocomplete();
    
    // Enable/disable directions button based on input
    if (userLocationInput) {
        userLocationInput.addEventListener('input', function() {
            getDirectionsBtn.disabled = !this.value.trim();
        });
    }
    
    // Get current location button
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                this.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        
                        // Reverse geocoding to get address
                        reverseGeocode(lat, lng, function(address) {
                            userLocationInput.value = address;
                            getDirectionsBtn.disabled = false;
                            getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                            getCurrentLocationBtn.disabled = false;
                        });
                    },
                    function(error) {
                        alert('Unable to get your location. Please enter it manually.');
                        getCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                        getCurrentLocationBtn.disabled = false;
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }
    
    // Get directions button
    if (getDirectionsBtn) {
        getDirectionsBtn.addEventListener('click', function() {
            const userLocation = userLocationInput.value.trim();
            if (!userLocation) return;
            
            showDirections(userLocation, homestayCoords);
        });
    }
    
    // Reverse geocoding function
    function reverseGeocode(lat, lng, callback) {
        if (!window.googleMapsLoaded || typeof google === 'undefined') {
            // Fallback: use coordinates if Google Maps isn't loaded
            callback(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            return;
        }
        
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: lat, lng: lng };
        
        geocoder.geocode({ location: latlng }, function(results, status) {
            if (status === 'OK' && results[0]) {
                callback(results[0].formatted_address);
            } else {
                callback(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
        });
    }
    
    // Show directions
    function showDirections(from, to) {
        if (!window.googleMapsLoaded || typeof google === 'undefined') {
            // Fallback: show basic directions without Google Maps API
            showBasicDirections(from, to);
            return;
        }
        
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();
        
        const request = {
            origin: from,
            destination: `${to.lat},${to.lng}`,
            travelMode: google.maps.TravelMode.DRIVING
        };
        
        directionsService.route(request, function(result, status) {
            if (status === 'OK') {
                displayDirectionsResult(result, from, to);
                showRouteOnMap(result);
            } else {
                showDirectionsError();
            }
        });
    }
    
    // Show route on the embedded map
    function showRouteOnMap(directionsResult) {
        // Create a new map instance for route display
        const mapContainer = document.getElementById('siargaoMap');
        if (!mapContainer) return;
        
        // Create a new map div
        const routeMapDiv = document.createElement('div');
        routeMapDiv.id = 'routeMap';
        routeMapDiv.style.width = '100%';
        routeMapDiv.style.height = '400px';
        routeMapDiv.style.borderRadius = '15px';
        
        // Replace the iframe with the new map
        const iframe = mapContainer.querySelector('iframe');
        if (iframe) {
            iframe.style.display = 'none';
        }
        
        // Clear existing route map if any
        const existingRouteMap = document.getElementById('routeMap');
        if (existingRouteMap) {
            existingRouteMap.remove();
        }
        
        mapContainer.appendChild(routeMapDiv);
        
        // Initialize the map
        const map = new google.maps.Map(routeMapDiv, {
            zoom: 12,
            center: { lat: 9.77125143535154, lng: 126.12964150776305 },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });
        
        // Create directions renderer
        const directionsRenderer = new google.maps.DirectionsRenderer({
            draggable: false,
            map: map,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: '#3498db',
                strokeWeight: 4,
                strokeOpacity: 0.8
            }
        });
        
        // Set the directions
        directionsRenderer.setDirections(directionsResult);
        
        // Add custom markers
        const route = directionsResult.routes[0];
        const leg = route.legs[0];
        
        // Origin marker
        new google.maps.Marker({
            position: leg.start_location,
            map: map,
            title: 'Your Location',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" fill="#3498db" stroke="white" stroke-width="3"/>
                        <circle cx="16" cy="16" r="6" fill="white"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            }
        });
        
        // Destination marker (Arriba Homestay)
        new google.maps.Marker({
            position: leg.end_location,
            map: map,
            title: 'Arriba Homestay',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#e74c3c" stroke="white" stroke-width="3"/>
                        <path d="M20 8 L24 16 L20 24 L16 16 Z" fill="white"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20)
            }
        });
        
        // Fit map to show entire route
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(leg.start_location);
        bounds.extend(leg.end_location);
        map.fitBounds(bounds);
        
        // Add padding to bounds
        const listener = google.maps.event.addListener(map, 'idle', function() {
            google.maps.event.removeListener(listener);
            map.setZoom(Math.min(map.getZoom(), 15));
        });
    }
    
    // Basic directions without Google Maps API
    function showBasicDirections(from, to) {
        directionsResult.innerHTML = `
            <h4><i class="fas fa-route"></i> Route to Arriba Homestay</h4>
            <div class="directions-info">
                <div class="direction-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span><strong>From:</strong> ${from}</span>
                </div>
                <div class="direction-item">
                    <i class="fas fa-home"></i>
                    <span><strong>To:</strong> ${to.address}</span>
                </div>
                <div class="direction-item">
                    <i class="fas fa-info-circle"></i>
                    <span><strong>Note:</strong> Detailed route information requires Google Maps</span>
                </div>
            </div>
            <div class="directions-actions">
                <a href="https://www.google.com/maps/dir/${encodeURIComponent(from)}/${to.lat},${to.lng}" target="_blank">
                    <i class="fas fa-external-link-alt"></i>
                    Open in Google Maps
                </a>
                <a href="https://maps.apple.com/?daddr=${to.lat},${to.lng}&saddr=${encodeURIComponent(from)}" target="_blank">
                    <i class="fas fa-mobile-alt"></i>
                    Open in Apple Maps
                </a>
            </div>
        `;
        directionsResult.style.display = 'block';
    }
    
    // Display directions result
    function displayDirectionsResult(result, from, to) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        const distance = leg.distance.text;
        const duration = leg.duration.text;
        
        directionsResult.innerHTML = `
            <h4><i class="fas fa-route"></i> Route to Arriba Homestay</h4>
            <div class="directions-info">
                <div class="direction-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span><strong>From:</strong> ${from}</span>
                </div>
                <div class="direction-item">
                    <i class="fas fa-home"></i>
                    <span><strong>To:</strong> ${to.address}</span>
                </div>
                <div class="direction-item">
                    <i class="fas fa-road"></i>
                    <span><strong>Distance:</strong> ${distance}</span>
                </div>
                <div class="direction-item">
                    <i class="fas fa-clock"></i>
                    <span><strong>Duration:</strong> ${duration}</span>
                </div>
            </div>
            <div class="directions-actions">
                <a href="https://www.google.com/maps/dir/${encodeURIComponent(from)}/${to.lat},${to.lng}" target="_blank">
                    <i class="fas fa-external-link-alt"></i>
                    Open in Google Maps
                </a>
                <a href="https://maps.apple.com/?daddr=${to.lat},${to.lng}&saddr=${encodeURIComponent(from)}" target="_blank">
                    <i class="fas fa-mobile-alt"></i>
                    Open in Apple Maps
                </a>
            </div>
        `;
        
        directionsResult.style.display = 'block';
    }
    
    // Show directions error
    function showDirectionsError() {
        directionsResult.innerHTML = `
            <div style="text-align: center; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <h4>Unable to get directions</h4>
                <p>Please check your location and try again.</p>
            </div>
        `;
        directionsResult.style.display = 'block';
    }
}

// LOGO FADE ON SCROLL (MOBILE ONLY)
function initializeLogoFadeOnScroll() {
    const navLogo = document.querySelector('.nav-logo');
    const heroSection = document.getElementById('home');
    const findSection = document.getElementById('find');
    
    if (!navLogo || !heroSection || !findSection) return;
    
    // INITIALLY HIDE LOGO ON MOBILE
    if (window.innerWidth <= 768) {
        navLogo.classList.add('hidden');
        navLogo.classList.remove('visible');
    }
    
    // CHECK SCROLL POSITION
    function checkScrollPosition() {
        // ONLY APPLY ON MOBILE (768px and below)
        if (window.innerWidth > 768) {
            navLogo.classList.remove('hidden', 'visible');
            return;
        }
        
        const scrollY = window.pageYOffset || window.scrollY;
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        
        // IF SCROLLED PAST HERO SECTION, SHOW LOGO WITH FADE IN
        if (scrollY > heroBottom - 150) {
            navLogo.classList.remove('hidden');
            navLogo.classList.add('visible');
        } 
        // IF STILL IN HERO SECTION, HIDE LOGO WITH FADE OUT
        else {
            navLogo.classList.remove('visible');
            navLogo.classList.add('hidden');
        }
    }
    
    // THROTTLE SCROLL EVENT FOR PERFORMANCE
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(checkScrollPosition, 10);
    }, { passive: true });
    
    // CHECK ON RESIZE
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLogo.classList.remove('hidden', 'visible');
        } else {
            checkScrollPosition();
        }
    });
    
    // INITIAL CHECK
    checkScrollPosition();
}

// PHONE MOCKUP SCROLL ANIMATION - SCROLL INTO PHONE EFFECT
function initializePhoneMockupScroll() {
    const phoneContainer = document.querySelector('.phone-mockup-container');
    const reviewSection = document.getElementById('review');
    const phoneContentScroll = document.getElementById('phoneReviewsContainer');
    
    if (!phoneContainer || !reviewSection || !phoneContentScroll) return;
    
    let isPhoneVisible = false;
    let lastScrollY = 0;
    
    // THROTTLE FUNCTION FOR PERFORMANCE
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // CHECK IF PHONE SHOULD BE VISIBLE
    function checkPhoneVisibility() {
        const scrollY = window.pageYOffset || window.scrollY;
        const reviewSectionTop = reviewSection.offsetTop;
        const reviewSectionHeight = reviewSection.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // SHOW PHONE WHEN REVIEW SECTION IS IN VIEWPORT
        const triggerPoint = reviewSectionTop - windowHeight * 0.5;
        const exitPoint = reviewSectionTop + reviewSectionHeight;
        
        if (scrollY >= triggerPoint && scrollY < exitPoint) {
            if (!isPhoneVisible) {
                phoneContainer.classList.add('visible');
                isPhoneVisible = true;
            }
            
            // SYNC SCROLLING INSIDE PHONE WITH PAGE SCROLL
            const scrollProgress = (scrollY - triggerPoint) / (exitPoint - triggerPoint);
            const maxScroll = phoneContentScroll.scrollHeight - phoneContentScroll.clientHeight;
            
            if (maxScroll > 0) {
                phoneContentScroll.scrollTop = scrollProgress * maxScroll;
            }
        } else {
            if (isPhoneVisible && scrollY < triggerPoint) {
                phoneContainer.classList.remove('visible');
                isPhoneVisible = false;
            }
        }
        
        lastScrollY = scrollY;
    }
    
    // LISTEN FOR SCROLL EVENTS
    const throttledCheck = throttle(checkPhoneVisibility, 10);
    window.addEventListener('scroll', throttledCheck, { passive: true });
    
    // INITIAL CHECK
    checkPhoneVisibility();
    
    // USE INTERSECTION OBSERVER AS FALLBACK
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                phoneContainer.classList.add('visible');
                isPhoneVisible = true;
            }
        });
    }, observerOptions);
    
    observer.observe(reviewSection);
}

// UPDATE PHONE STATUS BAR TIME (12-HOUR FORMAT)
function updatePhoneTime() {
    const phoneTime = document.getElementById('phoneTime');
    if (phoneTime) {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        
        // CONVERT TO 12-HOUR FORMAT (NO AM/PM)
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        
        const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
        phoneTime.textContent = timeString;
    }
}

// INITIALIZE PHONE STATUS BAR
function initializePhoneStatusBar() {
    // UPDATE TIME IMMEDIATELY
    updatePhoneTime();
    
    // UPDATE TIME EVERY MINUTE
    setInterval(updatePhoneTime, 60000);
}

// INSTAGRAM HEART LIKE FUNCTIONALITY
function toggleInstagramLike(likeId, reviewId) {
    const likeBtn = document.getElementById(likeId);
    if (!likeBtn) return;
    
    const isLiked = likeBtn.classList.contains('liked');
    const heartIcon = likeBtn.querySelector('.instagram-heart-icon');
    
    if (isLiked) {
        // UNLIKE
        likeBtn.classList.remove('liked', 'animate-heart');
        if (heartIcon) {
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
        }
    } else {
        // LIKE
        likeBtn.classList.add('liked', 'animate-heart');
        if (heartIcon) {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
        }
        
        // REMOVE ANIMATION CLASS AFTER ANIMATION COMPLETES
        setTimeout(() => {
            likeBtn.classList.remove('animate-heart');
        }, 600);
    }
    
    // SAVE LIKE STATE TO LOCALSTORAGE
    const likeState = !isLiked;
    localStorage.setItem(`review-like-${reviewId}`, likeState);
}

// RESTORE LIKE STATES FROM LOCALSTORAGE
function restoreInstagramLikes() {
    const likeButtons = document.querySelectorAll('.instagram-heart-btn');
    likeButtons.forEach(btn => {
        const likeId = btn.id;
        if (!likeId) return;
        const reviewId = likeId.replace('like-', '');
        const isLiked = localStorage.getItem(`review-like-${reviewId}`) === 'true';
        
        if (isLiked) {
            btn.classList.add('liked');
            const heartIcon = btn.querySelector('.instagram-heart-icon');
            if (heartIcon) {
                heartIcon.classList.remove('far');
                heartIcon.classList.add('fas');
            }
        }
    });
}

// INSTAGRAM BOOKMARK/SAVE FUNCTIONALITY
function toggleInstagramSave(saveId, reviewId) {
    const saveBtn = document.getElementById(saveId);
    if (!saveBtn) return;
    
    const isSaved = saveBtn.classList.contains('saved');
    const bookmarkIcon = saveBtn.querySelector('.instagram-bookmark-icon');
    
    if (isSaved) {
        // UNSAVE
        saveBtn.classList.remove('saved', 'animate-save');
        if (bookmarkIcon) {
            bookmarkIcon.classList.remove('fas');
            bookmarkIcon.classList.add('far');
        }
    } else {
        // SAVE
        saveBtn.classList.add('saved', 'animate-save');
        if (bookmarkIcon) {
            bookmarkIcon.classList.remove('far');
            bookmarkIcon.classList.add('fas');
        }
        
        // REMOVE ANIMATION CLASS AFTER ANIMATION COMPLETES
        setTimeout(() => {
            saveBtn.classList.remove('animate-save');
        }, 400);
    }
    
    // SAVE STATE TO LOCALSTORAGE
    const saveState = !isSaved;
    localStorage.setItem(`review-save-${reviewId}`, saveState);
}

// RESTORE SAVE STATES FROM LOCALSTORAGE
function restoreInstagramSaves() {
    const saveButtons = document.querySelectorAll('.instagram-save-btn');
    saveButtons.forEach(btn => {
        const saveId = btn.id;
        if (!saveId) return;
        const reviewId = saveId.replace('save-', '');
        const isSaved = localStorage.getItem(`review-save-${reviewId}`) === 'true';
        const bookmarkIcon = btn.querySelector('.instagram-bookmark-icon');
        
        if (isSaved) {
            btn.classList.add('saved');
            if (bookmarkIcon) {
                bookmarkIcon.classList.remove('far');
                bookmarkIcon.classList.add('fas');
            }
        }
    });
}

// MAKE FUNCTIONS GLOBAL FOR ONCLICK
window.toggleInstagramLike = toggleInstagramLike;
window.toggleInstagramSave = toggleInstagramSave;

// BURGER MENU COLOR CHANGE ON SCROLL (MOBILE ONLY)
function initializeBurgerMenuColor() {
    const navToggle = document.getElementById('navToggle');
    const heroSection = document.getElementById('home');
    
    if (!navToggle || !heroSection) return;
    
    // CHECK SCROLL POSITION
    function checkScrollPosition() {
        // ONLY ON MOBILE (768px and below)
        if (window.innerWidth > 768) {
            navToggle.classList.remove('in-hero');
            return;
        }
        
        const scrollY = window.pageYOffset || window.scrollY;
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        
        // IF IN HERO SECTION, MAKE BURGER MENU WHITE
        if (scrollY < heroBottom - 100) {
            navToggle.classList.add('in-hero');
        } 
        // IF SCROLLED PAST HERO, MAKE BURGER MENU DARK BLUE
        else {
            navToggle.classList.remove('in-hero');
        }
    }
    
    // THROTTLE SCROLL EVENT FOR PERFORMANCE
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(checkScrollPosition, 10);
    }, { passive: true });
    
    // CHECK ON RESIZE
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navToggle.classList.remove('in-hero');
        } else {
            checkScrollPosition();
        }
    });
    
    // INITIAL CHECK
    checkScrollPosition();
}

// SHOW WEATHER WIDGET FROM MENU (MOBILE ONLY)
function showWeatherWidget() {
    // ONLY SHOW ON MOBILE
    if (window.innerWidth > 768) {
        return;
    }
    
    const weatherWidget = document.getElementById('weatherWidget');
    if (!weatherWidget) return;
    
    // CREATE MODAL/OVERLAY FOR WEATHER WIDGET
    let weatherModal = document.getElementById('weatherModal');
    
    if (!weatherModal) {
        weatherModal = document.createElement('div');
        weatherModal.id = 'weatherModal';
        weatherModal.className = 'weather-modal';
        weatherModal.innerHTML = `
            <div class="weather-modal-content">
                <div class="weather-modal-header">
                    <h3>Weather Information</h3>
                    <button class="weather-modal-close" onclick="closeWeatherWidget()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="weather-modal-body" id="weatherModalBody">
                    <!-- WEATHER WIDGET CONTENT WILL BE INSERTED HERE -->
                </div>
            </div>
        `;
        document.body.appendChild(weatherModal);
    }
    
    // CLONE WEATHER WIDGET CONTENT TO MODAL
    const weatherContent = document.getElementById('weatherContent');
    if (weatherContent) {
        const modalBody = document.getElementById('weatherModalBody');
        modalBody.innerHTML = weatherContent.innerHTML;
    }
    
    // SHOW MODAL
    weatherModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // CLOSE MOBILE MENU
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    if (navMenu) navMenu.classList.remove('active');
    if (navToggle) navToggle.classList.remove('active');
}

// CLOSE WEATHER WIDGET MODAL
function closeWeatherWidget() {
    const weatherModal = document.getElementById('weatherModal');
    if (weatherModal) {
        weatherModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// MAKE FUNCTIONS GLOBAL
window.showWeatherWidget = showWeatherWidget;
window.closeWeatherWidget = closeWeatherWidget;

// DYNAMIC ISLAND INTERACTION
function initializeDynamicIsland() {
    const dynamicIsland = document.getElementById('dynamicIsland');
    if (!dynamicIsland) return;
    
    let isExpanded = false;
    
    // CLICK TO EXPAND/COLLAPSE
    dynamicIsland.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (isExpanded) {
            // COLLAPSE
            dynamicIsland.classList.remove('expanded');
            isExpanded = false;
        } else {
            // EXPAND
            dynamicIsland.classList.add('expanded');
            isExpanded = true;
            
            // AUTO COLLAPSE AFTER 3 SECONDS
            setTimeout(() => {
                if (isExpanded) {
                    dynamicIsland.classList.remove('expanded');
                    isExpanded = false;
                }
            }, 3000);
        }
    });
    
    // ADD SMOOTH HOVER EFFECT
    dynamicIsland.addEventListener('mouseenter', function() {
        if (!isExpanded) {
            this.style.transform = 'translateX(-50%) scale(1.05)';
        }
    });
    
    dynamicIsland.addEventListener('mouseleave', function() {
        if (!isExpanded) {
            this.style.transform = 'translateX(-50%) scale(1)';
        }
    });
}

