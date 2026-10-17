'use strict';

const DEFAULT_BASES = {
  jsdelivr: 'https://cdn.jsdelivr.net',
  unpkg: 'https://unpkg.com'
};

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function trimSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function getCdnConfig() {
  const advanced = (hexo.theme.config && hexo.theme.config.advanced) || {};
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

function versionSuffix(version) {
  return version ? `@${version}` : '';
}

hexo.extend.helper.register('cdn_asset', function (path) {
  const cdn = getCdnConfig();
  const type = getType(cdn);
  const base = getBase(cdn, type);
  const assetPath = String(path || '').replace(/^\/+/, '');
  const prefix = trimSlashes(cdn.path);
  const relPath = prefix ? `${prefix}/${assetPath}` : assetPath;

  if (type === 'custom' && base) {
    return `${base}/${relPath}`;
  }

  if (type === 'jsdelivr' && base) {
    const version = versionSuffix(cdn.version);
    if (cdn.repo) {
      return `${base}/gh/${trimTrailingSlash(cdn.repo)}${version}/${relPath}`;
    }
    if (cdn.package) {
      return `${base}/npm/${trimTrailingSlash(cdn.package)}${version}/${relPath}`;
    }
  }

  if (type === 'unpkg' && base && cdn.package) {
    const version = versionSuffix(cdn.version);
    return `${base}/${trimTrailingSlash(cdn.package)}${version}/${relPath}`;
  }

  return this.url_for(path);
});

hexo.extend.helper.register('cdn_module', function (pkg, version, file, manualUrl) {
  const cdn = getCdnConfig();
  const type = getType(cdn);
  const cleanPkg = String(pkg || '').replace(/^\/+/, '');
  const cleanFile = String(file || '').replace(/^\/+/, '');
  const suffix = versionSuffix(version);

  // Custom CDN URLs must be supplied explicitly; never concatenate them.
  if (type === 'custom') {
    return String(manualUrl || '');
  }

  if (!cleanPkg || !cleanFile) return '';

  if (type === 'jsdelivr') {
    return `${getBase(cdn, type)}/npm/${cleanPkg}${suffix}/${cleanFile}`;
  }

  if (type === 'unpkg') {
    return `${getBase(cdn, type)}/${cleanPkg}${suffix}/${cleanFile}`;
  }

  // External modules always need a CDN, even when theme assets are local.
  return `${DEFAULT_BASES.jsdelivr}/npm/${cleanPkg}${suffix}/${cleanFile}`;
});
