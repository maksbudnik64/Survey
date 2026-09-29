// src/utils/router.ts
import { renderLogin } from "../pages/login";
import { renderMain } from "../pages/main";
import { renderProfile } from "../pages/profile";
import { renderRegister } from "../pages/register";
import { renderCreateSurvey, initCreateSurveyPage } from "../pages/createSurvey";
import { renderSurveyEdit, initSurveyEditPage } from "../pages/surveyEdit";
import { renderSurveyTake, initSurveyTakePage } from "../pages/surveyTake";
import { renderSurveyStats, initSurveyStatsPage } from "../pages/surveyStats";
import { isAuthenticated } from "./auth";

export function navigateTo(path: string) {
    window.history.pushState({}, '', path);
    renderPage(path);
}

export async function renderPage(path: string) {
    const app = document.getElementById('app');
    if (!app) {
        console.error('App element not found!');
        return;
    }

    const isAuth = isAuthenticated();

    const surveyEditMatch = path.match(/^\/survey\/(\d+)\/edit$/);
    if (surveyEditMatch && surveyEditMatch[1]) {
        const surveyId = parseInt(surveyEditMatch[1]);
        if (!isAuth) {
            app.innerHTML = renderLogin();
        } else {
            app.innerHTML = renderSurveyEdit();
            initSurveyEditPage(surveyId);
        }
        return;
    }

    const surveyStatsMatch = path.match(/^\/survey\/(\d+)\/stats$/);
    if (surveyStatsMatch && surveyStatsMatch[1]) {
        const surveyId = parseInt(surveyStatsMatch[1]);
        if (!isAuth) {
            app.innerHTML = renderLogin();
        } else {
            app.innerHTML = renderSurveyStats();
            initSurveyStatsPage(surveyId);
        }
        return;
    }

    const surveyTakeMatch = path.match(/^\/survey\/(\d+)$/);
    if (surveyTakeMatch && surveyTakeMatch[1]) {
        const surveyId = parseInt(surveyTakeMatch[1]);
        app.innerHTML = renderSurveyTake();
        initSurveyTakePage(surveyId);
        return;
    }

    switch (path) {
        case '/':
            app.innerHTML = await renderMain();
            break;

        case '/profile':
            if (!isAuth) {
                app.innerHTML = renderLogin();
            } else {
                app.innerHTML = await renderProfile();
            }
            break;

        case '/login':
            if (!isAuth) {
                app.innerHTML = renderLogin();
            } else {
                navigateTo('/profile');
            }
            break;

        case '/register':
            if (!isAuth) {
                app.innerHTML = renderRegister();
            } else {
                navigateTo('/profile');
            }
            break;

        case '/survey/create':
            if (!isAuth) {
                app.innerHTML = renderLogin();
            } else {
                app.innerHTML = renderCreateSurvey();
                initCreateSurveyPage();
            }
            break;

        default:
            app.innerHTML = `<h1>404</h1><p>Страница не найдена</p>`;
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