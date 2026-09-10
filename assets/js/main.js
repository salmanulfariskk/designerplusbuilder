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
