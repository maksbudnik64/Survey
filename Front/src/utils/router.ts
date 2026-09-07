import { renderLogin } from "../pages/login";
import { renderProfile } from "../pages/profile";
import { renderRegister } from "../pages/register";
import { isAuthenticated } from "./auth";


export function navigateTo(path: string){
window.history.pushState({}, '', path);
renderPage(path);
}
export function renderPage(path: string){
    const app = document.getElementById('app');
    if(!app){
        console.error('App element not found!')
        return;
    }

   const isAuth = isAuthenticated();
   
   switch(path){
    case '/':
    case '/profile':
        if(!isAuth){
           app.innerHTML = renderLogin();
        } else {
            app.innerHTML = renderProfile();
        }
        break;
    case '/login':
        if(!isAuth){
           app.innerHTML = renderLogin();
        } else {
            navigateTo('/profile');
        }
        break;
    case '/register':
        if(!isAuth){
           app.innerHTML = renderRegister();
        } else {
            navigateTo('/profile');
        }
        break;
   }
}

document.addEventListener('click', (e) => {
    if (!(e.target instanceof HTMLElement)) {
        return;
    }

    const link = e.target.closest('a[data-link]');
    
    if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) navigateTo(href);
    }
});