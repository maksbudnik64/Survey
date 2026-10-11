// src/utils/router.ts
import { renderLogin } from "../pages/login";
import { renderMain } from "../pages/main";
import { renderProfile } from "../pages/profile";
import { renderRegister } from "../pages/register";
import { renderCreateSurvey, initCreateSurveyPage } from "../pages/createSurvey";
import { renderSurveyEdit, initSurveyEditPage } from "../pages/surveyEdit";
import { renderSurveyTake, initSurveyTakePage } from "../pages/surveyTake";
import { renderSurveyStats, initSurveyStatsPage } from "../pages/surveyStats";
import { isAuthenticated, getUser } from "./auth";
import { get } from "../api/client";
import { showToast } from "../components/toast";
import type { SurveyWithQuestions } from "../types";

export function navigateTo(path: string, replace = false) {
    if (replace) {
        window.history.replaceState({}, '', path);
    } else {
        window.history.pushState({}, '', path);
    }
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
            return;
        }

        const result = await get<SurveyWithQuestions>(`/surveys/${surveyId}`);

        if (!result.success) {
            showToast({ message: result.error, type: 'error' });
            navigateTo('/', true);
            return;
        }

        if (!result.data) {
            showToast({ message: 'Опрос не найден', type: 'error' });
            navigateTo('/', true);
            return;
        }

        const user = getUser();
        const isAuthor = user && result.data.author_id === user.id;

        if (!isAuthor) {
            showToast({ message: 'У вас нет доступа к редактированию', type: 'error' });
            navigateTo(`/survey/${surveyId}`, true);
            return;
        }

        app.innerHTML = renderSurveyEdit();
        initSurveyEditPage(surveyId);
        return;
    }

    const surveyStatsMatch = path.match(/^\/survey\/(\d+)\/stats$/);
    if (surveyStatsMatch && surveyStatsMatch[1]) {
        const surveyId = parseInt(surveyStatsMatch[1]);

        if (!isAuth) {
            app.innerHTML = renderLogin();
            return;
        }

        const result = await get<SurveyWithQuestions>(`/surveys/${surveyId}`);

        if (!result.success) {
            showToast({ message: result.error, type: 'error' });
            navigateTo('/', true);
            return;
        }

        if (!result.data) {
            showToast({ message: 'Опрос не найден', type: 'error' });
            navigateTo('/', true);
            return;
        }

        const user = getUser();
        const isAuthor = user && result.data.author_id === user.id;

        if (!isAuthor) {
            showToast({ message: 'У вас нет доступа к статистике', type: 'error' });
            navigateTo(`/survey/${surveyId}`, true);
            return;
        }

        app.innerHTML = renderSurveyStats();
        initSurveyStatsPage(surveyId);
        return;
    }

    const surveyTakeMatch = path.match(/^\/survey\/(\d+)$/);
    if (surveyTakeMatch && surveyTakeMatch[1]) {
        const surveyId = parseInt(surveyTakeMatch[1]);

        if (!isAuth) {
            showToast({ message: 'Войдите, чтобы пройти опрос', type: 'info' });
            navigateTo('/login', true);
            return;
        }

        const result = await get<SurveyWithQuestions>(`/surveys/${surveyId}`);

        if (!result.success) {
            showToast({ message: result.error, type: 'error' });
            navigateTo('/', true);
            return;
        }

        if (!result.data) {
            showToast({ message: 'Опрос не найден', type: 'error' });
            navigateTo('/', true);
            return;
        }

        const user = getUser();
        const isAuthor = user && result.data.author_id === user.id;

        if (isAuthor) {
            navigateTo(`/survey/${surveyId}/edit`, true);
        } else {
            app.innerHTML = renderSurveyTake();
            initSurveyTakePage(surveyId);
        }
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
                navigateTo('/profile', true);
            }
            break;

        case '/register':
            if (!isAuth) {
                app.innerHTML = renderRegister();
            } else {
                navigateTo('/profile', true);
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