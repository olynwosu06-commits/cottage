// 1. Hamburger Menu Toggle
const menuIcon = document.getElementById('menu-icon');
const overlay = document.querySelector('.overlay');
const closeIcon = document.querySelector('.close-icon');
const navLinks = document.querySelector('.nav-links');

menuIcon.addEventListener('click', () => {
    navLinks.classList.add('active');
    overlay.classList.add('active');
});

closeIcon.addEventListener('click', () => {
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
});

//2. Account toggle
const accountIcons = document.querySelectorAll('.accountIcon');

accountIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        window.location.href = "account.html";
    });
});



//3. BRAND NAME
brandName = document.querySelectorAll('.brandName')

brandName.forEach(icoon =>{
    icoon.addEventListener('click', ()=>{
        window.location.href = 'index.html'
    })
})


