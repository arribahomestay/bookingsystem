# Firebase Authentication Setup Guide

## Step 1: Enable Authentication in Firebase Console

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `booking-47007`

2. **Navigate to Authentication**
   - In the left sidebar, click on "Authentication"
   - Click on "Get started" if you haven't enabled it yet

3. **Go to Sign-in method tab**
   - Click on "Sign-in method" tab
   - You'll see a list of sign-in providers

## Step 2: Enable Google Sign-in Provider

1. **Enable Google Provider**
   - Click on "Google" from the list of providers
   - Toggle the "Enable" switch to ON
   - Set a "Project support email" (use your Gmail address)
   - Click "Save"

2. **Configure OAuth Consent Screen (if needed)**
   - If prompted, configure the OAuth consent screen
   - Add your app name: "Arriba Homestay Admin"
   - Add your email as the developer contact
   - Save the configuration

## Step 3: Get Firebase Auth Configuration

1. **Get Web App Configuration**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click on your web app (or create one if needed)
   - Copy the Firebase configuration object

2. **Your Current Configuration**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyCgr15-PAggrpDfczz_KS3dXgENdnIWK4w",
     authDomain: "booking-47007.firebaseapp.com",
     projectId: "booking-47007",
     storageBucket: "booking-47007.firebasestorage.app",
     messagingSenderId: "941466249313",
     appId: "1:941466249313:web:55719f70aaadae8d252220",
     measurementId: "G-B9RG31V3CM"
   };
   ```

## Step 4: Authorized Domains

1. **Add Authorized Domains**
   - In Authentication > Settings > Authorized domains
   - Add your domains:
     - `localhost` (for development)
     - `127.0.0.1` (for local development)
     - Your production domain (when you deploy)

## Step 5: Admin User Setup

1. **Add Admin Users**
   - Go to Authentication > Users tab
   - Click "Add user" to manually add admin emails
   - Or use the Google sign-in to automatically add users

2. **Admin Email List**
   - Add your Gmail address as an admin
   - Add any other admin Gmail addresses
   - Current admin emails:
     - `rubibella939@gmail.com`
     - `seguidoej@gmail.com`

## Step 6: Security Rules (Optional)

1. **Set up Firestore Security Rules**
   - Go to Firestore Database > Rules
   - Update rules to allow only authenticated admin users:

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
       
       // Admin-only collections (optional for future use)
       match /admin/{document} {
         allow read, write: if request.auth != null 
           && request.auth.token.email in ['rubibella939@gmail.com', 'seguidoej@gmail.com'];
       }
     }
   }
   ```

## Step 7: Testing

1. **Test Google Sign-in**
   - Open your admin login page
   - Click "Sign in with Google"
   - Complete the Google authentication flow
   - Verify you can access the admin dashboard

## Troubleshooting

### Common Issues:

1. **"This app is not verified"**
   - This is normal for development
   - Click "Advanced" then "Go to [app name] (unsafe)"
   - Or add your domain to Google Cloud Console

2. **"Error 400: redirect_uri_mismatch"**
   - Check authorized domains in Firebase Console
   - Make sure `localhost` and `127.0.0.1` are added

3. **"Access blocked"**
   - Check OAuth consent screen configuration
   - Make sure your email is added as a test user

### Required Firebase SDK Imports:

```html
<!-- Firebase Auth SDK -->
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
</script>
```

## Next Steps

After completing this setup:
1. Update the admin login page to use Firebase Auth
2. Test the Google sign-in flow
3. Verify admin access to the dashboard
4. Deploy and test on production domain

---

**Note:** Keep your Firebase configuration secure and never expose sensitive keys in client-side code for production use.
