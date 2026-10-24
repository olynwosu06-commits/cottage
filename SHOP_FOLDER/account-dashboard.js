
    // Mobile menu toggle
    document.addEventListener('DOMContentLoaded', function() {
        // Create menu toggle button if it doesn't exist
        const sidebarHeader = document.querySelector('.sidebar-header');
        if (sidebarHeader && !document.querySelector('.menu-toggle')) {
            const menuToggle = document.createElement('div');
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = '<i class="bx bx-menu"></i>';
            sidebarHeader.appendChild(menuToggle);
        }
        
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('.sidebar nav');
        const navFooter = document.querySelector('.nav-footer');
        
        if (menuToggle && nav && navFooter) {
            menuToggle.addEventListener('click', function() {
                nav.classList.toggle('show');
                navFooter.classList.toggle('show');
                menuToggle.innerHTML = nav.classList.contains('show') ? 
                    '<i class="bx bx-x"></i>' : '<i class="bx bx-menu"></i>';
            });
            
            // Close menu when clicking a link on mobile
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', function() {
                    if (window.innerWidth <= 768) {
                        nav.classList.remove('show');
                        navFooter.classList.remove('show');
                        menuToggle.innerHTML = '<i class="bx bx-menu"></i>';
                    }
                });
            });
        }
    });
