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
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js');
        const { getFirestore, collection, query, where, getDocs, orderBy, limit, startAfter, limitToLast } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
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
        
        // Calculate pagination
        const startIndex = (page - 1) * reviewsPerPage;
        const endIndex = startIndex + reviewsPerPage;
        const pageReviews = allReviews.slice(startIndex, endIndex);
        
        displayReviews(pageReviews, page);
        
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

function displayReviews(reviews, page = 1) {
    const reviewsGrid = document.getElementById('approvedReviews');
    
    if (reviews.length === 0) {
        showNoReviewsMessage();
        return;
    }
    
    // Display reviews
    reviewsGrid.innerHTML = reviews.map(review => createReviewCard(review)).join('');
    
    // Add pagination controls
    addPaginationControls(page);
    
    // Add click handlers for media viewing
    addMediaViewers();
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
    
    let mediaHtml = '';
    
    // Only show images if they exist and have valid URLs
    if (review.images && review.images.length > 0 && review.images[0] !== '') {
        mediaHtml += review.images.filter(img => img && img !== '').map(img => 
            `<img src="${img}" alt="Guest photo" class="review-image" onclick="openMediaModal('${img}', 'image')" onerror="this.style.display='none'">`
        ).join('');
    }
    
    // Only show videos if they exist and have valid URLs
    if (review.videos && review.videos.length > 0 && review.videos[0] !== '') {
        mediaHtml += review.videos.filter(vid => vid && vid !== '').map(vid => 
            `<video src="${vid}" class="review-video" controls onclick="openMediaModal('${vid}', 'video')" onerror="this.style.display='none'"></video>`
        ).join('');
    }
    
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
