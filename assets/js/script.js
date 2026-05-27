// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
let currentTheme = 'dark';
try {
    currentTheme = localStorage.getItem('theme') || 'dark';
} catch (e) {
    console.warn('localStorage is not accessible:', e);
}

document.documentElement.setAttribute('data-theme', currentTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            console.warn('localStorage is not accessible:', e);
        }
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

// Smooth Scroll - target section headers for perfect visual alignment below fixed navbar
document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            
            // Focus scroll exactly on the section heading (.section-title) for perfect layout view
            const scrollTarget = targetElement.querySelector('.section-title') || targetElement;
            const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
            
            // Scroll to the heading, leaving 20px breathing room below the sticky nav bar
            const top = scrollTarget.getBoundingClientRect().top + window.scrollY - navHeight - 20;
            
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// Initial check
reveal();

// ==================== Scrapbook Polaroid Collage Interaction ====================
(function() {
    const polaroids = document.querySelectorAll('.scrapbook-polaroid');
    if (polaroids.length === 0) return;

    let maxZIndex = 3;

    polaroids.forEach((polaroid, idx) => {
        polaroid.addEventListener('click', () => {
            maxZIndex++;
            polaroid.style.zIndex = maxZIndex;
            
            // Apply quick pop scaling effect
            polaroid.style.transform = 'scale(1.1) rotate(0deg)';
            
            setTimeout(() => {
                // Assign a small random tilt to maintain the messy scrapbook look
                const randomTilt = (Math.random() * 8 - 4).toFixed(1);
                polaroid.style.transform = `scale(1.02) rotate(${randomTilt}deg)`;
            }, 300);
        });
    });
})();

// ==================== Project Modal Logic ====================
(function() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const modalBackdrop = modal.querySelector('.modal-backdrop');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalCategory = document.getElementById('modal-category');
    const modalHeroImg = document.getElementById('modal-hero-img');
    const modalReadme = document.getElementById('modal-readme');
    const modalTechTags = document.getElementById('modal-tech-tags');
    const modalThumbnails = document.getElementById('modal-thumbnails');
    const modalImageBadge = document.getElementById('modal-image-badge');
    const prevBtn = document.getElementById('modal-prev-btn');
    const nextBtn = document.getElementById('modal-next-btn');

    let currentImages = [];
    let currentImageIndex = 0;

    // Prevent modal triggering when clicking links on cards directly
    document.querySelectorAll('.project-card a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Open Modal
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3') ? card.querySelector('h3').textContent : '';
            const category = card.dataset.category || 'PROJECT';
            const readme = card.dataset.readme || '';
            const repo = card.dataset.repo || '';
            const otherLink = card.dataset.otherLink || '';
            const imagesStr = card.dataset.images || '';
            
            currentImages = imagesStr.split(',').map(i => i.trim()).filter(i => i);
            currentImageIndex = 0;

            // Populate Text Details
            modalTitle.textContent = title;
            modalCategory.textContent = category;
            modalReadme.textContent = readme;

            // Populate Tech Tags
            modalTechTags.innerHTML = '';
            card.querySelectorAll('.tech-tags .tag').forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = tag.textContent;
                modalTechTags.appendChild(span);
            });

            // Populate Action Buttons dynamically
            const modalActions = modal.querySelector('.modal-actions');
            if (modalActions) {
                modalActions.innerHTML = '';
                const isThai = document.documentElement.lang === 'th';
                
                if (repo) {
                    const repoLabel = isThai ? 'GitHub Repository' : 'GitHub Repository';
                    modalActions.innerHTML += `
                        <a href="${repo}" target="_blank" class="modal-btn github-btn" style="display: flex;">
                            <i class="fab fa-github"></i> ${repoLabel}
                        </a>`;
                }
                if (otherLink) {
                    const otherLabel = isThai ? (card.dataset.otherLinkLabelTh || 'ดูรายละเอียด') : (card.dataset.otherLinkLabelEn || 'View Link');
                    
                    // Auto detect icon
                    let iconClass = 'fas fa-external-link-alt';
                    const url = otherLink.toLowerCase();
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        iconClass = 'fab fa-youtube';
                    } else if (url.includes('play.google.com') || url.includes('apps.apple.com')) {
                        iconClass = 'fas fa-mobile-alt';
                    } else if (url.includes('figma.com')) {
                        iconClass = 'fab fa-figma';
                    }
                    
                    modalActions.innerHTML += `
                        <a href="${otherLink}" target="_blank" class="modal-btn" style="display: flex; background: var(--accent); color: var(--text-white); font-weight: 700; border-color: var(--accent);">
                            <i class="${iconClass}"></i> ${otherLabel}
                        </a>`;
                }
            }

            // Setup Gallery
            if (currentImages.length > 0) {
                renderGallery();
            } else {
                // Fallback if no images
                modalHeroImg.src = 'assets/images/favicon.svg';
                modalThumbnails.innerHTML = '';
                modalImageBadge.textContent = '1 / 1';
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            }

            // Open Modal with active transition class
            modal.style.display = 'flex';
            // Reflow
            modal.offsetHeight;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Lock background scrolling
        });
    });

    function renderGallery() {
        // Load initial hero image
        modalHeroImg.src = `assets/images/project_images/${currentImages[currentImageIndex]}`;
        modalHeroImg.alt = modalTitle.textContent;
        
        // Show/hide navigation arrows
        if (currentImages.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }

        updateImageBadge();

        // Render thumbnails
        modalThumbnails.innerHTML = '';
        currentImages.forEach((imgName, idx) => {
            const thumb = document.createElement('img');
            thumb.src = `assets/images/project_images/${imgName}`;
            thumb.alt = `Thumbnail ${idx + 1}`;
            if (idx === currentImageIndex) thumb.className = 'active';
            
            thumb.addEventListener('click', () => {
                changeHeroImage(idx);
            });
            modalThumbnails.appendChild(thumb);
        });
    }

    function changeHeroImage(index) {
        if (index === currentImageIndex) return;
        currentImageIndex = index;

        // Apply smooth cross-fade animation
        modalHeroImg.classList.add('fade-out');
        
        setTimeout(() => {
            modalHeroImg.src = `assets/images/project_images/${currentImages[currentImageIndex]}`;
            updateImageBadge();
            
            // Highlight active thumbnail and scroll into view if overflowed
            const thumbs = modalThumbnails.querySelectorAll('img');
            thumbs.forEach((t, idx) => {
                if (idx === currentImageIndex) {
                    t.classList.add('active');
                    t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } else {
                    t.classList.remove('active');
                }
            });

            // Fade back in when image is loaded or immediately
            modalHeroImg.onload = () => {
                modalHeroImg.classList.remove('fade-out');
            };
            // Fallback in case onload does not trigger
            setTimeout(() => modalHeroImg.classList.remove('fade-out'), 100);
        }, 150);
    }

    function updateImageBadge() {
        modalImageBadge.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
    }

    function navigateGallery(direction) {
        if (currentImages.length <= 1) return;
        let newIndex = currentImageIndex + direction;
        if (newIndex < 0) {
            newIndex = currentImages.length - 1; // Wrap to end
        } else if (newIndex >= currentImages.length) {
            newIndex = 0; // Wrap to start
        }
        changeHeroImage(newIndex);
    }

    // Prev / Next Click Handlers
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateGallery(-1);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateGallery(1);
    });

    // Close Modal Function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Unlock scrolling
        
        // Hide after transition finishes
        setTimeout(() => {
            modal.style.display = 'none';
        }, 350);
    }

    // Close Event Listeners
    modalCloseBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowLeft') {
            navigateGallery(-1);
        } else if (e.key === 'ArrowRight') {
            navigateGallery(1);
        }
    });
})();

// Hero Typewriter Animation
(function() {
    const el = document.getElementById('hero-typing');
    if (!el) return;
    const words = ['Web Applications', 'AI Platforms', 'Automation Tools', 'Beautiful UIs'];
    let wi = 0, ci = 0, deleting = false;
    function tick() {
        const word = words[wi];
        el.textContent = deleting ? word.substring(0, ci--) : word.substring(0, ci++);
        let delay = deleting ? 60 : 100;
        if (!deleting && ci > word.length) {
            delay = 1800;
            deleting = true;
        } else if (deleting && ci < 0) {
            deleting = false;
            wi = (wi + 1) % words.length;
            ci = 0;
            delay = 400;
        }
        setTimeout(tick, delay);
    }
    tick();
})();
