  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyB4Hy_sEEH1twq0GDzKi5E1CZD5dVHn4Kk",
    authDomain: "cottage-9fa0c.firebaseapp.com",
    projectId: "cottage-9fa0c",
    storageBucket: "cottage-9fa0c.firebasestorage.app",
    messagingSenderId: "346971937714",
    appId: "1:346971937714:web:0f453c14862de16bede2ab"
  };

  const app  = initializeApp(firebaseConfig);
  const db   = getFirestore(app);
  const auth = getAuth(app);

  let currentUser = null;
  onAuthStateChanged(auth, user => currentUser = user);

  const PER_PAGE = 12;
  let allProducts   = [];
  let currentPage   = 1;
  let currentSort   = "default";

  function getCategory() {
    const params = new URLSearchParams(location.search);
    return params.get("category") || "all";
  }

  function showToast(message, isError = false) {
    const el = document.createElement("div");
    el.style.cssText = `
      background: ${isError ? '#ef4444' : 'var(--accent)'};
      color:white; padding:14px 20px; border-radius:8px;
      margin-bottom:10px; box-shadow:0 4px 12px rgba(0,0,0,0.25);
      min-width:260px; font-weight:500;
    `;
    el.textContent = message;
    document.getElementById("toastContainer").appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function createCard(product) {
    const discount = product.oldPrice
      ? Math.round((product.oldPrice - product.price) / product.oldPrice * 100)
      : 0;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      ${discount > 0 ? `<span class="badge">-${discount}%</span>` : ""}
      <div class="wishlist-btn"><i class="far fa-heart"></i></div>
      <div class="image-wrapper">
        <img src="${product.imageUrl || 'https://via.placeholder.com/240x260?text=No+Image'}" alt="${product.name || ''}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-name">${product.name || "—"}</div>
        <div class="stars">${"★".repeat(Math.round(product.rating || 4.5))}${"☆".repeat(5 - Math.round(product.rating || 4.5))}</div>
        <div class="price-row">
          ₦${(product.price || 0).toLocaleString()}
          ${product.oldPrice ? `<span class="old-price">₦${product.oldPrice.toLocaleString()}</span>` : ""}
        </div>
        <button class="add-btn"
          data-id="${product.id}"
          data-name="${(product.name||'').replace(/"/g,'&quot;')}"
          data-price="${product.price||0}"
          data-image="${product.imageUrl||''}">
          Add to Cart
        </button>
      </div>
    `;

    card.querySelector(".add-btn").onclick = e => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const id    = btn.dataset.id;
      const name  = btn.dataset.name;
      const price = Number(btn.dataset.price);
      const img   = btn.dataset.image;

      if (!currentUser) {
        showToast("Please sign in to add items", true);
        setTimeout(() => location.href = "../HTML/account.html", 1800);
        return;
      }

      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const item = cart.find(x => x.id === id);
      if (item) item.quantity = (item.quantity||1) + 1;
      else cart.push({id, name, price, imageUrl:img, quantity:1});

      localStorage.setItem("cart", JSON.stringify(cart));
      showToast(`${name} added to cart`);

      btn.textContent = "Added ✓";
      btn.style.background = "var(--accent-dark)";
      setTimeout(() => {
        btn.textContent = "Add to Cart";
        btn.style.background = "";
      }, 1400);
    };

    card.addEventListener("click", e => {
      if (e.target.closest(".add-btn") || e.target.closest(".wishlist-btn")) return;
      localStorage.setItem("selectedProduct", JSON.stringify(product));
      location.href = "product-detail.html";
    });

    return card;
  }

  function render(page = 1) {
    const grid = document.getElementById("productsGrid");
    const loader = document.getElementById("loader");

    // Hide loader when rendering products
    if (loader) loader.style.display = "none";

    grid.innerHTML = "";

    let items = [...allProducts];

    if (currentSort === "price-low")  items.sort((a,b) => (a.price||0) - (b.price||0));
    if (currentSort === "price-high") items.sort((a,b) => (b.price||0) - (a.price||0));
    if (currentSort === "name")       items.sort((a,b) => (a.name||"").localeCompare(b.name||""));

    const total = items.length;
    const start = (page-1) * PER_PAGE;
    const end   = Math.min(start + PER_PAGE, total);
    const slice = items.slice(start, end);

    slice.forEach(p => grid.appendChild(createCard(p)));

    document.getElementById("showingText").textContent =
      total === 0 ? "No products found in this category" : `Showing ${start+1}–${end} of ${total} products`;

    const pag = document.getElementById("pagination");
    pag.innerHTML = "";

    if (total <= PER_PAGE) return;

    const pages = Math.ceil(total / PER_PAGE);

    if (page > 1) {
      const a = document.createElement("a"); a.href="#"; a.innerHTML = "« Prev";
      a.onclick = e => { e.preventDefault(); render(page-1); };
      pag.appendChild(a);
    }

    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - page) <= 2) {
        const a = document.createElement("a"); a.href="#"; a.textContent = i;
        if (i === page) a.className = "active";
        a.onclick = e => { e.preventDefault(); render(i); };
        pag.appendChild(a);
      } else if (Math.abs(i - page) === 3) {
        pag.insertAdjacentHTML("beforeend", "<span>…</span>");
      }
    }

    if (page < pages) {
      const a = document.createElement("a"); a.href="#"; a.innerHTML = "Next »";
      a.onclick = e => { e.preventDefault(); render(page+1); };
      pag.appendChild(a);
    }
  }

  async function load() {
    const cat = getCategory();
    const grid = document.getElementById("productsGrid");
    const loader = document.getElementById("loader");

    // Make sure loader is visible at start
    if (loader) loader.style.display = "flex";

    try {
      let q = cat === "all"
        ? collection(db, "products")
        : query(collection(db, "products"), where("category", "==", cat));

      const snap = await getDocs(q);
      allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      render(1);
    } catch (err) {
      console.error(err);
      if (loader) loader.style.display = "none";
      grid.innerHTML = '<div class="no-products">Error loading products. Please try again later.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    document.getElementById("sortSelect")?.addEventListener("change", e => {
      currentSort = e.target.value;
      render(1);
    });
  });




// ==================================
// MOBILE/DESKTOP SEARCH
// ==================================

    
    // Make db available globally
    window.db = window.db || db;

    // ==================== SHARED VARIABLES ====================
    let allProductsCache = [];
    let searchTimeout;
    
    // Category display names
    const categoryDisplayNames = {
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

    // Shared helper function
    function getCategoryDisplayName(category) {
        return categoryDisplayNames[category] || category || 'Product';
    }

    // ==================== LOAD PRODUCTS (SINGLE FUNCTION) ====================
    async function loadProductsCache() {
        try {
            if (allProductsCache.length === 0) {
                const querySnapshot = await getDocs(collection(db, "products"));
                querySnapshot.forEach((doc) => {
                    allProductsCache.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                console.log(`Loaded ${allProductsCache.length} products`);
            }
            return allProductsCache;
        } catch (error) {
            console.error("Error loading products cache:", error);
            return [];
        }
    }

    // ==================== DESKTOP SEARCH ====================
    async function initializeDesktopSearch() {
        const searchInput = document.getElementById('name');
        const searchBtn = document.querySelector('.brand-search .search-btn');
        const clearBtn = document.querySelector('.clear-btn');
        
        // Create suggestions container if it doesn't exist
        const searchWrapper = document.querySelector('.search-wrapper');
        if (searchWrapper && !document.getElementById('searchSuggestions')) {
            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'searchSuggestions';
            suggestionsContainer.className = 'search-suggestions';
            searchWrapper.appendChild(suggestionsContainer);
        }

        // Load products cache
        await loadProductsCache();

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (clearBtn) {
                    clearBtn.classList.toggle('visible', e.target.value.trim().length > 0);
                }
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    showSearchSuggestions(e.target.value);
                }, 300);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performSearch(searchInput.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                performSearch(searchInput?.value || '');
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    clearBtn.classList.remove('visible');
                    searchInput.focus();
                }
                hideSuggestions();
            });
        }

        document.addEventListener('click', (e) => {
            const suggestions = document.getElementById('searchSuggestions');
            if (suggestions && !e.target.closest('.brand-search')) {
                suggestions.classList.remove('show');
            }
        });
    }

    // Show desktop suggestions
    async function showSearchSuggestions(searchTerm) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (!suggestionsContainer) return;
        
        if (!searchTerm || searchTerm.trim().length < 2) {
            suggestionsContainer.classList.remove('show');
            return;
        }
        
        try {
            const searchTermLower = searchTerm.toLowerCase().trim();
            
            if (allProductsCache.length === 0) {
                await loadProductsCache();
            }
            
            const suggestions = allProductsCache
                .filter(product => {
                    const text = `
                        ${(product.name || '').toLowerCase()}
                        ${(product.description || '').toLowerCase()}
                        ${(product.category || '').toLowerCase()}
                    `;
                    
                    const display = getCategoryDisplayName(product.category || '').toLowerCase();
                    
                    return (
                        text.includes(searchTermLower) ||
                        display.includes(searchTermLower) ||
                        display.replace(/ & /g, ' ').includes(searchTermLower) ||
                        display.replace(/ & /g, '').includes(searchTermLower) ||
                        display.replace(/\s+/g, '').includes(searchTermLower)
                    );
                })
                .slice(0, 6);
            
            if (suggestions.length === 0) {
                suggestionsContainer.classList.remove('show');
                return;
            }
            
            let html = '';
            suggestions.forEach(product => {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                const highlightedName = product.name.replace(regex, '<span class="suggestion-highlight">$1</span>');
                const category = getCategoryDisplayName(product.category);
                
                html += `
                    <div class="suggestion-item" onclick="goToProductPage('${product.id}')">
                        <div class="suggestion-content">
                            <span class="suggestion-name">${highlightedName}</span>
                            <span class="suggestion-category">${category}</span>
                        </div>
                        <span class="suggestion-price">$${product.price ? product.price.toFixed(2) : '0.00'}</span>
                    </div>
                `;
            });
            
            suggestionsContainer.innerHTML = html;
            suggestionsContainer.classList.add('show');
            
        } catch (error) {
            console.error("Error showing suggestions:", error);
            suggestionsContainer.classList.remove('show');
        }
    }

    // ==================== MOBILE SEARCH ====================
    function createMobileSearchOverlay() {
        if (document.getElementById('mobileSearchOverlay')) return;

        const overlayHTML = `
            <div class="mobile-search-overlay" id="mobileSearchOverlay">
                <div class="mobile-search-header">
                    <button class="mobile-search-back" id="mobileSearchBack">
                        <i class='bx bx-arrow-back'></i>
                    </button>
                    <h3>Search Products</h3>
                </div>
                <div class="mobile-search-content">
                    <div class="mobile-search-input-wrapper">
                        <i class='bx bx-search'></i>
                        <input type="text" id="mobileSearchInput" placeholder="Search for products..." autocomplete="off">
                        <button class="mobile-clear-btn" id="mobileClearBtn">×</button>
                    </div>
                    <div class="mobile-search-suggestions" id="mobileSearchSuggestions"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        
        const searchIcon = document.querySelector('.down-icons span:nth-child(2)');
        if (searchIcon) {
            searchIcon.addEventListener('click', toggleMobileSearch);
        }
        
        document.getElementById('mobileSearchBack')?.addEventListener('click', closeMobileSearch);
        
        const overlay = document.getElementById('mobileSearchOverlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) closeMobileSearch();
        });
        
        initializeMobileSearchInput();
    }

    function initializeMobileSearchInput() {
        const mobileInput = document.getElementById('mobileSearchInput');
        const mobileClearBtn = document.getElementById('mobileClearBtn');

        if (mobileInput) {
            mobileInput.addEventListener('input', (e) => {
                mobileClearBtn.style.display = e.target.value.trim().length > 0 ? 'block' : 'none';
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    showMobileSearchSuggestions(e.target.value);
                }, 300);
            });

            mobileInput.addEventListener('focus', (e) => {
                if (e.target.value.trim().length >= 2) {
                    showMobileSearchSuggestions(e.target.value);
                }
            });

            mobileInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performMobileSearch(mobileInput.value);
                }
            });
        }

        mobileClearBtn?.addEventListener('click', () => {
            if (mobileInput) {
                mobileInput.value = '';
                mobileClearBtn.style.display = 'none';
                mobileInput.focus();
                hideMobileSuggestions();
            }
        });
    }

    async function showMobileSearchSuggestions(searchTerm) {
        const suggestionsContainer = document.getElementById('mobileSearchSuggestions');
        if (!suggestionsContainer) return;
        
        if (!searchTerm || searchTerm.trim().length < 2) {
            suggestionsContainer.classList.remove('show');
            return;
        }
        
        try {
            const searchTermLower = searchTerm.toLowerCase().trim();
            
            if (allProductsCache.length === 0) {
                await loadProductsCache();
            }
            
            const suggestions = allProductsCache
                .filter(product => {
                    const text = `
                        ${(product.name || '').toLowerCase()}
                        ${(product.description || '').toLowerCase()}
                        ${(product.category || '').toLowerCase()}
                    `;
                    
                    const display = getCategoryDisplayName(product.category || '').toLowerCase();
                    
                    return (
                        text.includes(searchTermLower) ||
                        display.includes(searchTermLower) ||
                        display.replace(/ & /g, ' ').includes(searchTermLower) ||
                        display.replace(/ & /g, '').includes(searchTermLower) ||
                        display.replace(/\s+/g, '').includes(searchTermLower)
                    );
                })
                .slice(0, 8);
            
            if (suggestions.length === 0) {
                suggestionsContainer.innerHTML = `
                    <div class="mobile-no-results">
                        <i class='bx bx-search-alt'></i>
                        <p>No products found for "${searchTerm}"</p>
                    </div>
                `;
                suggestionsContainer.classList.add('show');
                return;
            }
            
            let html = '';
            suggestions.forEach(product => {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                const highlightedName = product.name.replace(regex, '<span class="mobile-suggestion-highlight">$1</span>');
                const category = getCategoryDisplayName(product.category);
                const price = product.price ? `$${product.price.toFixed(2)}` : 'Price on request';
                
                html += `
                    <div class="mobile-suggestion-item" onclick="goToMobileProductPage('${product.id}')">
                        <div class="mobile-suggestion-image">
                            <img src="${product.imageUrl || 'placeholder.jpg'}" alt="${product.name}" onerror="this.src='placeholder.jpg'">
                        </div>
                        <div class="mobile-suggestion-content">
                            <span class="mobile-suggestion-name">${highlightedName}</span>
                            <span class="mobile-suggestion-category">${category}</span>
                            <span class="mobile-suggestion-price">${price}</span>
                        </div>
                    </div>
                `;
            });
            
            suggestionsContainer.innerHTML = html;
            suggestionsContainer.classList.add('show');
            
        } catch (error) {
            console.error("Error showing mobile suggestions:", error);
        }
    }

    // ==================== SHARED FUNCTIONS ====================
    function performSearch(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') return;
        hideSuggestions();
        localStorage.setItem('searchTerm', searchTerm);
        window.location.href = `shop.html?search=${encodeURIComponent(searchTerm)}`;
    }

    function performMobileSearch(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') return;
        hideMobileSuggestions
        
        
        ();
        closeMobileSearch();
        localStorage.setItem('searchTerm', searchTerm);
        window.location.href = `shop.html?search=${encodeURIComponent(searchTerm)}`;
    }

    window.goToProductPage = function(productId) {
        const product = allProductsCache.find(p => p.id === productId);
        if (product) {
            localStorage.setItem('selectedProduct', JSON.stringify(product));
            window.location.href = '../SHOP_FOLDER/product-detail.html';
        }
    };

    window.goToMobileProductPage = function(productId) {
        const product = allProductsCache.find(p => p.id === productId);
        if (product) {
            localStorage.setItem('selectedProduct', JSON.stringify(product));
            closeMobileSearch();
            window.location.href = '../SHOP_FOLDER/product-detail.html';
        }
    };

    function hideSuggestions() {
        document.getElementById('searchSuggestions')?.classList.remove('show');
    }

    function hideMobileSuggestions() {
        document.getElementById('mobileSearchSuggestions')?.classList.remove('show');
    }

    function toggleMobileSearch() {
        const overlay = document.getElementById('mobileSearchOverlay');
        if (overlay) {
            overlay.classList.add('active');
            setTimeout(() => {
                document.getElementById('mobileSearchInput')?.focus();
            }, 300);
        }
    }

    function closeMobileSearch() {
        const overlay = document.getElementById('mobileSearchOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            const input = document.getElementById('mobileSearchInput');
            const clearBtn = document.getElementById('mobileClearBtn');
            if (input) input.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            hideMobileSuggestions();
        }
    }

    window.closeMobileSearch = closeMobileSearch;

    function initializeDownIcons() {
        const downIcons = document.querySelectorAll('.down-icons span');
        
        downIcons.forEach((icon, index) => {
            icon.addEventListener('click', () => {
                downIcons.forEach(i => i.classList.remove('active'));
                icon.classList.add('active');
                
                switch(index) {
                    case 0: window.location.href = 'shop.html'; break;
                    case 1: toggleMobileSearch(); break;
                    case 2: window.location.href = 'wishlist.html'; break;
                    // case 3: window.location.href = 'account.html'; break;
                }
            });
        });
    }

    // ==================== STYLES ====================
    function addSearchStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Desktop Search Styles */
            .search-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                margin-top: 4px;
            }
            
            .search-suggestions.show { display: block; }
            
            .suggestion-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
            }
            
            .suggestion-item:hover { background-color: #f9f9f9; }
            .suggestion-item:last-child { border-bottom: none; }
            
            .suggestion-content { flex: 1; }
            
            .suggestion-name {
                font-weight: 500;
                color: #333;
                display: block;
                margin-bottom: 3px;
            }
            
            .suggestion-category {
                font-size: 12px;
                color: #8424e3;
                display: block;
            }
            
            .suggestion-price {
                font-weight: 600;
                color: #8424e3;
                margin-left: 15px;
            }
            
            .suggestion-highlight {
                background-color: #ffe6f4;
                color: #8424e3;
                font-weight: 600;
            }
            
            .clear-btn.visible { display: block; }
            
            .clear-btn {
                display: none;
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                font-size: 20px;
                color: #999;
                cursor: pointer;
                padding: 0 5px;
            }
            
            .clear-btn:hover { color: #333; }
            
            .search-wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }
            
            .brand-search { position: relative; }

            /* Mobile Search Overlay */
            .mobile-search-overlay {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: white;
                z-index: 10000;
                transform: translateY(100%);
                transition: transform 0.4s ease-in-out;
                display: flex;
                flex-direction: column;
            }
            
            .mobile-search-overlay.active { transform: translateY(0); }
            
            .mobile-search-header {
                display: flex;
                align-items: center;
                padding: 15px 20px;
                background: var(--primary-color, #8424e3);
                color: white;
                position: sticky;
                top: 46px;
                z-index: 10;
            }
            
            .mobile-search-back {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                margin-right: 15px;
                display: flex;
                align-items: center;
            }
            
            .mobile-search-header h3 {
                font-size: 18px;
                font-weight: 500;
                margin: 0;
            }
            
            .mobile-search-content {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: #f8f8f8;
            }
            
            .mobile-search-input-wrapper {
                position: relative;
                display: flex;
                align-items: center;
                background: white;
                border-radius: 30px;
                padding: 0 15px;
                border: 2px solid var(--primary-color, #8424e3);
                margin-bottom: 20px;
                margin-top: 60px;

            }
            
            .mobile-search-input-wrapper i {
                color: #999;
                font-size: 20px;
                margin-right: 10px;
            }
            
            .mobile-search-input-wrapper input {
                flex: 1;
                padding: 15px 0;
                border: none;
                background: transparent;
                font-size: 16px;
                outline: none;
            }
            
            .mobile-clear-btn {
                display: none;
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                padding: 0 5px;
            }
            
            .mobile-clear-btn:hover { color: #333; }
            
            .mobile-search-suggestions {
                display: none;
                flex-direction: column;
                gap: 10px;
            }
            
            .mobile-search-suggestions.show { display: flex; }
            
            .mobile-suggestion-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 12px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .mobile-suggestion-item:hover,
            .mobile-suggestion-item:active {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(132, 36, 227, 0.15);
            }
            
            .mobile-suggestion-image {
                width: 60px;
                height: 60px;
                border-radius: 10px;
                overflow: hidden;
                flex-shrink: 0;
                background: #f5f5f5;
            }
            
            .mobile-suggestion-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .mobile-suggestion-content { flex: 1; }
            
            .mobile-suggestion-name {
                font-weight: 600;
                color: #333;
                display: block;
                margin-bottom: 4px;
                font-size: 15px;
            }
            
            .mobile-suggestion-category {
                font-size: 12px;
                color: var(--icons-color, #8424e3);
                display: block;
                margin-bottom: 2px;
            }
            
            .mobile-suggestion-price {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                display: block;
            }
            
            .mobile-suggestion-highlight {
                background-color: #ffe6f4;
                color: var(--icons-color, #8424e3);
                font-weight: 600;
                padding: 0 2px;
            }
            
            .mobile-no-results {
                text-align: center;
                padding: 40px 20px;
                background: white;
                border-radius: 12px;
            }
            
            .mobile-no-results i {
                font-size: 50px;
                color: #ccc;
                margin-bottom: 15px;
            }
            
            .mobile-no-results p {
                color: #666;
                font-size: 16px;
            }
        `;
        document.head.appendChild(style);
    }

    // ==================== INITIALIZATION ====================
    document.addEventListener('DOMContentLoaded', () => {
        addSearchStyles();
        initializeDesktopSearch();
        createMobileSearchOverlay();
        initializeDownIcons();
        
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            cartCount.innerText = totalItems;
        }
    });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            addSearchStyles();
            initializeDesktopSearch();
            createMobileSearchOverlay();
            initializeDownIcons();
        }, 100);
    }


// =========================================
// UPDATE ACCOUNT DISPLAY 
// =========================================
    function updateUserDisplay() {
        const userName = localStorage.getItem('userName');
        
        // Find the "Sign in Account" element - it's in a span within .user-cart
        const userCartSpan = document.querySelector('.user-cart span:nth-child(2)');
        
        if (userName && userCartSpan) {
            // Change "Sign in Account" to show the user's name
            userCartSpan.innerHTML = `Hi, <span style="color: #8424e3; font-weight: 600;">${userName}</span>`;
        }
    }
    
    // Run when page loads
    document.addEventListener('DOMContentLoaded', updateUserDisplay);
    
    // Run when page becomes visible (user comes back to tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) updateUserDisplay();
    });
    
    // Run when localStorage changes (logged in from another tab)
    window.addEventListener('storage', function(e) {
        if (e.key === 'userName') updateUserDisplay();
    });



    const accountIcons = document.querySelectorAll('.accountIcon');

accountIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        window.location.href = "../HTML/account.html";
    });
});