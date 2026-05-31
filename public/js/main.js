const pages   = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('a[data-page]');

function showPage(id) {
    pages.forEach(p => {
        const isTarget = p.id === 'page-' + id;
        p.classList.toggle('active', isTarget);
        if (isTarget) {
            p.classList.remove('animate');
            void p.offsetWidth;
            p.classList.add('animate');
        }
    });
    navLinks.forEach(a => {a.classList.toggle('active', a.dataset.page === id);});
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

navLinks.forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        showPage(a.dataset.page);
    });
});

document.getElementById('page-writing').classList.add('animate');
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
});
document.getElementById('home-btn').addEventListener('click', () => {
    showPage('home')
})
