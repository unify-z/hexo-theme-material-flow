'use strict';

const DEFAULT_THEME_COLOR = '#e91e63';

hexo.extend.filter.register('before_generate', function () {
  const config = hexo.theme.config || {};
  const themeColor = config.theme_color || config['theme-color'] || DEFAULT_THEME_COLOR;

  config.less = config.less || {};
  config.less.options = Object.assign({}, config.less.options, {
    modifyVars: Object.assign({}, config.less.options && config.less.options.modifyVars, {
      '@primary-color': themeColor,
      '@accent-color': themeColor,
      '@secondary-color': themeColor
    })
  });
}, 1);
