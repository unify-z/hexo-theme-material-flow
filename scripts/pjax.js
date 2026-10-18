'use strict';

const DEFAULT_BASES = {
  jsdelivr: 'https://cdn.jsdelivr.net',
  unpkg: 'https://unpkg.com'
};

const PJAX_PACKAGE = 'pjax';
const PJAX_VERSION = '0.2.8';
const PJAX_FILE = 'pjax.min.js';
const LOCAL_PJAX_FILE = 'js/pjax.min.js';

let warnedMissingCustomScript = false;

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function getThemeConfig() {
  return (hexo.theme && hexo.theme.config) || {};
}

function getPjaxConfig() {
  const theme = getThemeConfig();
  const advanced = theme.advanced || {};

  // `pjax: true` is a shorthand for using the defaults.
  if (theme.pjax === true) return {};
  if (theme.pjax === false) return {};
  if (theme.pjax && typeof theme.pjax === 'object') return theme.pjax;
  if (advanced.pjax && typeof advanced.pjax === 'object') return advanced.pjax;

  return {};
}

function isEnabled() {
  const theme = getThemeConfig();
  if (theme.pjax === true) return true;
  if (theme.pjax === false) return false;

  const pjax = getPjaxConfig();
  return pjax.enable === true || pjax.enable === 'true' || pjax.enable === 1 || pjax.enable === '1';
}

function getCdnConfig() {
  const advanced = getThemeConfig().advanced || {};
  return advanced.cdn || {};
}

function getType(cdn) {
  return String(cdn.type || 'local').toLowerCase();
}

function getBase(cdn, type) {
  if (type === 'custom') {
    return trimTrailingSlash(cdn.baseUrl || cdn.url || '');
  }
  if (type === 'jsdelivr') {
    return trimTrailingSlash(cdn.baseUrl || cdn.url || DEFAULT_BASES.jsdelivr);
  }
  if (type === 'unpkg') {
    return trimTrailingSlash(cdn.baseUrl || cdn.url || DEFAULT_BASES.unpkg);
  }
  return '';
}

/**
 * Resolve the PJAX script URL.
 *
 * - `pjax.script` always wins when it is set.
 * - Otherwise the URL is generated from `advanced.cdn.type`.
 * - `custom` CDNs cannot be guessed, so they require an explicit `pjax.script`.
 */
function resolveScript() {
  const pjax = getPjaxConfig();
  const manual = String(pjax.script || '').trim();
  if (manual) return manual;

  const cdn = getCdnConfig();
  const type = getType(cdn);

  if (type === 'custom') return '';

  if (type === 'jsdelivr') {
    return `${getBase(cdn, type) || DEFAULT_BASES.jsdelivr}/npm/${PJAX_PACKAGE}@${PJAX_VERSION}/${PJAX_FILE}`;
  }

  if (type === 'unpkg') {
    return `${getBase(cdn, type) || DEFAULT_BASES.unpkg}/${PJAX_PACKAGE}@${PJAX_VERSION}/${PJAX_FILE}`;
  }

  // local (and any unknown value) uses the copy bundled with the theme.
  return LOCAL_PJAX_FILE;
}

function isExternalUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(String(value || ''));
}

hexo.extend.helper.register('pjax_enabled', function () {
  return isEnabled() && !!resolveScript();
});

hexo.extend.helper.register('pjax_script', function () {
  const script = resolveScript();
  if (!script) return '';
  if (isExternalUrl(script)) return script;

  // Local scripts must respect the site root (e.g. GitHub Pages subdirectories).
  return this.url_for(script.replace(/^\/+/, ''));
});

hexo.extend.filter.register('before_generate', function () {
  if (warnedMissingCustomScript || !isEnabled() || resolveScript()) return;

  warnedMissingCustomScript = true;
  hexo.log.warn(
    '[hexo-theme-material-flow] PJAX is enabled, but `pjax.script` is empty while ' +
      '`advanced.cdn.type` is "custom". PJAX has been disabled until a script URL is configured.'
  );
}, 1);
