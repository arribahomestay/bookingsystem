# Firebase Reviews Setup - Fix Permission Errors

## 🔥 **Quick Fix for Review Permission Errors**

The error "Missing or insufficient permissions" means Firebase security rules don't allow access to the `reviews` collection. Here's how to fix it:

### **Step 1: Update Firebase Security Rules**

1. **Go to** [Firebase Console](https://console.firebase.google.com/)
2. **Select your project**: `booking-47007`
3. **Click "Firestore Database"** in the left sidebar
4. **Click "Rules"** tab
5. **Replace the existing rules** with this updated version:

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
    
    // Allow read/write access to reviews collection
    match /reviews/{document} {
      allow read, write: if true;
    }
  }
}
```

6. **Click "Publish"** to save the rules

### **Step 2: Create Reviews Collection (Optional)**

Firebase will create the collection automatically when the first review is submitted, but you can create it manually:

1. **In Firestore Database**, click **"Start collection"**
2. **Collection ID**: `reviews`
3. **First document ID**: `sample` (will be deleted later)
4. **Add fields**:
   - `customerName`: "Sample"
   - `reviewText`: "Sample review"
   - `rating`: 5
   - `status`: "approved"
   - `submittedAt`: Current timestamp
5. **Save** the document
6. **Delete** the sample document (right-click → Delete)

### **Step 3: Test Review Submission**

1. **Open** `homepage.html`
2. **Scroll to** the Customer Reviews section
3. **Fill out the review form**:
   - Name: "Test User"
   - Review: "This is a test review"
   - Rating: 5 stars
4. **Click "Submit Review"**
5. **Should see**: "Thank you for your review! It has been submitted for admin approval..."

### **Step 4: Verify in Firebase Console**

1. **Go back to** Firebase Console
2. **Click "Firestore Database"**
3. **Look for** `reviews` collection
4. **Click on it** to see your submitted review
5. **Check the status** field (should be "pending")

## 🔧 **Alternative: More Secure Rules (Recommended for Production)**

If you want more secure rules that still allow reviews:

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
    
    // Allow read/write access to reviews collection
    match /reviews/{document} {
      // Allow anyone to read approved reviews
      allow read: if resource.data.status == "approved";
      
      // Allow anyone to write new reviews (they start as pending)
      allow create: if request.resource.data.status == "pending";
      
      // Only allow updates to change status (for admin approval)
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'approvedAt', 'rejectedAt']);
    }
  }
}
```

## 🎯 **Expected Results After Fix**

### **✅ Review Submission:**
- No more permission errors
- Reviews submit successfully
- Status shows as "pending" in database

### **✅ Admin Approval:**
- Admin can see pending reviews
- Admin can approve/reject reviews
- Approved reviews appear on homepage

### **✅ Public Display:**
- Only approved reviews show on homepage
- Pagination works for multiple reviews
- No permission errors when loading reviews

## 🚨 **If You Still Get Errors**

### **Check These:**
1. **Rules published**: Make sure you clicked "Publish" after updating rules
2. **Correct project**: Ensure you're in the right Firebase project (`booking-47007`)
3. **Collection name**: Verify the collection is named `reviews` (lowercase)
4. **Browser cache**: Try refreshing the page or clearing browser cache

### **Debug Steps:**
1. **Open browser console** (F12)
2. **Try submitting a review**
3. **Check for any error messages**
4. **Look in Firebase Console** → Firestore Database for the review

## 📞 **Need Help?**

If you're still having issues:
1. **Screenshot the error** from browser console
2. **Check Firebase Console** → Rules to verify they're published
3. **Verify you're in the correct project** (`booking-47007`)

The most common issue is forgetting to click "Publish" after updating the security rules! 🎯
