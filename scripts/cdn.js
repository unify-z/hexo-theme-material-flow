'use strict';

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

hexo.extend.helper.register('cdn_asset', function (path) {
  const advanced = (hexo.theme.config && hexo.theme.config.advanced) || {};
  const cdn = advanced.cdn || {};
  const type = String(cdn.type || 'local').toLowerCase();
  const assetPath = String(path || '').replace(/^\/+/, '');
  const prefix = String(cdn.path || '').replace(/^\/+|\/+$/g, '');
  const relPath = prefix ? `${prefix}/${assetPath}` : assetPath;

  if (type === 'custom' && cdn.url) {
    return `${trimTrailingSlash(cdn.url)}/${relPath}`;
  }

  if (type === 'jsdelivr') {
    const version = cdn.version ? `@${cdn.version}` : '';
    if (cdn.repo) {
      return `https://cdn.jsdelivr.net/gh/${trimTrailingSlash(cdn.repo)}${version}/${relPath}`;
    }
    if (cdn.package) {
      return `https://cdn.jsdelivr.net/npm/${trimTrailingSlash(cdn.package)}${version}/${relPath}`;
    }
  }

  if (type === 'unpkg' && cdn.package) {
    const version = cdn.version ? `@${cdn.version}` : '';
    return `https://unpkg.com/${trimTrailingSlash(cdn.package)}${version}/${relPath}`;
  }

  return this.url_for(path);
});
