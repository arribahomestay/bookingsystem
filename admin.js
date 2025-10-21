// Admin Dashboard JavaScript with Firebase Integration

// Global Firebase variables
let db;
let collection, addDoc, getDocs, query, orderBy, where, updateDoc, doc, onSnapshot;
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
        const { collection: col, addDoc: add, getDocs: get, query: q, orderBy: order, where: w, updateDoc: update, doc: d, onSnapshot: onSnap } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        collection = col;
        addDoc = add;
        getDocs = get;
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
let currentSection = 'booking';
let currentPage = 1;
let itemsPerPage = 10;
let allBookings = [];
let allRecords = [];
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
                guests: data.guests,
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
                    guests: data.guests,
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

// Update notification list with pending bookings
function updateNotificationList() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    const pendingBookings = allBookings.filter(booking => 
        booking.status === 'pending' || booking.status === 'new'
    );
    
    if (pendingBookings.length === 0) {
        notificationList.innerHTML = '<div class="no-notifications">No new bookings</div>';
        return;
    }
    
    // Sort by creation date (newest first)
    pendingBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    notificationList.innerHTML = pendingBookings.map(booking => {
        const timeAgo = getTimeAgo(booking.createdAt);
        const checkInDate = new Date(booking.checkIn).toLocaleDateString();
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
        
        return `
            <div class="notification-item unread" onclick="viewBookingFromNotification('${booking.id}')">
                <div class="notification-item-header">
                    <span class="notification-customer">${booking.customerName}</span>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                <div class="notification-details">
                    <div>📅 ${checkInDate} - ${checkOutDate}</div>
                    <div>👥 ${booking.guests} guests${booking.extraBeds > 0 ? ` + ${booking.extraBeds} extra beds` : ''}</div>
                    <div>💰 ₱${booking.totalAmount.toLocaleString()}</div>
                </div>
                <span class="notification-status ${booking.status}">${booking.status.toUpperCase()}</span>
            </div>
        `;
    }).join('');
}

// View booking from notification
window.viewBookingFromNotification = function(bookingId) {
    // Close notification dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
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
};

// Mark all notifications as read
window.markAllAsRead = function() {
    // This would typically update the booking statuses in Firebase
    // For now, we'll just close the dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    // You could implement actual "mark as read" functionality here
    console.log('Mark all notifications as read');
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

// Close notification dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notificationDropdown');
    const bell = document.querySelector('.notification-bell');
    
    if (dropdown && !bell.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

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
                <img src="${receiptUrl}" alt="GCash Receipt" class="full-receipt-image">
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeReceiptModal();
        }
    });
};

// Close receipt modal
window.closeReceiptModal = function() {
    const modal = document.querySelector('.receipt-modal');
    if (modal) {
        modal.remove();
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
        'booking': 'Booking Management',
        'records': 'Booking Records',
        'calendar': 'Calendar Management'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    currentSection = section;
    
    // Load section-specific data
    switch(section) {
        case 'booking':
            loadBookings();
            break;
        case 'records':
            loadRecords();
            break;
        case 'calendar':
            generateCalendar();
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
    let pendingCount;
    
    if (count !== null) {
        // Use provided count (from real-time updates)
        pendingCount = count;
    } else {
        // Calculate count from current data
        pendingCount = allBookings.filter(booking => 
            booking.status === 'pending' || booking.status === 'new'
        ).length;
    }
    
    const notificationCount = document.getElementById('notificationCount');
    if (notificationCount) {
        notificationCount.textContent = pendingCount;
        
        // Add visual effects for new notifications
        if (pendingCount > 0) {
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
            <div>${booking.guests} guests</div>
            <div style="font-size: 0.8rem; color: #666;">${days} days, ${nights} nights</div>
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
            <div>${record.guests} guests</div>
            <div style="font-size: 0.8rem; color: #666;">${days} days, ${nights} nights</div>
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
        guests: parseInt(formData.get('guests')),
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
    const requiredFields = ['customerName', 'phoneNumber', 'email', 'checkIn', 'checkOut', 'guests'];
    
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
                <strong>Number of Guests:</strong> ${booking.guests}
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
    if (confirm('Are you sure you want to approve this booking?')) {
        await updateBookingStatus(bookingId, 'confirmed');
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
        if (confirm('Are you sure you want to approve this booking?')) {
            await updateBookingStatus(bookingId, 'confirmed');
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

async function updateBookingStatus(bookingId, status) {
    console.log(`Updating booking ${bookingId} to status: ${status}`);
    
    try {
        // Update in Firebase using the booking ID (which is now the Firebase document ID)
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
            status: status,
            updatedAt: new Date().toISOString()
        });
        
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
function exportRecords() {
    try {
        // Create CSV content
        const headers = [
            'Booking ID',
            'Customer Name',
            'Phone Number',
            'Email',
            'Check-in Date',
            'Check-out Date',
            'Guests',
            'Extra Beds',
            'Total Amount',
            'Status',
            'Created At'
        ];
        
        const csvContent = [
            headers.join(','),
            ...filteredRecords.map(record => [
                record.id,
                `"${record.customerName}"`,
                record.phoneNumber,
                record.email,
                record.checkIn,
                record.checkOut,
                record.guests,
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
        a.download = `arriba-homestay-records-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Records exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting records:', error);
        showNotification('Failed to export records. Please try again.', 'error');
    }
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
        if (!sidebar.contains(event.target) && !mobileToggle.contains(event.target)) {
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
    setupRealTimeReviewListeners();
    
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
function setupRealTimeReviewListeners() {
    if (!db) {
        console.log('Firebase not available for real-time listeners');
        return;
    }
    
    try {
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
        
        const reviews = [];
        querySnapshot.forEach((doc) => {
            reviews.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by submittedAt date (client-side sorting)
        reviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        console.log('Reviews loaded:', reviews.length);
        displayReviews(reviews);
        
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
