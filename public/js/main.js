const pages   = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('a[data-page]');

function showPage(id) {
    pages.forEach(p => {
    const isTarget = p.id === 'page-' + id;
    p.classList.toggle('active', isTarget);
    if (isTarget) {
        // Re-trigger fade-in by removing + re-adding the class
        p.classList.remove('animate');
        void p.offsetWidth; // force reflow
        p.classList.add('animate');
    }
    });

    navLinks.forEach(a => {
    a.classList.toggle('active', a.dataset.page === id);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

navLinks.forEach(a => {
    a.addEventListener('click', e => {
    e.preventDefault();
    showPage(a.dataset.page);
    });
});


// Kick off initial animation
document.getElementById('page-writing').classList.add('animate');

const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

const home = document.getElementById('home-btn');
home.addEventListener('click', () => {
    showPage('home')
})
