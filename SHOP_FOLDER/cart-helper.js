// cart-helper.js - Shared cart functions for all pages

// Get cart from localStorage
export function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// Save cart to localStorage
export function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateAllCartCounts(); // Update counts everywhere when cart changes
}

// Add item to cart
export function addToCart(product) {
    let cart = getCart();
    
    const existingProduct = cart.find(item => item.id === product.id);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            imageUrl: product.imageUrl,
            quantity: 1
        });
    }
    
    saveCart(cart);
    return cart;
}

// Remove item from cart
export function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    return cart;
}

// Update quantity
export function updateQuantity(productId, newQuantity) {
    let cart = getCart();
    const product = cart.find(item => item.id === productId);
    
    if (product) {
        if (newQuantity <= 0) {
            // Remove if quantity is 0 or less
            cart = cart.filter(item => item.id !== productId);
        } else {
            product.quantity = newQuantity;
        }
    }
    
    saveCart(cart);
    return cart;
}

// Get total number of items in cart
export function getTotalItems() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Calculate total price
export function getTotalPrice() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// UPDATE ALL CART COUNTS ON ALL PAGES
export function updateAllCartCounts() {
    const totalItems = getTotalItems();
    
    // Find ALL elements with id "cartCount" on the current page
    const cartCountElements = document.querySelectorAll('#cartCount');
    
    // Update each one
    cartCountElements.forEach(element => {
        element.innerText = totalItems;
    });
    
    // Also store in localStorage for pages that might load later
    localStorage.setItem("cartCount", totalItems);
}

// Initialize cart counts when page loads
export function initCartCounts() {
    updateAllCartCounts();
}