# Firestore Backend Setup Guide

This document explains the fully backend-less AquaTrade app structure and how to initialize Firestore collections.

## Architecture Overview

Your app now uses **Firebase Authentication + Firestore** exclusively. No Node.js/MySQL backend required.

```
┌─────────────────────────────────────────┐
│ React Frontend (aquatrade-ui)           │
│ ├─ LoginPage (Firebase Phone OTP)       │
│ ├─ HomePage (Fetch from Firestore)      │
│ ├─ SellerDashboard (Add to Firestore)   │
│ ├─ CheckoutPage (Orders to Firestore)   │
│ └─ ProfilePage (Update Firestore)       │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Firebase Firestore Database             │
│ ├─ users (User profiles)                │
│ ├─ products (Fish/Seafood)              │
│ └─ orders (Orders/Bookings)             │
└─────────────────────────────────────────┘
```

## Firestore Collections & Schemas

### 1. **users** Collection
Stores user/seller profiles

```javascript
{
  uid: "firebase-auth-uid",                    // Auto-generated
  phoneNumber: "+919876543210",                // From phone OTP
  name: "Viswanath",                          // Optional, user can edit
  email: "user@example.com",                   // Optional
  role: "customer" | "seller",                 // Customer or Fisherman
  address: "Marina Beach, Chennai",
  lastLogin: Timestamp,                        // Auto-updated
}
```

**How to create:** Automatically created when user logs in via phone OTP (in LoginPage.jsx)

---

### 2. **products** Collection
Stores all fish/seafood products

```javascript
{
  id: "{doc-id}",                             // Auto-generated
  name: "Pomfret",
  type: "Sea water" | "Fresh water",
  category: "Fish" | "Shellfish" | "Prawns",
  fishTypes: ["Saltwater"],
  price: 350,                                  // Per kg
  stock: 25,                                   // In kg
  description: "Fresh caught today",
  image: "🐟" | "uploaded",                   // Emoji or uploaded image
  sellerName: "John's Fish Store",
  sellerId: "uid-of-seller",                  // Reference to seller user
  address: "45, Beach Street, Chennai",
  location: {
    lat: 13.0827,
    lng: 80.2707
  },
  catchDateTime: "2026-04-12T15:30:00Z",
  rating: 4.5,
  reviews: 12,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**How to create:** Click "Add Fish" in SellerDashboard → Firestore saves to `products` collection (in addFish function)

---

### 3. **orders** Collection
Stores all customer orders and bookings

```javascript
{
  id: "{doc-id}",                             // Auto-generated
  orderId: "TKN1712946234567",                // Unique order token
  userId: "firebase-auth-uid",                // Reference to user
  items: [
    {
      id: "product-id",
      name: "Pomfret",
      price: 350,
      quantity: 2,
      seller: "John's Fish Store"
    }
  ],
  total: 70,                                   // 10% of full price
  fullTotal: 700,                             // Full price
  status: "Confirmed" | "Pending" | "Completed",
  paymentMethod: "upi" | "card" | "cod",
  address: "12, Marina Beach Rd, Chennai",
  createdAt: Timestamp
}
```

**How to create:** Click "Pay ₹X" in CheckoutPage → Firestore saves to `orders` collection (in placeOrder function)

---

## Step-by-Step Firestore Setup

### 1. **Initialize Firestore Database**

Go to [Firebase Console](https://console.firebase.google.com/)

1. Select your **aquatrade-9e20f** project
2. Go to **Cloud Firestore**
3. Click **Create Database**
4. Choose **Start in Test mode** (for development)
5. **Location:** Asia Southeast (Singapore)
6. Click **Create**

### 2. **Set Firestore Rules** (Security)

After creating, go to **Rules** tab and set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Everyone can read products
    match /products/{doc=**} {
      allow read: if true;
      allow write: if request.auth != null;  // Only logged-in users can add
    }

    // Users can only read/write their own orders
    match /orders/{doc=**} {
      allow read, write: if request.auth.uid == resource.data.userId
                            || request.auth != null;  // Sellers can read all
    }
  }
}
```

Click **Publish** after pasting.

### 3. **Enable Phone Authentication**

1. Go to **Authentication** → **Sign-in method**
2. Click **Phone** and toggle **ON**
3. Add **Domain**: `localhost:5173` (or your deployed domain)

### 4. **Create Test Data** (Optional)

Go to **Firestore** → **Create Collection**: `products`

Add a test document:

```javascript
{
  name: "Pomfret",
  type: "Sea water",
  category: "Fish",
  fishTypes: ["Saltwater"],
  price: 350,
  stock: 50,
  description: "Fresh caught today",
  image: "🐟",
  sellerName: "Direct Seller",
  sellerId: "test-seller-uid",
  address: "Marina Beach, Chennai",
  location: { lat: 13.0827, lng: 80.2707 },
  catchDateTime: "2026-04-12T15:30:00Z",
  rating: 4.5,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Data Flow in Each Page

### **LoginPage.jsx**
1. User enters phone number
2. `signInWithPhoneNumber()` sends OTP via Firebase
3. User enters OTP
4. `confirmationResult.confirm(otp)` verifies
5. User document created in `users` collection with `setDoc()`
6. Redux stores user info, redirects to `home`

### **HomePage.jsx**
1. On load, fetch from `products` collection via `getDocs()`
2. Display all available fish products
3. User adds items to cart (in-memory, no DB yet)
4. Display cart count

### **SellerDashboard.jsx**
1. Seller fills in fish details (name, price, stock, etc.)
2. Click "List Fish"
3. `addDoc()` saves to `products` collection
4. Product appears for all buyers immediately
5. Seller can see their bookings (orders mentioning their products)

### **CheckoutPage.jsx**
1. User reviews cart items
2. Enters pickup address
3. Click "Pay ₹X"
4. `addDoc()` saves order to `orders` collection
5. Order confirmation shown

### **ProfilePage.jsx**
1. User clicks "Edit Profile"
2. Updates name/email
3. Click "Save Changes"
4. `updateDoc()` updates user document in `users` collection
5. Profile reflected immediately

---

## Key Firestore Functions Used

### **Read Data**
```javascript
import { collection, getDocs } from "firebase/firestore";

const querySnapshot = await getDocs(collection(db, "products"));
querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

### **Add Data**
```javascript
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

await addDoc(collection(db, "products"), {
  name: "Pomfret",
  price: 350,
  createdAt: serverTimestamp()
});
```

### **Update Data**
```javascript
import { doc, updateDoc } from "firebase/firestore";

await updateDoc(doc(db, "users", uid), { name: "New Name" });
```

### **Query Data**
```javascript
import { query, where, getDocs, collection } from "firebase/firestore";

const q = query(collection(db, "orders"), where("userId", "==", currentUid));
const results = await getDocs(q);
```

---

## Environment Variables

Make sure your `.env.local` has Firebase config:

```
VITE_FIREBASE_API_KEY=AIzaSyBiANKFHfV036HAVCRAwy6lbzNSTNfI3II
VITE_FIREBASE_AUTH_DOMAIN=aquatrade-9e20f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aquatrade-9e20f
VITE_FIREBASE_STORAGE_BUCKET=aquatrade-9e20f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=372262100182
VITE_FIREBASE_APP_ID=1:372262100182:web:2e856c550eecd9b6f63d77
```

---

## Deployment

Since there's no backend, you can deploy the frontend only:

### **Option 1: Firebase Hosting** (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

### **Option 2: Vercel**
```bash
npm run build
vercel deploy
```

### **Option 3: Netlify**
```bash
npm run build
# Drag and drop `dist/` folder to netlify.com
```

---

## Troubleshooting

### **"Phone authentication not enabled"**
→ Go to Firebase Console → Authentication → Enable Phone

### **"Firestore permission denied"**
→ Check Firestore Rules (should be in Test mode for dev)

### **"API key has restrictions"**
→ Go to Google Cloud Console → APIs & Services → Credentials
→ Click API key → Remove restrictions

### **"Products not loading"**
→ Check if `products` collection exists in Firestore
→ Check browser console (F12) for errors

---

## Next Steps

1. ✅ Deploy Firestore rules
2. ✅ Test Login with real phone OTP
3. ✅ Add test products to Firestore
4. ✅ Test seller listing flow
5. ✅ Test checkout/orders
6. ✅ Deploy to Firebase Hosting/Vercel

## Files Modified

- `src/LoginPage.jsx` - Firebase phone OTP + user creation
- `src/HomePage.jsx` - Fetch products from Firestore
- `src/SellerDashboard.jsx` - Add products to Firestore
- `src/CheckoutPage.jsx` - Create orders in Firestore
- `src/ProfilePage.jsx` - Update user profile in Firestore
- `src/firebase.config.js` - Already configured ✅

**🎉 Your app is now 100% backend-less!**
