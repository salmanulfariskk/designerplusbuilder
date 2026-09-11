// scroll-reveal.js - adds animation classes when elements enter viewport

// Utility to check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.2, // trigger when 20% visible
  };

  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const elem = entry.target;
        // Add animation class based on data-animate attribute value
        const animType = elem.getAttribute('data-animate');
        if (animType) {
          elem.classList.add('animate-' + animType);
        } else {
          // default fade-up
          elem.classList.add('animate-fade-up');
        }
        observer.unobserve(elem);
      }
    });
  };

  const observer = new IntersectionObserver(revealCallback, observerOptions);

  document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(el => observer.observe(el));
  });
}
