import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
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
});

// ────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────

function isUserLoggedIn() {
    return currentUser !== null;
}

function getCategoryFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category') || 'all';
}

function getCategoryDisplayName(category) {
    const categories = {
        'all': 'All Products',
        'bath': 'Bath & Body',
        'body1': 'Body Lotion',
        'face': 'Face',
        'faceMask': 'Face Mask',
        'faceWash': 'FaceWash',
        'baby': 'Baby Skin',
        'babyLotion': 'Baby Lotion',
        'babyWash': 'Baby Wash',
        'babyOil': 'Baby Oil',
        'babyPowder': 'Baby Powder',
        'cream': 'Cream',
        'serum': 'Serum',
        'skincare': 'Skin Care',
        'sunScreen': 'Sun Screen',
        'scrubs': 'Scrubs'
    };
    return categories[category] || category;
}

// ────────────────────────────────────────
//  PAGINATION & LOADING
// ────────────────────────────────────────

let currentPage = 1;
const productsPerPage = 16;
let currentCategory = 'all';
let allProducts = [];
let allProductsCache = [];
let isSearchMode = false;
let currentSearchTerm = '';

function createPagination(currentPage, totalPages, container) {
    let existing = container.querySelector('.pagination');
    if (existing) existing.remove();

    if (totalPages <= 1) return;

    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    if (currentPage > 1) {
        const prev = document.createElement('a');
        prev.href = '#';
        prev.innerHTML = '&laquo;';
        prev.onclick = (e) => { e.preventDefault(); changePage(currentPage - 1); };
        pagination.appendChild(prev);
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const link = document.createElement('a');
            link.href = '#';
            link.innerHTML = i;
            if (i === currentPage) link.className = 'active';
            link.onclick = (e) => { e.preventDefault(); changePage(i); };
            pagination.appendChild(link);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const dots = document.createElement('span');
            dots.innerHTML = '...';
            pagination.appendChild(dots);
        }
    }

    if (currentPage < totalPages) {
        const next = document.createElement('a');
        next.href = '#';
        next.innerHTML = '&raquo;';
        next.onclick = (e) => { e.preventDefault(); changePage(currentPage + 1); };
        pagination.appendChild(next);
    }

    container.appendChild(pagination);
}

function changePage(page) {
    currentPage = page;
    if (isSearchMode) {
        displaySearchResults(allProductsCache, currentSearchTerm, page);
    } else {
        loadProductsByCategory(page);
    }
    document.getElementById('productsGrid')?.scrollIntoView({ behavior: 'smooth' });
}

async function loadProductsByCategory(page = 1) {
    const category = getCategoryFromUrl();
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const searchContainer = document.getElementById('searchResultsContainer');
    if (searchContainer) searchContainer.style.display = 'none';
    grid.style.display = 'grid';

    isSearchMode = false;
    currentSearchTerm = '';

    if (category !== currentCategory) {
        currentCategory = category;
        currentPage = 1;
        allProducts = [];
        allProductsCache = [];
    }

    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.textContent = getCategoryDisplayName(category);
    }

    grid.innerHTML = '<div class="loader-container"><div class="spinner"></div><p>Loading products...</p></div>';

    try {
        let q = category === 'all' 
            ? collection(db, "products")
            : query(collection(db, "products"), where("category", "==", category));

        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            grid.innerHTML = '<div class="no-products">No products found in this category.</div>';
            return;
        }

        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const total = allProducts.length;
        const start = (page - 1) * productsPerPage;
        const end = Math.min(start + productsPerPage, total);
        const pageItems = allProducts.slice(start, end);

        displayProducts(pageItems, grid, start + 1, end, total);

    } catch (err) {
        console.error("Load products error:", err);
        grid.innerHTML = 'Error loading products. Please try again.';
    }
}

function displayProducts(products, grid, start, end, total) {
    grid.innerHTML = '';

    // Remove old counter if exists
    const oldCounter = document.querySelector('.results-counter');
    if (oldCounter) oldCounter.remove();

    const counter = document.createElement('div');
    counter.className = 'results-counter';
    counter.innerHTML = `Showing ${start}-${end} of ${total} results`;
    grid.parentNode.insertBefore(counter, grid);

    products.forEach(product => {
        grid.appendChild(createProductCard(product));
    });

    const totalPages = Math.ceil(total / productsPerPage);
    createPagination(currentPage, totalPages, document.querySelector('.container'));
}

// ────────────────────────────────────────
//  PRODUCT CARD
// ────────────────────────────────────────

function createProductCard(product, highlightTerm = null) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Make the whole card clickable for product details
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking on the add to cart button
        if (!e.target.classList.contains('add-to-cart') && !e.target.closest('.add-to-cart')) {
            localStorage.setItem('selectedProduct', JSON.stringify(product));
            window.location.href = 'product-detail.html';
        }
    });

    const categoryDisplay = getCategoryDisplayName(product.category || 'uncategorized');

    let name = product.name || 'Unnamed Product';
    let desc = product.description 
        ? product.description.substring(0, 50) + (product.description.length > 50 ? '...' : '')
        : 'No description available.';

    if (highlightTerm) {
        name = highlightText(name, highlightTerm);
        desc = highlightText(desc, highlightTerm);
    }

    card.innerHTML = `
        <img src="${product.imageUrl || 'placeholder.jpg'}" alt="${product.name}" 
             onerror="this.src='placeholder.jpg'">
        <div class="product-info">
            <div class="product-name">${name}</div>
            <div class="product-category">${categoryDisplay}</div>
            <div class="product-price">₦${(product.price || 0).toLocaleString()}</div>
            <button class="add-to-cart" 
                    data-product-id="${product.id}"
                     data-product-name="${product.name.replace(/'/g, "\\'")}"
                     data-product-price="${product.price || 0}"
                    data-product-image="${product.imageUrl || ''}">
                Add to Cart
            </button>
        </div>
    `;

    // Add click event listener to the button
    const addToCartBtn = card.querySelector('.add-to-cart');
    addToCartBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        e.preventDefault();
        
        const productId = addToCartBtn.dataset.productId;
        const name = addToCartBtn.dataset.productName;
        const price = parseFloat(addToCartBtn.dataset.productPrice);
        const imageUrl = addToCartBtn.dataset.productImage;
        
        handleAddToCart(productId, name, price, imageUrl);
    });

    return card;
}

// ────────────────────────────────────────
//  ADD TO CART WITH LOGIN CHECK (NO ALERT)
// ────────────────────────────────────────

function handleAddToCart(productId, name, price, imageUrl, quantity = 1) {
    console.log("Add to cart clicked. Logged in:", isUserLoggedIn());
    
    if (!isUserLoggedIn()) {
        // Show login required toast
        showToast({
            type: 'warning',
            title: 'Login Required',
            message: 'Please sign in to add items to your cart. Redirecting to login...',
            duration: 2500
        });
        
        // Store the product they wanted to add
        sessionStorage.setItem('pendingCartItem', JSON.stringify({
            productId, name, price, imageUrl, quantity
        }));
        
        // Automatically redirect after toast
        setTimeout(() => {
            window.location.href = '../HTML/account.html';
        }, 2500);
        
        return;
    }

    // User is logged in, proceed with adding to cart
    addToCart(productId, name, price, imageUrl, quantity);
}

function addToCart(productId, name, price, imageUrl, quantity = 1) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: Number(price) || 0,
            imageUrl: imageUrl || '',
            quantity: quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    const countEl = document.getElementById('cartCount');
    if (countEl) {
        countEl.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
    }

    showToast({
        type: 'success',
        title: 'Added to Cart',
        message: `${name} added successfully 🛍️`,
        duration: 2600
    });

    // Button visual feedback
    const btn = event?.target;
    if (btn && btn.classList.contains('add-to-cart')) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="bx bx-check"></i> Added!';
        btn.style.background = '#f5babe';
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.style.background = '';
        }, 1600);
    }
}

// ────────────────────────────────────────
//  SEARCH & SUGGESTIONS
// ────────────────────────────────────────

let searchTimeout;

async function showSearchSuggestions(term) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;

    term = (term || '').trim().toLowerCase();
    if (term.length < 2) {
        container.classList.remove('show');
        return;
    }

    try {
        if (allProductsCache.length === 0) {
            const snap = await getDocs(collection(db, "products"));
            allProductsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        const matches = allProductsCache
            .filter(p => {
                const text = `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
                const cat = getCategoryDisplayName(p.category || '').toLowerCase();
                return text.includes(term) || cat.includes(term);
            })
            .slice(0, 6);

        if (matches.length === 0) {
            container.classList.remove('show');
            return;
        }

        let html = '';
        matches.forEach(p => {
            const highlighted = p.name.replace(new RegExp(`(${term})`, 'gi'), '<span class="suggestion-highlight">$1</span>');
            html += `
                <div class="suggestion-item" onclick="goToProduct('${p.id}')">
                    <span class="suggestion-name">${highlighted}</span>
                    <span class="suggestion-price">₦${(p.price || 0).toLocaleString()}</span>
                </div>
            `;
        });

        container.innerHTML = html;
        container.classList.add('show');
    } catch (error) {
        console.error("Error getting suggestions:", error);
    }
}

window.goToProduct = (id) => {
    const product = allProductsCache.find(p => p.id === id);
    if (product) {
        localStorage.setItem('selectedProduct', JSON.stringify(product));
        window.location.href = 'product-detail.html';
    }
};

async function searchProducts(term) {
    term = (term || '').trim();
    if (!term) {
        clearSearch();
        return;
    }

    isSearchMode = true;
    currentSearchTerm = term;
    currentPage = 1;

    const grid = document.getElementById('productsGrid');
    let searchCont = document.getElementById('searchResultsContainer');

    if (!searchCont) {
        searchCont = document.createElement('div');
        searchCont.id = 'searchResultsContainer';
        searchCont.className = 'search-results-container';
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(searchCont);
        }
    }

    if (grid) grid.style.display = 'none';
    searchCont.style.display = 'block';
    searchCont.innerHTML = '<div class="loading">Searching products...</div>';

    try {
        if (allProductsCache.length === 0) {
            const snap = await getDocs(collection(db, "products"));
            allProductsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        const matches = allProductsCache.filter(p => {
            const text = `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
            return text.includes(term.toLowerCase());
        });

        displaySearchResults(matches, term, 1);
    } catch (error) {
        console.error("Error searching products:", error);
        searchCont.innerHTML = '<div class="no-products">Error searching products. Please try again.</div>';
    }
}

function displaySearchResults(products, term, page = 1) {
    const grid = document.getElementById('productsGrid');
    let container = document.getElementById('searchResultsContainer');
    if (!container || !grid) return;

    const total = products.length;
    const start = (page - 1) * productsPerPage;
    const end = Math.min(start + productsPerPage, total);

    container.innerHTML = '';

    if (total === 0) {
        container.innerHTML = `
            <div class="no-results-wrapper">
                <div class="no-products-found">
                    <h3>No products found for "${term}"</h3>
                    <p>Try different keywords or browse our categories</p>
                    <button onclick="clearSearch()" class="primary-btn">Browse All Products</button>
                </div>
            </div>
        `;
        return;
    }

    const header = document.createElement('div');
    header.className = 'search-header';
    header.innerHTML = `
        <div>
            <h2>Search Results</h2>
            <span class="search-count">Found ${total} products for "${term}"</span>
        </div>
        <button class="clear-search-btn" onclick="clearSearch()">✕ Clear</button>
    `;
    container.appendChild(header);

    const counter = document.createElement('div');
    counter.className = 'results-counter';
    counter.textContent = `Showing ${start + 1}-${end} of ${total} products`;
    container.appendChild(counter);

    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'products-grid';
    products.slice(start, end).forEach(p => {
        resultsGrid.appendChild(createProductCard(p, term));
    });
    container.appendChild(resultsGrid);

    const totalPages = Math.ceil(total / productsPerPage);
    if (totalPages > 1) {
        const pag = document.createElement('div');
        pag.className = 'search-pagination';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = i === page ? 'active' : '';
            btn.onclick = () => displaySearchResults(products, term, i);
            pag.appendChild(btn);
        }
        container.appendChild(pag);
    }
}

function highlightText(text, term) {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

window.clearSearch = () => {
    isSearchMode = false;
    currentSearchTerm = '';
    const input = document.getElementById('name');
    if (input) input.value = '';
    
    const suggestions = document.getElementById('searchSuggestions');
    if (suggestions) suggestions.classList.remove('show');
    
    const searchContainer = document.getElementById('searchResultsContainer');
    if (searchContainer) {
        searchContainer.style.display = 'none';
        searchContainer.innerHTML = '';
    }
    
    const grid = document.getElementById('productsGrid');
    if (grid) grid.style.display = 'grid';
    
    loadProductsByCategory(1);
};

// ────────────────────────────────────────
//  TOAST NOTIFICATION
// ────────────────────────────────────────

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

// ────────────────────────────────────────
//  INITIALIZATION
// ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing...");
    
    // Create toast container
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create suggestions container
    const searchWrapper = document.querySelector('.brand-search, .search-wrapper');
    if (searchWrapper && !document.getElementById('searchSuggestions')) {
        const sug = document.createElement('div');
        sug.id = 'searchSuggestions';
        sug.className = 'search-suggestions';
        searchWrapper.appendChild(sug);
    }

    // Load products
    loadProductsByCategory();

    const input = document.getElementById('name');
    if (input) {
        input.addEventListener('input', e => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => showSearchSuggestions(e.target.value), 300);
        });

        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProducts(input.value);
            }
        });
    }

    // Search button
    const searchBtn = document.querySelector('.brand-search button, .search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', e => {
            e.preventDefault();
            searchProducts(input?.value || '');
        });
    }

    // Clear button
    const clearBtn = document.querySelector('.clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (input) {
                input.value = '';
                clearSearch();
            }
        });
    }

    // Close suggestions when clicking outside
    document.addEventListener('click', e => {
        if (!e.target.closest('.brand-search') && !e.target.closest('.search-wrapper')) {
            const suggestions = document.getElementById('searchSuggestions');
            if (suggestions) suggestions.classList.remove('show');
        }
    });

    // Account icon redirectzz
    const accountIcons = document.querySelectorAll('.accountIcon, .user-cart span:first-child');
    accountIcons.forEach(el => {
        el.addEventListener('click', () => {
            window.location.href = "../HTML/account.html";
        });
    });
    
    // Check for pending cart item from previous session
    const pendingItem = sessionStorage.getItem('pendingCartItem');
    if (pendingItem && isUserLoggedIn()) {
        const item = JSON.parse(pendingItem);
        addToCart(item.productId, item.name, item.price, item.imageUrl, item.quantity);
        sessionStorage.removeItem('pendingCartItem');
        showToast({
            type: 'success',
            title: 'Welcome Back!',
            message: 'Item has been added to your cart',
            duration: 3000
        });
    }
});

window.addEventListener('popstate', () => {
    currentPage = 1;
    currentCategory = getCategoryFromUrl();
    isSearchMode = false;
    currentSearchTerm = '';
    loadProductsByCategory();
});

// Make functions available globally
window.handleAddToCart = handleAddToCart;
window.addToCart = addToCart;
window.clearSearch = clearSearch;
window.searchProducts = searchProducts;


