/**
 * DE TOX - Main JavaScript
 * Handles smooth scrolling navigation, sticky header scroll state,
 * active link highlighting (Scrollspy), and responsive mobile menu.
 */

document.addEventListener('DOMContentLoaded', () => {
    const siteHeader = document.getElementById('site-header');
    const navToggle = document.getElementById('nav-toggle');
    const navLinksList = document.getElementById('nav-links');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');

    // Section IDs tracked by navbar
    const sectionIds = ['about', 'speaker', 'highlights', 'event-details', 'sponsorship', 'contact'];
    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    /**
     * Get the dynamic header height for accurate scroll offset
     */
    const getHeaderOffset = () => {
        if (!siteHeader) return 80;
        return siteHeader.offsetHeight + 16;
    };

    /**
     * Sticky Header Scroll State
     */
    const handleHeaderScroll = () => {
        if (!siteHeader) return;
        if (window.scrollY > 30) {
            siteHeader.classList.add('scrolled');
        } else {
            siteHeader.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    /**
     * Mobile Menu Toggle
     */
    if (navToggle && navLinksList) {
        const toggleMenu = () => {
            const isOpen = navToggle.classList.toggle('open');
            navLinksList.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        const closeMenu = () => {
            navToggle.classList.remove('open');
            navLinksList.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinksList.classList.contains('open') && !navLinksList.contains(e.target) && !navToggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinksList.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    /**
     * Smooth Scrolling for all hash links with exact offset
     */
    const handleSmoothScroll = (e) => {
        const link = e.currentTarget;
        const href = link.getAttribute('href');

        if (!href || !href.startsWith('#')) return;

        // Top / Hero links
        if (href === '#' || href === '#hero' || href === '#top') {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            if (window.history.pushState) {
                history.pushState(null, null, '#hero');
            }
            if (navToggle && navLinksList) {
                navToggle.classList.remove('open');
                navLinksList.classList.remove('open');
                document.body.style.overflow = '';
            }
            return;
        }

        let targetElem = document.querySelector(href);

        // Fallback checks
        if (!targetElem && href === '#for-sponsorship') {
            targetElem = document.getElementById('contact');
        } else if (!targetElem && href === '#contact') {
            targetElem = document.getElementById('for-sponsorship');
        }

        if (targetElem) {
            e.preventDefault();

            // Calculate precise offset so header never covers content
            const headerOffset = getHeaderOffset();
            const elementPosition = targetElem.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: 'smooth'
            });

            if (window.history.pushState) {
                history.pushState(null, null, href);
            }

            // Close mobile menu if open
            if (navToggle && navLinksList) {
                navToggle.classList.remove('open');
                navLinksList.classList.remove('open');
                document.body.style.overflow = '';
            }
        }
    };

    // Attach smooth scroll handler to all hash links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', handleSmoothScroll);
    });

    /**
     * Active Nav Link Highlighting (Scrollspy)
     */
    let isScrolling = false;

    const updateActiveNavLink = () => {
        const scrollPosition = window.scrollY;
        const headerOffset = getHeaderOffset();

        // If at the very top (Hero section), remove active state from nav links
        if (scrollPosition < 250) {
            navLinks.forEach(link => link.classList.remove('active'));
            isScrolling = false;
            return;
        }

        // Check which section currently spans the reading area
        let currentSectionId = '';

        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            const sectionTop = section.offsetTop - headerOffset - 50;

            if (scrollPosition >= sectionTop) {
                currentSectionId = section.getAttribute('id');
                break;
            }
        }

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentSectionId}` || 
               (currentSectionId === 'contact' && href === '#for-sponsorship') ||
               (currentSectionId === 'for-sponsorship' && href === '#contact')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        isScrolling = false;
    };

    const requestActiveUpdate = () => {
        if (!isScrolling) {
            window.requestAnimationFrame(updateActiveNavLink);
            isScrolling = true;
        }
    };

    window.addEventListener('scroll', requestActiveUpdate, { passive: true });
    updateActiveNavLink();
});

/**
 * Sponsor Inquiry Modal
 * Opens from any .sponsor-trigger button, pre-selects tier via data-tier attribute.
 * Submits form data to Google Sheets via Apps Script.
 */
(function () {
    // ⚡ PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL BELOW
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwRzjNMxCi6xR52oiRJgyHnGvGMd0IX7Pl5gnN3Qfau8nUpFicQvPSv9prNgGhSMV4W/exec';

    const overlay = document.getElementById('sponsor-modal-overlay');
    const modal = document.getElementById('sponsor-modal');
    const closeBtn = document.getElementById('sponsor-modal-close');
    const form = document.getElementById('sponsor-form');
    const tierSelect = document.getElementById('sponsor-tier');
    const modalBody = document.querySelector('.sponsor-modal-body');
    const successPanel = document.getElementById('sponsor-modal-success');

    if (!overlay || !modal) return;

    // Open modal
    function openSponsorModal(tier) {
        // Reset form and show form, hide success
        form.reset();
        modalBody.style.display = '';
        modal.querySelector('.sponsor-modal-header').style.display = '';
        successPanel.style.display = 'none';

        // Pre-select tier if provided
        if (tier && tierSelect) {
            const option = tierSelect.querySelector(`option[value="${tier}"]`);
            if (option) {
                tierSelect.value = tier;
            }
        } else {
            tierSelect.value = 'not-sure';
        }

        // Show modal
        overlay.classList.add('active');
        document.body.classList.add('modal-open');

        // Focus first input after animation
        setTimeout(() => {
            const firstInput = form.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 400);
    }

    // Close modal
    function closeSponsorModal() {
        overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    // Make closeSponsorModal globally accessible (used by inline onclick)
    window.closeSponsorModal = closeSponsorModal;

    // Wire up all trigger buttons
    document.querySelectorAll('.sponsor-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const tier = btn.getAttribute('data-tier') || '';
            openSponsorModal(tier);
        });
    });

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSponsorModal);
    }

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSponsorModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeSponsorModal();
        }
    });

    // Handle form submission → Google Sheets
    window.handleSponsorSubmit = async function () {
        const submitBtn = document.getElementById('sponsor-submit-btn');

        // Basic validation check
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Collect form data
        const formData = {
            fullName: document.getElementById('sponsor-name').value.trim(),
            companyName: document.getElementById('sponsor-company').value.trim(),
            designation: document.getElementById('sponsor-designation').value.trim(),
            email: document.getElementById('sponsor-email').value.trim(),
            phone: document.getElementById('sponsor-phone').value.trim(),
            sponsorshipTier: document.getElementById('sponsor-tier').value,
            industry: document.getElementById('sponsor-industry').value || '',
            city: document.getElementById('sponsor-city').value.trim(),
            message: document.getElementById('sponsor-message').value.trim(),
            source: document.getElementById('sponsor-source').value || ''
        };

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

        try {
            // POST to Google Apps Script
            const response = await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors', // Required for Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // With no-cors, we can't read the response, but if fetch didn't throw, it succeeded
            // Hide form, show success
            modalBody.style.display = 'none';
            modal.querySelector('.sponsor-modal-header').style.display = 'none';
            successPanel.style.display = 'flex';

        } catch (error) {
            console.error('Form submission error:', error);
            alert('Something went wrong. Please try again or contact us directly at events@designerpublications.com');
        } finally {
            // Reset button state for next time
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Inquiry';
        }
    };
})();
