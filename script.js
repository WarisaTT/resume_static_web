// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

document.documentElement.setAttribute('data-theme', currentTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Reveal on Scroll
function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}

window.addEventListener("scroll", function() {
    reveal();
    const nav = document.querySelector("nav");
    if (window.scrollY > 50) {
        nav.classList.add("scrolled");
    } else {
        nav.classList.remove("scrolled");
    }
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Initial check
reveal();

// ==================== Profile Carousel ====================
(function() {
    const photos = document.querySelectorAll('.profile-photo');
    const dots = document.querySelectorAll('.profile-dots .dot');
    if (photos.length === 0) return;

    let current = 0;
    let interval;

    function showPhoto(index) {
        photos.forEach(p => p.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        photos[index].classList.add('active');
        dots[index].classList.add('active');
        current = index;
    }

    function nextPhoto() {
        showPhoto((current + 1) % photos.length);
    }

    function startAutoPlay() {
        interval = setInterval(nextPhoto, 3500);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            clearInterval(interval);
            showPhoto(parseInt(dot.dataset.index));
            startAutoPlay();
        });
    });

    startAutoPlay();
})();
