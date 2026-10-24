import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    sendEmailVerification,
    updateProfile,
    onAuthStateChanged,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

// Social Media Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ========================================
// CHECK IF USER IS ALREADY LOGGED IN
// ========================================
(function() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        console.log("User detected in localStorage, redirecting to dashboard...");
        window.location.replace('../SHOP_FOLDER/account-dashboard.html');
        return;
    }
})();

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User already logged in from Firebase, redirecting...");
        if (user.displayName) {
            localStorage.setItem('userName', user.displayName.split(' ')[0]);
        }
        window.location.replace('../SHOP_FOLDER/account-dashboard.html');
    }
});

// ========================================
// DOM ELEMENTS AND FORM TOGGLE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Account page initialized');
    
    // Get all DOM elements
    const accountForm = document.getElementById('accountForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordGroup = document.querySelector('.password-group');
    const confirmPasswordGroup = document.querySelector('.confirm-password-group');
    const termsGroup = document.querySelector('.terms-group');
    const submitBtn = document.getElementById('submitBtn');
    const toggleFormBtn = document.getElementById('toggleForm');
    const togglePrompt = document.getElementById('togglePrompt');
    const continueShopBtn = document.getElementById('continueWithShop');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const passwordStrength = document.getElementById('passwordStrength');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPassword = document.getElementById('forgotPassword');
    
    let isSignIn = true; // true = Sign In mode, false = Create Account mode
    
 // ========================================
// TOGGLE BETWEEN SIGN IN AND CREATE ACCOUNT
// ========================================
function toggleFormMode() {
    isSignIn = !isSignIn;
    
    if (isSignIn) {
        // Switch to Sign In mode
        formTitle.textContent = 'Sign in';
        formSubtitle.textContent = 'Sign in to your account';
        togglePrompt.innerHTML = 'Don\'t have an account? <button type="button" id="toggleForm" class="toggle-link">Create one</button>';
        
        // Hide create account fields
        confirmPasswordGroup.style.display = 'none';
        termsGroup.style.display = 'none';
        passwordStrength.style.display = 'none';
        
        // Show forgot password link
        forgotPasswordLink.style.display = 'block';
        
        // Update button text
        submitBtn.textContent = 'Sign In';
        
        // Update password field label and placeholder
        document.querySelector('.password-group label').textContent = 'Password';
        passwordInput.placeholder = 'Enter your password';
        
        // Update required attributes
        passwordInput.required = true;
        confirmPasswordInput.required = false;
        document.getElementById('termsCheckbox').required = false;
        
        // Clear confirm password field
        confirmPasswordInput.value = '';
        if (passwordStrength) passwordStrength.innerHTML = '';
        
    } else {
        // Switch to Create Account mode
        formTitle.textContent = 'Create account';
        formSubtitle.textContent = 'Join our beauty community';
        togglePrompt.innerHTML = 'Already have an account? <button type="button" id="toggleForm" class="toggle-link">Sign in</button>';
        
        // Show create account fields
        confirmPasswordGroup.style.display = 'block';
        termsGroup.style.display = 'block';
        passwordStrength.style.display = 'block';
        
        // Hide forgot password link
        forgotPasswordLink.style.display = 'none';
        
        // Update button text
        submitBtn.textContent = 'Create account';
        
        // Update password field label and placeholder
        document.querySelector('.password-group label').textContent = 'Create Password';
        passwordInput.placeholder = 'Create a password';
        
        // Add required attributes
        passwordInput.required = true;
        confirmPasswordInput.required = true;
        document.getElementById('termsCheckbox').required = true;
    }
    
    // Re-attach event listener to new toggle button
    document.getElementById('toggleForm').addEventListener('click', toggleFormMode);
}
    
    // Initial toggle button event listener
    if (toggleFormBtn) {
        toggleFormBtn.addEventListener('click', toggleFormMode);
    }
    
    // ========================================
    // FORGOT PASSWORD
    // ========================================
    if (forgotPassword) {
        forgotPassword.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            
            if (!email) {
                showToast({
                    type: 'warning',
                    title: 'Email Required',
                    message: 'Please enter your email address first'
                });
                return;
            }
            
            if (!email.includes('@') || !email.includes('.')) {
                showToast({
                    type: 'error',
                    title: 'Invalid Email',
                    message: 'Please enter a valid email address'
                });
                return;
            }
            
            // Show loading state on the link
            forgotPassword.textContent = 'Sending...';
            forgotPassword.style.opacity = '0.7';
            forgotPassword.style.pointerEvents = 'none';
            
            try {
                await sendPasswordResetEmail(auth, email);
                
                showToast({
                    type: 'success',
                    title: 'Email Sent! ✅',
                    message: `Password reset link has been sent to ${email}`,
                    duration: 5000
                });
                
                // Clear email input
                emailInput.value = '';
                
            } catch (error) {
                console.error("Password reset error:", error);
                
                let message = '';
                switch (error.code) {
                    case 'auth/user-not-found':
                        message = 'No account found with this email. Please create an account first.';
                        break;
                    case 'auth/invalid-email':
                        message = 'Please enter a valid email address.';
                        break;
                    case 'auth/too-many-requests':
                        message = 'Too many attempts. Please try again later.';
                        break;
                    default:
                        message = 'Error sending reset email. Please try again.';
                }
                
                showToast({
                    type: 'error',
                    title: 'Reset Failed',
                    message: message,
                    duration: 4000
                });
                
            } finally {
                // Reset forgot password link
                forgotPassword.textContent = 'Forgot password?';
                forgotPassword.style.opacity = '1';
                forgotPassword.style.pointerEvents = 'auto';
            }
        });
    }
    
    // ========================================
    // PASSWORD STRENGTH CHECKER
    // ========================================
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (!isSignIn) {
                checkPasswordStrength(passwordInput.value);
            }
        });
    }
    
    function checkPasswordStrength(password) {
        if (!passwordStrength) return;
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        let strengthText = '';
        let strengthClass = '';
        
        if (password.length === 0) {
            passwordStrength.innerHTML = '';
            return;
        } else if (strength <= 2) {
            strengthText = 'Weak password';
            strengthClass = 'weak';
        } else if (strength <= 4) {
            strengthText = 'Medium password';
            strengthClass = 'medium';
        } else {
            strengthText = 'Strong password';
            strengthClass = 'strong';
        }
        
        passwordStrength.innerHTML = `
            <div class="strength-text ${strengthClass}">${strengthText}</div>
            <div class="strength-bar">
                <div class="strength-fill ${strengthClass}" style="width: ${strength <= 2 ? '33' : strength <= 4 ? '66' : '100'}%"></div>
            </div>
        `;
    }
    
// ========================================
// FORM SUBMISSION
// ========================================
if (accountForm) {
    accountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validate email
        if (!email) {
            showToast({
                type: 'error',
                title: 'Error',
                message: 'Please enter your email'
            });
            return;
        }
        
        if (!email.includes('@') || !email.includes('.')) {
            showToast({
                type: 'error',
                title: 'Invalid Email',
                message: 'Please enter a valid email address'
            });
            return;
        }
        
        // Validate password (for both modes)
        if (!password) {
            showToast({
                type: 'error',
                title: 'Error',
                message: 'Please enter your password'
            });
            return;
        }
        
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '';
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            if (isSignIn) {
                // SIGN IN MODE - Sign in with email and password
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Check if email is verified
                if (!user.emailVerified) {
                    // Resend verification email
                    await sendEmailVerification(user, {
                        url: window.location.origin + '/SHOP_FOLDER/account-dashboard.html',
                        handleCodeInApp: true
                    });
                    
                    showToast({
                        type: 'warning',
                        title: 'Email Not Verified',
                        message: 'Please check your email to verify your account. A new verification email has been sent.',
                        duration: 6000
                    });
                    
                    // Sign out the user since email isn't verified
                    await auth.signOut();
                    
                    submitBtn.textContent = originalText;
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                    return;
                }
                
                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                let userName = 'User';
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userName = userData.name ? userData.name.split(' ')[0] : 'User';
                } else {
                    // Create user document if it doesn't exist
                    await setDoc(doc(db, "users", user.uid), {
                        name: email.split('@')[0],
                        email: email,
                        createdAt: new Date().toISOString(),
                        emailVerified: user.emailVerified,
                        cart: [],
                        orders: [],
                        wishlist: []
                    });
                    userName = email.split('@')[0];
                }
                
                localStorage.setItem('userName', userName);
                localStorage.setItem('userEmail', user.email);
                
                showToast({
                    type: 'success',
                    title: 'Welcome Back!',
                    message: `Signed in as ${userName}`,
                    duration: 2000
                });
                
                setTimeout(() => {
                    window.location.href = '../SHOP_FOLDER/account-dashboard.html';
                }, 1500);
                
            } else {
                // CREATE ACCOUNT MODE
                const confirmPassword = confirmPasswordInput.value;
                const termsChecked = document.getElementById('termsCheckbox').checked;
                
                // Validate password strength
                if (password.length < 8) {
                    showToast({
                        type: 'error',
                        title: 'Weak Password',
                        message: 'Password must be at least 8 characters'
                    });
                    return;
                }
                
                if (password !== confirmPassword) {
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'Passwords do not match'
                    });
                    return;
                }
                
                if (!termsChecked) {
                    showToast({
                        type: 'error',
                        title: 'Terms Required',
                        message: 'Please accept the Terms and Privacy Policy'
                    });
                    return;
                }
                
                // Create account
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Send email verification
                await sendEmailVerification(user, {
                    url: window.location.origin + '/SHOP_FOLDER/account-dashboard.html',
                    handleCodeInApp: true
                });
                
                // Store user in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    name: email.split('@')[0],
                    email: email,
                    createdAt: new Date().toISOString(),
                    emailVerified: false,
                    cart: [],
                    orders: [],
                    wishlist: []
                });
                
                localStorage.setItem('userEmail', email);
                
                showToast({
                    type: 'success',
                    title: 'Account Created! 📧',
                    message: 'Please check your email to verify your account',
                    duration: 5000
                });
                
                // Clear form
                emailInput.value = '';
                passwordInput.value = '';
                confirmPasswordInput.value = '';
                document.getElementById('termsCheckbox').checked = false;
                
                // Switch back to sign in mode after account creation
                if (!isSignIn) toggleFormMode();
            }
            
        } catch (error) {
            console.error("Form error:", error);
            
            let message = 'Something went wrong. Please try again.';
            
            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email. Please create an account.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-credential') {
                message = 'Invalid email or password.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many failed attempts. Please try again later.';
            } else if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already registered. Please sign in instead.';
                // Switch to sign in mode
                if (!isSignIn) toggleFormMode();
            } else if (error.code === 'auth/weak-password') {
                message = 'Password is too weak. Please choose a stronger password.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            }
            
            showToast({
                type: 'error',
                title: 'Error',
                message: message
            });
            
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}    
    // ========================================
    // CONTINUE WITH SHOP BUTTON
    // ========================================
    if (continueShopBtn) {
        continueShopBtn.addEventListener('click', () => {
            showToast({
                type: 'success',
                title: 'Welcome!',
                message: 'Continuing as guest...'
            });
            
            setTimeout(() => {
                window.location.href = '../HTML/index.html';
            }, 1000);
        });
    }
    
    // ========================================
    // TOAST NOTIFICATION FUNCTION
    // ========================================
    function showToast({ type, title, message, duration = 3000 }) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || 'ℹ'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        container.appendChild(toast);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }
    
    // ========================================
    // HAMBURGER MENU TOGGLE
    // ========================================
    const menuIcon = document.getElementById('menu-icon');
    const overlay = document.querySelector('.overlay');
    const closeIcon = document.querySelector('.close-icon');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuIcon) {
        menuIcon.addEventListener('click', () => {
            if (navLinks) navLinks.classList.add('active');
            if (overlay) overlay.classList.add('active');
        });
    }
    
    if (closeIcon) {
        closeIcon.addEventListener('click', () => {
            if (navLinks) navLinks.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (navLinks) navLinks.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    
    // ========================================
    // BRAND NAME CLICK
    // ========================================
    document.querySelectorAll('.brandName').forEach(icoon => {
        icoon.addEventListener('click', () => {
            window.location.href = '../HTML/index.html';
        });
    });
});

// ========================================
// SOCIAL LOGIN FUNCTIONS
// ========================================
window.handleSocialLogin = async (provider) => {
    try {
        let authProvider;
        
        switch (provider) {
            case 'google':
                authProvider = new GoogleAuthProvider();
                break;
            case 'facebook':
                authProvider = new FacebookAuthProvider();
                break;
            case 'apple':
                showToast({
                    type: 'info',
                    title: 'Coming Soon',
                    message: 'Apple login will be available soon'
                });
                return;
            default:
                return;
        }
        
        const result = await signInWithPopup(auth, authProvider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
                name: user.displayName || 'User',
                email: user.email,
                createdAt: new Date().toISOString(),
                emailVerified: user.emailVerified,
                cart: [],
                orders: [],
                wishlist: []
            });
        }
        
        localStorage.setItem('userName', (user.displayName || user.email?.split('@')[0] || 'User').split(' ')[0]);
        localStorage.setItem('userEmail', user.email);
        
        showToast({
            type: 'success',
            title: 'Welcome!',
            message: `Logged in as ${user.displayName || user.email}`
        });
        
        setTimeout(() => {
            window.location.href = '../SHOP_FOLDER/account-dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error("Social login error:", error);
        
        showToast({
            type: 'error',
            title: 'Login Failed',
            message: error.message
        });
    }
};