/* eslint-disable */
var customSearch;
(function ($) {

	"use strict";
	const scrollCorrection = 70; // (header height = 50px) + (gap = 20px)
	var defaultSubTitle = null;
	var revealInstance = null;
	var wavesInitialized = false;
	var headerScrollLockUntil = 0;
	var subDataBeforePjax = null;
	var initialLoadingTimer = null;

	function getHashTarget(href) {
		if (!href) return null;
		const hashIndex = String(href).indexOf('#');
		if (hashIndex === -1) return null;

		let id = String(href).slice(hashIndex + 1);
		if (!id) return null;
		try {
			id = decodeURIComponent(id);
		} catch (e) {}
		return document.getElementById(id);
	}

	function scrolltoElement(elem, correction) {
		correction = correction || scrollCorrection;
		const href = elem && typeof elem.getAttribute === 'function' ? elem.getAttribute('href') : null;
		const target = getHashTarget(href);

		let $elem;
		if (target) {
			$elem = $(target);
		} else if (href) {
			// Anchor exists but its target is missing on this page.
			return;
		} else {
			$elem = $(elem);
		}

		if (!$elem.length) return;
		const offset = $elem.offset();
		if (!offset) return;
		$('html, body').animate({ 'scrollTop': offset.top - correction }, 400);
	};

	function attachWaves(selector, classes, $scope) {
		const $targets = $scope ? $scope.find(selector) : $(selector);
		$targets.each(function () {
			if (this.getAttribute('data-mf-waves')) return;
			this.setAttribute('data-mf-waves', '1');
			if (classes && classes.length) {
				Waves.attach(this, classes);
			} else {
				Waves.attach(this);
			}
		});
	}

	function setHeader() {
		const $wrapper = $('header .wrapper');
		if (!$wrapper.length) return;

		const $comment = $('.s-comment', $wrapper);
		const $toc = $('.s-toc', $wrapper);
		const $top = $('.s-top', $wrapper);
		const $logo = $wrapper.find('.nav-sub .logo');

		if (defaultSubTitle === null) defaultSubTitle = $.trim($logo.text());
		$logo.text((window.subData && window.subData.title) || defaultSubTitle);
		$wrapper.removeClass('sub');

		let pos = $(window).scrollTop();
		// Ignore the scroll event PJAX fires while restoring the new page's
		// scroll position, otherwise the header may hide immediately.
		headerScrollLockUntil = Date.now() + 300;
		$(window).off('scroll.mf-header').on('scroll.mf-header', function () {
			const scrollTop = $(window).scrollTop();
			if (Date.now() < headerScrollLockUntil) {
				pos = scrollTop;
				return;
			}
			const del = scrollTop - pos;
			if (del >= 20) {
				pos = scrollTop;
				$wrapper.addClass('sub');
			} else if (del <= -20) {
				pos = scrollTop;
				$wrapper.removeClass('sub');
			}
		});

		// bind events to every btn
		const $commentTarget = $('#comments');
		$comment.off('click.mf-header');
		$comment.toggle($commentTarget.length > 0);
		if ($commentTarget.length) {
			$comment.on('click.mf-header', function (e) {
				e.preventDefault();
				e.stopPropagation();
				scrolltoElement($commentTarget);
			});
		}

		const $tocTarget = $('.toc-wrapper');
		const hasToc = $tocTarget.length && $tocTarget.children().length;
		$toc.off('click.mf-header');
		$toc.toggle(!!hasToc);
		if (hasToc) {
			$toc.on('click.mf-header', function (e) {
				e.stopPropagation();
				$tocTarget.toggleClass('active');
			});
		}

		$top.off('click.mf-header').on('click.mf-header', function () {
			scrolltoElement(document.body);
		});
	}
	function setHeaderMenu() {
		var $headerMenu = $('header .menu');
		if (!$headerMenu.length) return;
		var $underline = $headerMenu.find('.underline');
		function setUnderline($item, transition) {
			$item = $item || $headerMenu.find('li a.active');//get instant
			transition = transition === undefined ? true : !!transition;
			if (!transition) $underline.addClass('disable-trans');
			if ($item && $item.length) {
				$item.addClass('active').siblings().removeClass('active');
				$underline.css({
					left: $item.position().left,
					width: $item.innerWidth()
				});
			} else {
				$underline.css({
					left: 0,
					width: 0
				});
			}
			if (!transition) {
				setTimeout(function () { $underline.removeClass('disable-trans') }, 0);//get into the queue.
			}
		}

		$headerMenu.off('.mf-menu');
		$headerMenu.on('mouseenter.mf-menu', 'li', function (e) {
			setUnderline($(e.currentTarget));
		});
		$headerMenu.on('mouseout.mf-menu', function () {
			setUnderline();
		});

		//set current active nav
		var $active_link = null;
		if (location.pathname === '/' || location.pathname.startsWith('/page/')) {
			$active_link = $('.nav-home', $headerMenu);
		} else {
			var name = location.pathname.match(/\/(.*?)\//);
			if (name && name.length > 1) {
				$active_link = $('.nav-' + name[1], $headerMenu);
			}
		}
		setUnderline($active_link, false);
	}
	function setHeaderMenuPhone() {
		var $switcher = $('.l_header .switcher .s-menu');
		$switcher.off('click.mf-phone').on('click.mf-phone', function (e) {
			e.stopPropagation();
			$('body').toggleClass('z_menu-open');
			$switcher.toggleClass('active');
		});
		$(document).off('click.mf-phone').on('click.mf-phone', function () {
			$('body').removeClass('z_menu-open');
			$switcher.removeClass('active');
		});
	}
	function setHeaderSearch() {
		var $switcher = $('.l_header .switcher .s-search');
		var $header = $('.l_header');
		var $search = $('.l_header .m_search');
		if ($switcher.length === 0) return;
		$switcher.off('click.mf-search').on('click.mf-search', function (e) {
			e.stopPropagation();
			$header.toggleClass('z_search-open');
			$search.find('input').focus();
		});
		$(document).off('click.mf-search').on('click.mf-search', function () {
			$header.removeClass('z_search-open');
		});
		$search.off('click.mf-search').on('click.mf-search', function (e) {
			e.stopPropagation();
		});
	}
	function setWaves() {
		if (typeof Waves === 'undefined') return;
		const $scope = $('.l_body').add('.l_header');
		attachWaves('.flat-btn', ['waves-button'], $scope);
		attachWaves('.float-btn', ['waves-button', 'waves-float'], $scope);
		attachWaves('.float-btn-light', ['waves-button', 'waves-float', 'waves-light'], $scope);
		attachWaves('.flat-box', ['waves-block'], $scope);
		attachWaves('.float-box', ['waves-block', 'waves-float'], $scope);
		attachWaves('.waves-image', [], $scope);
		if (!wavesInitialized) {
			Waves.init();
			wavesInitialized = true;
		}
	}
	function setScrollReveal() {
		const $reveal = $('.reveal');
		if ($reveal.length === 0) return;
		if (typeof ScrollReveal === 'undefined') {
			$reveal.css('visibility', 'visible');
			return;
		}
		if (revealInstance && typeof revealInstance.destroy === 'function') {
			try {
				revealInstance.destroy();
			} catch (e) {}
		}
		revealInstance = ScrollReveal({ distance: 0 });
		revealInstance.reveal('.reveal');
	}
	function setTocToggle() {
		const $toc = $('.toc-wrapper');
		$(window).off('resize.mf-toc scroll.mf-toc');
		$(document).off('click.mf-toc');
		if ($toc.length === 0) return;
		$toc.off('click.mf-toc').on('click.mf-toc', function (e) {
			e.stopPropagation();
			$toc.addClass('active');
		});
		$(document).on('click.mf-toc', function () {
			$toc.removeClass('active');
		});

		$toc.on('click.mf-toc', 'a', function (e) {
			e.preventDefault();
			e.stopPropagation();
			scrolltoElement(this);
		});

		const tocEntries = Array.from($toc.find('li a')).map(function (elem) {
			return {
				link: elem,
				target: getHashTarget(elem.getAttribute('href'))
			};
		}).filter(function (entry) {
			return !!entry.target;
		});

		//function animate above will convert float to int.
		const getAnchor = () => {
			// The TOC is detached while PJAX swaps the page container.
			if (!$toc[0] || !document.documentElement.contains($toc[0])) return null;
			return tocEntries.map(entry => Math.floor($(entry.target).offset().top - scrollCorrection));
		};

		let anchor = getAnchor();
		const scrollListener = () => {
			const scrollTop = $('html').scrollTop() || $('body').scrollTop();
			if (!anchor) return;
			//binary search.
			let l = 0, r = anchor.length - 1, mid;
			while (l < r) {
				mid = (l + r + 1) >> 1;
				if (anchor[mid] === scrollTop) l = r = mid;
				else if (anchor[mid] < scrollTop) l = mid;
				else r = mid - 1;
			}
			$(tocEntries.map(entry => entry.link)).removeClass('active').eq(l).addClass('active');
		}
		$(window)
			.off('resize.mf-toc scroll.mf-toc')
			.on('resize.mf-toc', function () {
				anchor = getAnchor();
				scrollListener();
			})
			.on('scroll.mf-toc', function () {
				scrollListener()
			});
		scrollListener();
	}
	function setFitVids() {
		if (typeof $.fn.fitVids !== 'function') return;
		const $videos = $('.l_body .article .video-container');
		if ($videos.length) $videos.fitVids();
	}

	// function getPicture() {
	// 	const $banner = $('.banner');
	// 	if ($banner.length === 0) return;
	// 	const url = ROOT + 'js/lovewallpaper.json';
	// 	$.get(url).done(res => {
	// 		if (res.data.length > 0) {
	// 			const index = Math.floor(Math.random() * res.data.length);
	// 			$banner.css('background-image', 'url(' + res.data[index].big + ')');
	// 		}
	// 	})
	// }

	// function getHitokoto() {
	// 	const $hitokoto = $('#hitokoto');
	// 	if($hitokoto.length === 0) return;
	// 	const url = 'http://api.hitokoto.us/rand?length=80&encode=jsc&fun=handlerHitokoto';
	// 	$('body').append('<script	src="%s"></script>'.replace('%s',url));
	// 	window.handlerHitokoto = (data) => {
	// 		$hitokoto
	// 			.css('color','transparent')
	// 			.text(data.hitokoto)
	// 		if(data.source) $hitokoto.append('<cite> ——  %s</cite>'.replace('%s',data.source));
	// 		else if(data.author) $hitokoto.append('<cite> ——  %s</cite>'.replace('%s',data.author));
	// 		$hitokoto.css('color','white');
	// 	}
	// }

	function initSearch() {
		if (SEARCH_SERVICE === 'google') {
			customSearch = new GoogleCustomSearch({
				apiKey: GOOGLE_CUSTOM_SEARCH_API_KEY,
				engineId: GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
				imagePath: "/images/"
			});
		}
		else if (SEARCH_SERVICE === 'algolia') {
			customSearch = new AlgoliaSearch({
				apiKey: ALGOLIA_API_KEY,
				appId: ALGOLIA_APP_ID,
				indexName: ALGOLIA_INDEX_NAME,
				imagePath: "/images/"
			});
		}
		else if (SEARCH_SERVICE === 'hexo') {
			customSearch = new HexoSearch({
				imagePath: "/images/"
			});
		}
		else if (SEARCH_SERVICE === 'azure') {
			customSearch = new AzureSearch({
				serviceName: AZURE_SERVICE_NAME,
				indexName: AZURE_INDEX_NAME,
				queryKey: AZURE_QUERY_KEY,
				imagePath: "/images/"
			});
		}
		else if (SEARCH_SERVICE === 'baidu') {
			customSearch = new BaiduSearch({
				apiId: BAIDU_API_ID,
				imagePath: "/images/"
			});
		}
	}

	function refreshContent() {
		setHeader();
		setHeaderMenu();
		setWaves();
		setScrollReveal();
		setTocToggle();
		setFitVids();
	}

	function init() {
		defaultSubTitle = $.trim($('.l_header .nav-sub .logo').text());
		setHeaderMenuPhone();
		setHeaderSearch();
		refreshContent();
		initSearch();

		initialLoadingTimer = setTimeout(function () {
			$('#loading-bar-wrapper').fadeOut(500);
		}, 300);
	}

	function refresh() {
		refreshContent();
		if (window.MaterialFlowCommentCount && typeof window.MaterialFlowCommentCount.refresh === 'function') {
			window.MaterialFlowCommentCount.refresh();
		}
	}

	function beforePjax() {
		clearTimeout(initialLoadingTimer);
		initialLoadingTimer = null;

		// Let the next page define its own sub-header title.
		subDataBeforePjax = window.subData;
		window.subData = null;

		// The TOC scroll handlers reference the old article DOM. The `getAnchor`
		// guard above keeps them inert while PJAX swaps the container.
		if (revealInstance && typeof revealInstance.destroy === 'function') {
			try {
				revealInstance.destroy();
			} catch (e) {}
			revealInstance = null;
		}

		if (customSearch && typeof customSearch.close === 'function') {
			customSearch.close();
		}
		$('.l_header').removeClass('z_search-open');
		$('body').removeClass('z_menu-open');
		$('.l_header .switcher .s-menu').removeClass('active');
	}

	function restoreAfterPjaxError() {
		window.subData = subDataBeforePjax;
		subDataBeforePjax = null;
		refreshContent();
	}

	window.MaterialFlow = {
		init: init,
		refresh: refresh,
		beforePjax: beforePjax,
		restoreAfterPjaxError: restoreAfterPjaxError
	};

	$(function () {
		init();
	});

})(jQuery);
