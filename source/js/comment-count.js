(function () {
  'use strict';

  var config = window.__COMMENT_COUNT_CONFIG__ || {};
  var type = String(config.type || '').toLowerCase();

  function isTwikooReady() {
    // `id="twikoo"` creates `window.twikoo` (the DOM element) as well.
    return !!(window.twikoo && typeof window.twikoo.getCommentsCount === 'function');
  }

  var twikooState = isTwikooReady() ? 'ready' : 'idle';
  var twikooQueue = [];

  function setCount(node, count) {
    var target = node.querySelector('.count');
    if (!target) return;
    target.textContent = (typeof count === 'number' && count >= 0) ? count : 0;
  }

  function getPath(node) {
    return node.getAttribute('data-path') || location.pathname;
  }

  function runTwikoo(nodes) {
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

  function flushTwikooQueue() {
    twikooState = 'ready';
    var queue = twikooQueue.slice();
    twikooQueue = [];
    queue.forEach(function (fn) {
      try {
        fn();
      } catch (e) {}
    });
  }

  function whenTwikooReady(callback) {
    if (isTwikooReady()) {
      callback();
      return;
    }
    if (twikooState === 'loading') {
      twikooQueue.push(callback);
      return;
    }
    if (twikooState === 'failed' || !config.twikoo || !config.twikoo.src) return;

    twikooState = 'loading';
    twikooQueue.push(callback);

    // The comments partial may already be loading Twikoo.
    var existing = document.querySelector('script[data-twikoo]');
    if (existing) {
      existing.addEventListener('load', flushTwikooQueue);
      existing.addEventListener('error', function () {
        twikooState = 'failed';
        twikooQueue = [];
      });
      return;
    }

    var script = document.createElement('script');
    script.src = config.twikoo.src;
    script.setAttribute('data-twikoo', '');
    script.onload = flushTwikooQueue;
    script.onerror = function () {
      twikooState = 'failed';
      twikooQueue = [];
    };
    document.head.appendChild(script);
  }

  function refresh(root) {
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll('.comment-count'));
    if (!nodes.length) return;

    if (type === 'twikoo' && config.twikoo && config.twikoo.envId) {
      whenTwikooReady(function () {
        runTwikoo(nodes);
      });
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
  }

  refresh(document);

  window.MaterialFlowCommentCount = {
    refresh: refresh
  };
})();
