// checkout.js ────────────────────────────────────────────────
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

console.log("✅ checkout.js loaded");

let currentUser = null;
let cartItems = [];

// DOM Elements
const checkoutSteps = document.querySelectorAll('.checkout-step');
const nextButtons = document.querySelectorAll('.next-step');
const prevButtons = document.querySelectorAll('.prev-step');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const paymentMethods = document.querySelectorAll('input[name="payment"]');

// Initialize checkout
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Content Loaded");
  loadCartItems();
  initializeCheckoutSteps();
  loadUserProfile();
  initializeInputFormatters();
});

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  console.log("Auth →", user ? `uid: ${user.uid}` : "guest");

  if (!user) {
    // Redirect to login if not authenticated
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = 'account.html';
    return;
  }

  await loadCartItems();
  await loadUserProfile();
});

// Load cart items
async function loadCartItems() {
  const container = document.getElementById('cartItems');
  if (!container) {
    console.error("Cart items container not found");
    return;
  }

  try {
    if (currentUser) {
      const cartRef = doc(db, "carts", currentUser.uid);
      const cartSnap = await getDoc(cartRef);
      cartItems = cartSnap.exists() ? (cartSnap.data().items || []) : [];
    } else {
      cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    }

    console.log("Cart items loaded:", cartItems);

    if (cartItems.length === 0) {
      showEmptyCart();
      return;
    }

    displayCartItems(cartItems);
    updateOrderSummary();

  } catch (error) {
    console.error("Cart load error:", error);
    showError("Failed to load cart");
  }
}

// Display cart items in review
function displayCartItems(items) {
  const container = document.getElementById('cartItems');
  if (!container) return;

  container.innerHTML = '';
  
  items.forEach(item => {
    const itemTotal = (Number(item.price) * item.quantity).toFixed(2);
    
    const el = document.createElement('div');
    el.className = 'checkout-cart-item';
    el.innerHTML = `
      <div class="item-image">
        <img src="${item.imageUrl || item.image || '../IMAGES/placeholder.jpg'}" 
             alt="${item.name}">
        <span class="item-quantity">${item.quantity}</span>
      </div>
      <div class="item-details">
        <h4>${item.name}</h4>
        <p class="item-price">$${Number(item.price).toFixed(2)} each</p>
      </div>
      <div class="item-total">$${itemTotal}</div>
    `;
    container.appendChild(el);
  });
  
  // Also update the review shipping section with current form data
  updateReviewShipping();
}

// Calculate totals
function calculateTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0);
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;

  return { subtotal, shipping, tax, total };
}

// Update order summary
function updateOrderSummary() {
  const { subtotal, shipping, tax, total } = calculateTotals(cartItems);
  
  document.getElementById('subtotal')?.textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('shipping')?.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
  document.getElementById('tax')?.textContent = `$${tax.toFixed(2)}`;
  document.getElementById('total')?.textContent = `$${total.toFixed(2)}`;
}

// Calculate shipping
function calculateShipping(subtotal) {
  // Free shipping over $50
  return subtotal > 50 ? 0 : 5.99;
}

// Calculate tax (adjust based on your location)
function calculateTax(subtotal) {
  const taxRate = 0.08; // 8% tax rate
  return subtotal * taxRate;
}

// Load user profile for pre-filling forms
async function loadUserProfile() {
  if (!currentUser) return;
  
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Pre-fill forms with existing data
      const fullNameInput = document.getElementById('fullName');
      const emailInput = document.getElementById('email');
      const phoneInput = document.getElementById('phone');
      
      if (fullNameInput) fullNameInput.value = userData.name || '';
      if (emailInput) emailInput.value = userData.email || currentUser.email || '';
      if (phoneInput) phoneInput.value = userData.phone || '';
      
      if (userData.address) {
        const addressInput = document.getElementById('address');
        const cityInput = document.getElementById('city');
        const stateInput = document.getElementById('state');
        const zipCodeInput = document.getElementById('zipCode');
        const countrySelect = document.getElementById('country');
        
        if (addressInput) addressInput.value = userData.address.street || '';
        if (cityInput) cityInput.value = userData.address.city || '';
        if (stateInput) stateInput.value = userData.address.state || '';
        if (zipCodeInput) zipCodeInput.value = userData.address.zipCode || '';
        if (countrySelect) countrySelect.value = userData.address.country || 'US';
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
}

// Initialize checkout steps
function initializeCheckoutSteps() {
  console.log("Initializing checkout steps");
  
  // Next buttons - FIXED: Find the step by traversing up the DOM
  nextButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log("Next button clicked");
      
      // Find the parent step by climbing up the DOM
      const currentStep = btn.closest('.checkout-step');
      if (!currentStep) {
        console.error("Could not find parent step");
        return;
      }
      
      const nextStepId = btn.getAttribute('data-next');
      console.log("Current step:", currentStep.id, "Next step:", nextStepId);
      
      if (validateStep(currentStep.id)) {
        goToStep(nextStepId);
      }
    });
  });

  // Previous buttons - FIXED: Find the step by traversing up the DOM
  prevButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log("Previous button clicked");
      
      const prevStepId = btn.getAttribute('data-prev');
      console.log("Going to previous step:", prevStepId);
      
      goToStep(prevStepId);
    });
  });

  // Payment method selection
  paymentMethods.forEach(method => {
    method.addEventListener('change', (e) => {
      console.log("Payment method changed:", e.target.value);
      togglePaymentDetails(e.target.value);
    });
  });
  
  // Initialize with first payment method visible
  const checkedPayment = document.querySelector('input[name="payment"]:checked');
  if (checkedPayment) {
    togglePaymentDetails(checkedPayment.value);
  }
}

// Go to specific step
function goToStep(stepId) {
  console.log("Going to step:", stepId);
  
  // Hide all steps
  checkoutSteps.forEach(step => {
    step.classList.remove('active');
  });
  
  // Show the target step
  const targetStep = document.getElementById(stepId);
  if (targetStep) {
    targetStep.classList.add('active');
  } else {
    console.error("Target step not found:", stepId);
    return;
  }
  
  // Update step indicators
  const indicators = document.querySelectorAll('.step-indicator');
  indicators.forEach(indicator => {
    indicator.classList.remove('active', 'completed');
  });
  
  // Mark completed steps
  let stepReached = false;
  indicators.forEach(indicator => {
    if (!stepReached) {
      indicator.classList.add('active');
      if (indicator.dataset.step === stepId) {
        stepReached = true;
      } else {
        indicator.classList.add('completed');
      }
    }
  });
  
  // If going to review step, update the shipping review
  if (stepId === 'review-step') {
    updateReviewShipping();
  }
}

// Update review shipping section
function updateReviewShipping() {
  const reviewShipping = document.getElementById('review-shipping');
  if (!reviewShipping) return;
  
  const fullName = document.getElementById('fullName')?.value || '';
  const address = document.getElementById('address')?.value || '';
  const city = document.getElementById('city')?.value || '';
  const state = document.getElementById('state')?.value || '';
  const zipCode = document.getElementById('zipCode')?.value || '';
  const country = document.getElementById('country')?.value || '';
  const phone = document.getElementById('phone')?.value || '';
  const email = document.getElementById('email')?.value || '';
  
  reviewShipping.innerHTML = `
    <p><strong>${fullName}</strong></p>
    <p>${address}</p>
    <p>${city}, ${state} ${zipCode}</p>
    <p>${country}</p>
    <p>📞 ${phone}</p>
    <p>✉️ ${email}</p>
  `;
}

// Validate step before proceeding
function validateStep(stepId) {
  console.log("Validating step:", stepId);
  
  switch(stepId) {
    case 'shipping-step':
      return validateShippingInfo();
    case 'payment-step':
      return validatePaymentInfo();
    default:
      return true;
  }
}

// Validate shipping information
function validateShippingInfo() {
  const required = ['fullName', 'address', 'city', 'state', 'zipCode', 'country', 'phone'];
  let isValid = true;
  let firstInvalid = null;
  
  required.forEach(field => {
    const input = document.getElementById(field);
    if (input && !input.value.trim()) {
      input.classList.add('error');
      isValid = false;
      if (!firstInvalid) firstInvalid = input;
    } else if (input) {
      input.classList.remove('error');
    }
  });
  
  // Validate email
  const email = document.getElementById('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email.value)) {
    email.classList.add('error');
    isValid = false;
    if (!firstInvalid) firstInvalid = email;
  } else if (email) {
    email.classList.remove('error');
  }
  
  if (!isValid) {
    alert('Please fill in all required fields correctly');
    if (firstInvalid) firstInvalid.focus();
  }
  
  return isValid;
}

// Validate payment information
function validatePaymentInfo() {
  const selectedPayment = document.querySelector('input[name="payment"]:checked');
  
  if (!selectedPayment) {
    alert('Please select a payment method');
    return false;
  }
  
  const paymentMethod = selectedPayment.value;
  
  if (paymentMethod === 'card') {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardName = document.getElementById('cardName').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;
    
    if (!cardNumber || cardNumber.length < 16) {
      alert('Please enter a valid card number');
      document.getElementById('cardNumber')?.focus();
      return false;
    }
    
    if (!cardName) {
      alert('Please enter the name on card');
      document.getElementById('cardName')?.focus();
      return false;
    }
    
    if (!cardExpiry || !cardExpiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
      alert('Please enter a valid expiry date (MM/YY)');
      document.getElementById('cardExpiry')?.focus();
      return false;
    }
    
    if (!cardCvv || cardCvv.length < 3) {
      alert('Please enter a valid CVV');
      document.getElementById('cardCvv')?.focus();
      return false;
    }
  }
  
  return true;
}

// Toggle payment details based on selected method
function togglePaymentDetails(method) {
  const cardDetails = document.getElementById('card-details');
  const transferDetails = document.getElementById('transfer-details');
  
  if (method === 'card') {
    if (cardDetails) cardDetails.style.display = 'block';
    if (transferDetails) transferDetails.style.display = 'none';
  } else if (method === 'transfer') {
    if (cardDetails) cardDetails.style.display = 'none';
    if (transferDetails) transferDetails.style.display = 'block';
    
    // Generate unique reference
    const reference = 'COTTAGE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const refElement = document.getElementById('transferReference');
    if (refElement) refElement.textContent = reference;
  }
}

// Initialize input formatters
function initializeInputFormatters() {
  // Format card number input
  document.getElementById('cardNumber')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    let formatted = '';
    
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += value[i];
    }
    
    e.target.value = formatted;
  });

  // Format expiry date
  document.getElementById('cardExpiry')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
      value = value.substr(0, 2) + '/' + value.substr(2, 2);
    }
    
    e.target.value = value;
  });

  // Format CVV
  document.getElementById('cardCvv')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substr(0, 4);
  });
}

// Place order
if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', async () => {
    console.log("Place order clicked");
    
    if (!validatePaymentInfo()) return;
    
    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
    
    try {
      // Show loading state
      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Processing...';
      
      // Get shipping info
      const shippingInfo = {
        fullName: document.getElementById('fullName')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        address: document.getElementById('address')?.value || '',
        city: document.getElementById('city')?.value || '',
        state: document.getElementById('state')?.value || '',
        zipCode: document.getElementById('zipCode')?.value || '',
        country: document.getElementById('country')?.value || ''
      };
      
      // Get payment info
      let paymentInfo = { method: selectedPayment };
      
      if (selectedPayment === 'card') {
        paymentInfo = {
          ...paymentInfo,
          cardLast4: document.getElementById('cardNumber')?.value.slice(-4) || '',
          cardType: detectCardType(document.getElementById('cardNumber')?.value || '')
        };
      } else if (selectedPayment === 'transfer') {
        paymentInfo = {
          ...paymentInfo,
          reference: document.getElementById('transferReference')?.textContent || ''
        };
      }
      
      // Calculate totals
      const { subtotal, shipping, tax, total } = calculateTotals(cartItems);
      
      // Create order object
      const order = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cartItems,
        shipping: shippingInfo,
        payment: paymentInfo,
        summary: {
          subtotal,
          shipping,
          tax,
          total
        },
        status: selectedPayment === 'transfer' ? 'pending_payment' : 'processing',
        createdAt: serverTimestamp(),
        orderNumber: generateOrderNumber()
      };
      
      console.log("Saving order:", order);
      
      // Save order to Firestore
      const orderRef = await addDoc(collection(db, "orders"), order);
      
      // Save shipping address to user profile for future use
      await updateDoc(doc(db, "users", currentUser.uid), {
        address: shippingInfo,
        phone: shippingInfo.phone,
        lastOrder: serverTimestamp()
      });
      
      // Clear cart
      await updateDoc(doc(db, "carts", currentUser.uid), {
        items: []
      });
      
      // Clear localStorage cart
      localStorage.removeItem('cart');
      
      // Update cart count
      if (window.updateCartCount) window.updateCartCount();
      
      console.log("Order placed successfully:", orderRef.id);
      
      // Redirect to order confirmation
      window.location.href = `order-confirmation.html?order=${orderRef.id}`;
      
    } catch (error) {
      console.error("Order processing error:", error);
      alert('Failed to process order. Please try again.');
      
      // Reset button
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = 'Place Order';
    }
  });
}

// Generate order number
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `COTT-${timestamp}-${random}`;
}

// Detect card type
function detectCardType(cardNumber) {
  const firstDigit = cardNumber[0];
  const firstTwoDigits = cardNumber.substr(0, 2);
  
  if (firstDigit === '4') return 'Visa';
  if (firstDigit === '5') return 'Mastercard';
  if (firstDigit === '3' && [4, 7].includes(parseInt(firstTwoDigits))) return 'Amex';
  if (firstDigit === '6') return 'Discover';
  
  return 'Unknown';
}

// Show empty cart
function showEmptyCart() {
  const container = document.querySelector('.checkout-container');
  if (container) {
    container.innerHTML = `
      <div class="empty-checkout">
        <i class='bx bx-cart'></i>
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart before checking out.</p>
        <a href="shop.html" class="shop-now-btn">Continue Shopping</a>
      </div>
    `;
  }
}

// Show error
function showError(message) {
  const container = document.querySelector('.checkout-container');
  if (container) {
    container.innerHTML = `
      <div class="checkout-error">
        <i class='bx bx-error-circle'></i>
        <h2>Something went wrong</h2>
        <p>${message}</p>
        <a href="cart.html" class="btn">Back to Cart</a>
      </div>
    `;
  }
}

// Export functions
export async function getCheckoutCart() {
  return cartItems;
}

