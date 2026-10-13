import { renderPage } from './utils/router';

document.addEventListener('DOMContentLoaded', () => {
  renderPage(window.location.pathname);
});

window.addEventListener('popstate', () => {
  renderPage(window.location.pathname);
});