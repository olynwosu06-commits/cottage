import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
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
// First check localStorage for quick redirect
(function() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        console.log("User detected in localStorage, redirecting to dashboard...");
        window.location.replace('../SHOP_FOLDER/account-dashboard.html');
        return;
    }
})();

// Then check Firebase Auth
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User already logged in from Firebase, redirecting...");
        // Save to localStorage if not already there
        if (user.displayName) {
            localStorage.setItem('userName', user.displayName.split(' ')[0]);
        }
        window.location.replace('../SHOP_FOLDER/account-dashboard.html');
    }
});

// ========================================
// DOM ELEMENTS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Account page initialized');
    
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const registerFormElement = document.getElementById('registerFormElement');
    const loginFormElement = document.getElementById('loginFormElement');
    const forgotPasswordLink = document.getElementById('forgotPassword');


    // Add this inside your DOMContentLoaded event listener

// Forgot Password Modal
const modal = document.getElementById('forgotPasswordModal');
const closeModal = document.querySelector('.close-modal');
const sendResetBtn = document.getElementById('sendResetLink');
const resetEmail = document.getElementById('resetEmail');

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Show the modal
        if (modal) {
            modal.style.display = 'block';
            resetEmail.value = ''; // Clear previous input
        } else {
            // Fallback to prompt if modal doesn't exist
            handleForgotPasswordFallback();
        }
    });
}

// Close modal when clicking X
if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Handle send reset link
if (sendResetBtn) {
    sendResetBtn.addEventListener('click', async () => {
        const email = resetEmail.value.trim();
        
        if (!email) {
            showToast({
                type: 'warning',
                title: 'Email Required',
                message: 'Please enter your email address'
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
        
        // Close modal
        modal.style.display = 'none';
        
        // Show loading toast
        showToast({
            type: 'info',
            title: 'Sending...',
            message: 'Please wait while we send your reset link'
        });
        
        try {
            await sendPasswordResetEmail(auth, email);
            
            showToast({
                type: 'success',
                title: 'Email Sent! ✅',
                message: `Password reset link has been sent to ${email}`,
                duration: 5000
            });
            
        } catch (error) {
            console.error("Password reset error:", error);
            
            let message = '';
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'No account found with this email. Please register first.';
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
        }
    });
}

// Fallback function using prompt
function handleForgotPasswordFallback() {
    const email = prompt("Please enter your email address to reset your password:");
    
    if (!email) return;
    
    if (!email.includes('@') || !email.includes('.')) {
        showToast({
            type: 'error',
            title: 'Invalid Email',
            message: 'Please enter a valid email address'
        });
        return;
    }
    
    showToast({
        type: 'info',
        title: 'Sending...',
        message: 'Please wait while we send your reset link'
    });
    
    sendPasswordResetEmail(auth, email)
        .then(() => {
            showToast({
                type: 'success',
                title: 'Email Sent! ✅',
                message: `Password reset link has been sent to ${email}`,
                duration: 5000
            });
        })
        .catch((error) => {
            let message = '';
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'No account found with this email.';
                    break;
                case 'auth/invalid-email':
                    message = 'Please enter a valid email address.';
                    break;
                default:
                    message = 'Error sending reset email.';
            }
            
            showToast({
                type: 'error',
                title: 'Reset Failed',
                message: message
            });
        });
}
    
    // ========================================
    // TOGGLE BETWEEN FORMS
    // ========================================
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        });
    }
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
        });
    }
    
    // ========================================
    // PASSWORD STRENGTH CHECKER
    // ========================================
    const passwordInput = document.getElementById('register-password');
    const strengthBar = document.querySelector('.strength-bar');
    const requirementsDiv = document.getElementById('passwordRequirements');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = checkPasswordStrength(password);
            updatePasswordStrengthUI(strength);
            updatePasswordRequirements(password);
        });
    }
    
    function checkPasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    }
    
    function updatePasswordStrengthUI(strength) {
        if (strengthBar) {
            strengthBar.className = 'strength-bar';
            strengthBar.classList.add(strength);
        }
    }
    
    function updatePasswordRequirements(password) {
        if (!requirementsDiv) return;
        
        const requirements = [
            { test: password.length >= 8, text: 'At least 8 characters' },
            { test: /[A-Z]/.test(password), text: 'Uppercase letter' },
            { test: /[a-z]/.test(password), text: 'Lowercase letter' },
            { test: /[0-9]/.test(password), text: 'Number' },
            { test: /[^A-Za-z0-9]/.test(password), text: 'Special character' }
        ];
        
        let html = '';
        requirements.forEach(req => {
            html += `
                <span class="${req.test ? 'valid' : 'invalid'}">
                    <i class='bx ${req.test ? 'bx-check-circle' : 'bx-x-circle'}'></i>
                    ${req.text}
                </span>
            `;
        });
        
        requirementsDiv.innerHTML = html;
    }
    
    // ========================================
    // REGISTER FORM SUBMISSION
    // ========================================
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('register-name')?.value.trim();
            const email = document.getElementById('register-email')?.value.trim();
            const password = document.getElementById('register-password')?.value;
            const termsChecked = document.getElementById('termsCheckbox')?.checked;
            
            if (!username || !email || !password) {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Please fill in all fields'
                });
                return;
            }
            
            if (!termsChecked) {
                showToast({
                    type: 'warning',
                    title: 'Terms Required',
                    message: 'Please accept the Terms of Service'
                });
                return;
            }
            
            const strength = checkPasswordStrength(password);
            if (strength === 'weak') {
                showToast({
                    type: 'warning',
                    title: 'Weak Password',
                    message: 'Please choose a stronger password'
                });
                return;
            }
            
            // Show loading state
            const submitBtn = registerFormElement.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Creating Account...</span><div class="spinner"></div>';
            submitBtn.disabled = true;
            
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                await updateProfile(user, {
                    displayName: username
                });
                
                await setDoc(doc(db, "users", user.uid), {
                    name: username,
                    email: email,
                    createdAt: new Date().toISOString(),
                    cart: [],
                    orders: [],
                    wishlist: []
                });
                
                localStorage.setItem('userName', username.split(' ')[0]);
                localStorage.setItem('userEmail', email);
                
                showToast({
                    type: 'success',
                    title: 'Welcome!',
                    message: 'Account created successfully'
                });
                
                setTimeout(() => {
                    window.location.href = '../SHOP_FOLDER/account-dashboard.html';
                }, 1500);
                
            } catch (error) {
                console.error("Registration error:", error);
                
                let message = 'Registration failed. ';
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        message = 'This email is already registered. Please login instead.';
                        break;
                    case 'auth/invalid-email':
                        message = 'Please enter a valid email address.';
                        break;
                    default:
                        message = error.message;
                }
                
                showToast({
                    type: 'error',
                    title: 'Registration Failed',
                    message: message
                });
                
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // ========================================
    // LOGIN FORM SUBMISSION
    // ========================================
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value;
            const rememberMe = document.getElementById('rememberMe')?.checked;
            
            if (!email || !password) {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Please fill in all fields'
                });
                return;
            }
            
            const submitBtn = loginFormElement.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Signing In...</span><div class="spinner"></div>';
            submitBtn.disabled = true;
            
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Get user's name from Firestore or displayName
                let userName = 'User';
                if (user.displayName) {
                    userName = user.displayName.split(' ')[0];
                } else {
                    // Try to get from Firestore
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        userName = userData.name ? userData.name.split(' ')[0] : 'User';
                    }
                }
                
                localStorage.setItem('userName', userName);
                localStorage.setItem('userEmail', user.email);
                
                if (rememberMe) {
                    localStorage.setItem('rememberUser', 'true');
                }
                
                showToast({
                    type: 'success',
                    title: 'Welcome Back!',
                    message: 'Login successful'
                });
                
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '../SHOP_FOLDER/account-dashboard.html';
                sessionStorage.removeItem('redirectAfterLogin');
                
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500);
                
            } catch (error) {
                console.error("Login error:", error);
                
                let message = 'Login failed. ';
                switch (error.code) {
                    case 'auth/user-not-found':
                        message = 'No account found with this email. Please register.';
                        break;
                    case 'auth/wrong-password':
                        message = 'Incorrect password. Please try again.';
                        break;
                    case 'auth/invalid-email':
                        message = 'Please enter a valid email address.';
                        break;
                    case 'auth/too-many-requests':
                        message = 'Too many failed attempts. Please try again later.';
                        break;
                    default:
                        message = error.message;
                }
                
                showToast({
                    type: 'error',
                    title: 'Login Failed',
                    message: message
                });
                
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // ========================================
    // FORGOT PASSWORD
    // ========================================
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email')?.value.trim();
            
            if (!email) {
                showToast({
                    type: 'warning',
                    title: 'Email Required',
                    message: 'Please enter your email address first'
                });
                return;
            }
            
            try {
                await sendPasswordResetEmail(auth, email);
                
                showToast({
                    type: 'success',
                    title: 'Email Sent',
                    message: 'Password reset link has been sent to your email'
                });
                
            } catch (error) {
                console.error("Password reset error:", error);
                
                let message = '';
                switch (error.code) {
                    case 'auth/user-not-found':
                        message = 'No account found with this email.';
                        break;
                    case 'auth/invalid-email':
                        message = 'Please enter a valid email address.';
                        break;
                    default:
                        message = 'Error sending reset email. Please try again.';
                }
                
                showToast({
                    type: 'error',
                    title: 'Reset Failed',
                    message: message
                });
            }
        });
    }
    
    // ========================================
    // SOCIAL LOGIN
    // ========================================
    window.handleSocialLogin = async (provider) => {
        try {
            let authProvider;
            
            switch (provider) {
                case 'google':
                    authProvider = googleProvider;
                    break;
                case 'facebook':
                    authProvider = facebookProvider;
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
                    cart: [],
                    orders: [],
                    wishlist: []
                });
            }
            
            // Save to localStorage
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
    
    // ========================================
    // TOAST NOTIFICATION FUNCTION
    // ========================================
    function showToast({ type = 'info', title = 'Notification', message, duration = 3000 }) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || '📢'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        container.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
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
// PASSWORD TOGGLE FUNCTION
// ========================================
window.togglePassword = (inputId) => {
    const input = document.getElementById(inputId);
    const icon = event.currentTarget.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bx-hide');
        icon.classList.add('bx-show');
    } else {
        input.type = 'password';
        icon.classList.remove('bx-show');
        icon.classList.add('bx-hide');
    }
};