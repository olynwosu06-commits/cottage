// ========================================
// PRODUCT DATA
// =========================================
const products = [
    {
        id: 1,
        name: "Anua Azelaic 10 Hyaluron Redness Soothing Pad",
        category:"star",
        price: 21999,
        description: "Rich moisturizing body lotion for all skin types",
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1772050504/Screenshot_839750-removebg-preview_kdj6vr.png"

    },
    {
        id: 2,
        name: "Skeenpoint Lightening Face Cream 50ml",
        price: 16900,
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1773315694/1_suuonk.jpg"
    },
    {
        id: 3,
        name: "Medicube Collagen Night Wrapping Mask 75ml",
        price: 4500,
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1772191526/rhema-removebg-preview_bim01z.png"
    },
    {
        id: 4,
        name: "Bioaqua Fresh Orange Vitamin C Face Sheet Mask",
        price: 2500,
        description: "Deep hydrating sheet mask",
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1772191514/allure3-removebg-preview_dp6whb.png"

    },
    {
        id: 5,
        name: "Medicube Niacinamide 15% + TXA Serum 30ml",
        price: 17700,
        description: "Serum",
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1773259585/serum-removebg-preview_q4tsra.png"
    },
    {
        id: 6,
        name: "Olay Vitamin C Body Lotion",
        price: 18000,
        description: "Sun Screen Cream",
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1773315884/Olay-vit--500x500_ctxpvg.jpg"
    },
    {
        id: 6,
        name: "Sun Screen SPF 50",
        price: 6500,
        description: "Broad spectrum sun protection",
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1772191526/rhema-removebg-preview_bim01z.png"
    },
    {
        id: 6,
        name: "NEWSungboon Editor Deep Collagen Retinol Boost Up Mask",
        price: 5375,
        description: "Broad spectrum sun protection",
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1773315371/sungbooneditor-deep-collagen-retinol-tension-boost-up-mask-set-4pcs-3_1080x_668e961c-d544-4fdc-8b3b-d7e835db9046_n1wule.webp"
    },
    {
        id: 6,
        name: "Sun Screen SPF 50",
        price: 6500,
        description: "Anua rice 70 Glow Collagen Face Mask 38g",
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1773315473/Anua_Rice_70_Ceramide_Glow_Collagen_Mask_4_pcs_6_sv4jos.webp"
    },
    {
        id: 6,
        name: "Sun Screen SPF 50",
        category: "sunScreen",
        price: 6500,
        description: "Broad spectrum sun protection",
        imageUrl: "https://res.cloudinary.com/daaiil1ah/image/upload/v1772191526/rhema-removebg-preview_bim01z.png"
    }
];

// ========================================
// PRODUCT CATEGORIES
// =========================================
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

// ========================================
// HIGHLIGHT TEXT FUNCTION (if needed)
// =========================================
function highlightText(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// ========================================
// PRODUCT CARD
// =========================================
function createProductCard(product, highlightTerm = null) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Make the whole card clickable for product details
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking on the add to cart button
        if (!e.target.classList.contains('add-to-cart') && !e.target.closest('.add-to-cart')) {
            localStorage.setItem('selectedProduct', JSON.stringify(product));
            window.location.href = '../SHOP_FOLDER/product-detail.html';
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

// ========================================
// HANDLE ADD TO CART
// =========================================
function handleAddToCart(productId, name, price, imageUrl) {
    // Get existing cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already in cart
    const existingProduct = cart.find(item => item.id === productId);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            imageUrl: imageUrl,
            quantity: 1
        });
    }
    
    // Save back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show feedback
    alert(`${name} added to cart!`);
    
    // Optional: Update cart icon count if you have one
    updateCartCount();
}

// ========================================
// UPDATE CART COUNT (optional)
// =========================================
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update cart count display if you have one
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = totalItems;
    });
}

// ========================================
// DISPLAY FEATURED PRODUCTS (ONLY 4)
// =========================================
function displayFeaturedProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    // Clear the grid
    productsGrid.innerHTML = '';
    
    // Get only the first 4 products
    const featuredProducts = products.slice(0, 10);
    
    // Create and append product cards
    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Add "View All Products" button
    addViewAllButton(productsGrid);
}

const view = document.querySelector('.view')

view.addEventListener('click', ()=>{
    window.location.href = "../SHOP_FOLDER/shop.html"
})

// ========================================
// INITIALIZE PAGE
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    displayFeaturedProducts();
    updateCartCount();
    
    // Setup category filters if you want to use them
    setupCategoryFilters();
});

// ========================================
// CATEGORY FILTERS (optional)
// =========================================
function setupCategoryFilters() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            categoryTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get category from tab text or data attribute
            const category = tab.textContent.trim().toLowerCase();
            
            if (category === 'all products') {
                displayFeaturedProducts();
            } else {
                filterFeaturedProducts(category);
            }
        });
    });
}

// ========================================
// FILTER FEATURED PRODUCTS
// =========================================
function filterFeaturedProducts(category) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    // Remove existing view all button
    const existingBtn = document.querySelector('.view-all-container');
    if (existingBtn) existingBtn.remove();
    
    // Map display category to actual category
    const categoryMap = {
        'bath & body': 'bath',
        'serum': 'serum',
        'face': 'face'
    };
    
    const filterCategory = categoryMap[category] || category;
    
    // Filter products and take first 4
    let filteredProducts = products
        .filter(product => product.category === filterCategory)
        .slice(0, 4);
    
    if (filteredProducts.length > 0) {
        filteredProducts.forEach(product => {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        });
    } else {
        productsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 2rem;">No products in this category</p>';
    }
    
    // Add view all button back
    addViewAllButton(productsGrid);
}


window.updateQuantity = (change) => {
    const input = document.getElementById('quantity');
    let value = parseInt(input.value) + change;
    if (value < 1) value = 1;
    if (value > 99) value = 99;
    input.value = value;
};



// WHATSAPP