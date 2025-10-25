// Admin Dashboard JavaScript with Firebase Integration
console.log('Admin.js loaded successfully');

// EmailJS Configuration
const EMAILJS_CONFIG = {
    PUBLIC_KEY: "kDx6o0Gsh2ZtIqQvO",
    SERVICE_ID: "service_fcen5ps",
    TEMPLATE_ID: "template_lksv70e"
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

// Send booking confirmation email
async function sendBookingConfirmationEmail(booking) {
    try {
        console.log('Sending booking confirmation email to:', booking.email);
        
        // Calculate duration and nights
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const nights = days - 1; // Nights = days - 1 (you don't sleep on the last day)
        
        // Prepare email parameters
        const emailParams = {
            customer_name: booking.customerName,
            booking_id: booking.id,
            check_in_date: formatDate(booking.checkIn),
            check_out_date: formatDate(booking.checkOut),
            duration: days,
            nights: nights,
            adults: booking.adults,
            kids: booking.kids || 0,
            extra_beds: booking.extraBeds || 0,
            total_amount: booking.totalAmount,
            email: booking.email,
            phone: booking.phoneNumber
        };
        
        // Send email
        const result = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            emailParams
        );
        
        console.log('Email sent successfully:', result);
        return { success: true, result };
        
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}

// Global Firebase variables
let db;
let collection, addDoc, getDocs, getDoc, query, orderBy, where, updateDoc, doc, onSnapshot;
let unsubscribeBookings; // For real-time listener

// Wait for Firebase to be available
const waitForFirebase = () => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max wait
        
        const checkFirebase = () => {
            console.log(`Checking Firebase availability... attempt ${attempts + 1}`);
            console.log('Window objects:', {
                firebaseApp: !!window.firebaseApp,
                firebaseDB: !!window.firebaseDB,
                firebaseAnalytics: !!window.firebaseAnalytics
            });
            
            if (window.firebaseDB) {
                console.log('Firebase DB found!');
                resolve(window.firebaseDB);
            } else if (attempts >= maxAttempts) {
                console.error('Firebase timeout - not available after', maxAttempts, 'attempts');
                reject(new Error('Firebase not available after timeout'));
            } else {
                attempts++;
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
};

// Initialize Firebase
async function initializeFirebase() {
    try {
        console.log('Starting Firebase initialization...');
        db = await waitForFirebase();
        console.log('Firebase DB obtained, importing functions...');
        
        // Import Firebase functions dynamically
        const { collection: col, addDoc: add, getDocs: get, getDoc: getSingle, query: q, orderBy: order, where: w, updateDoc: update, doc: d, onSnapshot: onSnap } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        collection = col;
        addDoc = add;
        getDocs = get;
        getDoc = getSingle;
        query = q;
        orderBy = order;
        where = w;
        updateDoc = update;
        doc = d;
        onSnapshot = onSnap;
        
        console.log('Firebase initialized successfully in admin!');
        console.log('Available functions:', {
            collection: !!collection,
            getDocs: !!getDocs,
            query: !!query,
            orderBy: !!orderBy
        });
        return true;
    } catch (error) {
        console.error('Firebase initialization failed in admin:', error);
        console.error('Error details:', error.message);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Clear old localStorage data
    function clearOldData() {
        console.log('Clearing old localStorage data...');
        localStorage.removeItem('arribaBookings');
        localStorage.removeItem('arribaAvailability');
        console.log('Old data cleared from localStorage');
    }

    // Initialize admin dashboard
    initializeAdmin();
    
    // Clear old data first
    clearOldData();
    
    // Load initial data from Firebase only
    loadInitialData();
    
    // Add refresh button for manual data reload
    const refreshButton = document.createElement('button');
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    refreshButton.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;';
    refreshButton.onclick = async () => {
        refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        refreshButton.disabled = true;
        await loadInitialData();
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshButton.disabled = false;
    };
    document.body.appendChild(refreshButton);
    
});

// Global variables
let currentSection = 'analytics';
let currentPage = 1;
let itemsPerPage = 10;
let allBookings = [];
let allRecords = [];
let allSuggestions = [];
let allReviews = [];
let filteredBookings = [];
let filteredRecords = [];
let availabilityData = {};
let currentDate = new Date();
let selectedDate = null;

// Load initial data from Firebase
async function loadInitialData() {
    try {
        console.log('Loading data from Firebase (READ-ONLY)...');
        
        // Initialize Firebase first
        await initializeFirebase();
        
        if (!db || !getDocs || !collection) {
            console.error('Firebase not available - admin dashboard requires Firebase connection');
            // Show error message instead of fallback
            showFirebaseError();
            return;
        }
        
        // Test Firebase connection first
        console.log('Testing Firebase connection...');
        try {
            const testQuery = query(collection(db, 'bookings'));
            const testSnapshot = await getDocs(testQuery);
            console.log('Firebase connection test successful!');
        } catch (testError) {
            console.error('Firebase connection test failed:', testError);
            throw testError;
        }
        
        // Load bookings from Firebase
        console.log('Fetching bookings from Firestore...');
        const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const bookings = [];
        bookingsSnapshot.forEach((doc) => {
            const data = doc.data();
            bookings.push({
                id: doc.id, // Use Firebase document ID consistently
                customerName: data.customerName,
                phoneNumber: data.phoneNumber,
                email: data.email,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                adults: data.adults,
                kids: data.kids,
                extraBeds: data.extraBeds,
                totalAmount: data.totalAmount,
                status: data.status,
                receiptUrl: data.receiptUrl,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
            });
        });
        
        console.log('Firebase bookings loaded:', bookings.length, 'bookings');
        
        // Load availability from Firebase (optional for now)
        try {
            const availabilityQuery = query(collection(db, 'availability'), orderBy('date', 'asc'));
            const availabilitySnapshot = await getDocs(availabilityQuery);
            
            const availability = {};
            availabilitySnapshot.forEach((doc) => {
                const data = doc.data();
                availability[data.date] = data.is_available;
            });
            
            availabilityData = availability;
            console.log('Firebase availability loaded:', Object.keys(availabilityData).length, 'dates');
        } catch (availabilityError) {
            console.log('No availability data in Firebase, using empty object');
            availabilityData = {};
        }
        
        // Update global arrays
        allBookings = bookings || [];
        allRecords = [...allBookings];
        filteredBookings = [...allBookings];
        filteredRecords = [...allRecords];

        console.log('Data loaded successfully from Firebase (READ-ONLY):', {
            bookings: allBookings.length,
            availability: Object.keys(availabilityData).length
        });

        // Update displays
        if (currentSection === 'booking') {
            displayBookings(filteredBookings);
        } else if (currentSection === 'records') {
            displayRecords(filteredRecords);
        } else if (currentSection === 'calendar') {
            generateCalendar();
        }
        
        // Generate mobile cards if on mobile
        if (window.innerWidth <= 768) {
            generateMobileBookingCards(filteredBookings);
        }

        // Update notification count
        updateNotificationCount();
        
        // Set up real-time notifications
        setupRealtimeNotifications();

    } catch (error) {
        console.error('Failed to load data from Firebase:', error);
        showFirebaseError();
    }
}

// Set up real-time notifications for new bookings
function setupRealtimeNotifications() {
    try {
        console.log('Setting up real-time notifications...');
        
        // Unsubscribe from previous listener if exists
        if (unsubscribeBookings) {
            unsubscribeBookings();
        }
        
        // Set up real-time listener for bookings
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, orderBy('createdAt', 'desc'));
        
        unsubscribeBookings = onSnapshot(q, (snapshot) => {
            console.log('Real-time update received:', snapshot.size, 'bookings');
            
            // Count new bookings (status: 'pending')
            let newBookingsCount = 0;
            let totalBookings = 0;
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                totalBookings++;
                
                // Count pending bookings as new notifications
                if (data.status === 'pending' || data.status === 'new') {
                    newBookingsCount++;
                }
            });
            
            // Update notification count
            updateNotificationCount(newBookingsCount);
            
            // Update bookings data
            allBookings = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    customerName: data.customer_name || data.customerName,
                    phoneNumber: data.phone_number || data.phoneNumber,
                    email: data.email,
                    checkIn: data.check_in || data.checkIn,
                    checkOut: data.check_out || data.checkOut,
                    adults: data.adults,
                    kids: data.kids,
                    extraBeds: data.extra_beds || data.extraBeds,
                    totalAmount: data.total_amount || data.totalAmount,
                    status: data.status,
                    receiptUrl: data.receipt_url || data.receiptUrl,
                    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
                };
            });
            
            allRecords = [...allBookings];
            
            // Update filtered data
            filteredBookings = allBookings.filter(booking => 
                booking.status === 'pending' || booking.status === 'new'
            );
            filteredRecords = allBookings;
            
            // Refresh current view
            if (currentSection === 'booking') {
                displayBookings(filteredBookings);
            } else if (currentSection === 'records') {
                displayRecords(filteredRecords);
                updatePagination();
            }
            
            console.log(`Real-time update: ${newBookingsCount} new bookings, ${totalBookings} total`);
            
        }, (error) => {
            console.error('Real-time listener error:', error);
        });
        
        console.log('Real-time notifications set up successfully');
        
    } catch (error) {
        console.error('Failed to set up real-time notifications:', error);
    }
}

// Play notification sound for new bookings
function playNotificationSound() {
    try {
        // Create a simple notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        console.log('Notification sound played');
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

// Toggle notification dropdown
window.toggleNotificationDropdown = function() {
    const dropdown = document.getElementById('notificationDropdown');
    
    if (dropdown) {
        dropdown.classList.toggle('show');
        
        // Update notification list when opened
        if (dropdown.classList.contains('show')) {
            updateNotificationList();
        }
    }
};

// Mobile notification dropdown toggle
window.toggleMobileNotificationDropdown = function() {
    const dropdown = document.getElementById('mobileNotificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        
        // Update notification list when opened
        if (dropdown.classList.contains('show')) {
            updateMobileNotificationList();
        }
    }
};

// Update notification list with all types of notifications
function updateNotificationList() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    // Get all types of notifications
    const pendingBookings = allBookings.filter(booking => 
        booking.status === 'pending' || booking.status === 'new'
    );
    
    const newSuggestions = allSuggestions.filter(suggestion => 
        !isNotificationRead(`suggestion_${suggestion.id}`)
    );
    
    const newReviews = allReviews.filter(review => 
        review.status === 'pending' && !isNotificationRead(`review_${review.id}`)
    );
    
    // Combine all notifications
    const allNotifications = [];
    
    // Add booking notifications
    pendingBookings.forEach(booking => {
        allNotifications.push({
            type: 'booking',
            id: booking.id,
            data: booking,
            timestamp: booking.createdAt,
            isRead: isNotificationRead(booking.id)
        });
    });
    
    // Add suggestion notifications
    newSuggestions.forEach(suggestion => {
        allNotifications.push({
            type: 'suggestion',
            id: `suggestion_${suggestion.id}`,
            data: suggestion,
            timestamp: suggestion.submittedAt,
            isRead: isNotificationRead(`suggestion_${suggestion.id}`)
        });
    });
    
    // Add review notifications
    newReviews.forEach(review => {
        allNotifications.push({
            type: 'review',
            id: `review_${review.id}`,
            data: review,
            timestamp: review.submittedAt,
            isRead: isNotificationRead(`review_${review.id}`)
        });
    });
    
    if (allNotifications.length === 0) {
        notificationList.innerHTML = '<div class="no-notifications">No new notifications</div>';
        // Update notification count after updating the list
        updateNotificationCount();
        return;
    }
    
    // Sort by timestamp (newest first)
    allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    notificationList.innerHTML = allNotifications.map(notification => {
        const timeAgo = getTimeAgo(notification.timestamp);
        const readClass = notification.isRead ? 'read' : 'unread';
        
        if (notification.type === 'booking') {
            const booking = notification.data;
            const checkInDate = new Date(booking.checkIn).toLocaleDateString();
            const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
            
            return `
                <div class="notification-item ${readClass}" onclick="viewBookingFromNotification('${booking.id}')">
                    <div class="notification-item-header">
                        <span class="notification-customer">📅 New Booking: ${booking.customerName}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-details">
                        <div>📅 ${checkInDate} - ${checkOutDate}</div>
                        <div>👥 ${booking.adults} adults${booking.kids > 0 ? `, ${booking.kids} kids` : ''}${booking.extraBeds > 0 ? ` + ${booking.extraBeds} extra beds` : ''}</div>
                        <div>💰 ₱${booking.totalAmount.toLocaleString()}</div>
                    </div>
                    <span class="notification-status ${booking.status}">${booking.status.toUpperCase()}</span>
                </div>
            `;
        } else if (notification.type === 'suggestion') {
            const suggestion = notification.data;
            return `
                <div class="notification-item ${readClass}" onclick="viewSuggestionFromNotification('${suggestion.id}')">
                    <div class="notification-item-header">
                        <span class="notification-customer">💡 New Suggestion: ${suggestion.name}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-details">
                        <div>📧 ${suggestion.email}</div>
                        <div>📝 ${suggestion.subject}</div>
                        <div>💬 ${suggestion.message.substring(0, 50)}${suggestion.message.length > 50 ? '...' : ''}</div>
                    </div>
                    <span class="notification-status suggestion">SUGGESTION</span>
                </div>
            `;
        } else if (notification.type === 'review') {
            const review = notification.data;
            return `
                <div class="notification-item ${readClass}" onclick="viewReviewFromNotification('${review.id}')">
                    <div class="notification-item-header">
                        <span class="notification-customer">⭐ New Review: ${review.customerName}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-details">
                        <div>⭐ ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)} (${review.rating}/5)</div>
                        <div>💬 ${review.review.substring(0, 50)}${review.review.length > 50 ? '...' : ''}</div>
                    </div>
                    <span class="notification-status review">REVIEW</span>
                </div>
            `;
        }
    }).join('');
    
    // Update notification count after updating the list
    updateNotificationCount();
}

// Update mobile notification list with all types of notifications
function updateMobileNotificationList() {
    const notificationList = document.getElementById('mobileNotificationList');
    if (!notificationList) return;
    
    // Get all types of notifications (same logic as desktop)
    const pendingBookings = allBookings.filter(booking => 
        booking.status === 'pending' || booking.status === 'new'
    );
    
    const newSuggestions = allSuggestions.filter(suggestion => 
        !isNotificationRead(`suggestion_${suggestion.id}`)
    );
    
    const newReviews = allReviews.filter(review => 
        review.status === 'pending' && !isNotificationRead(`review_${review.id}`)
    );
    
    // Combine all notifications
    const allNotifications = [];
    
    // Add booking notifications
    pendingBookings.forEach(booking => {
        allNotifications.push({
            type: 'booking',
            id: booking.id,
            data: booking,
            timestamp: booking.createdAt,
            isRead: isNotificationRead(booking.id)
        });
    });
    
    // Add suggestion notifications
    newSuggestions.forEach(suggestion => {
        allNotifications.push({
            type: 'suggestion',
            id: `suggestion_${suggestion.id}`,
            data: suggestion,
            timestamp: suggestion.submittedAt,
            isRead: isNotificationRead(`suggestion_${suggestion.id}`)
        });
    });
    
    // Add review notifications
    newReviews.forEach(review => {
        allNotifications.push({
            type: 'review',
            id: `review_${review.id}`,
            data: review,
            timestamp: review.submittedAt,
            isRead: isNotificationRead(`review_${review.id}`)
        });
    });
    
    if (allNotifications.length === 0) {
        notificationList.innerHTML = '<div class="no-notifications">No new notifications</div>';
        // Update notification count after updating the list
        updateNotificationCount();
        return;
    }
    
    // Sort by timestamp (newest first)
    allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    notificationList.innerHTML = allNotifications.map(notification => {
        const timeAgo = getTimeAgo(notification.timestamp);
        const readClass = notification.isRead ? 'read' : 'unread';
        
        if (notification.type === 'booking') {
            const booking = notification.data;
            const checkInDate = new Date(booking.checkIn).toLocaleDateString();
            const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
            
            return `
                <div class="notification-item ${readClass}" onclick="viewBookingFromNotification('${booking.id}')">
                    <div class="notification-item-header">
                        <span class="notification-customer">📅 New Booking: ${booking.customerName}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-details">
                        <div>📅 ${checkInDate} - ${checkOutDate}</div>
                        <div>👥 ${booking.adults} adults${booking.kids > 0 ? `, ${booking.kids} kids` : ''}${booking.extraBeds > 0 ? ` + ${booking.extraBeds} extra beds` : ''}</div>
                        <div>💰 ₱${booking.totalAmount.toLocaleString()}</div>
                    </div>
                    <span class="notification-status ${booking.status}">${booking.status.toUpperCase()}</span>
                </div>
            `;
        } else if (notification.type === 'suggestion') {
            const suggestion = notification.data;
            return `
                <div class="notification-item ${readClass}" onclick="viewSuggestionFromNotification('${suggestion.id}')">
                    <div class="notification-item-header">
                        <span class="notification-customer">💡 New Suggestion: ${suggestion.name}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-details">
                        <div>📧 ${suggestion.email}</div>
                        <div>📝 ${suggestion.subject}</div>
                        <div>💬 ${suggestion.message.substring(0, 50)}${suggestion.message.length > 50 ? '...' : ''}</div>
                    </div>
                    <span class="notification-status suggestion">SUGGESTION</span>
                </div>
            `;
        } else if (notification.type === 'review') {
            const review = notification.data;
            return `
                <div class="notification-item ${readClass}" onclick="viewReviewFromNotification('${review.id}')">
                    <div class="notification-item-header">
                        <span class="notification-customer">⭐ New Review: ${review.customerName}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-details">
                        <div>⭐ ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)} (${review.rating}/5)</div>
                        <div>💬 ${review.review.substring(0, 50)}${review.review.length > 50 ? '...' : ''}</div>
                    </div>
                    <span class="notification-status review">REVIEW</span>
                </div>
            `;
        }
    }).join('');
    
    // Update notification count after updating the list
    updateNotificationCount();
}

// Mark notification as read in localStorage
function markNotificationAsRead(bookingId) {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifications.includes(bookingId)) {
        readNotifications.push(bookingId);
        localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    }
}

// Check if notification is read
function isNotificationRead(bookingId) {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    return readNotifications.includes(bookingId);
}

// View booking from notification
window.viewBookingFromNotification = function(bookingId) {
    // Close notification dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    // Mark notification as read in localStorage
    markNotificationAsRead(bookingId);
    
    // Mark notification as read by removing unread class
    const notificationItem = document.querySelector(`.notification-item[onclick*="${bookingId}"]`);
    if (notificationItem) {
        notificationItem.classList.remove('unread');
        notificationItem.classList.add('read');
    }
    
    // Switch to booking section
    switchSection('booking');
    
    // Find and highlight the booking
    const bookingRow = document.querySelector(`tr[data-booking-id="${bookingId}"]`);
    if (bookingRow) {
        bookingRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        bookingRow.style.backgroundColor = '#fff3cd';
        setTimeout(() => {
            bookingRow.style.backgroundColor = '';
        }, 3000);
    }
    
    // Show booking details modal
    viewBookingDetails(bookingId);
    
    // Update notification count
    updateNotificationCount();
};

// View suggestion from notification
window.viewSuggestionFromNotification = function(suggestionId) {
    // Close notification dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    // Mark notification as read in localStorage
    markNotificationAsRead(`suggestion_${suggestionId}`);
    
    // Mark notification as read by removing unread class
    const notificationItem = document.querySelector(`.notification-item[onclick*="viewSuggestionFromNotification('${suggestionId}')"]`);
    if (notificationItem) {
        notificationItem.classList.remove('unread');
        notificationItem.classList.add('read');
    }
    
    // Switch to suggestions section
    switchSection('suggestions');
    
    // Update notification count
    updateNotificationCount();
};

// View review from notification
window.viewReviewFromNotification = function(reviewId) {
    // Close notification dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    // Mark notification as read in localStorage
    markNotificationAsRead(`review_${reviewId}`);
    
    // Mark notification as read by removing unread class
    const notificationItem = document.querySelector(`.notification-item[onclick*="viewReviewFromNotification('${reviewId}')"]`);
    if (notificationItem) {
        notificationItem.classList.remove('unread');
        notificationItem.classList.add('read');
    }
    
    // Switch to reviews section
    switchSection('reviews');
    
    // Update notification count
    updateNotificationCount();
};

// Mark all notifications as read
window.markAllAsRead = function() {
    // Mark all notification items as read
    const notificationItems = document.querySelectorAll('.notification-item.unread');
    notificationItems.forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
        
        // Extract notification ID from onclick attribute and mark as read in localStorage
        const onclickAttr = item.getAttribute('onclick');
        
        // Check for booking notifications
        const bookingIdMatch = onclickAttr.match(/viewBookingFromNotification\('([^']+)'\)/);
        if (bookingIdMatch) {
            markNotificationAsRead(bookingIdMatch[1]);
        }
        
        // Check for suggestion notifications
        const suggestionIdMatch = onclickAttr.match(/viewSuggestionFromNotification\('([^']+)'\)/);
        if (suggestionIdMatch) {
            markNotificationAsRead(`suggestion_${suggestionIdMatch[1]}`);
        }
        
        // Check for review notifications
        const reviewIdMatch = onclickAttr.match(/viewReviewFromNotification\('([^']+)'\)/);
        if (reviewIdMatch) {
            markNotificationAsRead(`review_${reviewIdMatch[1]}`);
        }
    });
    
    // Close the dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    // Update notification count
    updateNotificationCount();
    
    console.log('All notifications marked as read');
};

// Get time ago string
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
}

// Close notification dropdown when clicking outside (removed duplicate - handled in DOMContentLoaded)

function initializeAdmin() {
    // Set up sidebar navigation
    setupSidebarNavigation();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize calendar
    initializeCalendar();
}

function setupEventListeners() {
    // This function is called but the actual event listeners are set up in setupSidebarNavigation
    // Additional event listeners can be added here if needed
}

// Open receipt modal
window.openReceiptModal = function(receiptUrl) {
    console.log('Opening receipt modal with URL:', receiptUrl);
    
    // Remove any existing receipt modal first
    const existingModal = document.querySelector('.receipt-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal receipt-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content receipt-modal-content">
            <div class="modal-header">
                <h3>GCash Receipt</h3>
                <button onclick="closeReceiptModal()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <img src="${receiptUrl}" alt="GCash Receipt" class="full-receipt-image" onerror="console.error('Failed to load receipt image:', this.src)">
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener to close button as backup
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeReceiptModal();
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeReceiptModal();
        }
    });
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    console.log('Receipt modal opened successfully');
};

// Close receipt modal
window.closeReceiptModal = function() {
    console.log('Closing receipt modal');
    const modal = document.querySelector('.receipt-modal');
    if (modal) {
        modal.remove();
        // Restore body scroll
        document.body.style.overflow = '';
        console.log('Receipt modal closed successfully');
    }
};

function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(section) {
    // Close mobile menu when switching sections
    closeMobileMenu();
    
    // Update active menu item
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Update page title
    const titles = {
        'analytics': 'Analytics Dashboard',
        'booking': 'Booking Management',
        'records': 'Booking Records',
        'calendar': 'Calendar Management',
        'suggestions': 'Customer Suggestions'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    currentSection = section;
    
    // Load section-specific data
    switch(section) {
        case 'analytics':
            initializeAnalytics();
            break;
        case 'booking':
            loadBookings();
            break;
        case 'records':
            loadRecords();
            break;
        case 'calendar':
            generateCalendar();
            break;
        case 'suggestions':
            loadSuggestions();
            break;
    }
}

function showSection(section) {
    currentSection = section;
    updateSidebarActiveState();
    closeMobileMenu(); // Close mobile menu when switching sections
    
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show the selected section
    const targetSection = document.getElementById(section + 'Content');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load section-specific content
    switch(section) {
        case 'analytics':
            initializeAnalytics();
            break;
        case 'booking':
            loadBookings();
            break;
        case 'records':
            loadRecords();
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'reviews':
            loadReviews();
            break;
    }
}

function updateSidebarActiveState() {
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('data-section') === currentSection) {
            li.classList.add('active');
        }
    });
}


// Show Firebase connection error
function showFirebaseError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f8d7da;
        color: #721c24;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
        z-index: 10000;
        text-align: center;
        max-width: 400px;
    `;
    errorDiv.innerHTML = `
        <h3><i class="fas fa-exclamation-triangle"></i> Firebase Connection Error</h3>
        <p>Unable to connect to Firebase database. Please check your internet connection and try again.</p>
        <button onclick="location.reload()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
            <i class="fas fa-refresh"></i> Retry
        </button>
    `;
    document.body.appendChild(errorDiv);
}

// Note: localStorage functions removed - admin dashboard is now READ-ONLY from Firebase
// Old localStorage functions kept for reference but not used
/*
function loadBookingsFromStorage() {
    const storedBookings = localStorage.getItem('arribaBookings');
    if (storedBookings) {
        allBookings = JSON.parse(storedBookings);
        // Filter out bookings with undefined IDs
        allBookings = allBookings.filter(booking => booking.id && booking.id !== 'undefined');
    } else {
        allBookings = [];
    }
    
    allRecords = [...allBookings];
    filteredBookings = [...allBookings];
    filteredRecords = [...allRecords];
    
    // Note: No longer saving to localStorage - admin is read-only from Firebase
}

function loadAvailabilityFromStorage() {
    const storedAvailability = localStorage.getItem('arribaAvailability');
    if (storedAvailability) {
        availabilityData = JSON.parse(storedAvailability);
    } else {
        availabilityData = {};
    }
}

// Note: saveBookingsToStorage function removed - admin dashboard is now read-only from Firebase

*/

// Save availability data to Firebase
async function saveAvailabilityToFirebase(date, isAvailable) {
    console.log('saveAvailabilityToFirebase called with:', date, isAvailable);
    console.log('Firebase objects:', { db: !!db, addDoc: !!addDoc, collection: !!collection, updateDoc: !!updateDoc, doc: !!doc });
    
    try {
        if (!db || !addDoc || !collection || !updateDoc || !doc) {
            console.error('Firebase not available for saving availability');
            return false;
        }

        const dateString = date;
        console.log('Attempting to save to Firestore collection: availability');
        
        // Try to create/update document using addDoc first (simpler approach)
        try {
            const docData = {
                date: dateString,
                is_available: isAvailable,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            console.log('Document data:', docData);
            
            // Use addDoc instead of updateDoc to avoid document reference issues
            const docRef = await addDoc(collection(db, 'availability'), docData);
            console.log(`Successfully created availability document with ID: ${docRef.id}`);
            
            return true;
        } catch (firestoreError) {
            console.error('Firestore error details:', {
                code: firestoreError.code,
                message: firestoreError.message,
                stack: firestoreError.stack
            });
            
            // Show user-friendly error message
            if (firestoreError.code === 'permission-denied') {
                showNotification('Permission denied. Please check Firestore security rules.', 'error');
            } else if (firestoreError.code === 'unavailable') {
                showNotification('Firebase service unavailable. Please try again later.', 'error');
            } else {
                showNotification(`Firebase error: ${firestoreError.message}`, 'error');
            }
            
            return false;
        }
        
    } catch (error) {
        console.error('Failed to save availability to Firebase:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return false;
    }
}

// Save multiple availability dates to Firebase
async function saveMultipleAvailabilityToFirebase(dates, isAvailable) {
    console.log('saveMultipleAvailabilityToFirebase called with:', dates.length, 'dates, status:', isAvailable);
    
    try {
        if (!db || !addDoc || !collection) {
            console.error('Firebase not available for saving multiple availability');
            return false;
        }

        const promises = dates.map(async (dateString, index) => {
            try {
                const docData = {
                    date: dateString,
                    is_available: isAvailable,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                console.log(`Creating document ${index + 1}/${dates.length} for date: ${dateString}`);
                const docRef = await addDoc(collection(db, 'availability'), docData);
                console.log(`Successfully created document ${index + 1} with ID: ${docRef.id}`);
                return true;
            } catch (error) {
                console.error(`Failed to create document for ${dateString}:`, error);
                return false;
            }
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(result => result === true).length;
        
        console.log(`Successfully updated ${successCount}/${dates.length} dates`);
        return successCount === dates.length;
        
    } catch (error) {
        console.error('Failed to save multiple availability to Firebase:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return false;
    }
}

// Test Firebase connection
async function testFirebaseConnection() {
    console.log('Testing Firebase connection...');
    console.log('Firebase objects:', { 
        db: !!db, 
        addDoc: !!addDoc, 
        collection: !!collection,
        firebaseApp: !!window.firebaseApp,
        firebaseDB: !!window.firebaseDB
    });
    
    try {
        if (!db || !addDoc || !collection) {
            console.error('Firebase objects not available');
            return false;
        }
        
        // Try to read from a collection to test connection
        console.log('Testing read operation...');
        const testQuery = query(collection(db, 'availability'));
        const testSnapshot = await getDocs(testQuery);
        console.log('Read test successful, found', testSnapshot.size, 'documents');
        
        // Try to write a test document
        console.log('Testing write operation...');
        const testDoc = {
            test: true,
            timestamp: new Date(),
            message: 'Firebase connection test'
        };
        
        const docRef = await addDoc(collection(db, 'test'), testDoc);
        console.log('Write test successful, document ID:', docRef.id);
        
        return true;
    } catch (error) {
        console.error('Firebase connection test failed:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            name: error.name
        });
        return false;
    }
}

// Make functions globally available
window.saveAvailabilityToFirebase = saveAvailabilityToFirebase;
window.saveMultipleAvailabilityToFirebase = saveMultipleAvailabilityToFirebase;
window.setDateStatus = setDateStatus;
window.toggleMultiSelectMode = toggleMultiSelectMode;
window.applyBulkActionToSelected = applyBulkActionToSelected;
window.testFirebaseConnection = testFirebaseConnection;
window.submitAddBooking = submitAddBooking;

function updateNotificationCount(count = null) {
    let unreadCount;
    
    if (count !== null) {
        // Use provided count (from real-time updates)
        unreadCount = count;
    } else {
        // Calculate count from unread notifications in the DOM
        const unreadNotifications = document.querySelectorAll('.notification-item.unread');
        unreadCount = unreadNotifications.length;
    }
    
    const notificationCount = document.getElementById('notificationCount');
    const mobileNotificationCount = document.getElementById('mobileNotificationCount');
    
    // Update desktop notification count
    if (notificationCount) {
        notificationCount.textContent = unreadCount;
        
        // Add visual effects for new notifications
        if (unreadCount > 0) {
            notificationCount.style.background = '#e74c3c';
            notificationCount.style.animation = 'pulse 1s ease-in-out';
            
            // Play notification sound for new bookings
            if (count !== null && count > 0) {
                playNotificationSound();
            }
        } else {
            notificationCount.style.background = '#95a5a6';
            notificationCount.style.animation = 'none';
        }
    }
    
    // Update mobile notification count
    if (mobileNotificationCount) {
        mobileNotificationCount.textContent = unreadCount;
        
        // Add visual effects for new notifications
        if (unreadCount > 0) {
            mobileNotificationCount.style.background = '#e74c3c';
            mobileNotificationCount.style.animation = 'pulse 1s ease-in-out';
        } else {
            mobileNotificationCount.style.background = '#95a5a6';
            mobileNotificationCount.style.animation = 'none';
        }
    }
}

// Booking Management Functions
function loadBookings() {
    displayBookings(filteredBookings);
}

function loadRecords() {
    displayRecords(filteredRecords);
    updatePagination();
}

function loadCalendar() {
    generateCalendar();
}

function displayBookings(bookings) {
    const tableBody = document.getElementById('bookingsTableBody');
    tableBody.innerHTML = '';
    
    bookings.forEach(booking => {
        const row = createBookingRow(booking);
        tableBody.appendChild(row);
    });
    
    // Generate mobile cards if on mobile
    if (window.innerWidth <= 768) {
        generateMobileBookingCards(bookings);
    }
}

function createBookingRow(booking) {
    const row = document.createElement('tr');
    
    const statusClass = `status-${booking.status}`;
    const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
    
    // Calculate days and nights
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
    const nights = days - 1;
    
    // Add mobile click functionality
    const isMobile = window.innerWidth <= 768;
    
    row.innerHTML = `
        <td>${booking.id}</td>
        <td>${booking.customerName}</td>
        <td>
            <div>${booking.phoneNumber}</div>
            <div style="font-size: 0.8rem; color: #666;">${booking.email}</div>
        </td>
        <td>${formatDate(booking.checkIn)}</td>
        <td>${formatDate(booking.checkOut)}</td>
        <td>
            <div>${booking.adults}</div>
        </td>
        <td>
            <div>${booking.kids}</div>
        </td>
        <td>₱${booking.totalAmount.toLocaleString()}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
            <button class="action-btn btn-view" onclick="viewBookingDetails('${booking.id}')" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            ${booking.status === 'pending' ? `
                <button class="action-btn btn-approve" onclick="approveBooking('${booking.id}')" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
                <button class="action-btn btn-reject" onclick="rejectBooking('${booking.id}')" title="Reject">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </td>
    `;
    
    // Add mobile click functionality
    if (isMobile) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (!e.target.closest('.action-btn')) {
                viewBookingDetails(booking.id);
            }
        });
    }
    
    return row;
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    filteredBookings = allBookings.filter(booking => {
        if (statusFilter && booking.status !== statusFilter) return false;
        if (dateFrom && booking.checkIn < dateFrom) return false;
        if (dateTo && booking.checkIn > dateTo) return false;
        return true;
    });
    
    displayBookings(filteredBookings);
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    
    filteredBookings = [...allBookings];
    displayBookings(filteredBookings);
}

// Records Management Functions
function loadRecords() {
    displayRecords(filteredRecords);
    updatePagination();
}

function displayRecords(records) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageRecords = records.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('recordsTableBody');
    tableBody.innerHTML = '';
    
    pageRecords.forEach(record => {
        const row = createRecordRow(record);
        tableBody.appendChild(row);
    });
    
    // Generate mobile cards if on mobile
    if (window.innerWidth <= 768) {
        generateMobileRecordCards(pageRecords);
    }
}

function createRecordRow(record) {
    const row = document.createElement('tr');
    
    const statusClass = `status-${record.status}`;
    const statusText = record.status.charAt(0).toUpperCase() + record.status.slice(1);
    
    // Calculate days and nights
    const checkIn = new Date(record.checkIn);
    const checkOut = new Date(record.checkOut);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
    const nights = days - 1;
    
    // Add mobile click functionality
    const isMobile = window.innerWidth <= 768;
    
    row.innerHTML = `
        <td>${record.id}</td>
        <td>${record.customerName}</td>
        <td>
            <div>${record.phoneNumber}</div>
            <div style="font-size: 0.8rem; color: #666;">${record.email}</div>
        </td>
        <td>${formatDate(record.checkIn)}</td>
        <td>${formatDate(record.checkOut)}</td>
        <td>
            <div>${record.adults}</div>
        </td>
        <td>
            <div>${record.kids}</div>
        </td>
        <td>₱${record.totalAmount.toLocaleString()}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${formatDateTime(record.createdAt)}</td>
        <td>
            <button class="action-btn btn-view" onclick="viewRecordDetails('${record.id}')" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
        </td>
    `;
    
    // Add mobile click functionality
    if (isMobile) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (!e.target.closest('.action-btn')) {
                viewRecordDetails(record.id);
            }
        });
    }
    
    return row;
}

function applyRecordsFilters() {
    const statusFilter = document.getElementById('recordsStatusFilter').value;
    const dateFrom = document.getElementById('recordsDateFrom').value;
    const dateTo = document.getElementById('recordsDateTo').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredRecords = allRecords.filter(record => {
        if (statusFilter && record.status !== statusFilter) return false;
        if (dateFrom && record.checkIn < dateFrom) return false;
        if (dateTo && record.checkIn > dateTo) return false;
        if (searchTerm) {
            const searchFields = [record.id, record.customerName, record.email, record.phoneNumber];
            const matchesSearch = searchFields.some(field => 
                field.toLowerCase().includes(searchTerm)
            );
            if (!matchesSearch) return false;
        }
        return true;
    });
    
    currentPage = 1;
    displayRecords(filteredRecords);
    updatePagination();
}

function clearRecordsFilters() {
    document.getElementById('recordsStatusFilter').value = '';
    document.getElementById('recordsDateFrom').value = '';
    document.getElementById('recordsDateTo').value = '';
    document.getElementById('searchInput').value = '';
    
    filteredRecords = [...allRecords];
    currentPage = 1;
    displayRecords(filteredRecords);
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayRecords(filteredRecords);
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayRecords(filteredRecords);
        updatePagination();
    }
}

// Calendar Management Functions
function initializeCalendar() {
    // Calendar will be initialized when switching to calendar section
}

function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Generate calendar grid
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Create day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Create day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = dateString;
        
        // Set availability status
        const status = availabilityData[dateString];
        if (status === true || status === undefined) {
            dayCell.classList.add('available');
        } else if (status === 'reserved') {
            dayCell.classList.add('reserved');
        } else if (status === 'booked') {
            dayCell.classList.add('booked');
        } else {
            dayCell.classList.add('available'); // Default to available
        }
        
        // Add click event
        dayCell.addEventListener('click', () => {
            if (isMultiSelectMode) {
                selectMultipleDates(dateString, dayCell);
            } else {
                selectDate(dateString, dayCell);
            }
        });
        
        calendarGrid.appendChild(dayCell);
    }
}

function selectDate(dateString, element) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Add selection to clicked day
    element.classList.add('selected');
    selectedDate = dateString;
    
    // Show selected date info
    const selectedDateInfo = document.getElementById('selectedDateInfo');
    const selectedDateSpan = document.getElementById('selectedDate');
    
    selectedDateSpan.textContent = formatDate(dateString);
    selectedDateInfo.style.display = 'block';
    
    // Show appropriate buttons based on current status
    const status = availabilityData[dateString];
    const availableButtons = document.getElementById('availableDateButtons');
    const unavailableButton = document.getElementById('unavailableDateButton');
    
    if (status === true || status === undefined) {
        // Currently available - show RESERVED and BOOKED buttons
        availableButtons.style.display = 'flex';
        unavailableButton.style.display = 'none';
    } else {
        // Currently booked or reserved - show only MARK AS AVAILABLE button
        availableButtons.style.display = 'none';
        unavailableButton.style.display = 'block';
    }
}

// Multiple date selection functionality
let selectedDates = [];
let isMultiSelectMode = false;

function toggleMultiSelectMode() {
    isMultiSelectMode = !isMultiSelectMode;
    selectedDates = [];
    
    // Update UI
    const multiSelectBtn = document.getElementById('multiSelectBtn');
    const bulkBtn = document.getElementById('bulkBtn');
    
    if (isMultiSelectMode) {
        multiSelectBtn.innerHTML = '<i class="fas fa-check"></i> Exit Multi-Select';
        multiSelectBtn.className = 'btn btn-success';
        if (bulkBtn) bulkBtn.style.display = 'inline-block';
        
        // Clear single date selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        selectedDate = null;
        document.getElementById('selectedDateInfo').style.display = 'none';
        
        showNotification('Multi-select mode enabled. Click dates to select multiple.', 'info');
    } else {
        multiSelectBtn.innerHTML = '<i class="fas fa-mouse-pointer"></i> Multi-Select';
        multiSelectBtn.className = 'btn btn-outline-primary';
        if (bulkBtn) bulkBtn.style.display = 'none';
        
        // Clear multi-select
        document.querySelectorAll('.calendar-day.multi-selected').forEach(day => {
            day.classList.remove('multi-selected');
        });
        selectedDates = [];
        
        showNotification('Multi-select mode disabled.', 'info');
    }
}

function selectMultipleDates(dateString, element) {
    if (!isMultiSelectMode) return;
    
    if (selectedDates.includes(dateString)) {
        // Deselect
        selectedDates = selectedDates.filter(date => date !== dateString);
        element.classList.remove('multi-selected');
    } else {
        // Select
        selectedDates.push(dateString);
        element.classList.add('multi-selected');
    }
    
    // Update bulk button
    const bulkBtn = document.getElementById('bulkBtn');
    if (bulkBtn) {
        if (selectedDates.length > 0) {
            bulkBtn.innerHTML = `<i class="fas fa-bolt"></i> Bulk Action (${selectedDates.length})`;
            bulkBtn.disabled = false;
        } else {
            bulkBtn.innerHTML = '<i class="fas fa-bolt"></i> Bulk Action';
            bulkBtn.disabled = true;
        }
    }
}

function applyBulkActionToSelected() {
    if (selectedDates.length === 0) return;
    
    const action = prompt(`Apply bulk action to ${selectedDates.length} selected dates:\n1. Available\n2. Reserved\n3. Booked\n\nEnter 1, 2, or 3:`);
    
    if (!action || !['1', '2', '3'].includes(action)) return;
    
    let status;
    switch(action) {
        case '1': status = true; break;
        case '2': status = 'reserved'; break;
        case '3': status = 'booked'; break;
    }
    
    // Apply to all selected dates
    saveMultipleAvailabilityToFirebase(selectedDates, status).then(success => {
        if (success) {
            // Update local data
            selectedDates.forEach(date => {
                availabilityData[date] = status;
            });
            
            // Update calendar display
            selectedDates.forEach(date => {
                const dayElement = document.querySelector(`[data-date="${date}"]`);
                if (dayElement) {
                    dayElement.classList.remove('available', 'reserved', 'booked', 'multi-selected');
                    
                    if (status === true) {
                        dayElement.classList.add('available');
                    } else if (status === 'reserved') {
                        dayElement.classList.add('reserved');
                    } else if (status === 'booked') {
                        dayElement.classList.add('booked');
                    }
                }
            });
            
            // Clear selection
            selectedDates = [];
            const bulkBtn = document.getElementById('bulkBtn');
            if (bulkBtn) {
                bulkBtn.innerHTML = '<i class="fas fa-bolt"></i> Bulk Action';
                bulkBtn.disabled = true;
            }
            
            showNotification(`Updated ${selectedDates.length} dates successfully!`, 'success');
        } else {
            showNotification('Failed to update dates. Please try again.', 'error');
        }
    });
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
}

function today() {
    currentDate = new Date();
    generateCalendar();
}

// Set specific date status
function setDateStatus(newStatus) {
    console.log('setDateStatus called, selectedDate:', selectedDate, 'newStatus:', newStatus);
    
    if (!selectedDate) {
        console.log('No date selected');
        showNotification('Please select a date first', 'error');
        return;
    }
    
    console.log(`Setting date ${selectedDate} to status: ${newStatus}`);
    
    // Update local data
    availabilityData[selectedDate] = newStatus;
    
    // Save to Firebase
    saveAvailabilityToFirebase(selectedDate, newStatus).then(success => {
        if (success) {
            // Update the calendar display
            const dayElement = document.querySelector(`[data-date="${selectedDate}"]`);
            if (dayElement) {
                dayElement.classList.remove('available', 'blocked', 'booked', 'reserved');
                
                if (newStatus === true) {
                    dayElement.classList.add('available');
                } else if (newStatus === 'reserved') {
                    dayElement.classList.add('reserved');
                } else if (newStatus === 'booked') {
                    dayElement.classList.add('booked');
                }
            }
            
            // Update button display
            const availableButtons = document.getElementById('availableDateButtons');
            const unavailableButton = document.getElementById('unavailableDateButton');
            
            if (newStatus === true) {
                // Now available - show RESERVED and BOOKED buttons
                availableButtons.style.display = 'flex';
                unavailableButton.style.display = 'none';
            } else {
                // Now booked or reserved - show only MARK AS AVAILABLE button
                availableButtons.style.display = 'none';
                unavailableButton.style.display = 'block';
            }
            
            showNotification(`Date marked as ${newStatus.toUpperCase()} successfully!`, 'success');
        } else {
            showNotification('Failed to update availability. Please try again.', 'error');
        }
    });
}

function blockDate() {
    console.log('blockDate called, selectedDate:', selectedDate);
    console.log('saveAvailabilityToFirebase function:', typeof saveAvailabilityToFirebase);
    
    if (!selectedDate) {
        console.log('No date selected');
        return;
    }
    
    // Set to reserved (gray) status
    availabilityData[selectedDate] = 'reserved';
    
    // Save to Firebase
    saveAvailabilityToFirebase(selectedDate, 'reserved').then(success => {
        if (success) {
            // Update the calendar display
            const dayElement = document.querySelector(`[data-date="${selectedDate}"]`);
            if (dayElement) {
                dayElement.classList.remove('available', 'booked', 'blocked');
                dayElement.classList.add('reserved');
            }
            
            // Update toggle button
            const toggleBtn = document.getElementById('toggleBtn');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fas fa-pause"></i> Reserved';
                toggleBtn.className = 'btn btn-warning';
            }
            
            showNotification('Date reserved successfully!', 'success');
        } else {
            showNotification('Failed to reserve date. Please try again.', 'error');
        }
    });
}

function unblockDate() {
    if (!selectedDate) return;
    
    // Set to available status
    availabilityData[selectedDate] = true;
    
    // Save to Firebase
    saveAvailabilityToFirebase(selectedDate, true).then(success => {
        if (success) {
            // Update the calendar display
            const dayElement = document.querySelector(`[data-date="${selectedDate}"]`);
            if (dayElement) {
                dayElement.classList.remove('reserved', 'booked', 'blocked');
                dayElement.classList.add('available');
            }
            
            // Update toggle button
            const toggleBtn = document.getElementById('toggleBtn');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fas fa-toggle-on"></i> Available';
                toggleBtn.className = 'btn btn-success';
            }
            
            showNotification('Date made available successfully!', 'success');
        } else {
            showNotification('Failed to make date available. Please try again.', 'error');
        }
    });
}

// Modal Functions
function showAddBookingModal() {
    document.getElementById('addBookingModal').style.display = 'flex';
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('addCheckIn').value = today;
    document.getElementById('addCheckOut').value = today;
}

function closeAddBookingModal() {
    document.getElementById('addBookingModal').style.display = 'none';
    document.getElementById('addBookingForm').reset();
}

function handleAddBookingDateChange() {
    const checkIn = document.getElementById('addCheckIn').value;
    const checkOut = document.getElementById('addCheckOut').value;
    
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (checkOutDate <= checkInDate) {
            document.getElementById('addCheckOut').value = '';
            alert('Check-out date must be after check-in date');
        } else {
            // Update check-out minimum date
            const nextDay = new Date(checkInDate);
            nextDay.setDate(nextDay.getDate() + 1);
            document.getElementById('addCheckOut').min = nextDay.toISOString().split('T')[0];
        }
    }
}

async function submitAddBooking() {
    const form = document.getElementById('addBookingForm');
    const formData = new FormData(form);
    
    // Validate form
    if (!validateAddBookingForm()) {
        return;
    }
    
    const bookingData = {
        id: generateBookingId(),
        customerName: formData.get('customerName'),
        phoneNumber: formData.get('phoneNumber'),
        email: formData.get('email'),
        checkIn: formData.get('checkIn'),
        checkOut: formData.get('checkOut'),
        adults: parseInt(formData.get('adults')),
        kids: parseInt(formData.get('kids')),
        extraBeds: parseInt(formData.get('extraBeds')),
        status: formData.get('status'),
        totalAmount: calculateBookingAmount(formData.get('checkIn'), formData.get('checkOut'), parseInt(formData.get('extraBeds'))),
        createdAt: new Date().toISOString()
    };
    
    try {
        // Save to Firebase
        await addDoc(collection(db, 'bookings'), bookingData);
        console.log('Successfully added booking to Firebase:', bookingData);
        
        // Add to local arrays
        allBookings.unshift(bookingData);
        allRecords.unshift(bookingData);
        
        // Update filtered arrays
        filteredBookings = [...allBookings];
        filteredRecords = [...allRecords];
        
        // Refresh displays
        if (currentSection === 'booking') {
            displayBookings(filteredBookings);
        } else if (currentSection === 'records') {
            displayRecords(filteredRecords);
            updatePagination();
        }
        
        // Update notification count
        updateNotificationCount();
        
        closeAddBookingModal();
        showNotification('Booking added successfully!', 'success');
        
    } catch (error) {
        console.error('Failed to add booking to Firebase:', error);
        showNotification('Failed to add booking. Please try again.', 'error');
    }
}

function validateAddBookingForm() {
    const requiredFields = ['customerName', 'phoneNumber', 'email', 'checkIn', 'checkOut', 'adults'];
    
    for (const field of requiredFields) {
        const input = document.getElementById(`add${field.charAt(0).toUpperCase() + field.slice(1)}`);
        if (!input.value.trim()) {
            alert(`Please fill in the ${field} field`);
            input.focus();
            return false;
        }
    }
    
    return true;
}

function calculateBookingAmount(checkIn, checkOut, extraBeds) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 3600 * 24));
    
    const PRICE_PER_NIGHT = 3300;
    const PRICE_PER_EXTRA_BED = 300;
    
    return (nights * PRICE_PER_NIGHT) + (extraBeds * PRICE_PER_EXTRA_BED);
}

function generateBookingId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ARB-${timestamp}-${random}`.toUpperCase();
}

// Booking Actions
window.viewBookingDetails = function(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
        displayBookingDetails(booking);
        document.getElementById('bookingDetailsModal').style.display = 'flex';
    }
}

function displayBookingDetails(booking) {
    const content = document.getElementById('bookingDetailsContent');
    
    // Calculate days and nights
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
    const nights = days - 1;
    
    // Check if mobile device
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile-optimized layout with shorter labels
        content.innerHTML = `
            <div class="booking-details">
                <div class="detail-row">
                    <strong>ID:</strong> ${booking.id}
                </div>
                <div class="detail-row">
                    <strong>Customer:</strong> ${booking.customerName}
                </div>
                <div class="detail-row">
                    <strong>Phone:</strong> ${booking.phoneNumber}
                </div>
                <div class="detail-row">
                    <strong>Email:</strong> ${booking.email}
                </div>
                <div class="detail-row">
                    <strong>Check-in:</strong> ${formatDate(booking.checkIn)}
                </div>
                <div class="detail-row">
                    <strong>Check-out:</strong> ${formatDate(booking.checkOut)}
                </div>
                <div class="detail-row">
                    <strong>Duration:</strong> ${days} days, ${nights} nights
                </div>
                <div class="detail-row">
                    <strong>Adults:</strong> ${booking.adults}
                </div>
                <div class="detail-row">
                    <strong>Kids:</strong> ${booking.kids}
                </div>
                <div class="detail-row">
                    <strong>Extra Beds:</strong> ${booking.extraBeds}
                </div>
                <div class="detail-row">
                    <strong>Amount:</strong> ₱${booking.totalAmount.toLocaleString()}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                </div>
                <div class="detail-row">
                    <strong>Created:</strong> ${formatDateTime(booking.createdAt)}
                </div>
                ${booking.receiptUrl ? `
                <div class="detail-row">
                    <strong>Receipt:</strong>
                    <div class="receipt-image-container">
                        <img src="${booking.receiptUrl}" alt="GCash Receipt" class="receipt-image" onclick="openReceiptModal('${booking.receiptUrl}')">
                        <button onclick="openReceiptModal('${booking.receiptUrl}')" class="view-receipt-btn">
                            <i class="fas fa-eye"></i> View Full Size
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    } else {
        // Desktop layout with full labels
        content.innerHTML = `
            <div class="booking-details">
                <div class="detail-row">
                    <strong>Booking ID:</strong> ${booking.id}
                </div>
                <div class="detail-row">
                    <strong>Customer Name:</strong> ${booking.customerName}
                </div>
                <div class="detail-row">
                    <strong>Phone Number:</strong> ${booking.phoneNumber}
                </div>
                <div class="detail-row">
                    <strong>Email:</strong> ${booking.email}
                </div>
                <div class="detail-row">
                    <strong>Check-in Date:</strong> ${formatDate(booking.checkIn)}
                </div>
                <div class="detail-row">
                    <strong>Check-out Date:</strong> ${formatDate(booking.checkOut)}
                </div>
                <div class="detail-row">
                    <strong>Duration:</strong> ${days} days, ${nights} nights
                </div>
                <div class="detail-row">
                    <strong>Number of Adults:</strong> ${booking.adults}
                </div>
                <div class="detail-row">
                    <strong>Number of Kids:</strong> ${booking.kids}
                </div>
                <div class="detail-row">
                    <strong>Extra Beds:</strong> ${booking.extraBeds}
                </div>
                <div class="detail-row">
                    <strong>Total Amount:</strong> ₱${booking.totalAmount.toLocaleString()}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                </div>
                <div class="detail-row">
                    <strong>Created At:</strong> ${formatDateTime(booking.createdAt)}
                </div>
                ${booking.receiptUrl ? `
                <div class="detail-row">
                    <strong>GCash Receipt:</strong>
                    <div class="receipt-image-container">
                        <img src="${booking.receiptUrl}" alt="GCash Receipt" class="receipt-image" onclick="openReceiptModal('${booking.receiptUrl}')">
                        <button onclick="openReceiptModal('${booking.receiptUrl}')" class="view-receipt-btn">
                            <i class="fas fa-eye"></i> View Full Size
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    // Show/hide action buttons based on status
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    if (booking.status === 'pending') {
        approveBtn.style.display = 'inline-flex';
        rejectBtn.style.display = 'inline-flex';
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
}

function closeBookingDetailsModal() {
    document.getElementById('bookingDetailsModal').style.display = 'none';
}

window.approveBooking = async function(bookingId) {
    if (confirm('Are you sure you want to approve this booking? A confirmation email will be sent to the customer.')) {
        await updateBookingStatus(bookingId, 'confirmed', true); // true = send email
    }
}

window.rejectBooking = async function(bookingId) {
    if (confirm('Are you sure you want to reject this booking?')) {
        await updateBookingStatus(bookingId, 'rejected');
    }
}

// Functions for modal buttons
window.approveBookingFromModal = async function() {
    const bookingId = getCurrentBookingId();
    if (bookingId) {
        if (confirm('Are you sure you want to approve this booking? A confirmation email will be sent to the customer.')) {
            await updateBookingStatus(bookingId, 'confirmed', true); // true = send email
            closeBookingDetailsModal();
        }
    }
}

window.rejectBookingFromModal = async function() {
    const bookingId = getCurrentBookingId();
    if (bookingId) {
        if (confirm('Are you sure you want to reject this booking?')) {
            await updateBookingStatus(bookingId, 'rejected');
            closeBookingDetailsModal();
        }
    }
}

// Get current booking ID from modal content
function getCurrentBookingId() {
    const content = document.getElementById('bookingDetailsContent');
    const detailRows = content.querySelectorAll('.detail-row');
    
    for (let row of detailRows) {
        const strongElement = row.querySelector('strong');
        if (strongElement && strongElement.textContent.includes('Booking ID:')) {
            const bookingIdText = row.textContent.replace('Booking ID:', '').trim();
            return bookingIdText;
        }
    }
    return null;
}

async function updateBookingStatus(bookingId, status, sendEmail = false) {
    console.log(`Updating booking ${bookingId} to status: ${status}`);
    
    try {
        // Update in Firebase using the booking ID (which is now the Firebase document ID)
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
            status: status,
            updatedAt: new Date().toISOString()
        });
        
        // Send confirmation email if approved and requested
        if (status === 'confirmed' && sendEmail) {
            try {
                // Get booking data to send email
                const bookingDoc = await getDoc(bookingRef);
                const booking = { id: bookingId, ...bookingDoc.data() };
                
                // Send confirmation email
                const emailResult = await sendBookingConfirmationEmail(booking);
                
                if (emailResult.success) {
                    console.log('Confirmation email sent successfully');
                } else {
                    console.error('Failed to send confirmation email:', emailResult.error);
                }
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
            }
        }
        
        console.log(`Successfully updated booking ${bookingId} to ${status} in Firebase`);
        
        // Update in local arrays
        allBookings.forEach(booking => {
            if (booking.id === bookingId) {
                booking.status = status;
                booking.updatedAt = new Date().toISOString();
            }
        });
        
        allRecords.forEach(record => {
            if (record.id === bookingId) {
                record.status = status;
                record.updatedAt = new Date().toISOString();
            }
        });
        
        // Update filtered arrays
        filteredBookings = [...allBookings];
        filteredRecords = [...allRecords];
        
        // Refresh displays
        if (currentSection === 'booking') {
            displayBookings(filteredBookings);
        } else if (currentSection === 'records') {
            displayRecords(filteredRecords);
        }
        
        // Update notification count
        updateNotificationCount();
        
        // Close modal
        closeBookingDetailsModal();
        
        showNotification(`Booking ${status} successfully!`, 'success');
        
    } catch (error) {
        console.error('Failed to update booking status in Firebase:', error);
        showNotification('Failed to update booking status. Please try again.', 'error');
    }
}

function viewRecordDetails(recordId) {
    const record = allRecords.find(r => r.id === recordId);
    if (record) {
        displayBookingDetails(record);
        document.getElementById('bookingDetailsModal').style.display = 'flex';
    }
}

// Bulk Availability Functions
function showBulkAvailabilityModal() {
    document.getElementById('bulkAvailabilityModal').style.display = 'flex';
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bulkStartDate').value = today;
    document.getElementById('bulkEndDate').value = today;
}

function closeBulkAvailabilityModal() {
    document.getElementById('bulkAvailabilityModal').style.display = 'none';
    document.getElementById('bulkAvailabilityForm').reset();
}

function applyBulkAvailability() {
    const form = document.getElementById('bulkAvailabilityForm');
    const formData = new FormData(form);
    
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    const status = formData.get('status');
    const weekdaysOnly = formData.get('weekdaysOnly') === 'on';
    const weekendsOnly = formData.get('weekendsOnly') === 'on';
    
    if (!startDate || !endDate || !status) {
        alert('Please fill in all required fields');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
        alert('End date must be after start date');
        return;
    }
    
    let updatedDates = 0;
    const current = new Date(start);
    
    while (current <= end) {
        const dateString = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        
        // Check if date should be updated based on weekday/weekend filters
        let shouldUpdate = true;
        
        if (weekdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
            shouldUpdate = false;
        }
        
        if (weekendsOnly && (dayOfWeek !== 0 && dayOfWeek !== 6)) {
            shouldUpdate = false;
        }
        
        if (shouldUpdate) {
            // Convert status string to proper value
            let statusValue;
            if (status === 'true') {
                statusValue = true;
            } else if (status === 'reserved') {
                statusValue = 'reserved';
            } else if (status === 'booked') {
                statusValue = 'booked';
            } else {
                statusValue = status; // fallback
            }
            
            availabilityData[dateString] = statusValue;
            updatedDates++;
        }
        
        current.setDate(current.getDate() + 1);
    }
    
    // Save to Firebase
    const datesToUpdate = [];
    const current2 = new Date(start);
    
    while (current2 <= end) {
        const dateString = current2.toISOString().split('T')[0];
        const dayOfWeek = current2.getDay();
        
        // Check if date should be updated based on weekday/weekend filters
        let shouldUpdate = true;
        
        if (weekdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
            shouldUpdate = false;
        }
        
        if (weekendsOnly && (dayOfWeek !== 0 && dayOfWeek !== 6)) {
            shouldUpdate = false;
        }
        
        if (shouldUpdate) {
            datesToUpdate.push(dateString);
        }
        
        current2.setDate(current2.getDate() + 1);
    }
    
    // Convert status for Firebase
    let firebaseStatus;
    if (status === 'true') {
        firebaseStatus = true;
    } else if (status === 'reserved') {
        firebaseStatus = 'reserved';
    } else if (status === 'booked') {
        firebaseStatus = 'booked';
    } else {
        firebaseStatus = status; // fallback
    }
    
    // Save all dates to Firebase
    saveMultipleAvailabilityToFirebase(datesToUpdate, firebaseStatus).then(success => {
        if (success) {
            // Regenerate calendar
            generateCalendar();
            
            // Close modal
            closeBulkAvailabilityModal();
            
            // Show success message
            showNotification(`Updated ${updatedDates} dates successfully!`, 'success');
        } else {
            showNotification('Failed to update some dates. Please try again.', 'error');
        }
    });
}

// Export Functions
function showExportRecordsModal() {
    document.getElementById('exportRecordsModal').style.display = 'flex';
    
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('exportDateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('exportDateTo').value = today.toISOString().split('T')[0];
}

function closeExportRecordsModal() {
    document.getElementById('exportRecordsModal').style.display = 'none';
    document.getElementById('exportRecordsForm').reset();
}

function confirmExportRecords() {
    const form = document.getElementById('exportRecordsForm');
    const formData = new FormData(form);
    
    const exportDateFrom = formData.get('exportDateFrom');
    const exportDateTo = formData.get('exportDateTo');
    const exportStatus = formData.get('exportStatus');
    const exportFormat = formData.get('exportFormat');
    
    // Validate form
    if (!exportDateFrom || !exportDateTo) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (new Date(exportDateTo) < new Date(exportDateFrom)) {
        alert('End date must be after start date');
        return;
    }
    
    // Close modal
    closeExportRecordsModal();
    
    // Export records with selected criteria
    exportRecordsWithFilters(exportDateFrom, exportDateTo, exportStatus, exportFormat);
}

function exportRecordsWithFilters(dateFrom, dateTo, statusFilter, format) {
    try {
        // Filter records based on selected criteria
        let recordsToExport = allRecords.filter(record => {
            // Date filter
            const recordDate = new Date(record.createdAt);
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            
            if (recordDate < fromDate || recordDate > toDate) {
                return false;
            }
            
            // Status filter
            if (statusFilter && record.status !== statusFilter) {
                return false;
            }
            
            return true;
        });
        
        if (recordsToExport.length === 0) {
            showNotification('No records found for the selected criteria', 'info');
            return;
        }
        
        // Generate filename with date range
        const fromDateStr = new Date(dateFrom).toISOString().split('T')[0];
        const toDateStr = new Date(dateTo).toISOString().split('T')[0];
        const statusStr = statusFilter ? `-${statusFilter}` : '';
        
        // Handle different export formats
        switch(format) {
            case 'csv':
                exportRecordsAsCSV(recordsToExport, fromDateStr, toDateStr, statusStr);
                break;
            case 'xlsx':
                exportRecordsAsXLSX(recordsToExport, fromDateStr, toDateStr, statusStr);
                break;
            case 'word':
                exportRecordsAsWord(recordsToExport, fromDateStr, toDateStr, statusStr);
                break;
            case 'pdf':
                exportRecordsAsPDF(recordsToExport, fromDateStr, toDateStr, statusStr);
                break;
            case 'png':
                exportRecordsAsPNG(recordsToExport, fromDateStr, toDateStr, statusStr);
                break;
            case 'jpeg':
                exportRecordsAsJPEG(recordsToExport, fromDateStr, toDateStr, statusStr);
                break;
            default:
                exportRecordsAsCSV(recordsToExport, fromDateStr, toDateStr, statusStr);
        }
        
        showNotification(`Successfully exported ${recordsToExport.length} records!`, 'success');
        
    } catch (error) {
        console.error('Error exporting records:', error);
        showNotification('Failed to export records. Please try again.', 'error');
    }
}

function exportRecordsAsCSV(records, fromDate, toDate, statusStr) {
        // Create CSV content
        const headers = [
            'Booking ID',
            'Customer Name',
            'Phone Number',
            'Email',
            'Check-in Date',
            'Check-out Date',
        'Adults',
        'Kids',
            'Extra Beds',
            'Total Amount',
            'Status',
            'Created At'
        ];
        
        const csvContent = [
            headers.join(','),
        ...records.map(record => [
                record.id,
                `"${record.customerName}"`,
                record.phoneNumber,
                record.email,
                record.checkIn,
                record.checkOut,
            record.adults,
            record.kids,
                record.extraBeds,
                record.totalAmount,
                record.status,
                record.createdAt
            ].join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
    a.download = `arriba-homestay-records-${fromDate}-to-${toDate}${statusStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
}

function exportRecordsAsXLSX(records, fromDate, toDate, statusStr) {
    // Create Excel-compatible CSV with proper formatting
    const headers = [
        'Booking ID',
        'Customer Name',
        'Phone Number',
        'Email',
        'Check-in Date',
        'Check-out Date',
        'Adults',
        'Kids',
        'Extra Beds',
        'Total Amount',
        'Status',
        'Created At'
    ];
    
    const csvContent = [
        headers.join('\t'), // Use tabs for better Excel compatibility
        ...records.map(record => [
            record.id,
            record.customerName,
            record.phoneNumber,
            record.email,
            record.checkIn,
            record.checkOut,
            record.adults,
            record.kids,
            record.extraBeds,
            record.totalAmount,
            record.status,
            record.createdAt
        ].join('\t'))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arriba-homestay-records-${fromDate}-to-${toDate}${statusStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function exportRecordsAsWord(records, fromDate, toDate, statusStr) {
    // Create HTML content that can be opened in Word
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Arriba Homestay Records</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                h2 { color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .summary { background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>Arriba Homestay - Booking Records</h1>
            <div class="summary">
                <h2>Export Summary</h2>
                <p><strong>Date Range:</strong> ${fromDate} to ${toDate}</p>
                <p><strong>Total Records:</strong> ${records.length}</p>
                <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <h2>Booking Records</h2>
            <table>
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Customer Name</th>
                        <th>Phone Number</th>
                        <th>Email</th>
                        <th>Check-in Date</th>
                        <th>Check-out Date</th>
                        <th>Adults</th>
                        <th>Kids</th>
                        <th>Extra Beds</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(record => `
                        <tr>
                            <td>${record.id}</td>
                            <td>${record.customerName}</td>
                            <td>${record.phoneNumber}</td>
                            <td>${record.email}</td>
                            <td>${record.checkIn}</td>
                            <td>${record.checkOut}</td>
                            <td>${record.adults}</td>
                            <td>${record.kids}</td>
                            <td>${record.extraBeds}</td>
                            <td>₱${record.totalAmount.toLocaleString()}</td>
                            <td>${record.status}</td>
                            <td>${new Date(record.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Create and download file
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arriba-homestay-records-${fromDate}-to-${toDate}${statusStr}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function exportRecordsAsPDF(records, fromDate, toDate, statusStr) {
    // Create HTML content for PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Arriba Homestay Records</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                h1 { color: #2c3e50; text-align: center; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
                h2 { color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .summary { background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
                @media print {
                    body { margin: 0; }
                    table { font-size: 10px; }
                }
            </style>
        </head>
        <body>
            <h1>Arriba Homestay - Booking Records</h1>
            <div class="summary">
                <h2>Export Summary</h2>
                <p><strong>Date Range:</strong> ${fromDate} to ${toDate}</p>
                <p><strong>Total Records:</strong> ${records.length}</p>
                <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <h2>Booking Records</h2>
            <table>
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Customer Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Adults</th>
                        <th>Kids</th>
                        <th>Extra Beds</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(record => `
                        <tr>
                            <td>${record.id}</td>
                            <td>${record.customerName}</td>
                            <td>${record.phoneNumber}</td>
                            <td>${record.email}</td>
                            <td>${record.checkIn}</td>
                            <td>${record.checkOut}</td>
                            <td>${record.adults}</td>
                            <td>${record.kids}</td>
                            <td>${record.extraBeds}</td>
                            <td>₱${record.totalAmount.toLocaleString()}</td>
                            <td>${record.status}</td>
                            <td>${new Date(record.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                <p>Generated on ${new Date().toLocaleString()} | Arriba Homestay Management System</p>
            </div>
        </body>
        </html>
    `;
    
    // Create and download file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arriba-homestay-records-${fromDate}-to-${toDate}${statusStr}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function exportRecordsAsPNG(records, fromDate, toDate, statusStr) {
    // Create a visual chart/table as PNG
    createVisualExport(records, fromDate, toDate, statusStr, 'png');
}

function exportRecordsAsJPEG(records, fromDate, toDate, statusStr) {
    // Create a visual chart/table as JPEG
    createVisualExport(records, fromDate, toDate, statusStr, 'jpeg');
}

function createVisualExport(records, fromDate, toDate, statusStr, format) {
    // Create a canvas element to generate the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Arriba Homestay - Booking Records', canvas.width / 2, 50);
    
    // Subtitle
    ctx.fillStyle = '#3498db';
    ctx.font = '20px Arial';
    ctx.fillText(`Date Range: ${fromDate} to ${toDate}`, canvas.width / 2, 85);
    ctx.fillText(`Total Records: ${records.length}`, canvas.width / 2, 115);
    
    // Create a simple table visualization
    const tableStartY = 150;
    const rowHeight = 25;
    const colWidths = [120, 150, 120, 200, 100, 100, 60, 60, 80, 100, 80, 120];
    const headers = ['ID', 'Customer', 'Phone', 'Email', 'Check-in', 'Check-out', 'Adults', 'Kids', 'Extra', 'Amount', 'Status', 'Created'];
    
    // Draw table headers
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(50, tableStartY, canvas.width - 100, rowHeight);
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    
    let x = 60;
    headers.forEach((header, index) => {
        ctx.fillText(header, x, tableStartY + 18);
        x += colWidths[index];
    });
    
    // Draw table rows (limit to first 20 records for readability)
    const displayRecords = records.slice(0, 20);
    displayRecords.forEach((record, rowIndex) => {
        const y = tableStartY + (rowIndex + 1) * rowHeight;
        
        // Alternate row colors
        if (rowIndex % 2 === 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = '#f9f9f9';
        }
        ctx.fillRect(50, y, canvas.width - 100, rowHeight);
        
        // Draw row data
        ctx.fillStyle = '#333333';
        ctx.font = '10px Arial';
        
        x = 60;
        const rowData = [
            record.id.substring(0, 10) + '...',
            record.customerName.substring(0, 15),
            record.phoneNumber.substring(0, 12),
            record.email.substring(0, 20),
            record.checkIn.substring(0, 10),
            record.checkOut.substring(0, 10),
            record.adults.toString(),
            record.kids.toString(),
            record.extraBeds.toString(),
            '₱' + record.totalAmount.toLocaleString(),
            record.status,
            new Date(record.createdAt).toLocaleDateString()
        ];
        
        rowData.forEach((data, colIndex) => {
            ctx.fillText(data, x, y + 15);
            x += colWidths[colIndex];
        });
    });
    
    // Add note if there are more records
    if (records.length > 20) {
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`... and ${records.length - 20} more records`, canvas.width / 2, tableStartY + (21 * rowHeight) + 20);
    }
    
    // Footer
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Generated on ${new Date().toLocaleString()}`, canvas.width / 2, canvas.height - 20);
    
    // Convert canvas to image and download
    canvas.toBlob(function(blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arriba-homestay-records-${fromDate}-to-${toDate}${statusStr}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, `image/${format}`);
}

// Legacy export function (kept for compatibility)
function exportRecords() {
    // Default export (all records)
    exportRecordsWithFilters(
        new Date(0).toISOString().split('T')[0], // Start from beginning
        new Date().toISOString().split('T')[0],  // End today
        '', // All statuses
        'csv' // Default format
    );
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'index.html';
    }
}

// Clear all bookings function (for debugging)
window.clearAllBookings = function() {
    if (confirm('Are you sure you want to clear all bookings? This cannot be undone.')) {
        localStorage.removeItem('arribaBookings');
        allBookings = [];
        allRecords = [];
        filteredBookings = [];
        filteredRecords = [];
        
        // Refresh displays
        if (currentSection === 'booking') {
            displayBookings(filteredBookings);
        } else if (currentSection === 'records') {
            displayRecords(filteredRecords);
            updatePagination();
        }
        
        // Update notification count
        updateNotificationCount();
        
        showNotification('All bookings cleared!', 'success');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Mobile Menu Toggle
window.toggleMobileMenu = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

// Close Mobile Menu
window.closeMobileMenu = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (window.innerWidth <= 768) {
        // Check if mobile toggle exists (it might not exist with bottom navigation)
        if (!sidebar.contains(event.target) && (!mobileToggle || !mobileToggle.contains(event.target))) {
            closeMobileMenu();
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
    
    // Update mobile click functionality for existing rows
    updateMobileClickHandlers();
});

// Update mobile click handlers for existing table rows
function updateMobileClickHandlers() {
    const isMobile = window.innerWidth <= 768;
    const bookingRows = document.querySelectorAll('#bookingsTable tbody tr');
    const recordRows = document.querySelectorAll('#recordsTable tbody tr');
    
    // Update booking rows
    bookingRows.forEach(row => {
        // Remove existing click handlers
        row.replaceWith(row.cloneNode(true));
        
        // Add new click handler if mobile
        if (isMobile) {
            row.style.cursor = 'pointer';
            row.addEventListener('click', function(e) {
                if (!e.target.closest('.action-btn')) {
                    const bookingId = row.cells[0].textContent;
                    viewBookingDetails(bookingId);
                }
            });
        } else {
            row.style.cursor = 'default';
        }
    });
    
    // Update record rows
    recordRows.forEach(row => {
        // Remove existing click handlers
        row.replaceWith(row.cloneNode(true));
        
        // Add new click handler if mobile
        if (isMobile) {
            row.style.cursor = 'pointer';
            row.addEventListener('click', function(e) {
                if (!e.target.closest('.action-btn')) {
                    const recordId = row.cells[0].textContent;
                    viewRecordDetails(recordId);
                }
            });
        } else {
            row.style.cursor = 'default';
        }
    });
}

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupRealTimeReviewListeners().catch(error => {
        console.error('Error setting up review listeners:', error);
    });
    
    // Load reviews initially if we're on the reviews page
    if (window.location.hash === '#reviews') {
        setTimeout(() => {
            loadReviews();
        }, 500); // Small delay to ensure Firebase is initialized
    }
});

// Listen for hash changes to load reviews when navigating to reviews tab
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#reviews') {
        setTimeout(() => {
            loadReviews();
        }, 100);
    }
});

// Set up real-time listeners for reviews
async function setupRealTimeReviewListeners() {
    if (!db) {
        console.log('Firebase not available for real-time listeners');
        return;
    }
    
    try {
        // Import Firebase functions
        const { collection, query, onSnapshot } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        // Set up real-time listener for reviews
        const reviewsRef = collection(db, 'reviews');
        const reviewsQuery = query(reviewsRef); // Simplified query without ordering
        
        // Listen for real-time changes
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            console.log('Reviews updated in real-time');
            
            // Only refresh reviews if we're currently on the reviews section
            const reviewsSection = document.getElementById('reviewsContent');
            if (reviewsSection && reviewsSection.classList.contains('active')) {
                loadReviews();
            }
        }, (error) => {
            console.error('Error setting up real-time reviews listener:', error);
        });
        
        // Store the unsubscribe function for cleanup
        window.unsubscribeReviews = unsubscribeReviews;
        
    } catch (error) {
        console.error('Error setting up real-time review listeners:', error);
    }
}

// ==================== REVIEW MANAGEMENT FUNCTIONS ====================

// Load all reviews
async function loadReviews() {
    try {
        console.log('Loading reviews...');
        
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef); // Simplified query without ordering
        const querySnapshot = await getDocs(q);
        
        allReviews = [];
        querySnapshot.forEach((doc) => {
            allReviews.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by submittedAt date (client-side sorting)
        allReviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        // Store reviews globally for mobile
        window.currentReviews = allReviews;
        
        console.log('Reviews loaded:', allReviews.length);
        displayReviews(allReviews);
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        showNotification('Error loading reviews', 'error');
    }
}

// Display reviews in the table
function displayReviews(reviews) {
    const tableBody = document.getElementById('reviewsTableBody');
    
    if (reviews.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No reviews found</td></tr>';
        // Store empty reviews globally for mobile
        window.currentReviews = [];
        // Generate mobile cards if on mobile
        if (window.innerWidth <= 768) {
            generateMobileReviewCards([]);
        }
        return;
    }
    
    tableBody.innerHTML = reviews.map(review => {
        const stars = Array(5).fill().map((_, i) => 
            i < review.rating ? '<i class="fas fa-star" style="color: #f39c12;"></i>' : '<i class="far fa-star" style="color: #ddd;"></i>'
        ).join('');
        
        const date = new Date(review.submittedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Count only valid media files
        const validImages = review.images ? review.images.filter(img => img && img !== '' && img !== null && img !== undefined) : [];
        const validVideos = review.videos ? review.videos.filter(vid => vid && vid !== '' && vid !== null && vid !== undefined) : [];
        const mediaCount = validImages.length + validVideos.length;
        const mediaText = mediaCount > 0 ? `${mediaCount} file${mediaCount > 1 ? 's' : ''}` : 'None';
        
        const statusClass = review.status === 'approved' ? 'status-approved' : 
                           review.status === 'rejected' ? 'status-rejected' : 'status-pending';
        
        const statusText = review.status.charAt(0).toUpperCase() + review.status.slice(1);
        
        return `
            <tr class="review-row" onclick="viewReviewDetails('${review.id}')" style="cursor: pointer;">
                <td>
                    <div class="customer-info">
                        <strong>${review.customerName}</strong>
                        <small class="review-id">ID: ${review.reviewId || review.id}</small>
                    </div>
                </td>
                <td><div class="rating-display">${stars}</div></td>
                <td class="review-preview">${review.reviewText.length > 100 ? review.reviewText.substring(0, 100) + '...' : review.reviewText}</td>
                <td>${mediaText}</td>
                <td>${date}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-column" onclick="event.stopPropagation();">
                    <button onclick="viewReviewDetails('${review.id}')" class="btn-action btn-view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${review.status === 'pending' ? `
                        <button onclick="approveReview('${review.id}')" class="btn-action btn-approve" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="rejectReview('${review.id}')" class="btn-action btn-reject" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    ${review.status === 'approved' ? `
                        <button onclick="deleteReview('${review.id}')" class="btn-action btn-delete" title="Delete Active Review">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
    
    // Generate mobile cards if on mobile
    if (window.innerWidth <= 768) {
        generateMobileReviewCards(reviews);
    }
}

// View review details
async function viewReviewDetails(reviewId) {
    try {
        const reviewDoc = doc(db, 'reviews', reviewId);
        const { getDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        const reviewSnapshot = await getDoc(reviewDoc);
        
        if (!reviewSnapshot.exists()) {
            showNotification('Review not found', 'error');
            return;
        }
        
        const review = reviewSnapshot.data();
        
        const stars = Array(5).fill().map((_, i) => 
            i < review.rating ? '<i class="fas fa-star" style="color: #f39c12;"></i>' : '<i class="far fa-star" style="color: #ddd;"></i>'
        ).join('');
        
        const date = new Date(review.submittedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let mediaHtml = '';
        
        // Debug: Log the review data to see what we have
        console.log('Review data for modal:', review);
        console.log('Review images:', review.images);
        console.log('Review videos:', review.videos);
        
        // Show images section if images exist
        if (review.images && review.images.length > 0) {
            const validImages = review.images.filter(img => img && img !== '' && img !== null && img !== undefined);
            if (validImages.length > 0) {
                mediaHtml += '<div class="review-media-section"><h4>Images (' + validImages.length + '):</h4><div class="media-grid">';
                validImages.forEach((img, index) => {
                    mediaHtml += `<div class="media-item-container">
                        <img src="${img}" alt="Review image ${index + 1}" class="review-media-item" onclick="openMediaModal('${img}', 'image')" onerror="console.error('Failed to load image:', '${img}'); this.style.display='none'">
                        <div class="media-item-info">Image ${index + 1}</div>
                    </div>`;
                });
                mediaHtml += '</div></div>';
            } else {
                mediaHtml += '<div class="review-media-section"><h4>Images:</h4><p class="no-media">No valid images found</p></div>';
            }
        } else {
            mediaHtml += '<div class="review-media-section"><h4>Images:</h4><p class="no-media">No images uploaded</p></div>';
        }
        
        // Show videos section if videos exist
        if (review.videos && review.videos.length > 0) {
            const validVideos = review.videos.filter(vid => vid && vid !== '' && vid !== null && vid !== undefined);
            if (validVideos.length > 0) {
                mediaHtml += '<div class="review-media-section"><h4>Videos (' + validVideos.length + '):</h4><div class="media-grid">';
                validVideos.forEach((vid, index) => {
                    mediaHtml += `<div class="media-item-container">
                        <video src="${vid}" class="review-media-item" controls onclick="openMediaModal('${vid}', 'video')" onerror="console.error('Failed to load video:', '${vid}'); this.style.display='none'">
                            <source src="${vid}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <div class="media-item-info">Video ${index + 1}</div>
                    </div>`;
                });
                mediaHtml += '</div></div>';
            } else {
                mediaHtml += '<div class="review-media-section"><h4>Videos:</h4><p class="no-media">No valid videos found</p></div>';
            }
        } else {
            mediaHtml += '<div class="review-media-section"><h4>Videos:</h4><p class="no-media">No videos uploaded</p></div>';
        }
        
        const statusClass = review.status === 'approved' ? 'status-approved' : 
                           review.status === 'rejected' ? 'status-rejected' : 'status-pending';
        
        const statusText = review.status.charAt(0).toUpperCase() + review.status.slice(1);
        
        document.getElementById('reviewDetailsContent').innerHTML = `
            <div class="review-details">
                <div class="review-header">
                    <h4>${review.customerName}</h4>
                    <div class="review-meta">
                        <div class="rating-display">${stars}</div>
                        <span class="review-date">${date}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="review-id-info">
                        <strong>Review ID:</strong> ${review.reviewId || review.id}
                    </div>
                </div>
                <div class="review-content">
                    <p>${review.reviewText}</p>
                </div>
                ${mediaHtml}
            </div>
        `;
        
        // Show/hide action buttons based on status
        const approveBtn = document.getElementById('approveReviewBtn');
        const rejectBtn = document.getElementById('rejectReviewBtn');
        
        if (review.status === 'pending') {
            approveBtn.style.display = 'inline-block';
            rejectBtn.style.display = 'inline-block';
            approveBtn.onclick = () => approveReviewFromModal(reviewId);
            rejectBtn.onclick = () => rejectReviewFromModal(reviewId);
        } else {
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }
        
        document.getElementById('reviewDetailsModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading review details:', error);
        showNotification('Error loading review details', 'error');
    }
}

// Approve review
async function approveReview(reviewId) {
    if (!confirm('Are you sure you want to approve this review? It will be visible to all customers.')) {
        return;
    }
    
    try {
        const reviewDoc = doc(db, 'reviews', reviewId);
        await updateDoc(reviewDoc, {
            status: 'approved',
            approvedAt: new Date().toISOString()
        });
        
        showNotification('Review approved successfully', 'success');
        loadReviews(); // Refresh the reviews list
        
    } catch (error) {
        console.error('Error approving review:', error);
        showNotification('Error approving review', 'error');
    }
}

// Reject review
async function rejectReview(reviewId) {
    if (!confirm('Are you sure you want to reject this review? It will not be visible to customers.')) {
        return;
    }
    
    try {
        const reviewDoc = doc(db, 'reviews', reviewId);
        await updateDoc(reviewDoc, {
            status: 'rejected',
            rejectedAt: new Date().toISOString()
        });
        
        showNotification('Review rejected successfully', 'success');
        loadReviews(); // Refresh the reviews list
        
    } catch (error) {
        console.error('Error rejecting review:', error);
        showNotification('Error rejecting review', 'error');
    }
}

// Approve review from modal
async function approveReviewFromModal(reviewId) {
    await approveReview(reviewId);
    closeReviewDetailsModal();
}

// Reject review from modal
async function rejectReviewFromModal(reviewId) {
    await rejectReview(reviewId);
    closeReviewDetailsModal();
}

// Close review details modal
function closeReviewDetailsModal() {
    document.getElementById('reviewDetailsModal').style.display = 'none';
}

// Apply review filters
function applyReviewFilters() {
    // This would implement filtering logic
    // For now, just reload all reviews
    loadReviews();
}

// Clear review filters
function clearReviewFilters() {
    document.getElementById('reviewStatusFilter').value = '';
    document.getElementById('reviewRatingFilter').value = '';
    document.getElementById('reviewDateFrom').value = '';
    document.getElementById('reviewDateTo').value = '';
    loadReviews();
}

// Refresh reviews
function refreshReviews() {
    loadReviews();
    showNotification('Reviews refreshed', 'success');
}

// Show only active (approved) reviews
function showActiveReviews() {
    const reviewsRef = collection(db, 'reviews');
    const activeQuery = query(reviewsRef, where('status', '==', 'approved'));
    
    getDocs(activeQuery).then((querySnapshot) => {
        const activeReviews = [];
        querySnapshot.forEach((doc) => {
            activeReviews.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by submittedAt date (client-side sorting)
        activeReviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        console.log('Active reviews loaded:', activeReviews.length);
        displayReviews(activeReviews);
        
        // Update filter dropdown to show active only
        document.getElementById('reviewStatusFilter').value = 'approved';
        
        showNotification(`Showing ${activeReviews.length} active reviews`, 'success');
        
    }).catch((error) => {
        console.error('Error loading active reviews:', error);
        showNotification('Error loading active reviews', 'error');
    });
}

// Delete review (for active reviews)
async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this active review? This action cannot be undone and the review will be permanently removed from the website.')) {
        return;
    }
    
    try {
        const reviewDoc = doc(db, 'reviews', reviewId);
        await updateDoc(reviewDoc, {
            status: 'deleted',
            deletedAt: new Date().toISOString()
        });
        
        showNotification('Review deleted successfully', 'success');
        loadReviews(); // Refresh the reviews list
        
    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('Error deleting review', 'error');
    }
}

// Open media modal (for viewing images/videos in full size)
function openMediaModal(src, type) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('mediaModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mediaModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <span class="close-modal" onclick="closeMediaModal()">&times;</span>
            <div class="modal-content" style="background: transparent; padding: 0; max-width: 90vw; max-height: 90vh;">
                <img id="modalImage" style="display: none; max-width: 100%; max-height: 90vh; object-fit: contain;">
                <video id="modalVideo" style="display: none; max-width: 100%; max-height: 90vh;" controls>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeMediaModal();
            }
        });
        
        // Add escape key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeMediaModal();
            }
        });
    }
    
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

// Close media modal
function closeMediaModal() {
    const modal = document.getElementById('mediaModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Stop video playback
        const modalVideo = document.getElementById('modalVideo');
        if (modalVideo) {
            modalVideo.pause();
            modalVideo.currentTime = 0;
        }
    }
}

// ==================== ANALYTICS DASHBOARD FUNCTIONS ====================

// Global analytics variables
let analyticsData = {
    bookings: [],
    reviews: [],
    revenue: 0,
    totalBookings: 0,
    occupancyRate: 0,
    avgBookingValue: 0
};

let charts = {};

// Initialize analytics dashboard
async function initializeAnalytics() {
    try {
        console.log('Initializing analytics dashboard...');
        
        // Load analytics data
        await loadAnalyticsData();
        
        // Initialize charts
        initializeCharts();
        
        // Update analytics display
        updateAnalyticsDisplay();
        
        console.log('Analytics dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing analytics:', error);
        showNotification('Error initializing analytics dashboard', 'error');
    }
}

// Load analytics data from Firebase
async function loadAnalyticsData() {
    try {
        console.log('Loading analytics data from Firebase...');
        
        // Load bookings data
        const bookingsQuery = query(collection(db, 'bookings'));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const bookings = [];
        bookingsSnapshot.forEach((doc) => {
            const data = doc.data();
            bookings.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                totalAmount: data.totalAmount || 0,
                status: data.status
            });
        });
        
        // Load reviews data
        const reviewsQuery = query(collection(db, 'reviews'));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        const reviews = [];
        reviewsSnapshot.forEach((doc) => {
            const data = doc.data();
            reviews.push({
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString()
            });
        });
        
        // Store analytics data
        analyticsData.bookings = bookings;
        analyticsData.reviews = reviews;
        
        // Calculate analytics metrics
        calculateAnalyticsMetrics();
        
        console.log('Analytics data loaded:', {
            bookings: bookings.length,
            reviews: reviews.length
        });
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        throw error;
    }
}

// Calculate analytics metrics
function calculateAnalyticsMetrics() {
    const { bookings } = analyticsData;
    
    // Calculate total revenue (only confirmed bookings)
    const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');
    analyticsData.revenue = confirmedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    // Calculate total bookings
    analyticsData.totalBookings = bookings.length;
    
    // Calculate average booking value
    analyticsData.avgBookingValue = analyticsData.totalBookings > 0 ? analyticsData.revenue / analyticsData.totalBookings : 0;
    
    // Calculate occupancy rate (simplified - based on confirmed bookings vs total capacity)
    // This is a simplified calculation - in a real system, you'd calculate based on actual room capacity
    const totalCapacity = 365; // Assuming 365 days of capacity per year
    const bookedDays = confirmedBookings.reduce((sum, booking) => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const days = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
        return sum + days;
    }, 0);
    
    analyticsData.occupancyRate = totalCapacity > 0 ? (bookedDays / totalCapacity) * 100 : 0;
    
    console.log('Analytics metrics calculated:', {
        revenue: analyticsData.revenue,
        totalBookings: analyticsData.totalBookings,
        avgBookingValue: analyticsData.avgBookingValue,
        occupancyRate: analyticsData.occupancyRate
    });
}

// Initialize charts
function initializeCharts() {
    try {
        // Initialize simple charts
        initializeRevenueChart();
        initializeBookingsChart();
        initializeStatusChart();
        
        // Calculate business insights
        calculateBusinessInsights();
        
        console.log('Charts initialized successfully');
        
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Initialize revenue chart
function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const { bookings } = analyticsData;
    const revenueData = calculateRevenueByPeriod(bookings);
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: revenueData.labels,
            datasets: [{
                label: 'Revenue (₱)',
                data: revenueData.values,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Initialize bookings chart
function initializeBookingsChart() {
    const ctx = document.getElementById('bookingsChart');
    if (!ctx) return;
    
    const { bookings } = analyticsData;
    const bookingsData = calculateBookingsByPeriod(bookings);
    
    charts.bookings = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bookingsData.labels,
            datasets: [{
                label: 'Bookings',
                data: bookingsData.values,
                backgroundColor: '#f59e0b',
                borderColor: '#d97706',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialize demographics charts
function initializeDemographicsCharts() {
    // Age groups chart (mock data since we don't collect age)
    const ageCtx = document.getElementById('ageGroupChart');
    if (ageCtx) {
        charts.ageGroup = new Chart(ageCtx, {
            type: 'doughnut',
            data: {
                labels: ['18-25', '26-35', '36-45', '46-55', '55+'],
                datasets: [{
                    data: [20, 35, 25, 15, 5],
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Booking sources chart (mock data)
    const sourceCtx = document.getElementById('bookingSourceChart');
    if (sourceCtx) {
        charts.bookingSource = new Chart(sourceCtx, {
            type: 'pie',
            data: {
                labels: ['Website', 'Social Media', 'Referral', 'Direct'],
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Initialize status distribution chart
function initializeStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const { bookings } = analyticsData;
    const statusData = calculateStatusDistribution(bookings);
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statusData.labels,
            datasets: [{
                data: statusData.values,
                backgroundColor: [
                    '#f59e0b', // Pending
                    '#10b981', // Confirmed
                    '#ef4444'  // Rejected
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Calculate business insights
function calculateBusinessInsights() {
    try {
        const bookings = analyticsData.bookings || [];
        
        if (bookings.length === 0) {
            // Show loading or no data message
            document.getElementById('bestBookingDays').textContent = 'No data available';
            document.getElementById('avgBookingValueInsight').textContent = 'No data available';
            document.getElementById('commonGroupSize').textContent = 'No data available';
            document.getElementById('avgStayDuration').textContent = 'No data available';
            return;
        }
        
        // Calculate best booking days (most bookings per day of week)
        const dayCounts = {};
        bookings.forEach(booking => {
            const date = new Date(booking.createdAt);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });
        
        const bestDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
        document.getElementById('bestBookingDays').textContent = bestDay;
        
        // Calculate average booking value
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        const avgValue = bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0;
        document.getElementById('avgBookingValueInsight').textContent = `₱${avgValue.toLocaleString()}`;
        
        // Calculate most common group size
        const groupSizes = {};
        bookings.forEach(booking => {
            const totalGuests = (booking.adults || 0) + (booking.kids || 0);
            groupSizes[totalGuests] = (groupSizes[totalGuests] || 0) + 1;
        });
        
        const commonGroupSize = Object.keys(groupSizes).reduce((a, b) => groupSizes[a] > groupSizes[b] ? a : b);
        document.getElementById('commonGroupSize').textContent = `${commonGroupSize} guests`;
        
        // Calculate average stay duration
        let totalNights = 0;
        let validBookings = 0;
        
        bookings.forEach(booking => {
            if (booking.checkIn && booking.checkOut) {
                const checkIn = new Date(booking.checkIn);
                const checkOut = new Date(booking.checkOut);
                const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                if (nights > 0) {
                    totalNights += nights;
                    validBookings++;
                }
            }
        });
        
        const avgNights = validBookings > 0 ? Math.round(totalNights / validBookings) : 0;
        document.getElementById('avgStayDuration').textContent = `${avgNights} nights`;
        
        console.log('Business insights calculated successfully');
        
    } catch (error) {
        console.error('Error calculating business insights:', error);
        document.getElementById('bestBookingDays').textContent = 'Error loading';
        document.getElementById('avgBookingValueInsight').textContent = 'Error loading';
        document.getElementById('commonGroupSize').textContent = 'Error loading';
        document.getElementById('avgStayDuration').textContent = 'Error loading';
    }
}

// Calculate revenue by period
function calculateRevenueByPeriod(bookings) {
    const period = document.getElementById('analyticsPeriod')?.value || 'daily';
    const dateRange = document.getElementById('analyticsDateRange')?.value || '30';
    
    const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');
    const now = new Date();
    const startDate = new Date(now.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));
    
    const revenueMap = new Map();
    
    confirmedBookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt);
        if (bookingDate >= startDate) {
            let key;
            if (period === 'daily') {
                key = bookingDate.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const weekStart = new Date(bookingDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else if (period === 'monthly') {
                key = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
            }
            
            const currentRevenue = revenueMap.get(key) || 0;
            revenueMap.set(key, currentRevenue + (booking.totalAmount || 0));
        }
    });
    
    const labels = Array.from(revenueMap.keys()).sort();
    const values = labels.map(label => revenueMap.get(label));
    
    return { labels, values };
}

// Calculate bookings by period
function calculateBookingsByPeriod(bookings) {
    const period = document.getElementById('analyticsPeriod')?.value || 'daily';
    const dateRange = document.getElementById('analyticsDateRange')?.value || '30';
    
    const now = new Date();
    const startDate = new Date(now.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));
    
    const bookingsMap = new Map();
    
    bookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt);
        if (bookingDate >= startDate) {
            let key;
            if (period === 'daily') {
                key = bookingDate.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const weekStart = new Date(bookingDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else if (period === 'monthly') {
                key = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
            }
            
            const currentCount = bookingsMap.get(key) || 0;
            bookingsMap.set(key, currentCount + 1);
        }
    });
    
    const labels = Array.from(bookingsMap.keys()).sort();
    const values = labels.map(label => bookingsMap.get(label));
    
    return { labels, values };
}

// Calculate status distribution
function calculateStatusDistribution(bookings) {
    const statusCounts = {
        pending: 0,
        confirmed: 0,
        rejected: 0
    };
    
    bookings.forEach(booking => {
        if (statusCounts.hasOwnProperty(booking.status)) {
            statusCounts[booking.status]++;
        }
    });
    
    return {
        labels: ['Pending', 'Confirmed', 'Rejected'],
        values: [statusCounts.pending, statusCounts.confirmed, statusCounts.rejected]
    };
}

// Update analytics display
function updateAnalyticsDisplay() {
    try {
        // Update analytics cards
        document.getElementById('totalRevenue').textContent = `₱${analyticsData.revenue.toLocaleString()}`;
        document.getElementById('totalBookings').textContent = analyticsData.totalBookings.toString();
        document.getElementById('occupancyRate').textContent = `${analyticsData.occupancyRate.toFixed(1)}%`;
        document.getElementById('avgBookingValue').textContent = `₱${analyticsData.avgBookingValue.toLocaleString()}`;
        
        // Update popular dates
        updatePopularDates();
        
        console.log('Analytics display updated');
        
    } catch (error) {
        console.error('Error updating analytics display:', error);
    }
}

// Update popular dates
function updatePopularDates() {
    const { bookings } = analyticsData;
    const popularDatesGrid = document.getElementById('popularDatesGrid');
    if (!popularDatesGrid) return;
    
    // Calculate popular booking dates (check-in dates)
    const dateCounts = new Map();
    
    bookings.forEach(booking => {
        const checkInDate = new Date(booking.checkIn);
        const dateKey = checkInDate.toISOString().split('T')[0];
        const count = dateCounts.get(dateKey) || 0;
        dateCounts.set(dateKey, count + 1);
    });
    
    // Sort by count and get top 6
    const sortedDates = Array.from(dateCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    
    if (sortedDates.length === 0) {
        popularDatesGrid.innerHTML = '<div class="analytics-no-data"><i class="fas fa-calendar"></i><h4>No Popular Dates</h4><p>No booking data available</p></div>';
        return;
    }
    
    popularDatesGrid.innerHTML = sortedDates.map(([date, count]) => {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="popular-date-item">
                <div class="date">${formattedDate}</div>
                <div class="count">${count}</div>
                <div class="period">bookings</div>
            </div>
        `;
    }).join('');
}

// Refresh analytics data
window.refreshAnalytics = async function() {
    try {
        console.log('Refreshing analytics data...');
        
        // Show loading state
        showAnalyticsLoading();
        
        // Reload data
        await loadAnalyticsData();
        
        // Update charts
        updateCharts();
        
        // Update display
        updateAnalyticsDisplay();
        
        // Hide loading state
        hideAnalyticsLoading();
        
        showNotification('Analytics data refreshed successfully', 'success');
        
    } catch (error) {
        console.error('Error refreshing analytics:', error);
        showNotification('Error refreshing analytics data', 'error');
        hideAnalyticsLoading();
    }
};

// Update analytics when filters change
window.updateAnalytics = function() {
    try {
        console.log('Updating analytics with new filters...');
        
        // Update charts with new data
        updateCharts();
        
        // Update business insights
        calculateBusinessInsights();
        
        console.log('Analytics updated with new filters');
        
    } catch (error) {
        console.error('Error updating analytics:', error);
    }
};

// Update charts with new data
function updateCharts() {
    const { bookings } = analyticsData;
    
    // Update revenue chart
    if (charts.revenue) {
        const revenueData = calculateRevenueByPeriod(bookings);
        charts.revenue.data.labels = revenueData.labels;
        charts.revenue.data.datasets[0].data = revenueData.values;
        charts.revenue.update();
    }
    
    // Update bookings chart
    if (charts.bookings) {
        const bookingsData = calculateBookingsByPeriod(bookings);
        charts.bookings.data.labels = bookingsData.labels;
        charts.bookings.data.datasets[0].data = bookingsData.values;
        charts.bookings.update();
    }
    
    // Update status chart
    if (charts.status) {
        const statusData = calculateStatusDistribution(bookings);
        charts.status.data.labels = statusData.labels;
        charts.status.data.datasets[0].data = statusData.values;
        charts.status.update();
    }
}

// Show analytics loading state
function showAnalyticsLoading() {
    const loadingElements = document.querySelectorAll('.analytics-loading');
    loadingElements.forEach(element => {
        element.style.display = 'flex';
    });
}

// Hide analytics loading state
function hideAnalyticsLoading() {
    const loadingElements = document.querySelectorAll('.analytics-loading');
    loadingElements.forEach(element => {
        element.style.display = 'none';
    });
}

// Update page title for analytics section
function updatePageTitleForAnalytics() {
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = 'Analytics Dashboard';
    }
}

// Suggestions Management Functions
function loadSuggestions() {
    console.log('Loading suggestions...');
    
    const tableBody = document.getElementById('suggestionsTableBody');
    const loadingDiv = document.getElementById('suggestionsLoading');
    const noDataDiv = document.getElementById('noSuggestionsMessage');
    
    // Show loading state
    loadingDiv.style.display = 'block';
    noDataDiv.style.display = 'none';
    tableBody.innerHTML = '';
    
    // Import Firestore functions
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js')
        .then(({ collection, query, orderBy, onSnapshot }) => {
            // Create real-time listener for suggestions
            const suggestionsRef = collection(db, 'suggestions');
            const suggestionsQuery = query(suggestionsRef, orderBy('submittedAt', 'desc'));
            
            // Set up real-time listener
            const unsubscribe = onSnapshot(suggestionsQuery, (snapshot) => {
                console.log('Suggestions updated:', snapshot.size, 'documents');
                
                // Hide loading state
                loadingDiv.style.display = 'none';
                
                // Clear existing table content
                tableBody.innerHTML = '';
                
                if (snapshot.empty) {
                    noDataDiv.style.display = 'block';
                    // Store empty suggestions globally for mobile
                    window.currentSuggestions = [];
                    // Generate mobile cards if on mobile
                    if (window.innerWidth <= 768) {
                        generateMobileSuggestionCards([]);
                    }
                    return;
                }
                
                noDataDiv.style.display = 'none';
                
                // Collect all suggestions for mobile cards
                allSuggestions = [];
                
                // Add each suggestion to the table
                snapshot.forEach(doc => {
                    const suggestion = doc.data();
                    suggestion.id = doc.id;
                    allSuggestions.push(suggestion);
                    addSuggestionToTable(suggestion);
                });
                
                // Store suggestions globally for mobile
                window.currentSuggestions = allSuggestions;
                
                // Generate mobile cards if on mobile
                if (window.innerWidth <= 768) {
                    generateMobileSuggestionCards(allSuggestions);
                }
            }, (error) => {
                console.error('Error loading suggestions:', error);
                loadingDiv.style.display = 'none';
                showNotification('Error loading suggestions', 'error');
            });
            
            // Store unsubscribe function for cleanup
            window.suggestionsUnsubscribe = unsubscribe;
        })
        .catch(error => {
            console.error('Error importing Firestore:', error);
            loadingDiv.style.display = 'none';
            showNotification('Error loading suggestions', 'error');
        });
}

function addSuggestionToTable(suggestion) {
    const tableBody = document.getElementById('suggestionsTableBody');
    const row = document.createElement('tr');
    
    const submittedDate = new Date(suggestion.submittedAt);
    const formattedDate = submittedDate.toLocaleDateString() + ' ' + submittedDate.toLocaleTimeString();
    
    row.innerHTML = `
        <td>${suggestion.name}</td>
        <td>${suggestion.email}</td>
        <td>${suggestion.subject}</td>
        <td class="message-cell">
            <div class="message-preview" onclick="event.stopPropagation(); showSuggestionModal('${suggestion.id}')">
                ${suggestion.message.length > 50 ? suggestion.message.substring(0, 50) + '...' : suggestion.message}
            </div>
        </td>
        <td>${formattedDate}</td>
        <td>
            <button onclick="event.stopPropagation(); showSuggestionModal('${suggestion.id}')" class="action-btn view-btn" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            <button onclick="event.stopPropagation(); deleteSuggestion('${suggestion.id}')" class="action-btn delete-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    // Make the entire row clickable on mobile
    row.onclick = function(event) {
        // Don't trigger if clicking on buttons or message preview
        if (event.target.closest('.action-btn') || event.target.closest('.message-preview')) {
            return;
        }
        showSuggestionModal(suggestion.id);
    };
    
    tableBody.appendChild(row);
}

async function showSuggestionModal(suggestionId) {
    try {
        // Import Firestore functions
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        // Get suggestion data from Firebase
        const suggestionRef = doc(db, 'suggestions', suggestionId);
        const docSnap = await getDoc(suggestionRef);
        
        if (docSnap.exists()) {
            const suggestion = docSnap.data();
            suggestion.id = docSnap.id;
            
            const submittedDate = new Date(suggestion.submittedAt);
            const formattedDate = submittedDate.toLocaleDateString() + ' ' + submittedDate.toLocaleTimeString();
            
            // Create modal content
            const modalContent = `
                <div class="suggestion-details">
                    <div class="detail-row">
                        <label>Name:</label>
                        <span>${suggestion.name}</span>
                    </div>
                    <div class="detail-row">
                        <label>Email:</label>
                        <span>${suggestion.email}</span>
                    </div>
                    <div class="detail-row">
                        <label>Subject:</label>
                        <span>${suggestion.subject}</span>
                    </div>
                    <div class="detail-row">
                        <label>Date:</label>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="detail-row full-width">
                        <label>Message:</label>
                        <div class="message-content">${suggestion.message}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="deleteSuggestion('${suggestion.id}')" class="btn-secondary">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button onclick="closeModal()" class="btn-primary">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            `;
            
            showSuggestionDetailsModal(modalContent);
        } else {
            showNotification('Suggestion not found', 'error');
        }
        
    } catch (error) {
        console.error('Error loading suggestion:', error);
        showNotification('Error loading suggestion details', 'error');
    }
}


window.deleteSuggestion = async function(suggestionId) {
    if (confirm('Are you sure you want to delete this suggestion?')) {
        try {
            // Import Firestore functions
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
            
            // Delete suggestion
            const suggestionRef = doc(db, 'suggestions', suggestionId);
            await deleteDoc(suggestionRef);
            
            showNotification('Suggestion deleted successfully', 'success');
            closeModal();
            // No need to refresh - real-time listener will update automatically
            
        } catch (error) {
            console.error('Error deleting suggestion:', error);
            showNotification('Error deleting suggestion', 'error');
        }
    }
}

function refreshSuggestions() {
    loadSuggestions();
    showNotification('Suggestions refreshed', 'success');
}

function filterSuggestions() {
    // This function can be expanded to filter suggestions based on status and date range
    loadSuggestions();
}

// View suggestion details (for mobile cards)
window.viewSuggestionDetails = async function(suggestionId) {
    try {
        // Import Firestore functions
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        // Get suggestion details
        const suggestionRef = doc(db, 'suggestions', suggestionId);
        const suggestionDoc = await getDoc(suggestionRef);
        
        if (suggestionDoc.exists()) {
            const suggestion = suggestionDoc.data();
            
            // Create modal content
            const modalContent = `
                <div class="suggestion-details">
                    <div class="detail-row">
                        <strong>Name:</strong> ${suggestion.name}
                    </div>
                    <div class="detail-row">
                        <strong>Email:</strong> ${suggestion.email}
                    </div>
                    <div class="detail-row">
                        <strong>Subject:</strong> ${suggestion.subject}
                    </div>
                    <div class="detail-row">
                        <strong>Message:</strong> ${suggestion.message}
                    </div>
                    <div class="detail-row">
                        <strong>Date:</strong> ${formatDate(suggestion.submittedAt || suggestion.date)}
                    </div>
                </div>
            `;
            
            showSuggestionDetailsModal(modalContent);
        } else {
            showNotification('Suggestion not found', 'error');
        }
        
    } catch (error) {
        console.error('Error loading suggestion:', error);
        showNotification('Error loading suggestion details', 'error');
    }
};

// Modal functions for suggestions
function showSuggestionDetailsModal(content) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal-content suggestion-modal">
            <div class="modal-header">
                <h3>Customer Suggestion Details</h3>
                <button class="close-modal" onclick="closeSuggestionModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modalOverlay);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeSuggestionModal();
        }
    });
}

function closeSuggestionModal() {
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
    }
}

// Global close modal function
window.closeModal = closeSuggestionModal;

// Make analytics functions globally available
window.initializeAnalytics = initializeAnalytics;
window.refreshAnalytics = refreshAnalytics;
window.updateAnalytics = updateAnalytics;

// Mobile Booking Cards Generation
function generateMobileBookingCards(bookings) {
    const mobileCardsContainer = document.getElementById('mobileBookingsCards');
    if (!mobileCardsContainer) {
        return;
    }
    
    if (!bookings || bookings.length === 0) {
        mobileCardsContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-calendar-times"></i>
                <p>No bookings found</p>
            </div>
        `;
        return;
    }
    
    const cardsHTML = bookings.map(booking => {
        const statusClass = booking.status.toLowerCase();
        const statusColors = {
            'pending': '#f39c12',
            'confirmed': '#27ae60',
            'rejected': '#e74c3c'
        };
        
        return `
            <div class="booking-card ${statusClass}">
                <div class="booking-card-header">
                    <div class="booking-id">${booking.id}</div>
                    <div class="booking-status ${statusClass}">${booking.status}</div>
                </div>
                <div class="booking-details">
                    <div class="booking-detail">
                        <div class="booking-detail-label">Customer</div>
                        <div class="booking-detail-value">${booking.customerName}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Contact</div>
                        <div class="booking-detail-value">${booking.phoneNumber}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Check-in</div>
                        <div class="booking-detail-value">${formatDate(booking.checkIn)}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Check-out</div>
                        <div class="booking-detail-value">${formatDate(booking.checkOut)}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Guests</div>
                        <div class="booking-detail-value">${booking.adults} adults${booking.kids > 0 ? `, ${booking.kids} kids` : ''}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Amount</div>
                        <div class="booking-detail-value">₱${booking.totalAmount}</div>
                    </div>
                </div>
                <div class="booking-actions">
                    <button class="booking-action-btn view" onclick="viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${booking.status === 'pending' ? `
                        <button class="booking-action-btn approve" onclick="approveBooking('${booking.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="booking-action-btn reject" onclick="rejectBooking('${booking.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    mobileCardsContainer.innerHTML = cardsHTML;
}

// Update mobile cards when bookings change
function updateMobileBookingCards() {
    if (window.innerWidth <= 768) {
        // Get current bookings data and generate mobile cards
        const bookings = window.currentBookings || [];
        generateMobileBookingCards(bookings);
    }
}

// Mobile Suggestion Cards Generation
function generateMobileSuggestionCards(suggestions) {
    const mobileCardsContainer = document.getElementById('mobileSuggestionsCards');
    if (!mobileCardsContainer) return;
    
    console.log('Generating mobile suggestion cards with:', suggestions);
    
    if (!suggestions || suggestions.length === 0) {
        mobileCardsContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-comments"></i>
                <p>No suggestions found</p>
            </div>
        `;
        return;
    }
    
    const cardsHTML = suggestions.map(suggestion => {
        const date = suggestion.submittedAt || suggestion.date || new Date().toISOString();
        console.log('Processing suggestion:', suggestion);
        return `
            <div class="suggestion-card">
                <div class="suggestion-card-header">
                    <div class="suggestion-name">${suggestion.name}</div>
                    <div class="suggestion-date">${formatDate(date)}</div>
                </div>
                <div class="suggestion-details">
                    <div class="suggestion-email">${suggestion.email}</div>
                    <div class="suggestion-subject">${suggestion.subject}</div>
                    <div class="suggestion-message">${suggestion.message}</div>
                </div>
                <div class="suggestion-actions">
                    <button class="suggestion-action-btn view" onclick="viewSuggestionDetails('${suggestion.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="suggestion-action-btn delete" onclick="deleteSuggestion('${suggestion.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    mobileCardsContainer.innerHTML = cardsHTML;
}

// Mobile Review Cards Generation
function generateMobileReviewCards(reviews) {
    const mobileCardsContainer = document.getElementById('mobileReviewsCards');
    if (!mobileCardsContainer) return;
    
    console.log('Generating mobile review cards with:', reviews);
    
    if (!reviews || reviews.length === 0) {
        mobileCardsContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-star"></i>
                <p>No reviews found</p>
            </div>
        `;
        return;
    }
    
    const cardsHTML = reviews.map(review => {
        console.log('Processing review:', review);
        const statusClass = review.status.toLowerCase();
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        return `
            <div class="review-card ${statusClass}">
                <div class="review-card-header">
                    <div class="review-customer">${review.customerName}</div>
                    <div class="review-rating">${stars}</div>
                </div>
                <div class="review-details">
                    <div class="review-text">${review.reviewText}</div>
                    <div class="review-media">${review.mediaCount || 0} media files</div>
                    <div class="review-date">${formatDate(review.submittedDate)}</div>
                </div>
                <div class="review-status ${statusClass}">${review.status}</div>
                <div class="review-actions">
                    <button class="review-action-btn view" onclick="viewReviewDetails('${review.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${review.status === 'pending' ? `
                        <button class="review-action-btn approve" onclick="approveReview('${review.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="review-action-btn reject" onclick="rejectReview('${review.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    mobileCardsContainer.innerHTML = cardsHTML;
}

// Mobile Record Cards Generation
function generateMobileRecordCards(records) {
    const mobileCardsContainer = document.getElementById('mobileRecordsCards');
    if (!mobileCardsContainer) return;
    
    if (!records || records.length === 0) {
        mobileCardsContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-history"></i>
                <p>No records found</p>
            </div>
        `;
        return;
    }
    
    const cardsHTML = records.map(record => {
        const statusClass = record.status.toLowerCase();
        
        return `
            <div class="record-card ${statusClass}">
                <div class="record-card-header">
                    <div class="record-id">${record.id}</div>
                    <div class="record-status ${statusClass}">${record.status}</div>
                </div>
                <div class="record-details">
                    <div class="record-detail">
                        <div class="record-detail-label">Customer</div>
                        <div class="record-detail-value">${record.customerName}</div>
                    </div>
                    <div class="record-detail">
                        <div class="record-detail-label">Contact</div>
                        <div class="record-detail-value">${record.phoneNumber}</div>
                    </div>
                    <div class="record-detail">
                        <div class="record-detail-label">Check-in</div>
                        <div class="record-detail-value">${formatDate(record.checkIn)}</div>
                    </div>
                    <div class="record-detail">
                        <div class="record-detail-label">Check-out</div>
                        <div class="record-detail-value">${formatDate(record.checkOut)}</div>
                    </div>
                    <div class="record-detail">
                        <div class="record-detail-label">Guests</div>
                        <div class="record-detail-value">${record.adults} adults${record.kids > 0 ? `, ${record.kids} kids` : ''}</div>
                    </div>
                    <div class="record-detail">
                        <div class="record-detail-label">Amount</div>
                        <div class="record-detail-value">₱${record.totalAmount}</div>
                    </div>
                </div>
                <div class="record-actions">
                    <button class="record-action-btn view" onclick="viewRecordDetails('${record.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="record-action-btn export" onclick="exportRecord('${record.id}')">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    mobileCardsContainer.innerHTML = cardsHTML;
}

// Update mobile cards for all sections
function updateAllMobileCards() {
    if (window.innerWidth <= 768) {
        // Update each section's mobile cards
        const bookings = window.currentBookings || [];
        const suggestions = window.currentSuggestions || [];
        const reviews = window.currentReviews || [];
        const records = window.currentRecords || [];
        
        generateMobileBookingCards(bookings);
        generateMobileSuggestionCards(suggestions);
        generateMobileReviewCards(reviews);
        generateMobileRecordCards(records);
    }
}

// Make functions globally available
window.generateMobileBookingCards = generateMobileBookingCards;
window.updateMobileBookingCards = updateMobileBookingCards;
window.generateMobileSuggestionCards = generateMobileSuggestionCards;
window.generateMobileReviewCards = generateMobileReviewCards;
window.generateMobileRecordCards = generateMobileRecordCards;
window.updateAllMobileCards = updateAllMobileCards;

// Bottom Navigation Functionality (Mobile Only)
let lastScrollTop = 0;
let isScrolling = false;

// Initialize bottom navigation
function initializeBottomNavigation() {
    const bottomNav = document.getElementById('bottomNav');
    const navItems = document.querySelectorAll('.nav-item');
    
    if (!bottomNav) return;
    
    // Add click handlers to nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            if (section) {
                // Add smooth transition effect
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 150);
                
                // Remove active class from all items with smooth transition
                navItems.forEach(nav => {
                    nav.classList.remove('active');
                    nav.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                });
                
                // Add active class to clicked item with smooth transition
                item.classList.add('active');
                item.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // Navigate to section with smooth animation
                navigateToSection(section);
            }
        });
    });
    
    // Set initial active state
    const currentSection = document.querySelector('.content-section.active');
    if (currentSection) {
        const sectionId = currentSection.id.replace('-section', '');
        const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }
}

// Navigate to section
function navigateToSection(sectionName) {
    // Hide all sections with fade out animation
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        section.style.opacity = '0';
        section.style.transform = 'translateY(10px)';
        setTimeout(() => {
            section.classList.remove('active');
            section.style.transition = '';
            section.style.opacity = '';
            section.style.transform = '';
        }, 300);
    });
    
    // Show target section with fade in animation
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        setTimeout(() => {
            targetSection.classList.add('active');
            targetSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            targetSection.style.opacity = '0';
            targetSection.style.transform = 'translateY(10px)';
            
            // Trigger reflow
            targetSection.offsetHeight;
            
            targetSection.style.opacity = '1';
            targetSection.style.transform = 'translateY(0)';
            
            // Clean up after animation
            setTimeout(() => {
                targetSection.style.transition = '';
                targetSection.style.opacity = '';
                targetSection.style.transform = '';
            }, 300);
        }, 300);
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        const mobilePageTitle = document.getElementById('mobilePageTitle');
        const titles = {
            'analytics': 'Analytics Dashboard',
            'suggestions': 'Customer Suggestions',
            'booking': 'Booking Management',
            'records': 'Booking Records',
            'reviews': 'Customer Reviews'
        };
        const titleText = titles[sectionName] || 'Admin Dashboard';
        
        if (pageTitle) {
            pageTitle.textContent = titleText;
        }
        if (mobilePageTitle) {
            mobilePageTitle.textContent = titleText;
        }
        
        // Generate mobile cards if on mobile
        if (window.innerWidth <= 768) {
            switch(sectionName) {
                case 'booking':
                    generateMobileBookingCards(filteredBookings);
                    break;
                case 'suggestions':
                    // Load suggestions if not already loaded
                    if (!window.currentSuggestions || window.currentSuggestions.length === 0) {
                        loadSuggestions();
                    } else {
                        generateMobileSuggestionCards(window.currentSuggestions);
                    }
                    break;
                case 'records':
                    generateMobileRecordCards(filteredRecords);
                    break;
                case 'reviews':
                    // Load reviews if not already loaded
                    if (!window.currentReviews || window.currentReviews.length === 0) {
                        loadReviews();
                    } else {
                        generateMobileReviewCards(window.currentReviews);
                    }
                    break;
            }
        }
    }
}

// Auto-hide bottom navigation on scroll
function handleScroll() {
    if (window.innerWidth > 768) return; // Only on mobile
    
    const bottomNav = document.getElementById('bottomNav');
    if (!bottomNav) return;
    
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollDifference = Math.abs(currentScrollTop - lastScrollTop);
    
    // Only process if there's significant scroll movement
    if (scrollDifference < 3) return;
    
    // Show/hide based on scroll direction with faster response
    if (currentScrollTop > lastScrollTop && currentScrollTop > 30) {
        // Scrolling down - hide nav with smooth transition
        if (!bottomNav.classList.contains('hidden')) {
            bottomNav.style.transition = 'transform 0.15s ease-out';
            bottomNav.classList.add('hidden');
        }
    } else if (currentScrollTop < lastScrollTop) {
        // Scrolling up - show nav immediately with fast response
        if (bottomNav.classList.contains('hidden')) {
            bottomNav.style.transition = 'transform 0.1s ease-in';
            bottomNav.classList.remove('hidden');
        }
    }
    
    lastScrollTop = currentScrollTop;
}

// Throttle scroll events
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize bottom navigation on mobile devices
    if (window.innerWidth <= 768) {
        initializeBottomNavigation();
        
        // Add scroll listener with throttling for fast response
        window.addEventListener('scroll', throttle(handleScroll, 25));
    }
    
    // Handle resize events
    window.addEventListener('resize', () => {
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) {
            if (window.innerWidth > 768) {
                // Desktop: Hide bottom nav, show sidebar
                bottomNav.style.display = 'none';
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.style.display = 'block';
                }
            } else {
                // Mobile: Show bottom nav, hide sidebar
                bottomNav.style.display = 'flex';
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.style.display = 'none';
                }
                // Initialize bottom navigation if not already done
                if (!bottomNav.hasAttribute('data-initialized')) {
                    initializeBottomNavigation();
                    bottomNav.setAttribute('data-initialized', 'true');
                }
            }
        }
    });
});

// Mobile Account Icon Functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileAccountIcon = document.getElementById('mobileAccountIcon');
    const mobileAccountDropdown = document.getElementById('mobileAccountDropdown');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    
    if (mobileAccountIcon && mobileAccountDropdown) {
        // Toggle dropdown when account icon is clicked
        mobileAccountIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileAccountDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileAccountIcon.contains(e.target)) {
                mobileAccountDropdown.classList.remove('active');
            }
        });
    }
    
    // Mobile notification dropdown functionality
    const mobileNotificationBell = document.querySelector('.mobile-header-right .notification-bell');
    const mobileNotificationDropdown = document.getElementById('mobileNotificationDropdown');
    
    if (mobileNotificationBell && mobileNotificationDropdown) {
        // Close notification dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileNotificationBell.contains(e.target)) {
                mobileNotificationDropdown.classList.remove('show');
            }
        });
    }
    
    // Desktop notification dropdown functionality
    const desktopNotificationBell = document.querySelector('.header-actions .notification-bell');
    const desktopNotificationDropdown = document.getElementById('notificationDropdown');
    
    if (desktopNotificationBell && desktopNotificationDropdown) {
        // Close notification dropdown when clicking outside
        document.addEventListener('click', function(e) {
            // Don't close if clicking on the bell or dropdown
            if (!desktopNotificationBell.contains(e.target) && !desktopNotificationDropdown.contains(e.target)) {
                desktopNotificationDropdown.classList.remove('show');
            }
        });
        
        // Prevent the bell click from being handled by the outside click listener
        desktopNotificationBell.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Logout functionality
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored data
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page or homepage
        window.location.href = 'index.html';
    }
}
