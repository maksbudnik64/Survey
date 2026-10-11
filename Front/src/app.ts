import { renderPage } from './utils/router'

console.log('🚀 Survey App frontend initialized!');

document.addEventListener('DOMContentLoaded', () => {
    renderPage(window.location.pathname);
})

window.addEventListener('popstate', () => {
    renderPage(window.location.pathname);
})