'use strict';

hexo.extend.filter.register('before_post_render', function (data) {
  if (data.hidden === true || data.hidden === 'true') {
    data.published = false;
  }
  return data;
});
