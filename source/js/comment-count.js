(function () {
  'use strict';

  var nodes = Array.prototype.slice.call(document.querySelectorAll('.comment-count'));
  if (!nodes.length) return;

  var config = window.__COMMENT_COUNT_CONFIG__ || {};
  var type = String(config.type || '').toLowerCase();

  function setCount(node, count) {
    var target = node.querySelector('.count');
    if (!target) return;
    target.textContent = (typeof count === 'number' && count >= 0) ? count : 0;
  }

  function getPath(node) {
    return node.getAttribute('data-path') || location.pathname;
  }

  if (type === 'twikoo' && config.twikoo && config.twikoo.envId) {
    function runTwikoo() {
      if (!window.twikoo) return;
      nodes.forEach(function (node) {
        window.twikoo.getCommentsCount({
          envId: config.twikoo.envId,
          urls: [location.origin + getPath(node)]
        }).then(function (res) {
          var item = res && res[0];
          setCount(node, item && item.count);
        }).catch(function () {});
      });
    }
    if (window.twikoo) {
      runTwikoo();
    } else if (config.twikoo.src) {
      var script = document.createElement('script');
      script.src = config.twikoo.src;
      script.onload = runTwikoo;
      document.head.appendChild(script);
    }
  } else if (type === 'waline' && config.waline && config.waline.serverURL) {
    nodes.forEach(function (node) {
      fetch(config.waline.serverURL.replace(/\/+$/, '') + '/api/comment?path=' + encodeURIComponent(getPath(node)) + '&pageSize=1')
        .then(function (res) { return res.json(); })
        .then(function (data) { setCount(node, data && data.count); })
        .catch(function () {});
    });
  } else if (type === 'artalk' && config.artalk && config.artalk.server) {
    nodes.forEach(function (node) {
      fetch(config.artalk.server.replace(/\/+$/, '') + '/api/v2/comments?page_key=' + encodeURIComponent(getPath(node)) + '&limit=1')
        .then(function (res) { return res.json(); })
        .then(function (data) { setCount(node, data && data.count); })
        .catch(function () {});
    });
  }
})();
