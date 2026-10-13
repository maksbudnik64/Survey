import { renderLogin } from '../pages/login';
import { renderMain } from '../pages/main';
import { renderProfile } from '../pages/profile';
import { renderRegister } from '../pages/register';
import { renderCreateSurvey, initCreateSurveyPage } from '../pages/createSurvey';
import { renderSurveyEdit, initSurveyEditPage } from '../pages/surveyEdit';
import { renderSurveyTake, initSurveyTakePage } from '../pages/surveyTake';
import { renderSurveyStats, initSurveyStatsPage } from '../pages/surveyStats';
import { isAuthenticated, getUser } from './auth';
import { get } from '../api/client';
import { showToast } from '../components/toast';
import type { SurveyWithQuestions } from '../types';

export function navigateTo(path: string, replace = false): void {
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
  void renderPage(path);
}

export async function renderPage(path: string): Promise<void> {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App element not found');
    return;
  }

  try {
    await renderRoute(app, path);
  } catch (error) {
    console.error('Failed to render page:', error);
    showToast({ message: 'Ошибка при загрузке страницы', type: 'error' });
  }
}

async function renderRoute(app: HTMLElement, path: string): Promise<void> {
  const isAuth = isAuthenticated();

  const editMatch = path.match(/^\/survey\/(\d+)\/edit$/);
  const editId = editMatch?.[1];
  if (editId) {
    const surveyId = Number(editId);

    if (!isAuth) {
      app.innerHTML = renderLogin();
      return;
    }

    const survey = await loadSurvey(surveyId);
    if (!survey) return;

    if (!isAuthor(survey)) {
      showToast({ message: 'У вас нет доступа к редактированию', type: 'error' });
      navigateTo(`/survey/${surveyId}`, true);
      return;
    }

    app.innerHTML = renderSurveyEdit();
    await initSurveyEditPage(survey);
    return;
  }

  const statsMatch = path.match(/^\/survey\/(\d+)\/stats$/);
  const statsId = statsMatch?.[1];
  if (statsId) {
    const surveyId = Number(statsId);

    if (!isAuth) {
      app.innerHTML = renderLogin();
      return;
    }

    const survey = await loadSurvey(surveyId);
    if (!survey) return;

    if (!isAuthor(survey)) {
      showToast({ message: 'У вас нет доступа к статистике', type: 'error' });
      navigateTo(`/survey/${surveyId}`, true);
      return;
    }

    app.innerHTML = renderSurveyStats();
    await initSurveyStatsPage(survey);
    return;
  }

  const takeMatch = path.match(/^\/survey\/(\d+)$/);
  const takeId = takeMatch?.[1];
  if (takeId) {
    const surveyId = Number(takeId);

    if (!isAuth) {
      showToast({ message: 'Войдите, чтобы пройти опрос', type: 'info' });
      navigateTo('/login', true);
      return;
    }

    const survey = await loadSurvey(surveyId);
    if (!survey) return;

    if (isAuthor(survey)) {
      navigateTo(`/survey/${surveyId}/edit`, true);
      return;
    }

    app.innerHTML = renderSurveyTake();
    await initSurveyTakePage(survey);
    return;
  }

  switch (path) {
    case '/':
      app.innerHTML = await renderMain();
      return;

    case '/profile':
      app.innerHTML = isAuth ? await renderProfile() : renderLogin();
      return;

    case '/login':
      if (isAuth) {
        navigateTo('/profile', true);
      } else {
        app.innerHTML = renderLogin();
      }
      return;

    case '/register':
      if (isAuth) {
        navigateTo('/profile', true);
      } else {
        app.innerHTML = renderRegister();
      }
      return;

    case '/survey/create':
      if (!isAuth) {
        app.innerHTML = renderLogin();
      } else {
        app.innerHTML = renderCreateSurvey();
        initCreateSurveyPage();
      }
      return;

    default:
      app.innerHTML = '<h1>404</h1><p>Страница не найдена</p>';
  }
}

async function loadSurvey(surveyId: number): Promise<SurveyWithQuestions | null> {
  const result = await get<SurveyWithQuestions>(`/surveys/${surveyId}`);

  if (!result.success) {
    showToast({ message: result.error, type: 'error' });
    navigateTo('/', true);
    return null;
  }

  if (!result.data) {
    showToast({ message: 'Опрос не найден', type: 'error' });
    navigateTo('/', true);
    return null;
  }

  return result.data;
}

function isAuthor(survey: SurveyWithQuestions): boolean {
  const user = getUser();
  return user !== null && survey.author_id === user.id;
}

document.addEventListener('click', (e) => {
  if (!(e.target instanceof HTMLElement)) return;

  const link = e.target.closest<HTMLAnchorElement>('a[data-link]');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || !href.startsWith('/')) return;

  e.preventDefault();
  navigateTo(href);
});