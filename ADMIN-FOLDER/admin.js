import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Global variables
let currentEditId = null;
let productToDelete = null;

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.admin-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    
    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// DELETE MODAL FUNCTIONS
// ============================================
window.showDeleteModal = function(productId, productName) {
    console.log("Opening delete modal for:", productName);
    productToDelete = productId;
    
    let modal = document.getElementById('deleteModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'deleteModal';
        modal.className = 'delete-modal';
        modal.innerHTML = `
            <div class="delete-modal-content">
                <div class="delete-modal-header">
                    <span class="delete-modal-icon">🗑️</span>
                    <h3>Delete Product</h3>
                </div>
                <div class="delete-modal-body">
                    <p>Are you sure you want to delete <strong id="deleteProductName"></strong>?</p>
                    <p class="delete-warning">⚠️ This action cannot be undone!</p>
                </div>
                <div class="delete-modal-footer">
                    <button class="delete-cancel-btn" id="cancelDeleteBtn">Cancel</button>
                    <button class="delete-confirm-btn" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
        document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
        
        // Add click outside to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeDeleteModal();
        });
    }
    
    document.getElementById('deleteProductName').textContent = productName;
    modal.classList.add('show');
};

window.closeDeleteModal = function() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('show');
        productToDelete = null;
    }
};

window.confirmDelete = async function() {
    if (!productToDelete) {
        closeDeleteModal();
        return;
    }
    
    try {
        await deleteDoc(doc(db, "products", productToDelete));
        showToast('✅ Product deleted successfully!', 'success');
        loadProducts();
        closeDeleteModal();
    } catch (error) {
        console.error("Error deleting product: ", error);
        showToast('❌ Error deleting product: ' + error.message, 'error');
        closeDeleteModal();
    }
};

// ============================================
// CATEGORY MAPPING
// ============================================
const categoryMap = {
    'bath': 'Bath & Body',
    'body1': 'Body Lotion',
    'face': 'Face',
    'faceMask': 'Face Mask',
    'faceWash': 'Face Wash',
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

// ============================================
// CURRENCY FORMATTING
// ============================================
function formatNaira(amount) {
    if (!amount && amount !== 0) return '₦0.00';
    return '₦' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getCategoryDisplayName(categoryKey) {
    return categoryMap[categoryKey] || categoryKey || 'Uncategorized';
}

// ============================================
// POPULATE EDIT CATEGORY DROPDOWN
// ============================================
function populateEditCategoryDropdown() {
    const editCategory = document.getElementById('editCategory');
    if (!editCategory) return;
    
    editCategory.innerHTML = '';
    
    Object.entries(categoryMap).forEach(([value, display]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = display;
        editCategory.appendChild(option);
    });
}

// ============================================
// ADD PRODUCT
// ============================================
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const imageUrl = document.getElementById('imageUrl').value.trim();
    const productName = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const description = document.getElementById('description').value.trim();
    const category = document.getElementById('category').value;

    if (!imageUrl || !productName || !price || !description || !category) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    if (!imageUrl.startsWith('http')) {
        showToast('Please enter a valid image URL starting with http:// or https://', 'error');
        return;
    }

    if (isNaN(price) || price <= 0) {
        showToast('Please enter a valid price greater than 0', 'error');
        return;
    }

    try {
        await addDoc(collection(db, "products"), {
            name: productName,
            price: price,
            description: description,
            imageUrl: imageUrl,
            category: category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        document.getElementById('productForm').reset();
        showToast('✅ Product added successfully!', 'success');
        loadProducts();
    } catch (error) {
        console.error("Error adding product: ", error);
        showToast('❌ Error adding product: ' + error.message, 'error');
    }
});

// ============================================
// LOAD PRODUCTS
// ============================================
async function loadProducts() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '<div class="loading">Loading products...</div>';

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        productsList.innerHTML = '';

        if (querySnapshot.empty) {
            productsList.innerHTML = '<p class="no-products">No products found. Add your first product!</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productId = doc.id;
            
            const categoryDisplay = getCategoryDisplayName(product.category);
            
            // Escape product name for JavaScript (handles quotes)
            const escapedProductName = product.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300?text=Image+Not+Found'">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatNaira(product.price)}</div>
                    <div class="product-category">
                        <strong>Category:</strong> ${categoryDisplay}
                    </div>
                    <div class="product-description">
                        <strong>Description:</strong> ${product.description ? 
                            (product.description.substring(0, 50) + (product.description.length > 50 ? '...' : '')) 
                            : 'No description'}
                    </div>
                </div>
                <div class="product-actions">
                    <button class="edit-btn" onclick="editProduct('${productId}')">Edit</button>
                    <button class="delete-btn" onclick="showDeleteModal('${productId}', '${escapedProductName}')">Delete</button>
                </div>
            `;
            productsList.appendChild(productCard);
        });
    } catch (error) {
        console.error("Error loading products: ", error);
        productsList.innerHTML = '❌ Error loading products. Please try again.';
        showToast('❌ Error loading products', 'error');
    }
}

// ============================================
// EDIT PRODUCT
// ============================================
window.editProduct = async (productId) => {
    currentEditId = productId;
    
    try {
        const productDoc = await getDoc(doc(db, "products", productId));
        
        if (productDoc.exists()) {
            const product = productDoc.data();
            
            document.getElementById('editProductName').value = product.name || '';
            document.getElementById('editPrice').value = product.price || '';
            document.getElementById('editDescription').value = product.description || '';
            document.getElementById('editImage').value = product.imageUrl || '';
            
            const categorySelect = document.getElementById('editCategory');
            if (categorySelect) {
                categorySelect.value = product.category || 'bath';
            }
            
            document.getElementById('editModal').style.display = 'flex';
        } else {
            showToast('Product not found', 'error');
        }
    } catch (error) {
        console.error("Error loading product for edit: ", error);
        showToast('❌ Error loading product details', 'error');
    }
};

// ============================================
// UPDATE PRODUCT
// ============================================
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productName = document.getElementById('editProductName').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDescription').value.trim();
    const imageUrl = document.getElementById('editImage').value.trim();
    const category = document.getElementById('editCategory').value;

    if (!productName || !price || !description || !imageUrl || !category) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    if (!imageUrl.startsWith('http')) {
        showToast('Please enter a valid image URL starting with http:// or https://', 'error');
        return;
    }

    if (isNaN(price) || price <= 0) {
        showToast('Please enter a valid price greater than 0', 'error');
        return;
    }

    try {
        const productRef = doc(db, "products", currentEditId);

        await updateDoc(productRef, {
            name: productName,
            price: price,
            description: description,
            imageUrl: imageUrl,
            category: category,
            updatedAt: new Date().toISOString()
        });

        closeModal();
        showToast('✅ Product updated successfully!', 'success');
        loadProducts();
    } catch (error) {
        console.error("Error updating product: ", error);
        showToast('❌ Error updating product: ' + error.message, 'error');
    }
});

// ============================================
// MODAL CONTROLS
// ============================================
window.closeModal = () => {
    document.getElementById('editModal').style.display = 'none';
    currentEditId = null;
    document.getElementById('editForm').reset();
};

window.onclick = (event) => {
    const modal = document.getElementById('editModal');
    if (modal && event.target === modal) {
        closeModal();
    }
};

// ============================================
// ADD ALL STYLES
// ============================================
function addAllStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Toast Styles */
        .admin-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            max-width: 400px;
            padding: 16px 20px;
            border-radius: 10px;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            border-left: 4px solid;
        }
        
        .admin-toast.show { transform: translateX(0); }
        .admin-toast.success { border-left-color: #4caf50; background: #f1f9f1; }
        .admin-toast.error { border-left-color: #f44336; background: #fef2f2; }
        .admin-toast.warning { border-left-color: #ff9800; background: #fff4e5; }
        .toast-icon { font-size: 24px; }
        .toast-message { color: #333; font-size: 14px; font-weight: 500; flex: 1; }

        /* Delete Modal Styles */
        .delete-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 10001;
            backdrop-filter: blur(5px);
        }
        
        .delete-modal.show { display: flex; }
        
        .delete-modal-content {
            background: white;
            border-radius: 16px;
            max-width: 400px;
            width: 90%;
            animation: modalPop 0.3s ease;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        @keyframes modalPop {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        
        .delete-modal-header {
            background: #fff4f4;
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #ffcdd2;
        }
        
        .delete-modal-icon { font-size: 48px; display: block; margin-bottom: 10px; }
        .delete-modal-header h3 { color: #d32f2f; font-size: 24px; margin: 0; }
        
        .delete-modal-body { padding: 25px 20px; text-align: center; }
        .delete-modal-body p { margin: 10px 0; font-size: 16px; color: #333; }
        .delete-modal-body strong { color: #d32f2f; }
        
        .delete-warning {
            color: #d32f2f !important;
            font-weight: 600;
            font-size: 14px !important;
            background: #ffebee;
            padding: 8px;
            border-radius: 6px;
        }
        
        .delete-modal-footer {
            padding: 20px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            border-top: 1px solid #e0e0e0;
        }
        
        .delete-cancel-btn {
            padding: 10px 24px;
            border: 2px solid #e0e0e0;
            background: white;
            color: #666;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
        }
        
        .delete-cancel-btn:hover { background: #f5f5f5; border-color: #999; }
        
        .delete-confirm-btn {
            padding: 10px 24px;
            border: none;
            background: #d32f2f;
            color: white;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
        }
        
        .delete-confirm-btn:hover {
            background: #b71c1c;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(211, 47, 47, 0.3);
        }
        
        @media (max-width: 768px) {
            .delete-modal-footer { flex-direction: column; }
            .delete-cancel-btn, .delete-confirm-btn { width: 100%; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin panel initializing...");
    populateEditCategoryDropdown();
    loadProducts();
    addAllStyles();
    
    // Log to confirm functions are available
    console.log("Delete functions ready:", {
        showDeleteModal: typeof window.showDeleteModal,
        closeDeleteModal: typeof window.closeDeleteModal,
        confirmDelete: typeof window.confirmDelete
    });
});

// Load products on page load
loadProducts();