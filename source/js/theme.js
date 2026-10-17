(function () {
  'use strict';

  var KEY = 'material-flow-theme';
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  var meta = document.getElementById('theme-color-meta');

  function setLabel(theme) {
    if (!btn) return;
    var dark = theme === 'dark';
    var label = dark ? '切换到浅色模式' : '切换到深色模式';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#121212' : '#3367d6');
    setLabel(theme);
  }

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  apply(current());

  if (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {}
    });
  }

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      var saved = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch (err) {}
      if (!saved) apply(e.matches ? 'dark' : 'light');
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
    } else if (mq.addListener) {
      mq.addListener(onChange);
    }
  }
})();
