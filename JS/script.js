// 1. Hamburger Menu Toggle
const menuIcon = document.getElementById('menu-icon');
const overlay = document.querySelector('.overlay');
const closeIcon = document.querySelector('.close-icon');
const navLinks = document.querySelector('.nav-links');

if (menuIcon) {
    menuIcon.addEventListener('click', () => {
        navLinks.classList.add('active');
        overlay.classList.add('active');
    });
}

if (closeIcon) {
    closeIcon.addEventListener('click', () => {
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
    });
}

if (overlay) {
    overlay.addEventListener('click', () => {
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
    });
}

// 2. BRAND NAME
const brandName = document.querySelectorAll('.brandName');

brandName.forEach(icoon => {
    icoon.addEventListener('click', ()=>{
        window.location.href = 'index.html';
    });
});

// 3. Slider / Carousel
const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function nextSlide() {
    if (slides.length > 0) {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
}

if (slides.length > 0) {
    setInterval(nextSlide, 4000); // change slide every 4s
}

// 4. Brand track auto-scroll
const track = document.getElementById("track");
if (track) {
    const images = track.querySelectorAll("img");
    if (images.length > 0) {
        let index = 0;

        // Calculate one image width + gap
        const imageWidth = images[0].offsetWidth;
        const gap = 25; // must match your CSS gap
        const moveAmount = imageWidth + gap;

        function slideNext() {
            index++;

            track.style.transition = "transform 0.5s ease";
            track.style.transform = `translateX(-${index * moveAmount}px)`;

            // When we've moved through original set, reset
            if (index >= images.length / 2) {
                setTimeout(() => {
                    track.style.transition = "none";
                    track.style.transform = "translateX(0)";
                    index = 0;
                }, 500);
            }
        }

        setInterval(slideNext, 3000); // moves every 3 seconds
    }
}

// 5. Account toggle
const accountIcons = document.querySelectorAll('.accountIcon');

accountIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        window.location.href = "../HTML/account.html";
    });
});

// 6. IMAGES DELAY ON REFRESH/LOAD
window.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.fourimages-div');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('show');
        }, index * 250); // 250ms delay between cards
    });
});

// 7. BEAUTY BRANDS toggle
const beautyBrands = document.querySelectorAll('.beautyBrands');

beautyBrands.forEach(icons => {
    icons.addEventListener('click', ()=>{
        window.location.href = '../HTML/brand-images.html';
    });
});

// 8. Cart icon click - redirect to cart page
// const addToCart = document.getElementById('addToCart');
// if (addToCart) {
//     addToCart.addEventListener('click', ()=>{
//         window.location.href = '../SHOP_FOLDER/cart.html';
//     });
// }

// 9. FIXED: Update cart count function
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        try {
            // Get cart from localStorage
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            // Calculate total items (sum of quantities)
            const totalItems = cart.reduce((sum, item) => {
                // Handle both number and string quantities
                const quantity = parseInt(item.quantity) || 1;
                return sum + quantity;
            }, 0);
            cartCount.innerText = totalItems;
            
            // Also try to get from Firebase if user is logged in (optional)
            if (typeof auth !== 'undefined' && auth.currentUser) {
                import('../SHOP_FOLDER/cart.js').then(module => {
                    if (module.getCart) {
                        module.getCart().then(items => {
                            const firebaseTotal = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                            if (firebaseTotal > 0) {
                                cartCount.innerText = firebaseTotal;
                            }
                        }).catch(err => console.log('Could not load cart from Firebase'));
                    }
                }).catch(err => console.log('Cart module not available'));
            }
        } catch (e) {
            console.error('Error updating cart count:', e);
            cartCount.innerText = '0';
        }
    }
}

// Call updateCartCount when page loads
document.addEventListener('DOMContentLoaded', updateCartCount);

// Listen for cart updates from other tabs/windows
window.addEventListener('storage', (e) => {
    if (e.key === 'cart') {
        updateCartCount();
    }
});

// 10. FIXED: Function to handle add to cart button clicks
function handleAddToCart(product, button) {
    try {
        // Get existing cart
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Check if product already exists in cart
        const existingProductIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingProductIndex >= 0) {
            // Increment quantity if product exists
            cart[existingProductIndex].quantity = (cart[existingProductIndex].quantity || 1) + 1;
        } else {
            // Add new product with quantity 1
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        // Save back to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Show success feedback on button
        if (button) {
            const originalHTML = button.innerHTML;
            const originalBg = button.style.background;
            
            button.innerHTML = '<i class="bx bx-check"></i> Added!';
            button.style.background = '#f5babe';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = originalBg;
            }, 2000);
        } else {
            // Fallback alert if button not provided
            alert(product.name + " added to cart!");
        }
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
    }
}

// Make function available globally
window.handleAddToCart = handleAddToCart;

// Example usage (you would call this from your product buttons):
// document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
//     btn.addEventListener('click', (e) => {
//         const product = {
//             id: btn.dataset.id,
//             name: btn.dataset.name,
//             price: btn.dataset.price,
//             image: btn.dataset.image
//         };
//         handleAddToCart(product, btn);
//     });
// });

// Optional: If you have existing add to cart buttons with specific classes,
// uncomment and adapt the code below:
/*
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.add-to-cart-btn, .product-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const product = {
                id: btn.getAttribute('data-id') || btn.closest('.product').dataset.id,
                name: btn.getAttribute('data-name') || btn.closest('.product').querySelector('.product-name').textContent,
                price: btn.getAttribute('data-price') || btn.closest('.product').querySelector('.product-price').textContent.replace('$', ''),
                image: btn.getAttribute('data-image') || btn.closest('.product').querySelector('img').src
            };
            handleAddToCart(product, btn);
        });
    });
});
*/  


window.goToProduct = function(productId) {
    const product = allProductsCache.find(p => p.id === productId);
    if (product) {
        localStorage.setItem('selectedProduct', JSON.stringify(product));
        window.location.href = '../SHOP_FOLDER/product-detail.html';
    }
};


// DISPLAY Arriva
// Single Shopping Cart Class - Use ONLY this one
class ShoppingCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    init() {
        // Initialize based on current page
        if (document.querySelector('.new-arrivals')) {
            this.initProductPage();
        }
        
        if (document.querySelector('.cart-page')) {
            this.renderCartPage();
        }
        
        this.updateCartCount();
    }

    initProductPage() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.addToCart(button);
            });
        });

        // Initialize wishlist hearts
        document.querySelectorAll('.bx-heart').forEach(heart => {
            heart.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleWishlist(heart);
            });
        });
    }

    addToCart(button) {
    const productDiv = button.closest('.new-arrivals2 > div');
    
    // Get product details
    const priceDisplay = productDiv.querySelector('h1').textContent;
    
    // Get image URL
    let imageUrl = productDiv.querySelector('img').src;
    
    // DEBUG: Log everything
    console.log('Product name:', productDiv.querySelector('h3').textContent);
    console.log('Image URL:', imageUrl);
    console.log('Price:', priceDisplay);
    
    const product = {
        id: this.generateId(productDiv.querySelector('h3').textContent),
        name: productDiv.querySelector('h3').textContent,
        price: this.parsePrice(priceDisplay),
        priceDisplay: priceDisplay,
        category: productDiv.querySelector('p').textContent,
        image: imageUrl,
        quantity: 1
    };

    console.log('Product object saved:', product);
    
    // Rest of your code...


        // Check if product already in cart
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
            this.showNotification(`Added another ${product.name} to cart!`, 'success');
        } else {
            this.cart.push(product);
            this.showNotification(`${product.name} added to cart!`, 'success');
        }

        // Save and update
        this.saveCart();
        this.animateButton(button);
        this.updateCartCount();
        
        // Show cart preview
        this.showCartPreview(product);
        
        console.log('Current cart:', this.cart); // Debug: Check if items are added
    }

    showCartPreview(product) {
        // Create a mini cart preview
        const preview = document.createElement('div');
        preview.className = 'cart-preview';
        preview.innerHTML = `
            <div class="cart-preview-header">
                <i class='bx bx-cart'></i>
                <span>Added to Cart!</span>
                <button onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <div class="cart-preview-item">
                <img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;">
                <div>
                    <h4 style="margin: 0; font-size: 14px;">${product.name}</h4>
                    <p style="margin: 5px 0;">${product.priceDisplay}</p>
                    <p style="margin: 0;">Qty: ${product.quantity}</p>
                </div>
            </div>
            <div class="cart-preview-footer" style="display: flex; gap: 10px; padding: 10px;">
                <button onclick="window.location.href='cart.html'" style="flex: 1; padding: 8px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    View Cart (${this.cart.length})
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="flex: 1; padding: 8px; background: #f0f0f0; border: none; border-radius: 5px; cursor: pointer;">
                    Continue
                </button>
            </div>
        `;
        
        document.body.appendChild(preview);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(preview)) {
                preview.remove();
            }
        }, 5000);
    }

 renderCartPage() {
    const cartContainer = document.querySelector('.cart-items');
    if (!cartContainer) return;

    if (this.cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        return;
    }

    console.log('Rendering cart with items:', this.cart); // DEBUG

    let html = '';
    this.cart.forEach((item, index) => {
        console.log(`Item ${index}:`, item); // DEBUG each item
        
        // FIXED: Try both image and imageUrl properties
        const imageSrc = item.imageUrl || item.image || 'https://via.placeholder.com/100x100?text=Product';
        
        html += `
            <div class="cart-item" data-id="${item.id}" style="display: flex; align-items: center; gap: 20px; padding: 20px; border-bottom: 1px solid #eee;">
                <div style="width: 100px; height: 100px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${imageSrc}" 
                         alt="${item.name}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/100x100?text=No+Image'; this.style.objectFit='contain';">
                </div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px 0;">${item.name || 'Product'}</h3>
                    <p style="margin: 0 0 5px 0; color: #666;">${item.category || ''}</p>
                    <p style="margin: 0; font-weight: bold;">₦${(item.price || 0).toLocaleString()}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; cursor: pointer;">-</button>
                    <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; cursor: pointer;">+</button>
                </div>
                <div style="min-width: 100px; text-align: right; font-weight: bold;">
                    ₦${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                </div>
                <button onclick="cart.removeItem('${item.id}')" style="background: none; border: none; cursor: pointer; color: #ff4444;">
                    <i class='bx bx-trash' style="font-size: 20px;"></i>
                </button>
            </div>
        `;
    });

    cartContainer.innerHTML = html;
    
    // Update cart summary
    this.updateCartSummary();
    
    // Add image load listeners
    this.addImageLoadListeners();
}

addImageLoadListeners() {
    document.querySelectorAll('.cart-item img').forEach(img => {
        // Add loading animation
        const container = img.closest('div[style*="width: 100px"]'); // Find the image container div
        if (!container) return;
        
        const loader = document.createElement('div');
        loader.className = 'image-spinner';
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--icons-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        // Make container relative for absolute positioning
        container.style.position = 'relative';
        container.appendChild(loader);
        
        // Hide loader when image loads
        img.onload = () => {
            if (loader.parentNode) loader.remove();
        };
        
        img.onerror = () => {
            if (loader.parentNode) loader.remove();
            img.src = 'https://via.placeholder.com/80x80?text=No+Image';
            img.style.objectFit = 'contain';
        };
    });
}

    toggleWishlist(heart) {
        // Wishlist functionality
        heart.classList.toggle('active');
        if (heart.classList.contains('active')) {
            heart.style.color = '#ff4444';
            this.showNotification('Added to wishlist!', 'success');
        } else {
            heart.style.color = '#999';
            this.showNotification('Removed from wishlist!', 'success');
        }
    }

    updateQuantity(id, newQuantity) {
        const item = this.cart.find(item => item.id === id);
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(id);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                if (document.querySelector('.cart-page')) {
                    this.renderCartPage();
                }
                this.updateCartCount();
            }
        }
    }

    removeItem(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.saveCart();
        if (document.querySelector('.cart-page')) {
            this.renderCartPage();
        }
        this.updateCartCount();
        this.showNotification('Item removed from cart');
    }

    updateCartSummary() {
        const subtotal = this.getTotalPrice();
        const shipping = subtotal > 50000 ? 0 : 5000;
        const tax = subtotal * 0.075; // 7.5% tax
        const total = subtotal + shipping + tax;

        const summaryElement = document.querySelector('.cart-summary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                <h3>Order Summary</h3>
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>${shipping === 0 ? 'Free' : '$' + shipping.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span>Tax (7.5%):</span>
                    <span>$${Math.round(tax).toLocaleString()}</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>$${Math.round(total).toLocaleString()}</span>
                </div>
                <button class="checkout-btn" onclick="checkout()">Proceed to Checkout</button>
            `;
        }
    }

    // Helper methods
    generateId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    parsePrice(priceString) {
        // Convert "$20,000" to 20000
        return parseInt(priceString.replace(/[^0-9]/g, ''));
    }

    animateButton(button) {
        button.classList.add('added');
        button.innerHTML = '✓ Added!';
        
        setTimeout(() => {
            button.classList.remove('added');
            button.innerHTML = 'Add to Cart 🛒';
        }, 2000);
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error'}'></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        console.log('Cart saved:', this.cart); // Debug: Check if cart is saving
    }

    updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
        
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }

    getCartItems() {
        return this.cart;
    }

    getTotalPrice() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        this.showNotification('Cart cleared');
    }
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});

// Optional: Checkout function
function checkout() {
    if (cart.getCartItems().length === 0) {
        cart.showNotification('Your cart is empty!', 'error');
        return;
    }
    window.location.href = 'checkout.html';
}

