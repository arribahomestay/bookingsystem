// Booking System JavaScript with Firebase Integration

// Production Configuration
const PRODUCTION_CONFIG = {
    // Production reCAPTCHA site key
    RECAPTCHA_SITE_KEY: '6LcNlfcrAAAAAFCZoXwniLEJ48I89OWnKo44FTgG',
    
    // Production reCAPTCHA secret key (for server-side verification)
    RECAPTCHA_SECRET_KEY: '6LcNIfcrAAAAAAx9KhsuSHQHtJjsXsQv2jslsfQC',
    
    // Add your domain for additional security
    ALLOWED_DOMAINS: [
        'arribahomestay.github.io',
        'www.arribahomestay.github.io',
        'localhost',
        '127.0.0.1'
    ]
};

// CAPTCHA State Management
let captchaVerified = false;

// CAPTCHA Callback Functions
function onCaptchaSuccess(token) {
    console.log('CAPTCHA verification successful');
    
    // Validate domain for additional security
    const currentDomain = window.location.hostname;
    if (!PRODUCTION_CONFIG.ALLOWED_DOMAINS.includes(currentDomain)) {
        console.warn('CAPTCHA verification from unauthorized domain:', currentDomain);
    }
    
    captchaVerified = true;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('captcha-error').style.display = 'none';
    
    // Add success styling to submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.style.backgroundColor = '#4CAF50';
    submitBtn.style.cursor = 'pointer';
    
    // Store token for server-side verification
    window.captchaToken = token;
}

function onCaptchaExpired() {
    console.log('CAPTCHA expired');
    captchaVerified = false;
    document.getElementById('submitBtn').disabled = true;
    
    // Reset submit button styling
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.style.backgroundColor = '#ccc';
    submitBtn.style.cursor = 'not-allowed';
}

// EmailJS Configuration for Booking Submitted Email
const EMAILJS_CONFIG = {
    PUBLIC_KEY: "kDx6o0Gsh2ZtIqQvO",
    SERVICE_ID: "service_fcen5ps",
    TEMPLATE_ID_SUBMITTED: "template_ynd8k7e" // Booking submitted template
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

// Send booking submitted confirmation email
async function sendBookingSubmittedEmail(bookingData) {
    try {
        console.log('Sending booking submitted email to:', bookingData.email);
        
        // Calculate duration and nights
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const nights = days - 1; // Nights = days - 1
        
        // Prepare email parameters
        const emailParams = {
            customer_name: bookingData.customerName,
            booking_id: bookingData.id || bookingData.bookingId,
            check_in_date: formatDate(bookingData.checkIn),
            check_out_date: formatDate(bookingData.checkOut),
            duration: days,
            nights: nights,
            adults: bookingData.adults,
            kids: bookingData.kids || 0,
            extra_beds: bookingData.extraBeds || 0,
            total_amount: bookingData.totalAmount,
            email: bookingData.email,
            phone: bookingData.phoneNumber
        };
        
        // Send email
        const result = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID_SUBMITTED,
            emailParams
        );
        
        console.log('Booking submitted email sent successfully:', result);
        return { success: true, result };
        
    } catch (error) {
        console.error('Failed to send booking submitted email:', error);
        return { success: false, error };
    }
}

// Format date function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Burger Menu Functionality
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }

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
    const adultsInput = document.getElementById('adults');
    const kidsInput = document.getElementById('kids');
    const extraBedCheck = document.getElementById('extraBedCheck');
    const extraBedQuantity = document.getElementById('extraBedQuantity');
    const extraBedCount = document.getElementById('extraBedCount');
    const submitBtn = document.getElementById('submitBtn');
    const successModal = document.getElementById('successModal');
    const bookingIdSpan = document.getElementById('bookingId');

    // Summary elements
    const totalDaysSpan = document.getElementById('totalDays');
    const totalNightsSpan = document.getElementById('totalNights');
    const totalAdultsSpan = document.getElementById('totalAdults');
    const totalKidsSpan = document.getElementById('totalKids');
    const totalExtraBedsSpan = document.getElementById('totalExtraBeds');
    const totalAmountSpan = document.getElementById('totalAmount');

    // Pricing constants
    const BASE_RATE = 3300; // Base rate per night (includes up to 5 guests)
    const MAX_GUESTS_INCLUDED = 5; // Maximum guests included in base rate
    const PRICE_PER_EXTRA_ADULT = 300; // Additional charge per adult over 5
    const PRICE_PER_EXTRA_KID = 240; // Additional charge per kid over 5
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
    adultsInput.addEventListener('input', updateBookingSummary);
    kidsInput.addEventListener('input', updateBookingSummary);
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
        // Initialize phone number input with number-only restriction
        initializePhoneInput();
        
        updateBookingSummary();
    }

    // Initialize phone number input with number-only restriction
    function initializePhoneInput() {
        const phoneInput = document.getElementById('phoneNumber');
        const countryCodeSelect = document.getElementById('countryCode');
        
        // Restrict input to numbers only
        phoneInput.addEventListener('input', function(e) {
            // Remove any non-numeric characters
            let value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;
        });
        
        // Prevent non-numeric characters on keypress
        phoneInput.addEventListener('keypress', function(e) {
            // Allow: backspace, delete, tab, escape, enter
            if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true)) {
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
        
        // Handle paste events to filter out non-numeric characters
        phoneInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbersOnly = paste.replace(/[^0-9]/g, '');
            phoneInput.value = numbersOnly;
        });
        
        // Update phone number format based on country code
        countryCodeSelect.addEventListener('change', function() {
            const countryCode = this.value;
            const phoneInput = document.getElementById('phoneNumber');
            
            // Clear existing value when country changes
            phoneInput.value = '';
            
            // Set placeholder based on country
            switch(countryCode) {
                case '+63': // Philippines
                    phoneInput.placeholder = '9XX XXX XXXX';
                    break;
                case '+1': // USA/Canada
                    phoneInput.placeholder = 'XXX XXX XXXX';
                    break;
                case '+44': // UK
                    phoneInput.placeholder = 'XXXX XXX XXX';
                    break;
                case '+49': // Germany
                    phoneInput.placeholder = 'XXX XXXXXXX';
                    break;
                case '+33': // France
                    phoneInput.placeholder = 'X XX XX XX XX';
                    break;
                case '+39': // Italy
                    phoneInput.placeholder = 'XXX XXX XXXX';
                    break;
                case '+34': // Spain
                    phoneInput.placeholder = 'XXX XXX XXX';
                    break;
                case '+81': // Japan
                    phoneInput.placeholder = 'XX XXXX XXXX';
                    break;
                case '+82': // South Korea
                    phoneInput.placeholder = 'XX XXXX XXXX';
                    break;
                case '+86': // China
                    phoneInput.placeholder = 'XXX XXXX XXXX';
                    break;
                case '+65': // Singapore
                    phoneInput.placeholder = 'XXXX XXXX';
                    break;
                case '+60': // Malaysia
                    phoneInput.placeholder = 'XX XXX XXXX';
                    break;
                case '+66': // Thailand
                    phoneInput.placeholder = 'XX XXX XXXX';
                    break;
                case '+84': // Vietnam
                    phoneInput.placeholder = 'XXX XXX XXXX';
                    break;
                case '+62': // Indonesia
                    phoneInput.placeholder = 'XXX XXXX XXXX';
                    break;
                case '+91': // India
                    phoneInput.placeholder = 'XXXXX XXXXX';
                    break;
                case '+61': // Australia
                    phoneInput.placeholder = 'XXX XXX XXX';
                    break;
                case '+64': // New Zealand
                    phoneInput.placeholder = 'XX XXX XXXX';
                    break;
                default:
                    phoneInput.placeholder = 'Enter phone number';
            }
        });
        
        // Set initial placeholder for Philippines
        phoneInput.placeholder = '9XX XXX XXXX';
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
        const adults = parseInt(adultsInput.value) || 0;
        const kids = parseInt(kidsInput.value) || 0;
        const extraBeds = extraBedCheck.checked ? parseInt(extraBedCount.value) || 0 : 0;

        // Calculate days and nights
        let days = 0;
        let nights = 0;
        
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
            days = Math.ceil(timeDiff / (1000 * 3600 * 24));
            nights = Math.max(0, days - 1); // Nights = days - 1 (you don't sleep the last day)
        }

        // Calculate total amount with new pricing structure
        const totalGuests = adults + kids;
        const baseAmount = nights * BASE_RATE; // Base rate includes up to 5 guests
        
        // Calculate extra charges for guests over 5
        let extraGuestAmount = 0;
        if (totalGuests > MAX_GUESTS_INCLUDED) {
            const extraGuests = totalGuests - MAX_GUESTS_INCLUDED;
            // Calculate how many adults and kids are in the extra guests
            const extraAdults = Math.min(adults, extraGuests);
            const extraKids = Math.max(0, extraGuests - extraAdults);
            
            extraGuestAmount = (extraAdults * PRICE_PER_EXTRA_ADULT) + (extraKids * PRICE_PER_EXTRA_KID);
        }
        
        const extraBedAmount = extraBeds * PRICE_PER_EXTRA_BED;
        const totalAmount = baseAmount + extraGuestAmount + extraBedAmount;

        // Update display
        totalDaysSpan.textContent = days;
        totalNightsSpan.textContent = nights;
        totalAdultsSpan.textContent = adults;
        totalKidsSpan.textContent = kids;
        totalExtraBedsSpan.textContent = extraBeds;
        totalAmountSpan.textContent = `₱${totalAmount.toLocaleString()}`;

        // Enable/disable submit button
        const isValid = checkIn && checkOut && adults > 0 && totalAmount > 0;
        submitBtn.disabled = !isValid;
    }

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        console.log('Form submission started...');
        
        // Check CAPTCHA verification first
        if (!captchaVerified) {
            console.log('CAPTCHA verification required');
            document.getElementById('captcha-error').style.display = 'block';
            showNotification('Please complete the CAPTCHA verification to continue', 'error');
            return;
        }
        
        // Add loading animation
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        if (!validateForm()) {
            console.log('Form validation failed');
            // Remove loading state if validation fails
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            return;
        }

        console.log('Form validation passed');

        // Add delay for bubble animation to complete
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const cloudinaryUrl = receiptInput.getAttribute('data-cloudinary-url');
            console.log('Cloudinary URL:', cloudinaryUrl);
            
            // Prepare CAPTCHA token for server-side verification
            const captchaToken = window.captchaToken;
            if (!captchaToken) {
                throw new Error('CAPTCHA token not found');
            }
            
            const bookingData = {
                customerName: document.getElementById('customerName').value.trim(),
                phoneNumber: document.getElementById('phoneNumber').value.trim(),
                countryCode: document.getElementById('countryCode').value,
                fullPhoneNumber: document.getElementById('countryCode').value + document.getElementById('phoneNumber').value.trim(),
                email: document.getElementById('email').value.trim(),
                checkIn: checkInInput.value,
                checkOut: checkOutInput.value,
                adults: parseInt(adultsInput.value),
                kids: parseInt(kidsInput.value) || 0,
                extraBeds: extraBedCheck.checked ? parseInt(extraBedCount.value) || 0 : 0,
                totalAmount: calculateTotalAmount(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                receiptUrl: cloudinaryUrl,
                captchaToken: captchaToken // Include CAPTCHA token for server verification
            };

            console.log('Booking data:', bookingData);

            // Submit booking to database
            const result = await submitBooking(bookingData);
            
            console.log('Booking submitted successfully');
            
            // Send booking submitted confirmation email
            try {
                const emailResult = await sendBookingSubmittedEmail(result);
                if (emailResult.success) {
                    console.log('Booking submitted email sent successfully');
                } else {
                    console.error('Failed to send booking submitted email:', emailResult.error);
                }
            } catch (emailError) {
                console.error('Error sending booking submitted email:', emailError);
            }
            
            showSuccessModal(result.id);
            resetForm();

        } catch (error) {
            console.error('Booking submission error:', error);
            showError(submitBtn, 'Failed to submit booking. Please try again.');
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Booking';
        }
    }

    // Validate form
    function validateForm() {
        let isValid = true;
        let errorCount = 0;

        // Clear previous errors
        clearAllErrors();

        console.log('Starting comprehensive form validation...');
        
        // Check CAPTCHA verification
        if (!captchaVerified) {
            console.log('CAPTCHA verification failed');
            document.getElementById('captcha-error').style.display = 'block';
            isValid = false;
            errorCount++;
        }

        // Validate required fields with detailed error messages
        const requiredFields = [
            { id: 'customerName', name: 'Customer Name' },
            { id: 'phoneNumber', name: 'Phone Number' },
            { id: 'email', name: 'Email Address' },
            { id: 'checkIn', name: 'Check-in Date' },
            { id: 'checkOut', name: 'Check-out Date' },
            { id: 'adults', name: 'Number of Adults' }
        ];
        
        requiredFields.forEach(field => {
            const fieldElement = document.getElementById(field.id);
            if (!fieldElement.value.trim()) {
                showError(fieldElement, `${field.name} is required`);
                isValid = false;
                errorCount++;
                console.log(`Validation failed: ${field.id} is empty`);
            }
        });

        // Validate customer name (minimum 2 characters)
        const customerName = document.getElementById('customerName').value.trim();
        if (customerName && customerName.length < 2) {
            showError(document.getElementById('customerName'), 'Customer name must be at least 2 characters long');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Customer name too short');
        }

        // Validate email format
        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            showError(document.getElementById('email'), 'Please enter a valid email address (e.g., user@example.com)');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Invalid email format');
        }

        // Validate phone number (more comprehensive)
        const phone = document.getElementById('phoneNumber').value.trim();
        const countryCode = document.getElementById('countryCode').value;
        const phoneWrapper = document.querySelector('.phone-input-wrapper');
        
        // Check if phone number is provided
        if (!phone) {
            showError(document.getElementById('phoneNumber'), 'Phone number is required');
            phoneWrapper.classList.add('error');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Phone number is empty');
        } else {
            // Validate phone number format based on country
            let phoneRegex, minLength, maxLength, errorMessage;
            
            switch(countryCode) {
                case '+63': // Philippines
                    phoneRegex = /^9\d{9}$/; // Must start with 9 and be 10 digits total
                    minLength = 10;
                    maxLength = 10;
                    errorMessage = 'Philippine mobile numbers must start with 9 and be 10 digits (e.g., 9123456789)';
                    break;
                case '+1': // USA/Canada
                    phoneRegex = /^\d{10}$/; // 10 digits
                    minLength = 10;
                    maxLength = 10;
                    errorMessage = 'US/Canada numbers must be 10 digits';
                    break;
                case '+44': // UK
                    phoneRegex = /^\d{10,11}$/; // 10-11 digits
                    minLength = 10;
                    maxLength = 11;
                    errorMessage = 'UK numbers must be 10-11 digits';
                    break;
                case '+49': // Germany
                    phoneRegex = /^\d{10,12}$/; // 10-12 digits
                    minLength = 10;
                    maxLength = 12;
                    errorMessage = 'German numbers must be 10-12 digits';
                    break;
                case '+81': // Japan
                    phoneRegex = /^\d{10,11}$/; // 10-11 digits
                    minLength = 10;
                    maxLength = 11;
                    errorMessage = 'Japanese numbers must be 10-11 digits';
                    break;
                case '+82': // South Korea
                    phoneRegex = /^\d{10,11}$/; // 10-11 digits
                    minLength = 10;
                    maxLength = 11;
                    errorMessage = 'Korean numbers must be 10-11 digits';
                    break;
                case '+86': // China
                    phoneRegex = /^\d{11}$/; // 11 digits
                    minLength = 11;
                    maxLength = 11;
                    errorMessage = 'Chinese numbers must be 11 digits';
                    break;
                case '+65': // Singapore
                    phoneRegex = /^\d{8}$/; // 8 digits
                    minLength = 8;
                    maxLength = 8;
                    errorMessage = 'Singapore numbers must be 8 digits';
                    break;
                case '+60': // Malaysia
                    phoneRegex = /^\d{9,10}$/; // 9-10 digits
                    minLength = 9;
                    maxLength = 10;
                    errorMessage = 'Malaysian numbers must be 9-10 digits';
                    break;
                case '+66': // Thailand
                    phoneRegex = /^\d{9,10}$/; // 9-10 digits
                    minLength = 9;
                    maxLength = 10;
                    errorMessage = 'Thai numbers must be 9-10 digits';
                    break;
                case '+84': // Vietnam
                    phoneRegex = /^\d{9,10}$/; // 9-10 digits
                    minLength = 9;
                    maxLength = 10;
                    errorMessage = 'Vietnamese numbers must be 9-10 digits';
                    break;
                case '+62': // Indonesia
                    phoneRegex = /^\d{10,12}$/; // 10-12 digits
                    minLength = 10;
                    maxLength = 12;
                    errorMessage = 'Indonesian numbers must be 10-12 digits';
                    break;
                case '+91': // India
                    phoneRegex = /^\d{10}$/; // 10 digits
                    minLength = 10;
                    maxLength = 10;
                    errorMessage = 'Indian numbers must be 10 digits';
                    break;
                case '+61': // Australia
                    phoneRegex = /^\d{9,10}$/; // 9-10 digits
                    minLength = 9;
                    maxLength = 10;
                    errorMessage = 'Australian numbers must be 9-10 digits';
                    break;
                case '+64': // New Zealand
                    phoneRegex = /^\d{8,9}$/; // 8-9 digits
                    minLength = 8;
                    maxLength = 9;
                    errorMessage = 'New Zealand numbers must be 8-9 digits';
                    break;
                default:
                    phoneRegex = /^\d{7,15}$/; // General: 7-15 digits
                    minLength = 7;
                    maxLength = 15;
                    errorMessage = 'Phone number must be 7-15 digits';
            }
            
            if (!phoneRegex.test(phone)) {
                showError(document.getElementById('phoneNumber'), errorMessage);
                phoneWrapper.classList.add('error');
                isValid = false;
                errorCount++;
                console.log('Validation failed: Invalid phone format for', countryCode);
            } else {
                // Clear error state if valid
                phoneWrapper.classList.remove('error');
                clearError(document.getElementById('phoneNumber'));
            }
        }

        // Validate dates with more comprehensive checks
        const checkInDate = new Date(checkInInput.value);
        const checkOutDate = new Date(checkOutInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day

        if (checkInDate && checkInDate < today) {
            showError(checkInInput, 'Check-in date cannot be in the past');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Check-in date in past');
        }

        if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
            showError(checkOutInput, 'Check-out date must be after check-in date');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Invalid date range');
        }

        // Validate number of adults
        const adults = parseInt(adultsInput.value) || 0;
        if (adults < 1) {
            showError(adultsInput, 'At least 1 adult is required');
            isValid = false;
            errorCount++;
            console.log('Validation failed: No adults specified');
        } else if (adults > 10) {
            showError(adultsInput, 'Maximum 10 adults allowed per booking');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Too many adults');
        }

        // Validate number of kids
        const kids = parseInt(kidsInput.value) || 0;
        if (kids < 0) {
            showError(kidsInput, 'Number of kids cannot be negative');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Negative kids count');
        } else if (kids > 10) {
            showError(kidsInput, 'Maximum 10 kids allowed per booking');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Too many kids');
        }

        // Validate total guest count
        const totalGuests = adults + kids;
        if (totalGuests > 15) {
            showError(adultsInput, 'Maximum 15 total guests allowed per booking');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Too many total guests');
        }

        // Validate extra beds
        if (extraBedCheck.checked) {
            const extraBeds = parseInt(extraBedCount.value) || 0;
            if (extraBeds < 1) {
                showError(extraBedCount, 'Please specify number of extra beds needed');
                isValid = false;
                errorCount++;
                console.log('Validation failed: Extra beds not specified');
            } else if (extraBeds > MAX_EXTRA_BEDS) {
                showError(extraBedCount, `Maximum ${MAX_EXTRA_BEDS} extra beds allowed`);
                isValid = false;
                errorCount++;
                console.log('Validation failed: Too many extra beds');
            }
        }

        // Validate receipt upload (CRITICAL - must have receipt)
        const cloudinaryUrl = receiptInput.getAttribute('data-cloudinary-url');
        const receiptFile = receiptInput.files[0];
        const fileUploadContainer = document.querySelector('.file-upload-container');
        
        if (!cloudinaryUrl && !receiptFile) {
            showError(receiptInput, 'Please upload a screenshot of your GCash receipt to complete the booking');
            fileUploadContainer.classList.add('error');
            isValid = false;
            errorCount++;
            console.log('Validation failed: No receipt uploaded');
        } else if (receiptFile) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(receiptFile.type)) {
                showError(receiptInput, 'Please upload a valid image file (JPG, PNG, or GIF)');
                fileUploadContainer.classList.add('error');
                isValid = false;
                errorCount++;
                console.log('Validation failed: Invalid file type');
            }
            
            // Validate file size (5MB limit)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (receiptFile.size > maxSize) {
                showError(receiptInput, 'File size must be less than 5MB');
                fileUploadContainer.classList.add('error');
                isValid = false;
                errorCount++;
                console.log('Validation failed: File too large');
            } else {
                // Clear error state if valid
                fileUploadContainer.classList.remove('error');
                clearError(receiptInput);
            }
        } else {
            // Clear error state if cloudinary URL exists
            fileUploadContainer.classList.remove('error');
            clearError(receiptInput);
        }

        // Validate minimum booking amount
        const totalAmount = calculateTotalAmount();
        if (totalAmount < 1000) {
            showError(document.getElementById('adults'), 'Minimum booking amount is ₱1,000');
            isValid = false;
            errorCount++;
            console.log('Validation failed: Amount too low');
        }

        // Show summary of validation results
        if (!isValid) {
            console.log(`Form validation failed with ${errorCount} error(s)`);
            
            // Show error summary notification
            showErrorSummary(errorCount);
            
            // Enhanced mobile-friendly scrolling to first error
            scrollToFirstError();
        } else {
            console.log('Form validation passed successfully');
        }

        console.log('Form validation result:', isValid);
        return isValid;
    }

    // Calculate total amount
    function calculateTotalAmount() {
        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);
        const days = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
        const nights = Math.max(0, days - 1); // Nights = days - 1 (you don't sleep the last day)
        const adults = parseInt(adultsInput.value) || 0;
        const kids = parseInt(kidsInput.value) || 0;
        const extraBeds = extraBedCheck.checked ? parseInt(extraBedCount.value) || 0 : 0;
        
        // Calculate total amount with correct pricing structure
        const totalGuests = adults + kids;
        const baseAmount = nights * BASE_RATE; // Base rate includes up to 5 guests
        
        // Calculate extra charges for guests over 5
        let extraGuestAmount = 0;
        if (totalGuests > MAX_GUESTS_INCLUDED) {
            const extraGuests = totalGuests - MAX_GUESTS_INCLUDED;
            // Calculate how many adults and kids are in the extra guests
            const extraAdults = Math.min(adults, extraGuests);
            const extraKids = Math.max(0, extraGuests - extraAdults);
            
            extraGuestAmount = (extraAdults * PRICE_PER_EXTRA_ADULT) + (extraKids * PRICE_PER_EXTRA_KID);
        }
        
        const extraBedAmount = extraBeds * PRICE_PER_EXTRA_BED;
        const totalAmount = baseAmount + extraGuestAmount + extraBedAmount;
        
        return totalAmount;
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
                adults: bookingData.adults,
                kids: bookingData.kids,
                extraBeds: bookingData.extraBeds,
                totalAmount: bookingData.totalAmount,
                status: bookingData.status,
                receiptUrl: bookingData.receiptUrl,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('Booking submitted successfully to Firebase with ID:', docRef.id);
            // Use Firebase document ID instead of custom ID
            const updatedBookingData = { ...bookingData, id: docRef.id };
            return updatedBookingData;
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
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                button.style.background = '#27ae60';
                
                setTimeout(() => {
                    button.innerHTML = originalText;
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
        
        // Add new error message with enhanced styling
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        field.parentNode.appendChild(errorDiv);
        
        // Add shake animation
        field.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            field.style.animation = '';
        }, 500);
        
        // Focus on the field for better UX
        field.focus();
        
        // Add visual feedback
        field.style.borderColor = '#e74c3c';
        field.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
    }

    // Clear error
    function clearError(field) {
        field.classList.remove('error');
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
        
        // Reset visual feedback
        field.style.borderColor = '';
        field.style.boxShadow = '';
        field.style.animation = '';
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
        
        // Hide CAPTCHA error
        const captchaError = document.getElementById('captcha-error');
        if (captchaError) {
            captchaError.style.display = 'none';
        }
        
        // Remove error summary if exists
        const errorSummary = document.getElementById('errorSummary');
        if (errorSummary) {
            errorSummary.remove();
        }
    }

    // Show error summary notification
    function showErrorSummary(errorCount) {
        // Remove existing error summary
        const existingSummary = document.getElementById('errorSummary');
        if (existingSummary) {
            existingSummary.remove();
        }
        
        // Create error summary
        const errorSummary = document.createElement('div');
        errorSummary.id = 'errorSummary';
        errorSummary.className = 'error-summary';
        errorSummary.innerHTML = `
            <div class="error-summary-content">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="error-summary-text">
                    <strong>Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} to continue:</strong>
                    <p>All required fields must be filled and a receipt must be uploaded.</p>
                </div>
                <button type="button" class="error-summary-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Insert at the top of the form
        const form = document.querySelector('form');
        form.insertBefore(errorSummary, form.firstChild);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorSummary.parentNode) {
                errorSummary.remove();
            }
        }, 10000);
    }

    // Enhanced mobile-friendly scroll to first error
    function scrollToFirstError() {
        const firstError = document.querySelector('.error');
        if (!firstError) return;
        
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Mobile-specific scrolling with offset for fixed header
            const headerHeight = 70; // Height of fixed navigation
            const offset = headerHeight + 20; // Extra padding
            
            // Get the position of the error field
            const errorRect = firstError.getBoundingClientRect();
            const scrollTop = window.pageYOffset + errorRect.top - offset;
            
            // Smooth scroll to error field
            window.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
            
            // Add visual highlight to the error field
            firstError.style.animation = 'errorPulse 0.6s ease-in-out 3';
            
            // Focus on the error field after scroll
            setTimeout(() => {
                if (firstError.tagName === 'INPUT' || firstError.tagName === 'SELECT') {
                    firstError.focus();
                } else {
                    // If it's a wrapper, find the actual input
                    const input = firstError.querySelector('input, select');
                    if (input) {
                        input.focus();
                    }
                }
            }, 800);
            
        } else {
            // Desktop scrolling
            firstError.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Focus on the error field
            setTimeout(() => {
                if (firstError.tagName === 'INPUT' || firstError.tagName === 'SELECT') {
                    firstError.focus();
                } else {
                    const input = firstError.querySelector('input, select');
                    if (input) {
                        input.focus();
                    }
                }
            }, 500);
        }
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
                
                // Hide filename if too long to prevent field stretching
                if (file.name.length > 25) {
                    fileName.textContent = 'Image uploaded';
                    fileName.classList.add('long-filename');
                } else {
                    fileName.textContent = file.name;
                    fileName.classList.remove('long-filename');
                }
                fileName.title = file.name; // Add tooltip with full filename
                
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
    
    // Image viewer functions
    window.openImageViewer = function(imageSrc, imageAlt) {
        const modal = document.getElementById('imageViewerModal');
        const viewerImage = document.getElementById('viewerImage');
        const viewerImageName = document.getElementById('viewerImageName');
        const viewerImageSize = document.getElementById('viewerImageSize');
        
        // Set image source and alt text
        viewerImage.src = imageSrc;
        viewerImage.alt = imageAlt;
        
        // Set image name (extract from alt or use default)
        const fileName = imageAlt || 'Uploaded Image';
        viewerImageName.textContent = fileName;
        
        // Get image dimensions for display
        const img = new Image();
        img.onload = function() {
            const dimensions = `${this.naturalWidth} × ${this.naturalHeight}`;
            const fileSize = getFileSizeFromSrc(imageSrc);
            viewerImageSize.textContent = `${dimensions}${fileSize ? ` • ${fileSize}` : ''}`;
        };
        img.src = imageSrc;
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add keyboard support
        document.addEventListener('keydown', handleImageViewerKeyboard);
    };
    
    window.closeImageViewer = function() {
        const modal = document.getElementById('imageViewerModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Remove keyboard listener
        document.removeEventListener('keydown', handleImageViewerKeyboard);
    };
    
    function handleImageViewerKeyboard(event) {
        if (event.key === 'Escape') {
            closeImageViewer();
        }
    }
    
    function getFileSizeFromSrc(src) {
        // This is a placeholder - in a real implementation, you might want to
        // store file size when uploading or make an API call to get it
        return null;
    }

    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const gcashModal = document.getElementById('gcashModal');
        const successModal = document.getElementById('successModal');
        const imageViewerModal = document.getElementById('imageViewerModal');
        
        if (event.target === gcashModal) {
            closeGCashModal();
        }
        
        if (event.target === successModal) {
            closeSuccessModal();
        }
        
        if (event.target === imageViewerModal) {
            closeImageViewer();
        }
    });
});
