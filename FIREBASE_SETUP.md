# Firebase Setup Guide for Arriba Homestay

## 🔥 **Step-by-Step Firebase Setup**

### **1. Create Firebase Project**
1. **Go to** [Firebase Console](https://console.firebase.google.com/)
2. **Click "Create a project"**
3. **Enter project name**: `arriba-homestay`
4. **Enable Google Analytics** (optional)
5. **Click "Create project"**

### **2. Enable Firestore Database**
1. **In Firebase Console**, click **"Firestore Database"**
2. **Click "Create database"**
3. **Choose "Start in test mode"** (for development)
4. **Select location**: `asia-southeast1` (Singapore) - closest to Philippines
5. **Click "Done"**

### **3. Get Firebase Configuration**
1. **Click the gear icon** → **Project settings**
2. **Scroll down to "Your apps"**
3. **Click "Web" icon** (`</>`)
4. **Enter app nickname**: `arriba-homestay-web`
5. **Click "Register app"**
6. **Copy the configuration object**

### **4. Update Your Code**
Replace the placeholder configuration in `index.html`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "arriba-homestay.firebaseapp.com",
    projectId: "arriba-homestay",
    storageBucket: "arriba-homestay.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### **5. Set Up Firestore Collections**
Firebase will automatically create collections when you first add data, but you can manually create them:

#### **Collections Structure:**
- **`bookings`** - Customer bookings
- **`availability`** - Calendar availability

#### **Bookings Document Structure:**
```javascript
{
    customerName: "John Doe",
    phoneNumber: "09123456789",
    email: "john@example.com",
    checkIn: "2025-10-23",
    checkOut: "2025-10-24",
    guests: 2,
    extraBeds: 0,
    totalAmount: 3300.00,
    status: "pending",
    receiptUrl: "https://res.cloudinary.com/...",
    createdAt: Timestamp,
    updatedAt: Timestamp
}
```

#### **Availability Document Structure:**
```javascript
{
    date: "2025-10-23",
    is_available: true,
    createdAt: Timestamp,
    updatedAt: Timestamp
}
```

### **6. Configure Security Rules**
1. **Go to Firestore Database** → **Rules**
2. **Replace the rules** with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to bookings collection
    match /bookings/{document} {
      allow read, write: if true;
    }
    
    // Allow read/write access to availability collection
    match /availability/{document} {
      allow read, write: if true;
    }
  }
}
```

3. **Click "Publish"**

### **7. Test the Integration**
1. **Open your booking form** (`index.html`)
2. **Fill out and submit a booking**
3. **Check Firebase Console** → **Firestore Database**
4. **Verify the booking appears** in the `bookings` collection

## 🎯 **Expected Results**

### **After Setup:**
- ✅ **Firebase project created**
- ✅ **Firestore database enabled**
- ✅ **Configuration updated in code**
- ✅ **Security rules configured**
- ✅ **Booking form submits to Firebase**
- ✅ **Admin dashboard loads from Firebase**

### **Firebase Console Verification:**
1. **Go to Firestore Database**
2. **Click on `bookings` collection**
3. **See your test booking** with all fields
4. **Check `availability` collection** (if created)

## 🔧 **Troubleshooting**

### **Common Issues:**
1. **Configuration errors** - Double-check API keys
2. **Security rules** - Ensure rules allow read/write
3. **Network issues** - Firebase is more reliable than Supabase
4. **CORS issues** - Firebase handles CORS automatically

### **Debug Steps:**
1. **Check browser console** for Firebase errors
2. **Verify configuration** matches Firebase Console
3. **Check Firestore rules** are published
4. **Test with simple data** first

## 🚀 **Benefits of Firebase**

### **Reliability:**
- ✅ **Better network connectivity**
- ✅ **Google's infrastructure**
- ✅ **Automatic scaling**
- ✅ **Real-time updates**

### **Features:**
- ✅ **Real-time database**
- ✅ **Authentication** (for future use)
- ✅ **Storage** (for future use)
- ✅ **Analytics** (for future use)

## 📞 **Next Steps**

1. **Create Firebase project**
2. **Enable Firestore**
3. **Get configuration**
4. **Update code**
5. **Test booking submission**
6. **Verify in Firebase Console**

**Firebase is much more reliable than Supabase and should work without network issues!** 🎉
