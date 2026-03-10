import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR KEY",
    authDomain: "YOUR DOMAIN",
    projectId: "YOUR ID",
    storageBucket: "YOUR BUCKET",
    messagingSenderId: "YOUR SENDER ID",
    appId: "YOUR APP ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadHomeProducts() {
    const container = document.getElementById("homeProducts");

    const querySnapshot = await getDocs(collection(db, "products"));

    container.innerHTML = "";

    querySnapshot.forEach((doc) => {
        const product = doc.data();

        container.innerHTML += `
            <div class="product-card">
                <img src="${product.imageUrl}" class="product-image"/>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>$${product.price}</p>
                </div>
            </div>
        `;
    });
}

loadHomeProducts();
