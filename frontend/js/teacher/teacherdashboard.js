document.addEventListener('DOMContentLoaded', function() {
            const hamburger = document.getElementById('hamburger');
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            const profile = document.getElementById('profile');
            const profileDropdown = document.getElementById('profileDropdown');
            
            // Toggle sidebar
            hamburger.addEventListener('click', function() {
                sidebar.classList.toggle('active');
                mainContent.classList.toggle('sidebar-open');
                
                // Change hamburger icon
                const icon = hamburger.querySelector('i');
                if (sidebar.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
            
            // Toggle profile dropdown
            profile.addEventListener('click', function() {
                profileDropdown.classList.toggle('active');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(event) {
                if (!profile.contains(event.target) && !profileDropdown.contains(event.target)) {
                    profileDropdown.classList.remove('active');
                }
            });
            
            // Close sidebar when clicking on a link (for mobile)
            const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
            sidebarLinks.forEach(link => {
                link.addEventListener('click', function() {
                    if (window.innerWidth < 992) {
                        sidebar.classList.remove('active');
                        mainContent.classList.remove('sidebar-open');
                        hamburger.querySelector('i').classList.remove('fa-times');
                        hamburger.querySelector('i').classList.add('fa-bars');
                    }
                });
            });
        });