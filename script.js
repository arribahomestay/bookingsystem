// Booking System JavaScript with Firebase Integration
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be available
    const waitForFirebase = () => {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseDB) {
                    resolve(window.firebaseDB);
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    };

    // Firebase imports
    let db;
    let collection, addDoc, getDocs, query, orderBy, where, updateDoc, doc;

    // Initialize Firebase
    async function initializeFirebase() {
        try {
            db = await waitForFirebase();
            
            // Import Firebase functions dynamically
            const { collection: col, addDoc: add, getDocs: get, query: q, orderBy: order, where: w, updateDoc: update, doc: d } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
            
            collection = col;
            addDoc = add;
            getDocs = get;
            query = q;
            orderBy = order;
            where = w;
            updateDoc = update;
            doc = d;
            
            console.log('Firebase initialized successfully!');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    // Calendar functionality
    let currentCalendarDate = new Date();
    let availabilityData = {};

    // Load availability data from Firebase
    async function loadAvailabilityData() {
        try {
            if (!db || !getDocs || !collection) {
                console.log('Firebase not available, using empty availability data');
                return {};
            }

            const availabilityQuery = query(collection(db, 'availability'), orderBy('date', 'asc'));
            const availabilitySnapshot = await getDocs(availabilityQuery);
            
            const availability = {};
            availabilitySnapshot.forEach((doc) => {
                const data = doc.data();
                availability[data.date] = data.is_available;
            });
            
            console.log('Availability data loaded:', Object.keys(availability).length, 'dates');
            return availability;
        } catch (error) {
            console.error('Failed to load availability data:', error);
            return {};
        }
    }

    // Generate calendar
    function generateCalendar(year = null, month = null) {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonthYear = document.getElementById('currentMonthYear');
        
        if (!calendarGrid || !currentMonthYear) return;

        const date = year && month ? new Date(year, month) : currentCalendarDate;
        currentCalendarDate = date;

        const yearNum = date.getFullYear();
        const monthNum = date.getMonth();
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthYear.textContent = `${monthNames[monthNum]} ${yearNum}`;

        // Clear previous calendar
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });

        // Get first day of month and number of days
        const firstDay = new Date(yearNum, monthNum, 1);
        const lastDay = new Date(yearNum, monthNum + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const dateString = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Check availability status FIRST (this should override today styling)
            if (availabilityData[dateString] === false) {
                dayElement.classList.add('blocked');
                dayElement.title = 'Not available';
            } else if (availabilityData[dateString] === 'reserved') {
                dayElement.classList.add('reserved');
                dayElement.title = 'Reserved';
            } else if (availabilityData[dateString] === 'booked') {
                dayElement.classList.add('booked');
                dayElement.title = 'Booked';
            } else if (availabilityData[dateString] === true) {
                dayElement.classList.add('available');
                dayElement.title = 'Available';
            } else {
                // Default to available if no data
                dayElement.classList.add('available');
                dayElement.title = 'Available';
            }

            // Check if it's today (just for styling, no automatic selection)
            if (yearNum === today.getFullYear() && monthNum === today.getMonth() && day === today.getDate()) {
                dayElement.classList.add('today');
                dayElement.title = 'Today - ' + dayElement.title;
            }

            // Add click handler for date selection
            dayElement.addEventListener('click', () => {
                if (dayElement.classList.contains('available')) {
                    // Remove previous selection
                    document.querySelectorAll('.calendar-day.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    
                    // Add selection to clicked day
                    dayElement.classList.add('selected');
                    
                    // Update date inputs
                    updateDateInputs(dateString);
                }
            });

            calendarGrid.appendChild(dayElement);
        }

        // Add empty cells for days after the last day of the month
        const totalCells = calendarGrid.children.length - 7; // Subtract day headers
        const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42 total cells
        for (let i = 0; i < remainingCells; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyDay);
        }
    }

    // Update date inputs when calendar date is selected
    function updateDateInputs(dateString) {
        const checkInInput = document.getElementById('checkIn');
        const checkOutInput = document.getElementById('checkOut');
        
        if (checkInInput && !checkInInput.value) {
            checkInInput.value = dateString;
            checkInInput.dispatchEvent(new Event('change'));
        } else if (checkOutInput && !checkOutInput.value) {
            checkOutInput.value = dateString;
            checkOutInput.dispatchEvent(new Event('change'));
        }
    }

    // Calendar navigation
    function setupCalendarNavigation() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        const refreshBtn = document.getElementById('refreshCalendar');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
                generateCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
                generateCalendar();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                refreshBtn.disabled = true;
                
                await refreshCalendar();
                
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                refreshBtn.disabled = false;
            });
        }
    }

    // Refresh calendar with updated availability data
    async function refreshCalendar() {
        try {
            console.log('Refreshing calendar...');
            availabilityData = await loadAvailabilityData();
            generateCalendar();
            console.log('Calendar refreshed successfully!');
        } catch (error) {
            console.error('Failed to refresh calendar:', error);
        }
    }

    // Make refreshCalendar globally available
    window.refreshCalendar = refreshCalendar;

    // Cloudinary configuration
    const cloudinaryConfig = {
        cloudName: 'djghkklph', // Your actual cloud name
        apiKey: '435329188695635',
        uploadPreset: 'arriba_receipts' // Upload preset to be created
    };

    // DOM Elements
    const bookingForm = document.getElementById('bookingForm');
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    const guestsSelect = document.getElementById('guests');
    const extraBedCheck = document.getElementById('extraBedCheck');
    const extraBedQuantity = document.getElementById('extraBedQuantity');
    const extraBedCount = document.getElementById('extraBedCount');
    const submitBtn = document.getElementById('submitBtn');
    const successModal = document.getElementById('successModal');
    const bookingIdSpan = document.getElementById('bookingId');

    // Summary elements
    const totalDaysSpan = document.getElementById('totalDays');
    const totalNightsSpan = document.getElementById('totalNights');
    const totalGuestsSpan = document.getElementById('totalGuests');
    const totalExtraBedsSpan = document.getElementById('totalExtraBeds');
    const totalAmountSpan = document.getElementById('totalAmount');

    // Pricing constants
    const PRICE_PER_NIGHT = 3300;
    const PRICE_PER_EXTRA_BED = 300;
    const MAX_EXTRA_BEDS = 5;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    checkInInput.min = today;
    checkOutInput.min = today;

    // Initialize Firebase on page load
    initializeFirebase();

    // Initialize calendar
    async function initializeCalendar() {
        try {
            console.log('Initializing calendar...');
            availabilityData = await loadAvailabilityData();
            generateCalendar();
            setupCalendarNavigation();
            console.log('Calendar initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize calendar:', error);
            // Still generate calendar with empty availability data
            generateCalendar();
            setupCalendarNavigation();
        }
    }

    // Initialize calendar after Firebase is ready
    setTimeout(() => {
        initializeCalendar();
    }, 1000);

    // Event Listeners
    checkInInput.addEventListener('change', handleDateChange);
    checkOutInput.addEventListener('change', handleDateChange);
    guestsSelect.addEventListener('input', updateBookingSummary);
    extraBedCheck.addEventListener('change', handleExtraBedToggle);
    extraBedCount.addEventListener('change', updateBookingSummary);
    bookingForm.addEventListener('submit', handleFormSubmit);

    // File upload functionality
    const receiptInput = document.getElementById('receipt');
    const fileUploadDisplay = document.querySelector('.file-upload-display');
    const fileUploadPlaceholder = document.querySelector('.file-upload-placeholder');
    const fileUploadPreview = document.querySelector('.file-upload-preview');
    const receiptPreview = document.getElementById('receiptPreview');
    const fileName = document.getElementById('fileName');

    // File upload event listeners
    fileUploadDisplay.addEventListener('click', () => {
        receiptInput.click();
    });

    receiptInput.addEventListener('change', handleFileUpload);

    // Initialize form
    function initializeForm() {
        updateBookingSummary();
    }

    // Handle date changes
    function handleDateChange() {
        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);

        if (checkIn && checkOut) {
            if (checkOut <= checkIn) {
                checkOutInput.value = '';
                showError(checkOutInput, 'Check-out date must be after check-in date');
                return;
            }
            
            // Update check-out minimum date
            const nextDay = new Date(checkIn);
            nextDay.setDate(nextDay.getDate() + 1);
            checkOutInput.min = nextDay.toISOString().split('T')[0];
        }

        updateBookingSummary();
    }

    // Handle extra bed toggle
    function handleExtraBedToggle() {
        if (extraBedCheck.checked) {
            extraBedQuantity.style.display = 'block';
        } else {
            extraBedQuantity.style.display = 'none';
            extraBedCount.value = '0';
        }
        updateBookingSummary();
    }

    // Update booking summary
    function updateBookingSummary() {
        const checkIn = checkInInput.value;
        const checkOut = checkOutInput.value;
        const guests = parseInt(guestsSelect.value) || 0;
        const extraBeds = extraBedCheck.checked ? parseInt(extraBedCount.value) || 0 : 0;

        // Calculate days and nights
        let days = 0;
        let nights = 0;
        
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
            days = Math.ceil(timeDiff / (1000 * 3600 * 24));
            nights = days;
        }

        // Calculate total amount
        const baseAmount = nights * PRICE_PER_NIGHT;
        const extraBedAmount = extraBeds * PRICE_PER_EXTRA_BED;
        const totalAmount = baseAmount + extraBedAmount;

        // Update display
        totalDaysSpan.textContent = days;
        totalNightsSpan.textContent = nights;
        totalGuestsSpan.textContent = guests;
        totalExtraBedsSpan.textContent = extraBeds;
        totalAmountSpan.textContent = `₱${totalAmount.toLocaleString()}`;

        // Enable/disable submit button
        const isValid = checkIn && checkOut && guests > 0 && totalAmount > 0;
        submitBtn.disabled = !isValid;
    }

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        console.log('Form submission started...');
        
        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        console.log('Form validation passed');

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const cloudinaryUrl = receiptInput.getAttribute('data-cloudinary-url');
            console.log('Cloudinary URL:', cloudinaryUrl);
            
            const bookingData = {
                id: generateBookingId(),
                customerName: document.getElementById('customerName').value.trim(),
                phoneNumber: document.getElementById('phoneNumber').value.trim(),
                email: document.getElementById('email').value.trim(),
                checkIn: checkInInput.value,
                checkOut: checkOutInput.value,
                guests: parseInt(guestsSelect.value),
                extraBeds: extraBedCheck.checked ? parseInt(extraBedCount.value) || 0 : 0,
                totalAmount: calculateTotalAmount(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                receiptUrl: cloudinaryUrl
            };

            console.log('Booking data:', bookingData);

            // Simulate API call
            await submitBooking(bookingData);
            
            console.log('Booking submitted successfully');
            showSuccessModal(bookingData.id);
            resetForm();

        } catch (error) {
            console.error('Booking submission error:', error);
            showError(submitBtn, 'Failed to submit booking. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Booking';
        }
    }

    // Validate form
    function validateForm() {
        let isValid = true;

        // Clear previous errors
        clearAllErrors();

        console.log('Starting form validation...');

        // Validate required fields
        const requiredFields = ['customerName', 'phoneNumber', 'email', 'checkIn', 'checkOut', 'guests'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                showError(field, 'This field is required');
                isValid = false;
                console.log(`Validation failed: ${fieldId} is empty`);
            }
        });

        // Validate email format
        const email = document.getElementById('email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            showError(document.getElementById('email'), 'Please enter a valid email address');
            isValid = false;
            console.log('Validation failed: Invalid email format');
        }

        // Validate phone number
        const phone = document.getElementById('phoneNumber').value;
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (phone && !phoneRegex.test(phone)) {
            showError(document.getElementById('phoneNumber'), 'Please enter a valid phone number');
            isValid = false;
            console.log('Validation failed: Invalid phone format');
        }

        // Validate dates
        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);
        if (checkIn && checkOut && checkOut <= checkIn) {
            showError(checkOutInput, 'Check-out date must be after check-in date');
            isValid = false;
            console.log('Validation failed: Invalid date range');
        }

        // Validate number of guests
        const guests = parseInt(guestsSelect.value) || 0;
        if (guests < 1 || guests > 10) {
            showError(guestsSelect, 'Number of guests must be between 1 and 10');
            isValid = false;
            console.log('Validation failed: Invalid guest count');
        }

        // Validate extra beds
        if (extraBedCheck.checked) {
            const extraBeds = parseInt(extraBedCount.value) || 0;
            if (extraBeds > MAX_EXTRA_BEDS) {
                showError(extraBedCount, `Maximum ${MAX_EXTRA_BEDS} extra beds allowed`);
                isValid = false;
                console.log('Validation failed: Too many extra beds');
            }
        }

        // Validate receipt upload
        const cloudinaryUrl = receiptInput.getAttribute('data-cloudinary-url');
        if (!cloudinaryUrl) {
            showError(receiptInput, 'Please upload a screenshot of your GCash receipt');
            isValid = false;
            console.log('Validation failed: No receipt uploaded');
        } else {
            console.log('Receipt validation passed:', cloudinaryUrl);
        }

        console.log('Form validation result:', isValid);
        return isValid;
    }

    // Calculate total amount
    function calculateTotalAmount() {
        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
        const extraBeds = extraBedCheck.checked ? parseInt(extraBedCount.value) || 0 : 0;
        
        return (nights * PRICE_PER_NIGHT) + (extraBeds * PRICE_PER_EXTRA_BED);
    }

    // Submit booking to Firebase with fallback to localStorage
    async function submitBooking(bookingData) {
        try {
            console.log('Submitting booking to Firebase:', bookingData);
            
            if (!db || !addDoc || !collection) {
                throw new Error('Firebase not initialized');
            }
            
            const docRef = await addDoc(collection(db, 'bookings'), {
                customerName: bookingData.customerName,
                phoneNumber: bookingData.phoneNumber,
                email: bookingData.email,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                guests: bookingData.guests,
                extraBeds: bookingData.extraBeds,
                totalAmount: bookingData.totalAmount,
                status: bookingData.status,
                receiptUrl: bookingData.receiptUrl,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('Booking submitted successfully to Firebase with ID:', docRef.id);
            return { id: docRef.id, ...bookingData };
        } catch (error) {
            console.error('Firebase submission failed, falling back to localStorage:', error);
            
            // Fallback to localStorage
            const existingBookings = JSON.parse(localStorage.getItem('arribaBookings') || '[]');
            existingBookings.unshift(bookingData);
            localStorage.setItem('arribaBookings', JSON.stringify(existingBookings));
            
            console.log('Booking saved to localStorage as fallback');
            return bookingData;
        }
    }

    // Generate booking ID
    function generateBookingId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `ARB-${timestamp}-${random}`.toUpperCase();
    }

    // Show success modal
    function showSuccessModal(bookingId) {
        bookingIdSpan.textContent = bookingId;
        successModal.style.display = 'flex';
    }

    // Close modal
    window.closeModal = function() {
        successModal.style.display = 'none';
    }

    // GCash Payment Functions
    window.showGCashDetails = function() {
        document.getElementById('gcashModal').style.display = 'flex';
    }

    window.closeGCashModal = function() {
        document.getElementById('gcashModal').style.display = 'none';
    }

    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(function() {
            // Show success feedback
            const copyBtn = event.target.closest('.copy-btn');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.style.background = '#27ae60';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '#667eea';
            }, 2000);
        }).catch(function(err) {
            console.error('Could not copy text: ', err);
            alert('Could not copy to clipboard');
        });
    }

    // Reset form
    function resetForm() {
        bookingForm.reset();
        extraBedQuantity.style.display = 'none';
        
        // Reset file upload
        receiptInput.value = '';
        receiptInput.removeAttribute('data-cloudinary-url');
        fileUploadDisplay.classList.remove('has-file', 'uploading');
        fileUploadPlaceholder.style.display = 'block';
        fileUploadPreview.style.display = 'none';
        receiptPreview.src = '';
        fileName.textContent = '';
        fileUploadPlaceholder.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>Click to upload screenshot of GCash receipt</p><small>Accepted formats: JPG, PNG, GIF (Max 5MB)</small>';
        
        // Clear any errors
        clearAllErrors();
        
        updateBookingSummary();
    }

    // Show error
    function showError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    // Clear error
    function clearError(field) {
        field.classList.remove('error');
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    // Clear all errors
    function clearAllErrors() {
        const errorFields = document.querySelectorAll('.error');
        errorFields.forEach(field => {
            field.classList.remove('error');
        });
        
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(message => {
            message.remove();
        });
    }

    // File upload handling functions
    function handleFileUpload(event) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError(receiptInput, 'Please upload an image file (JPG, PNG, GIF)');
            return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showError(receiptInput, 'File size must be less than 5MB');
            return;
        }
        
        // Clear any previous errors
        clearError(receiptInput);
        
        // Show loading state
        fileUploadDisplay.classList.add('uploading');
        fileUploadPlaceholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Uploading to cloud...</p>';
        
        // Upload to Cloudinary
        uploadToCloudinary(file);
    }

    // Upload file to Cloudinary
    function uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'arriba_receipts');
        formData.append('api_key', '435329188695635');
        
        fetch('https://api.cloudinary.com/v1_1/djghkklph/image/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.secure_url) {
                // Store the Cloudinary URL
                receiptInput.setAttribute('data-cloudinary-url', data.secure_url);
                
                // Show preview
                receiptPreview.src = data.secure_url;
                fileName.textContent = file.name;
                
                // Show preview and hide placeholder
                fileUploadDisplay.classList.remove('uploading');
                fileUploadDisplay.classList.add('has-file');
                fileUploadPlaceholder.style.display = 'none';
                fileUploadPreview.style.display = 'flex';
            } else {
                throw new Error('Upload failed');
            }
        })
        .catch(error => {
            console.error('Cloudinary upload error:', error);
            showError(receiptInput, 'Failed to upload image. Please try again.');
            fileUploadDisplay.classList.remove('uploading');
            fileUploadPlaceholder.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>Click to upload screenshot of GCash receipt</p><small>Accepted formats: JPG, PNG, GIF (Max 5MB)</small>';
        });
    }

    // Remove uploaded file
    window.removeReceipt = function() {
        receiptInput.value = '';
        receiptInput.removeAttribute('data-cloudinary-url');
        fileUploadDisplay.classList.remove('has-file', 'uploading');
        fileUploadPlaceholder.style.display = 'block';
        fileUploadPreview.style.display = 'none';
        receiptPreview.src = '';
        fileName.textContent = '';
        fileUploadPlaceholder.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>Click to upload screenshot of GCash receipt</p><small>Accepted formats: JPG, PNG, GIF (Max 5MB)</small>';
        clearError(receiptInput);
    };

    // Initialize booking summary on page load
    updateBookingSummary();

    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const gcashModal = document.getElementById('gcashModal');
        const successModal = document.getElementById('successModal');
        
        if (event.target === gcashModal) {
            closeGCashModal();
        }
        
        if (event.target === successModal) {
            closeSuccessModal();
        }
    });
});
