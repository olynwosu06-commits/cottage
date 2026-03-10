import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    updateProfile, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyB4Hy_sEEH1twq0GDzKi5E1CZD5dVHn4Kk",
    authDomain: "cottage-9fa0c.firebaseapp.com",
    projectId: "cottage-9fa0c",
    storageBucket: "cottage-9fa0c.firebasestorage.app",
    messagingSenderId: "346971937714",
    appId: "1:346971937714:web:0f453c14862de16bede2ab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("Firebase initialized:", { app, auth, db, storage });

// ========================================
// GLOBAL VARIABLES
// ========================================
let currentUser = null;

// ========================================
// CHECK AUTHENTICATION STATE
// ========================================
onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed:", user ? "Logged in" : "Logged out");
    if (user) {
        console.log("User logged in:", user.email);
        currentUser = user;
        
        // Load all user data including profile picture
        await loadUserData(user);
        await loadProfilePicture(user.uid);
        
        setupRealtimeListeners(user.uid);
        updateUserDisplayOnNavbar();
    } else {
        console.log("No user logged in");
        currentUser = null;
        showGuestView();
    }
});

// ========================================
// SHOW GUEST VIEW
// ========================================
function showGuestView() {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = 'Guest';
    
    const userMessageEl = document.getElementById('userMessage');
    if (userMessageEl) userMessageEl.textContent = 'Sign in to access your dashboard';
    
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = '0';
    
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) wishlistCount.textContent = '0';
    
    const localCart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartTotal = localCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (cartCount) cartCount.textContent = cartTotal;
}

// ========================================
// LOAD USER DATA
// ========================================
async function loadUserData(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            const firstName = userData.name ? userData.name.split(' ')[0] : 
                             (user.displayName ? user.displayName.split(' ')[0] : 'there');
            
            const userNameEl = document.getElementById('userName');
            if (userNameEl) userNameEl.textContent = firstName;
            
            const userEmailEl = document.getElementById('userEmail');
            if (userEmailEl) userEmailEl.textContent = user.email;
            
            setWelcomeMessage();
            
            await loadCartCount(user.uid);
            await loadWishlistCount(user.uid);
            await loadOrders(user.uid);
            
            const localCart = JSON.parse(localStorage.getItem('cart')) || [];
            if (localCart.length > 0) {
                const currentCart = userData.cart || [];
                const mergedCart = [...currentCart];
                localCart.forEach(localItem => {
                    const exists = mergedCart.some(item => item.id === localItem.id);
                    if (!exists) {
                        mergedCart.push(localItem);
                    }
                });
                
                await updateDoc(doc(db, "users", user.uid), {
                    cart: mergedCart
                });
                
                localStorage.removeItem('cart');
            }
            
            localStorage.setItem('userName', firstName);
            
            if (userData.createdAt) {
                const memberDate = new Date(userData.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const memberSinceEl = document.getElementById('memberSince');
                if (memberSinceEl) {
                    memberSinceEl.innerHTML = `<i class='bx bx-calendar'></i> Member since ${memberDate}`;
                }
            }
        } else {
            await createUserDocument(user);
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        showNotification('Error loading user data', 'error');
    }
}

// ========================================
// CREATE USER DOCUMENT
// ========================================
async function createUserDocument(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userData = {
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email,
            phone: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            cart: [],
            wishlist: [],
            orders: [],
            profilePicture: null
        };
        
        await setDoc(userDocRef, userData);
        console.log("User document created");
        await loadUserData(user);
    } catch (error) {
        console.error("Error creating user document:", error);
    }
}

// ========================================
// SETUP REAL-TIME LISTENERS
// ========================================
function setupRealtimeListeners(userId) {
    const userDocRef = doc(db, "users", userId);
    
    onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            const userData = doc.data();
            
            const cart = userData.cart || [];
            const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const cartCountEl = document.getElementById('cartCount');
            if (cartCountEl) cartCountEl.textContent = cartCount;
            
            const wishlist = userData.wishlist || [];
            const wishlistCountEl = document.getElementById('wishlistCount');
            if (wishlistCountEl) wishlistCountEl.textContent = wishlist.length;
            
            const navbarCartCount = document.getElementById('cartCount');
            if (navbarCartCount) navbarCartCount.textContent = cartCount;
            
            if (userData.profilePicture) {
                updateProfilePictureUI(userData.profilePicture);
                localStorage.setItem('userProfilePic', userData.profilePicture);
            }
        }
    });
    
    const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("orderDate", "desc"),
        limit(5)
    );
    
    onSnapshot(ordersQuery, (snapshot) => {
        if (!snapshot.empty) {
            updateOrdersTable(snapshot.docs);
        }
    });
}

// ========================================
// SET WELCOME MESSAGE
// ========================================
function setWelcomeMessage() {
    const hour = new Date().getHours();
    let message = '';
    
    if (hour < 12) {
        message = 'Good morning! Ready to discover something new?';
    } else if (hour < 18) {
        message = 'Good afternoon! Your skin deserves some love.';
    } else {
        message = 'Good evening! Time for some self-care.';
    }
    
    const userMessageEl = document.getElementById('userMessage');
    if (userMessageEl) userMessageEl.textContent = message;
}

// ========================================
// LOAD CART COUNT
// ========================================
async function loadCartCount(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const cart = userDoc.data().cart || [];
            const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            
            const cartCountEl = document.getElementById('cartCount');
            if (cartCountEl) cartCountEl.textContent = cartCount;
        }
    } catch (error) {
        console.error("Error loading cart:", error);
    }
}

// ========================================
// LOAD WISHLIST COUNT
// ========================================
async function loadWishlistCount(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const wishlist = userDoc.data().wishlist || [];
            const wishlistCountEl = document.getElementById('wishlistCount');
            if (wishlistCountEl) wishlistCountEl.textContent = wishlist.length;
        }
    } catch (error) {
        console.error("Error loading wishlist:", error);
    }
}

// ========================================
// LOAD ORDERS
// ========================================
async function loadOrders(userId) {
    try {
        const countQuery = query(
            collection(db, "orders"),
            where("userId", "==", userId)
        );
        
        const countSnapshot = await getDocs(countQuery);
        const totalOrders = countSnapshot.size;
        
        const orderCountEl = document.getElementById('orderCount');
        if (orderCountEl) orderCountEl.textContent = totalOrders;
        
        const ordersQuery = query(
            collection(db, "orders"),
            where("userId", "==", userId),
            orderBy("orderDate", "desc"),
            limit(5)
        );
        
        const querySnapshot = await getDocs(ordersQuery);
        const ordersTableBody = document.getElementById('ordersTableBody');
        
        if (querySnapshot.empty) {
            if (ordersTableBody) {
                ordersTableBody.innerHTML = 
                    '<tr><td colspan="4" style="text-align: center; color: #c47a7a;">No orders yet</td></tr>';
            }
            return;
        }

        updateOrdersTable(querySnapshot.docs);
        
    } catch (error) {
        console.error("Error loading orders:", error);
    }
}

// ========================================
// UPDATE ORDERS TABLE
// ========================================
function updateOrdersTable(orderDocs) {
    let html = '';
    let orderCount = 0;
    const ordersTableBody = document.getElementById('ordersTableBody');
    const orderCountEl = document.getElementById('orderCount');

    orderDocs.forEach(doc => {
        orderCount++;
        const order = doc.data();
        const date = new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        let statusClass = 'processing';
        let statusText = order.paymentStatus || 'processing';
        
        if (order.paymentStatus === 'success' || order.paymentStatus === 'delivered') {
            statusClass = 'delivered';
            statusText = 'Delivered';
        } else if (order.paymentStatus === 'pending') {
            statusClass = 'pending';
            statusText = 'Pending';
        }
        
        html += `
            <tr>
                <td>#${order.paymentReference?.substring(0, 8) || doc.id.substring(0, 8)}</td>
                <td>${date}</td>
                <td>₦${order.total?.toLocaleString() || '0.00'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    });

    if (ordersTableBody) ordersTableBody.innerHTML = html;
    if (orderCountEl) orderCountEl.textContent = orderCount;
}

// ========================================
// EDIT PROFILE FUNCTION
// ========================================
window.editProfile = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Please login to edit profile', 'warning');
            return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            const editName = document.getElementById('editName');
            const editPhone = document.getElementById('editPhone');
            const editEmail = document.getElementById('editEmail');
            
            if (editName) editName.value = userData.name || '';
            if (editPhone) editPhone.value = userData.phone || '';
            if (editEmail) editEmail.value = user.email || '';
            
            const modal = document.getElementById('editProfileModal');
            if (modal) modal.style.display = 'block';
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        showNotification('Error loading profile', 'error');
    }
};

// ========================================
// CLOSE MODAL FUNCTION
// ========================================
window.closeEditModal = function() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'none';
};

// ========================================
// HANDLE PROFILE FORM SUBMISSION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized');
    
    const addToCart = document.getElementById('addToCart');
    if (addToCart) {
        addToCart.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = './cart.html';
        });
    }
    
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const user = auth.currentUser;
            if (!user) return;
            
            const newName = document.getElementById('editName').value.trim();
            const newPhone = document.getElementById('editPhone').value.trim();
            
            const submitBtn = editForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;
            
            try {
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, {
                    name: newName,
                    phone: newPhone,
                    updatedAt: new Date().toISOString()
                });
                
                if (user.displayName !== newName) {
                    await updateProfile(user, {
                        displayName: newName
                    });
                }
                
                const firstName = newName.split(' ')[0];
                const userNameEl = document.getElementById('userName');
                if (userNameEl) userNameEl.textContent = firstName;
                
                localStorage.setItem('userName', firstName);
                
                window.closeEditModal();
                showNotification('Profile updated successfully!', 'success');
                
            } catch (error) {
                console.error("Error updating profile:", error);
                showNotification('Error updating profile', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    setupProfilePictureHandlers();
    
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    
    if (closeBtn) closeBtn.addEventListener('click', window.closeEditModal);
    if (cancelBtn) cancelBtn.addEventListener('click', window.closeEditModal);
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('editProfileModal');
        if (e.target === modal) {
            window.closeEditModal();
        }
    });
});

// ========================================
// PROFILE PICTURE FUNCTIONS
// ========================================

function setupProfilePictureHandlers() {
    const profileWrapper = document.getElementById('profilePictureWrapper');
    if (profileWrapper) {
        profileWrapper.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.openProfilePictureModal();
        });
        console.log("Click handler added to profile wrapper");
    }

    const fileInput = document.getElementById('profileFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', window.handleFileSelect);
    }

    window.addEventListener('click', function(e) {
        const modal = document.getElementById('profilePicModal');
        if (e.target === modal) {
            closeProfilePictureModal();
        }
    });
}

window.openProfilePictureModal = function() {
    console.log("Opening profile modal");
    const modal = document.getElementById('profilePicModal');
    if (modal) {
        const preview = document.getElementById('profilePreview');
        const currentPic = localStorage.getItem('userProfilePic');
        
        if (currentPic) {
            preview.src = currentPic;
        } else {
            preview.src = '../IMAGES/default-avatar.svg';
        }
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
};

window.closeProfilePictureModal = function() {
    const modal = document.getElementById('profilePicModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};

window.handleFileSelect = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log("File selected:", file.name, file.type, file.size);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('profilePreview');
        if (preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    uploadProfilePicture(file);
};

// MAIN UPLOAD FUNCTION - THIS IS THE CORRECT ONE
async function uploadProfilePicture(file) {
    console.log("========== UPLOAD STARTED ==========");
    console.log("File:", file.name, file.type, (file.size/1024/1024).toFixed(2) + "MB");
    
    if (!currentUser) {
        console.error("No current user");
        showNotification('Please login to upload', 'error');
        return;
    }

    if (!file.type.startsWith('image/')) {
        console.error("Invalid file type:", file.type);
        showNotification('Please select an image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        console.error("File too large:", file.size);
        showNotification('File must be less than 5MB', 'error');
        return;
    }

    try {
        // Show progress indicator (starts at 0%)
        showUploadProgress();

        console.log("Storage object:", storage ? "OK" : "UNDEFINED");
        
        const fileExtension = file.name.split('.').pop();
        const fileName = `profile_${currentUser.uid}_${Date.now()}.${fileExtension}`;
        console.log("Filename:", fileName);
        
        const storageRef = ref(storage, `profile-pictures/${fileName}`);
        console.log("Storage ref created:", storageRef);

        console.log("Starting upload to Firebase Storage...");
        
        // THIS IS THE ACTUAL UPLOAD - it will take time
        const snapshot = await uploadBytes(storageRef, file);
        
        // Once we get here, upload is 100% complete
        console.log("Upload completed successfully!");
        
        console.log("Getting download URL...");
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Download URL obtained:", downloadURL);

        console.log("Saving to Firestore...");
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, {
            profilePicture: downloadURL,
            updatedAt: new Date().toISOString()
        });
        console.log("Firestore update successful");

        console.log("Updating Auth profile...");
        await updateProfile(currentUser, {
            photoURL: downloadURL
        });
        console.log("Auth profile updated");

        // Save to localStorage
        localStorage.setItem('userProfilePic', downloadURL);
        console.log("LocalStorage updated");

        // Update UI
        updateProfilePictureUI(downloadURL);
        console.log("UI updated");
        
        // Hide progress with success
        hideUploadProgress(true);
        showNotification('Profile picture updated!', 'success');
        
        setTimeout(() => {
            closeProfilePictureModal();
        }, 1500);

        console.log("========== UPLOAD COMPLETED ==========");

    } catch (error) {
        console.error("========== UPLOAD ERROR ==========");
        console.error("Error:", error);
        
        // Hide progress with error
        hideUploadProgress(false);
        showNotification('Error uploading: ' + error.message, 'error');
    }
}

window.removeProfilePicture = async function() {
    if (!currentUser) return;

    if (!confirm('Remove profile picture?')) return;

    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, {
            profilePicture: null
        });

        await updateProfile(currentUser, {
            photoURL: null
        });

        localStorage.removeItem('userProfilePic');
        updateProfilePictureUI(null);
        
        const preview = document.getElementById('profilePreview');
        if (preview) preview.src = '../IMAGES/default-avatar.svg';
        
        showNotification('Profile picture removed', 'success');
        closeProfilePictureModal();

    } catch (error) {
        console.error("Error removing:", error);
        showNotification('Error removing picture', 'error');
    }
};

function updateProfilePictureUI(imageUrl) {
    console.log("Updating UI with image:", imageUrl);
    
    const defaultIcon = document.getElementById('profileIconDefault');
    const profileImg = document.getElementById('profileImg');
    
    if (!defaultIcon || !profileImg) {
        console.log("Profile elements not found");
        return;
    }
    
    if (imageUrl) {
        defaultIcon.style.display = 'none';
        profileImg.src = imageUrl;
        profileImg.style.display = 'block';
        console.log("Showing profile image");
    } else {
        defaultIcon.style.display = 'block';
        profileImg.style.display = 'none';
        console.log("Showing default icon");
    }
}

async function loadProfilePicture(userId) {
    console.log("Loading profile picture for user:", userId);
    
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data from Firestore:", userData);
            
            if (userData.profilePicture) {
                console.log("Found profile picture in Firestore:", userData.profilePicture);
                updateProfilePictureUI(userData.profilePicture);
                localStorage.setItem('userProfilePic', userData.profilePicture);
            } else {
                console.log("No profile picture in Firestore");
                const localPic = localStorage.getItem('userProfilePic');
                if (localPic) {
                    console.log("Found in localStorage:", localPic);
                    updateProfilePictureUI(localPic);
                } else {
                    updateProfilePictureUI(null);
                }
            }
        } else {
            console.log("User document not found");
        }
    } catch (error) {
        console.error("Error loading profile picture:", error);
    }
}

// Show upload progress - IMPROVED VERSION (NO FAKE PROGRESS)
function showUploadProgress() {
    const existing = document.getElementById('uploadProgress');
    if (existing) existing.remove();
    
    const progressDiv = document.createElement('div');
    progressDiv.id = 'uploadProgress';
    progressDiv.className = 'upload-progress';
    progressDiv.innerHTML = `
        <div class="upload-progress-content">
            <p>Uploading... <span class="upload-status">Preparing...</span></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <p class="upload-message">Please wait...</p>
        </div>
    `;
    document.body.appendChild(progressDiv);
    
    // Don't start any fake progress - let the actual upload complete
    // We'll update to 100% only when upload is done
}

// Hide upload progress and show result
function hideUploadProgress(success = true) {
    const progressDiv = document.getElementById('uploadProgress');
    if (!progressDiv) return;
    
    const fill = progressDiv.querySelector('.progress-fill');
    const status = progressDiv.querySelector('.upload-status');
    const message = progressDiv.querySelector('.upload-message');
    
    if (success) {
        // Show success
        if (fill) fill.style.width = '100%';
        if (status) status.textContent = '100%';
        if (message) message.textContent = 'Upload complete!';
        
        // Remove after showing success
        setTimeout(() => {
            progressDiv.remove();
        }, 1000);
    } else {
        // Show error
        if (message) message.textContent = 'Upload failed!';
        progressDiv.style.background = '#ffebee';
        if (fill) fill.style.backgroundColor = '#f44336';
        setTimeout(() => {
            progressDiv.remove();
        }, 2000);
    }
}

// ========================================
// TEST FIREBASE STORAGE
// ========================================
window.testFirebaseStorage = async function() {
    console.log("========== TESTING FIREBASE STORAGE ==========");
    
    try {
        if (!storage) {
            alert("Storage not initialized!");
            return;
        }
        
        const testRef = ref(storage, 'test-file.txt');
        console.log("Test reference created:", testRef);
        
        const testData = new Blob(['test'], { type: 'text/plain' });
        console.log("Test data created, size:", testData.size);
        
        console.log("Attempting test upload...");
        const result = await uploadBytes(testRef, testData);
        console.log("Test upload successful:", result);
        
        const url = await getDownloadURL(testRef);
        console.log("Download URL obtained:", url);
        
        await deleteObject(testRef);
        console.log("Test file cleaned up");
        
        alert("✅ Firebase Storage is working correctly!");
        
    } catch (error) {
        console.error("❌ Firebase Storage test failed:", error);
        alert("❌ Firebase Storage test failed: " + error.message);
    }
};

// ========================================
// VIEW ORDERS FUNCTION
// ========================================
window.viewOrders = () => {
    window.location.href = '../HTML/order.html';
};

window.viewAllOrders = () => {
    window.location.href = '../HTML/order.html';
};

// ========================================
// LOGOUT FUNCTION
// ========================================
window.logout = async () => {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await signOut(auth);
            localStorage.removeItem('userName');
            localStorage.removeItem('userProfilePic');
            localStorage.removeItem('cart');
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '../HTML/account.html';
            }, 1000);
        } catch (error) {
            console.error("Logout error:", error);
            showNotification('Error logging out', 'error');
        }
    }
};

// ========================================
// UPDATE NAVBAR WITH USER NAME
// ========================================
function updateUserDisplayOnNavbar() {
    const userName = localStorage.getItem('userName');
    const userCartSpan = document.querySelector('.user-cart span:nth-child(2)');
    
    if (userName && userCartSpan) {
        userCartSpan.innerHTML = `Hi, <span style="color: #c47a7a; font-weight: 600;">${userName}</span>`;
    }
}

// ========================================
// SHOW NOTIFICATION FUNCTION
// ========================================
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#c47a7a'
    };
    
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${colors[type]};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: 'Poppins', sans-serif;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// ADD NOTIFICATION STYLES
// ========================================
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
    
    .notification {
        transition: opacity 0.3s ease;
    }
    
    .upload-progress {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 20000;
        min-width: 320px;
        text-align: center;
        animation: fadeIn 0.3s ease;
    }
    
    .upload-progress-content p {
        margin: 0 0 15px 0;
        color: #333;
        font-weight: 500;
        font-size: 16px;
    }
    
    .upload-status {
        color: #c47a7a;
        font-weight: 600;
    }
    
    .upload-message {
        margin-top: 15px !important;
        font-size: 14px !important;
        color: #666 !important;
        font-weight: normal !important;
    }
    
    .progress-bar {
        width: 100%;
        height: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        margin: 10px 0;
    }
    
    .progress-fill {
        height: 100%;
        background: #c47a7a;
        transition: width 0.3s ease;
        border-radius: 4px;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

// ========================================
// UPDATE USER DISPLAY
// ========================================
function updateUserDisplay() {
    const userName = localStorage.getItem('userName');
    const userCartSpan = document.querySelector('.user-cart span:nth-child(2)');
    
    if (userName && userCartSpan) {
        userCartSpan.innerHTML = `Hi, <span style="color: #8424e3; font-weight: 600;">${userName}</span>`;
    }
}

document.addEventListener('DOMContentLoaded', updateUserDisplay);

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) updateUserDisplay();
});

window.addEventListener('storage', function(e) {
    if (e.key === 'userName') updateUserDisplay();
});

window.checkFirestoreProfile = async function() {
    if (!currentUser) {
        console.log("No user logged in");
        alert("No user logged in");
        return;
    }
    
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            console.log("Firestore user data:", userDoc.data());
            const profilePic = userDoc.data().profilePicture;
            if (profilePic) {
                console.log("Profile picture URL:", profilePic);
                alert("Profile picture found in Firestore! Check console for URL");
            } else {
                console.log("No profile picture in Firestore");
                alert("No profile picture in Firestore");
            }
        } else {
            console.log("User document not found");
            alert("User document not found");
        }
    } catch (error) {
        console.error("Error checking Firestore:", error);
        alert("Error checking Firestore: " + error.message);
    }
};