// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Loading state for form
const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', function() {
        const btn = form.querySelector('button');
        btn.innerHTML = '<span class="loading-spinner"></span> Analyzing Patterns...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
    });
}

// Result Gauge Animation
window.addEventListener('load', () => {
    const gauge = document.querySelector('.gauge-fill');
    if (gauge) {
        // Force reflow
        void gauge.offsetWidth;
        gauge.style.transition = 'transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
});
