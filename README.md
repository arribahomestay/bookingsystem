# 🏠 Arriba Homestay Booking System

A complete booking management system for Arriba Homestay, featuring both customer-facing booking interface and admin dashboard.

## 🌟 Features

### Customer Booking Page (`index.html`)
- **Guest Information**: Name, phone number, email
- **Date Selection**: Check-in/check-out with real-time availability
- **Guest Management**: Up to 10 guests with extra bed options (max 5)
- **Automatic Calculations**: Days, nights, guests, extra beds, and total amount
- **GCash Payment**: Integrated payment with receipt upload
- **Availability Calendar**: View-only calendar showing available, reserved, and booked dates
- **Receipt Upload**: Required GCash receipt upload via Cloudinary

### Admin Dashboard (`admin.html`)
- **Booking Management**: View, approve, reject bookings
- **Records Tracking**: Complete booking history
- **Calendar Management**: Set date availability (Available, Reserved, Booked)
- **Mobile Responsive**: Optimized for iOS and iPad
- **Receipt Viewing**: View uploaded GCash receipts
- **Real-time Updates**: Firebase-powered data synchronization

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: Firebase Firestore
- **File Storage**: Cloudinary
- **Payment**: GCash integration
- **Responsive Design**: Mobile-first approach

## 📁 Project Structure

```
bookingsystem/
├── index.html          # Customer booking page
├── admin.html          # Admin dashboard
├── style.css           # Customer page styles
├── admin.css           # Admin dashboard styles
├── script.js           # Customer page JavaScript
├── admin.js            # Admin dashboard JavaScript
├── FIREBASE_SETUP.md   # Firebase configuration guide
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites
- Firebase project with Firestore enabled
- Cloudinary account for image uploads
- Web server (local or hosted)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arribahomestay/bookingsystem.git
   cd bookingsystem
   ```

2. **Configure Firebase**
   - Follow the instructions in `FIREBASE_SETUP.md`
   - Update Firebase configuration in both `index.html` and `admin.html`

3. **Configure Cloudinary**
   - Update Cloudinary credentials in `script.js`
   - Set up upload presets for receipt images

4. **Deploy**
   - Upload files to your web server
   - Ensure Firebase security rules are properly configured

## 💰 Pricing Structure

- **Per Night**: ₱3,300 PHP
- **Extra Bed**: ₱300 PHP per additional guest
- **Minimum Deposit**: ₱3,000 PHP (GCash payment)

## 📱 Mobile Features

- **Touch-friendly Interface**: Optimized for mobile devices
- **Responsive Calendar**: Easy date selection on small screens
- **Mobile Admin**: Full admin functionality on mobile devices
- **iOS/iPad Optimized**: Specific optimizations for Apple devices

## 🔧 Configuration

### Firebase Setup
1. Create Firebase project
2. Enable Firestore Database
3. Set up security rules
4. Update configuration in HTML files

### Cloudinary Setup
1. Create Cloudinary account
2. Get API credentials
3. Update upload configuration in `script.js`

## 📊 Admin Features

- **Dashboard**: Overview of all bookings
- **Booking Management**: Approve/reject bookings
- **Calendar Control**: Set availability status
- **Receipt Management**: View uploaded payment receipts
- **Export Functionality**: Export booking records

## 🔒 Security

- Firebase security rules for data protection
- Cloudinary secure uploads
- Form validation and sanitization
- HTTPS recommended for production

## 🌐 Live Demo

The system is designed to be deployed on any web hosting service that supports static files.

## 📞 Support

For support or questions about the booking system, please contact Arriba Homestay.

## 📄 License

This project is proprietary to Arriba Homestay.

---

**Built with ❤️ for Arriba Homestay**
