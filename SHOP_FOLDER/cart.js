import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc,
    updateDoc,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB4Hy_sEEH1twq0GDzKi5E1CZD5dVHn4Kk",
    authDomain: "cottage-9fa0c.firebaseapp.com",
    projectId: "cottage-9fa0c",
    storageBucket: "cottage-9fa0c.firebasestorage.app",
    messagingSenderId: "346971937714",
    appId: "1:346971937714:web:0f453c14862de16bede2ab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// CURRENCY FORMATTING (Naira with commas)
// ============================================
function formatNaira(amount) {
    if (!amount && amount !== 0) return '₦0.00';
    return '₦' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ────────────────────────────────────────
//  GLOBAL STATE
// ────────────────────────────────────────
let cart = [];
let currentUser = null;
let hasInitialized = false;

// ────────────────────────────────────────
//  AUTH LISTENER
// ────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User logged in:", user.email);
        currentUser = user;

        if (!hasInitialized) {
            hasInitialized = true;
            await initializeCart(user.uid);
        }

        setupRealtimeCartListener(user.uid);
    } else {
        console.log("No user logged in → using localStorage only");
        currentUser = null;
        hasInitialized = false;
        loadCartFromLocalStorage();
    }
});

// ────────────────────────────────────────
//  INITIAL CART LOAD + MERGE
// ────────────────────────────────────────
async function initializeCart(userId) {
    try {
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];

        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        let finalCart = [];

        if (userDoc.exists()) {
            const firestoreCart = userDoc.data().cart || [];

            if (firestoreCart.length === 0 && localCart.length > 0) {
                console.log("Firestore empty → pushing local cart");
                finalCart = localCart;
                await updateDoc(userDocRef, { cart: finalCart });
            } else if (localCart.length > 0) {
                console.log("Merging local + Firestore");
                finalCart = mergeCarts(localCart, firestoreCart);
                await updateDoc(userDocRef, { cart: finalCart });
            } else {
                finalCart = firestoreCart;
            }
        } else {
            console.log("Creating new user doc with local cart");
            finalCart = localCart;
            await setDoc(userDocRef, { cart: finalCart });
        }

        cart = finalCart;
        localStorage.setItem('cart', JSON.stringify(cart)); // backup
        updateCartCount();
        if (document.getElementById('cartContent')) renderCart();
        console.log("Initial cart ready:", cart);
    } catch (err) {
        console.error("Cart initialization failed:", err);
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        updateCartCount();
    }
}

// Simple merge: prefer higher quantity per product
function mergeCarts(local, remote) {
    const map = new Map();

    [...remote, ...local].forEach(item => {
        const key = item.id;
        if (!map.has(key)) {
            map.set(key, { ...item });
        } else {
            const existing = map.get(key);
            existing.quantity = Math.max(existing.quantity || 1, item.quantity || 1);
        }
    });

    return Array.from(map.values());
}

// ────────────────────────────────────────
//  REAL-TIME LISTENER
// ────────────────────────────────────────
function setupRealtimeCartListener(userId) {
    const userDocRef = doc(db, "users", userId);

    onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
            const newCart = snap.data().cart || [];
            if (JSON.stringify(newCart) !== JSON.stringify(cart)) {
                console.log("Real-time update received:", newCart);
                cart = newCart;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                if (document.getElementById('cartContent')) renderCart();
            }
        }
    }, (err) => {
        console.error("Snapshot error:", err);
    });
}

// ────────────────────────────────────────
//  LOAD FROM LOCALSTORAGE (guest mode fallback)
// ────────────────────────────────────────
function loadCartFromLocalStorage() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCount();
    if (document.getElementById('cartContent')) renderCart();
    console.log("Loaded from localStorage:", cart);
}

// ────────────────────────────────────────
//  SAVE CART (local + Firestore if logged in)
// ────────────────────────────────────────
async function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));

    if (currentUser) {
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, { cart });
            console.log("Cart saved to Firestore");
        } catch (err) {
            console.error("Firestore save failed:", err);
        }
    }

    updateCartCount();
    if (document.getElementById('cartContent')) renderCart();
}

// ────────────────────────────────────────
//  ADD TO CART (used from shop / product detail)
// ────────────────────────────────────────
window.addToCart = function(productId, name, price, imageUrl, category = '') {
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({
            id: productId,
            name,
            price: Number(price) || 0,
            imageUrl: imageUrl || 'placeholder.jpg',
            category,
            quantity: 1
        });
    }

    saveCart();
    showToast(`${name} added to cart! 🛍️`);
};

// ────────────────────────────────────────
//  UPDATE QUANTITY / REMOVE ITEM
// ────────────────────────────────────────
window.updateQuantity = async function(index, change) {
    if (index < 0 || index >= cart.length) return;

    let newQty = (cart[index].quantity || 1) + change;
    if (newQty < 1) {
        await removeItem(index);
        return;
    }
    if (newQty > 99) newQty = 99;

    cart[index].quantity = newQty;
    await saveCart();
    showToast("Quantity updated");
};

window.removeItem = async function(index) {
    if (index < 0 || index >= cart.length) return;

    const itemName = cart[index].name;
    cart.splice(index, 1);
    await saveCart();
    showToast(`${itemName} removed`);
};

// ────────────────────────────────────────
//  CART COUNT BADGE
// ────────────────────────────────────────
function updateCartCount() {
    const el = document.getElementById('cartCount');
    if (el) {
        const total = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
        el.textContent = total || '0';
    }
}

// ────────────────────────────────────────
//  RENDER CART (FIXED with Naira)
// ────────────────────────────────────────
function renderCart() {
    const container = document.getElementById('cartContent');
    if (!container) return; // not on cart page

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class='bx bx-shopping-bag'></i>
                <h2>Your cart is empty</h2>
                <p>Start shopping now!</p>
                <a href="shop.html" class="shop-now-btn">Shop Now</a>
            </div>
        `;
        return;
    }

    const subtotal = cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    const shipping = subtotal > 5000 ? 0 : 1000; // Changed to Naira: Free shipping over ₦5000
    const total = subtotal + shipping;

    container.innerHTML = `
        <div class="cart-items" id="cartItems">
            ${cart.map((item, i) => createCartItemHTML(item, i)).join('')}
        </div>
        <div class="cart-summary">
            <h2>Order Summary</h2>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatNaira(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'Free' : formatNaira(shipping)}</span>
            </div>
            <div class="promo-code">
                <!-- your promo code HTML -->
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>${formatNaira(total)}</span>
            </div>
            <button class="checkout-btn" onclick="checkout()">Proceed to Checkout</button>
            <a href="shop.html" class="continue-shopping">Continue Shopping</a>
        </div>
    `;
}

function createCartItemHTML(item, index) {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    return `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-image">
                <img src="${item.imageUrl}" alt="${item.name}" onerror="this.src='placeholder.jpg'">
            </div>
            <div class="cart-item-details">
                <h3>${item.name || 'Product'}</h3>
                <div class="cart-item-price">${formatNaira(item.price || 0)}</div>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button onclick="updateQuantity(${index}, -1)">−</button>
                    <span>${item.quantity || 1}</span>
                    <button onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeItem(${index})">
                    <i class='bx bx-trash'></i>
                </button>
                <div class="item-subtotal">Subtotal: ${formatNaira(itemTotal)}</div>
            </div>
        </div>
    `;
}

// ────────────────────────────────────────
//  TOAST (FIXED - had a typo 'l')
// ────────────────────────────────────────
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: #4caf50; color: white; padding: 12px 20px;
        border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

// ───────────────────────────────────
//  CHECKOUT
// ────────────────────────────────────────
window.checkout = function() {
    if (cart.length === 0) {
        showToast("Your cart is empty");
        return;
    }
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
};

// Account icon navigation
const accountIcon = document.getElementById('accountIcon');
if (accountIcon) {
    accountIcon.addEventListener('click', ()=>{
        window.location.href = '../HTML/account.html';
    });
}

// Apply promo code function (if you have it)
window.applyPromo = function() {
    // Your promo code logic here
    showToast("Promo code applied!");
};

