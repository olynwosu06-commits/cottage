// lumina-cart.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    updateDoc,
    getDoc,
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

// Cart state
let cart = [];
let currentUser = null;

// Format currency
function formatCurrency(amount) {
    return '$' + Number(amount).toFixed(2);
}

// Toggle cart drawer
window.toggleCart = function(e) {
    if (e) e.preventDefault();
    
    const overlay = document.getElementById('dimOverlay');
    const drawer = document.getElementById('cartDrawer');
    
    if (overlay && drawer) {
        overlay.classList.toggle('open');
        drawer.classList.toggle('open');
        
        if (drawer.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
            renderCartItems();
        } else {
            document.body.style.overflow = '';
        }
    }
};

// Close cart drawer
window.closeCart = function() {
    const overlay = document.getElementById('dimOverlay');
    const drawer = document.getElementById('cartDrawer');
    
    if (overlay && drawer) {
        overlay.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    }
};

// Initialize cart
async function initCart() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();
    
    if (currentUser) {
        await syncWithFirestore();
    }
}

// Update cart UI
function updateCartUI() {
    updateCartCount();
    if (isDrawerOpen()) {
        renderCartItems();
    }
}

// Check if drawer is open
function isDrawerOpen() {
    const drawer = document.getElementById('cartDrawer');
    return drawer?.classList.contains('open') || false;
}

// Render cart items
function renderCartItems() {
    const cartBody = document.getElementById('cartBody');
    const cartFoot = document.getElementById('cartFoot');
    const countLabel = document.getElementById('cartCountLabel');
    
    if (!cartBody) return;
    
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    if (countLabel) {
        countLabel.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
    }
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <p>Your cart is empty</p>
                <button onclick="closeCart(); window.location.href='../SHOP_FOLDER/shop.html'" class="btn-to-checkout" style="width: auto; padding: 10px 20px;">
                    Shop Now
                </button>
            </div>
        `;
        if (cartFoot) cartFoot.style.display = 'none';
        return;
    }
    
    // Build cart items HTML
    let itemsHTML = '';
    cart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        itemsHTML += `
            <div class="cart-item" data-index="${index}">
                <img src="${item.imageUrl || 'placeholder.jpg'}" alt="${item.name}" class="cart-item-img" onerror="this.src='placeholder.jpg'">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name || 'Product'}</div>
                    <div class="cart-item-price">${formatCurrency(item.price || 0)}</div>
                    <div class="cart-item-qty">
                        <button class="qty-ctrl" onclick="updateItemQuantity(${index}, -1)">−</button>
                        <span class="qty-num">${item.quantity || 1}</span>
                        <button class="qty-ctrl" onclick="updateItemQuantity(${index}, 1)">+</button>
                        <button class="cart-item-remove" onclick="removeCartItem(${index})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    cartBody.innerHTML = itemsHTML;
    
    // Update footer
    if (cartFoot) {
        cartFoot.style.display = 'block';
        document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal);
        document.getElementById('cartTotal').textContent = formatCurrency(subtotal);
    }
}

// Update item quantity
window.updateItemQuantity = async function(index, change) {
    if (index < 0 || index >= cart.length) return;
    
    let newQty = (cart[index].quantity || 1) + change;
    if (newQty < 1) {
        await removeCartItem(index);
        return;
    }
    if (newQty > 99) newQty = 99;
    
    cart[index].quantity = newQty;
    await saveCart();
    showToast('Cart updated');
};

// Remove cart item
window.removeCartItem = async function(index) {
    if (index < 0 || index >= cart.length) return;
    
    cart.splice(index, 1);
    await saveCart();
    showToast('Item removed');
};

// Save cart
async function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    
    if (currentUser) {
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, { cart });
        } catch (err) {
            console.error("Firestore save failed:", err);
        }
    }
}

// Update cart count badge
function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        countEl.textContent = total;
    }
}

// Sync with Firestore
async function syncWithFirestore() {
    if (!currentUser) return;
    
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const firestoreCart = userDoc.data().cart || [];
            
            if (cart.length > 0 && firestoreCart.length > 0) {
                cart = mergeCarts(cart, firestoreCart);
            } else if (firestoreCart.length > 0) {
                cart = firestoreCart;
            }
            
            await saveCart();
        }
        
        // Real-time listener
        onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
                const newCart = snap.data().cart || [];
                if (JSON.stringify(newCart) !== JSON.stringify(cart)) {
                    cart = newCart;
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartUI();
                }
            }
        });
        
    } catch (err) {
        console.error("Sync failed:", err);
    }
}

// Merge carts
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

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: var(--gold, #d88c9a); color: white; padding: 12px 20px;
        border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// Go to checkout
window.goToCheckout = function() {
    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    window.location.href = '../SHOP_FOLDER/checkout.html';
};

// Add to cart function
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
    showToast(`${name} added to cart!`);
};

// Close on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDrawerOpen()) {
        closeCart();
    }
});

// Initialize cart icon click
function initCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleCart);
        console.log('Cart icon click handler attached');
    } else {
        console.log('Cart icon not found, retrying...');
        setTimeout(initCartIcon, 500);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing cart...');
    initCart();
    initCartIcon();
});

// Auth state listener
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    currentUser = user;
    initCart();
});