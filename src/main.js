import './styles/app.css';
import { addRoute, otherwise, startRouter, navigate } from './core/router.js';
import { initModals, initDropdowns } from './components/uiInteractions.js';
import { initApiErrorBoundary } from './components/apiErrorBoundary.js';

// Global delegated handling keeps individual views from duplicating listeners.
initModals(document);
initDropdowns(document);
initApiErrorBoundary();

const appEl = document.getElementById('app');

addRoute('/login', async (el, params) => {
  const { mount } = await import('./views/login/login.js');
  return mount(el, params);
});

addRoute('/admin', async (el, params) => {
  const { mount } = await import('./views/admin/admin.js');
  return mount(el, params);
});

addRoute('/selectTemplate', async (el, params) => {
  const { mount } = await import('./views/selectTemplate/selectTemplate.js');
  return mount(el, params);
});

addRoute('/revisions/:templateID', async (el, params) => {
  const { mount } = await import('./views/revisions/revisions.js');
  return mount(el, params);
});

addRoute('/json/:templateID', async (el, params) => {
  const { mount } = await import('./views/json/json.js');
  return mount(el, params);
});

addRoute('/datastructure/:templateID', async (el, params) => {
  const { mount } = await import('./views/dataStructure/dataStructure.js');
  return mount(el, { ...params, isPlatform: false });
});
addRoute('/platformDataStructure/:templateID', async (el, params) => {
  const { mount } = await import('./views/dataStructure/dataStructure.js');
  return mount(el, { ...params, isPlatform: true });
});

addRoute('/appstructure/:templateID', async (el, params) => {
  const { mount } = await import('./views/appStructure/appStructure.js');
  return mount(el, { ...params, isPlatform: false });
});
addRoute('/platformAppStructure/:templateID', async (el, params) => {
  const { mount } = await import('./views/appStructure/appStructure.js');
  return mount(el, { ...params, isPlatform: true });
});

addRoute('/portfoliostructure/:templateID', async (el, params) => {
  const { mount } = await import('./views/portfolioStructure/portfolioStructure.js');
  return mount(el, { ...params, isPlatform: false });
});
addRoute('/platformPortfolioStructure/:templateID', async (el, params) => {
  const { mount } = await import('./views/portfolioStructure/portfolioStructure.js');
  return mount(el, { ...params, isPlatform: true });
});

otherwise(async (el) => {
  navigate('/login');
});

startRouter(appEl);
