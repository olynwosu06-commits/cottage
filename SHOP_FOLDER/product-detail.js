import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB4Hy_sEEH1twq0GDzKi5E1CZD5dVHn4Kk",
    authDomain: "cottage-9fa0c.firebaseapp.com",
    projectId: "cottage-9fa0c",
    storageBucket: "cottage-9fa0c.firebasestorage.app",
    messagingSenderId: "346971937714",
    appId: "1:346971937714:web:0f453c14862de16bede2ab"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Track authentication state
let currentUser = null;

// Monitor auth state
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    console.log("Auth state changed. User logged in:", !!user);
    
    // Check for pending purchase after login
    if (user) {
        checkPendingPurchase();
    }
});

// Check if user is logged in
function isUserLoggedIn() {
    return currentUser !== null;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Get product from localStorage
function getSelectedProduct() {
    const productJson = localStorage.getItem('selectedProduct');
    if (!productJson) return null;
    try {
        return JSON.parse(productJson);
    } catch {
        return null;
    }
}

// Check for pending purchase after login
function checkPendingPurchase() {
    const pendingPurchase = sessionStorage.getItem('pendingPurchase');
    if (pendingPurchase && isUserLoggedIn()) {
        const purchase = JSON.parse(pendingPurchase);
        
        if (purchase.action === 'addToCart') {
            addToCart(purchase.product, purchase.quantity, true);
            showToast({
                type: 'success',
                title: 'Welcome Back!',
                message: 'Item has been added to your cart',
                duration: 3000
            });
        } else if (purchase.action === 'buyNow') {
            addToCart(purchase.product, purchase.quantity, true);
            showToast({
                type: 'success',
                title: 'Welcome Back!',
                message: 'Redirecting to checkout...',
                duration: 2000
            });
            setTimeout(() => {
                window.location.href = 'checkout.html';
            }, 2000);
        }
        
        sessionStorage.removeItem('pendingPurchase');
        sessionStorage.removeItem('redirectAfterLogin');
    }
}

// Load product details
async function loadProductDetail() {
    const productDetail = document.getElementById('productDetail');
    const selectedProduct = getSelectedProduct();

    if (!selectedProduct || !selectedProduct.id) {
        productDetail.innerHTML = `
            <div class="error">
                <i class='bx bx-error-circle'></i>
                <h2>No Product Selected</h2>
                <p>Please select a product from the shop.</p>
                <a href="shop.html" class="primary-btn">Go to Shop</a>
            </div>
        `;
        return;
    }

    productDetail.innerHTML = `
    <div class="product-loader-container bottle-loader">
        <div class="bottle">
            <div class="bottle-liquid"></div>
            <div class="bottle-cap"></div>
            <div class="bottle-label">
                <div class="label-shine"></div>
            </div>
        </div>
        <div class="bubbles">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>
        <p class="bottle-text">Preparing your product</p>
    </div>
`;

    try {
        // Get latest data from Firestore
        const docRef = doc(db, "products", selectedProduct.id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error("Product not found");
        }

        const product = { id: docSnap.id, ...docSnap.data() };
        
        // Get category display name
        let categoryDisplay = product.category || 'uncategorized';
        const displayNames = {
            'bath': 'Bath & Body',
            'serum': 'Serum',
            'face': 'Face',
            'baby': 'Baby Skin',
            'skincare': 'Skincare',
            'bodyOil': 'Body Oil'
        };
        categoryDisplay = displayNames[categoryDisplay] || categoryDisplay;

        // Generate random rating (for demo)
        const rating = (4 + Math.random()).toFixed(1);
        const reviewCount = Math.floor(Math.random() * 50) + 10;

        productDetail.innerHTML = `
            <div class="product-images">
                <img src="${product.imageUrl}" alt="${product.name}" class="main-image" onerror="this.src='https://via.placeholder.com/500x500?text=Image+Not+Found'">
                <span class="badge">New Arrival</span>
            </div>
            <div class="product-info">
                <span class="product-category">${categoryDisplay}</span>
                <h1 class="product-name">${product.name}</h1>
                <div class="product-price">₦${product.price ? product.price.toLocaleString() : '0.00'}</div>
                
                <div class="product-rating">
                    <div class="stars">
                        ${getStarRating(rating)}
                    </div>
                    <span class="rating-count">${rating} (${reviewCount} reviews)</span>
                </div>

                <div class="product-description">
                    <h3>Description</h3>
                    <p>${product.description || 'No description available.'}</p>
                    
                    <ul class="product-highlights">
                        <li><i class='bx bx-check-circle'></i> 100% Authentic Product</li>
                        <li><i class='bx bx-check-circle'></i> Free Shipping on orders over ₦50,000</li>
                        <li><i class='bx bx-check-circle'></i> Secure Payment</li>
                        <li><i class='bx bx-check-circle'></i> 30-Day Money Back Guarantee</li>
                    </ul>
                </div>

                <div class="quantity-selector">
                    <span class="quantity-label">Quantity:</span>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(-1)">−</button>
                        <input type="text" class="quantity-input" id="quantity" value="1" readonly>
                        <button class="quantity-btn" onclick="updateQuantity(1)">+</button>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="add-to-cart-btn" onclick="handleAddToCartFromDetail()">
                        <i class='bx bx-cart-alt'></i>
                        Add to Cart
                    </button>
                    <button class="buy-now-btn" onclick="handleBuyNow()">
                        <i class='bx bx-flash'></i>
                        Buy Now
                    </button>
                    <button class="wishlist-btn" onclick="handleAddToWishlist()">
                        <i class='bx bx-heart'></i>
                    </button>
                </div>

                <div class="product-meta">
                    <div class="meta-item">
                        <i class='bx bx-package'></i>
                        <span>SKU:</span> COTTAGE-${product.id.substring(0, 8)}
                    </div>
                    <div class="meta-item">
                        <i class='bx bx-time'></i>
                        <span>Availability:</span> In Stock
                    </div>
                    <div class="meta-item">
                        <i class='bx bx-store'></i>
                        <span>Category:</span> ${categoryDisplay}
                    </div>
                </div>
            </div>
        `;

        // Load related products
        loadRelatedProducts(product.category, product.id);

    } catch (error) {
        console.error("Error loading product:", error);
        productDetail.innerHTML = `
            <div class="error">
                <i class='bx bx-error-circle'></i>
                <h2>Error Loading Product</h2>
                <p>${error.message}</p>
                <a href="shop.html" class="primary-btn">Go to Shop</a>
            </div>
        `;
    }
}

// Helper function to generate star rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="bx bxs-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="bx bxs-star-half"></i>';
        } else {
            stars += '<i class="bx bx-star"></i>';
        }
    }
    return stars;
}

// Load related products
async function loadRelatedProducts(category, currentProductId) {
    const relatedGrid = document.getElementById('relatedGrid');
    
    try {
        let productsQuery;
        if (category) {
            productsQuery = query(
                collection(db, "products"),
                where("category", "==", category),
                limit(4)
            );
        } else {
            productsQuery = query(
                collection(db, "products"),
                limit(4)
            );
        }
        
        const querySnapshot = await getDocs(productsQuery);
        
        if (querySnapshot.empty) {
            relatedGrid.innerHTML = '<p style="text-align: center; color: #b18080;">No related products found.</p>';
            return;
        }

        relatedGrid.innerHTML = '';

        querySnapshot.forEach((doc) => {
            if (doc.id === currentProductId) return; // Skip current product
            
            const product = doc.data();
            
            const card = document.createElement('div');
            card.className = 'related-card';
            card.onclick = () => {
                localStorage.setItem('selectedProduct', JSON.stringify({
                    id: doc.id,
                    ...product
                }));
                window.location.reload();
            };
            
            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200x200?text=Image+Not+Found'">
                <div class="related-info">
                    <h4>${product.name}</h4>
                    <p>₦${product.price ? product.price.toLocaleString() : '0.00'}</p>
                </div>
            `;
            
            relatedGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error("Error loading related products:", error);
    }
}

// Quantity update function
window.updateQuantity = (change) => {
    const input = document.getElementById('quantity');
    let value = parseInt(input.value) + change;
    if (value < 1) value = 1;
    if (value > 99) value = 99;
    input.value = value;
};

// Handle add to cart from detail page with auth check (NO ALERT)
window.handleAddToCartFromDetail = () => {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const product = getSelectedProduct();
    
    if (!isUserLoggedIn()) {
        // Show toast notification
        showToast({
            type: 'warning',
            title: 'Login Required',
            message: 'Please sign in to add items to your cart. Redirecting to login...',
            duration: 2500
        });
        
        // Save product for after login
        sessionStorage.setItem('pendingPurchase', JSON.stringify({
            product: product,
            quantity: quantity,
            action: 'addToCart'
        }));
        
        // Save current page to return after login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        
        // Redirect after toast
        setTimeout(() => {
            window.location.href = '../HTML/account.html';
        }, 2500);
        return;
    }
    
    // User is logged in - add to cart
    addToCart(product, quantity);
};

// Handle buy now with auth check (NO ALERT)
window.handleBuyNow = () => {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const product = getSelectedProduct();
    
    if (!isUserLoggedIn()) {
        // Show toast notification
        showToast({
            type: 'warning',
            title: 'Login Required',
            message: 'Please sign in to continue with purchase. Redirecting to login...',
            duration: 2500
        });
        
        // Save product for after login
        sessionStorage.setItem('pendingPurchase', JSON.stringify({
            product: product,
            quantity: quantity,
            action: 'buyNow'
        }));
        
        // Save current page to return after login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        
        // Redirect after toast
        setTimeout(() => {
            window.location.href = '../HTML/account.html';
        }, 2500);
        return;
    }
    
    // User is logged in - add to cart and go to checkout
    addToCart(product, quantity);
    
    showToast({
        type: 'success',
        title: 'Processing Order',
        message: 'Redirecting to checkout...',
        duration: 1500
    });
    
    setTimeout(() => {
        window.location.href = 'checkout.html';
    }, 1500);
};

// Handle add to wishlist with auth check (NO ALERT)
window.handleAddToWishlist = () => {
    if (!isUserLoggedIn()) {
        showToast({
            type: 'warning',
            title: 'Login Required',
            message: 'Please sign in to add items to wishlist. Redirecting to login...',
            duration: 2500
        });
        
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        
        setTimeout(() => {
            window.location.href = '../HTML/account.html';
        }, 2500);
        return;
    }
    
    addToWishlist();
};

// Add to cart function
function addToCart(product, quantity = 1, skipToast = false) {
    if (!product) return;
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count if element exists
    updateCartCount();
    
    if (!skipToast) {
        // Show success message
        showToast({
            type: 'success',
            title: 'Added to Cart',
            message: `${product.name} has been added successfully 🛍️`,
            duration: 2000
        });
    }
    
    // Button visual feedback
    const button = document.querySelector('.add-to-cart-btn');
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bx bx-check"></i> Added!';
        button.style.background = '#4CAF50';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }
}

// Add to wishlist
function addToWishlist() {
    const product = getSelectedProduct();
    
    // Get existing wishlist
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    // Check if product already in wishlist
    const existingItem = wishlist.find(item => item.id === product.id);
    
    if (!existingItem) {
        wishlist.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl
        });
        
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        
        showToast({
            type: 'success',
            title: 'Added to Wishlist',
            message: `${product.name} has been added to your wishlist`,
            duration: 2000
        });
    } else {
        showToast({
            type: 'info',
            title: 'Already in Wishlist',
            message: 'This item is already in your wishlist',
            duration: 2000
        });
    }
    
    // Visual feedback
    const button = document.querySelector('.wishlist-btn');
    const icon = button.querySelector('i');
    
    icon.classList.remove('bx-heart');
    icon.classList.add('bxs-heart');
    button.style.background = '#c47a7a';
    button.style.color = 'white';
    
    setTimeout(() => {
        icon.classList.remove('bxs-heart');
        icon.classList.add('bx-heart');
        button.style.background = '';
        button.style.color = '';
    }, 2000);
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.innerText = totalItems;
    }
}

// Toast notification function
function showToast({ type = 'success', title = 'Success', message, duration = 2800, showClose = true }) {
    let container = document.getElementById('toastContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || '✨'}</div>
        <div class="toast-content">
            <h4 class="toast-title">${title}</h4>
            <p class="toast-message">${message}</p>
        </div>
        ${showClose ? '<button class="toast-close">×</button>' : ''}
    `;

    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    const remove = () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    };

    let timeout = setTimeout(remove, duration);

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeout);
            remove();
        });
    }

    toast.addEventListener('mouseenter', () => clearTimeout(timeout));
    toast.addEventListener('mouseleave', () => {
        timeout = setTimeout(remove, duration);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("Product detail page loaded");
    
    // Create toast container if it doesn't exist
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Load product
    loadProductDetail();
    
    // Update cart count on load
    updateCartCount();
});

// Make functions available globally
window.addToCart = addToCart;