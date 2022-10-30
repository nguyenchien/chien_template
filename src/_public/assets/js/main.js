/*
  Define the constants common
===============================================================*/
//Animation
const [ANIMATE_SPEED, EASING] = [300, 'swing']

//Class
const CLASS_ANIMATED = 'is-animated'
const CLASS_ACTIVE = 'is-active'
const CLASS_OPEN = 'is-open'
const CLASS_SHOWN = 'is-shown'

//User Agent
const UA = navigator.userAgent

//Hash
const HASH = location.hash

/*
  Define the functions common
===============================================================*/
/**
* @return {string} media query to get the style for which device
*/
function getDevice() {
	return $('.js-media-query').css('font-family').replace(/"/g, '')
}

/**
 * @param {string} name パラメータ名
 * @param {string=} opt_url URL
 * @return {string} URLに含まれる特定のパラメータの値を返す
 */
 function getParam(name, opt_url) {
	if (!name) return
	name = name.replace(/[\[\]]/g, "\\$&")
	if (!opt_url) {
		opt_url = window.location.href
	}
	const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
				results = regex.exec(opt_url)
	if (!results) return null
	if (!results[2]) return ''
	return decodeURIComponent(results[2].replace(/\+/g, " "))
}

/**
 * @return {number} VW,VHの値を返す
 */
function getVhVw() {
	const $window = $(window)
	const vh = $window.innerHeight() * 0.01
	const vw = $window.innerWidth() * 0.01
	return { vh, vw }
}


/*
  Define the variables common
===============================================================*/
let $window = $(window)
let $bodyHtml = $('body,html')

/*
  Define the functions
===============================================================*/
/* viewport set
------------------------------------- */
$(function () {
	const winWidth = $window.innerWidth()
	let bodyMinWidth = $('body').css('min-width')
			bodyMinWidth = Number(bodyMinWidth.replace('px', ''))
	// SP:320px->320
	// TB:auto->0 フルリキッド時
	// TB:1120px->1120 リキッド時 ここだけ処理される
	// 0が来る（リキッド）時計算できなくなるので省く（win-width: auto;の時）
	const doCalculateViewport = bodyMinWidth !== 0 && winWidth > 768
	if (doCalculateViewport) {
		let value = winWidth / bodyMinWidth
	
		const isSp_ = UA.indexOf('iPhone') > -1 || (UA.indexOf('Android') > -1 && UA.indexOf('Mobile') > -1);
		const isTab_ = !isSp_ && (UA.indexOf('iPad') > -1 || (UA.indexOf('Macintosh') > -1 && 'ontouchend' in document) || UA.indexOf('Android') > -1)
		if (isTab_) {
			$('meta[name="viewport"]').attr('content', 'width=' + winWidth + ', initial-scale=' + value)
		}
	}
})

/* vh,vw for iOS
------------------------------------- */
$(function () {
	let resizeTimer
	$window.on('resize load', () => {
		function setVhVw_() {
			const vwVh = getVhVw();
			document.documentElement.style.setProperty('--vh', vwVh.vh + "px")
			document.documentElement.style.setProperty('--vw', vwVh.vw + "px")
		}
		clearTimeout(resizeTimer)
		resizeTimer = setTimeout(function () {
			setVhVw_()
		}, 100)
	})
})

/* smoothScroll
------------------------------------- */
$(function () {
	// ハッシュ付きリンクはそこまでアンカーリンク
	$window.on('load', () => {
		if (!HASH) return
		const $target = $(HASH)
		if ($target.length) {
			const headerHeight = $('.js-header').innerHeight()
			let position = $target.offset().top
			if (headerHeight) {
				position -= headerHeight
			}
			$bodyHtml.animate({ scrollTop: position }, ANIMATE_SPEED, EASING)
		}
	})
	//クリック時アンカーリンク
	$('a[href^="#"]').on('click', function() {
		const href = $(this).attr('href'),
			$target = $(href === '#' || href === '' ? 'html' : href)
		let position = 0
		if (href !== '#top') {
			const headerHeight = $('.js-header').innerHeight()
			position = $target.offset().top
			if (headerHeight) {
				position -= headerHeight
			}
		}
		$bodyHtml.animate({scrollTop: position}, ANIMATE_SPEED, EASING)
		return false
	})
})

/* Animation
------------------------------------- */
window.addEventListener('load', () => {
	let observer = new IntersectionObserver(entries => {
		entries.forEach(elem => {
			let isIntersecting = elem.isIntersecting
			if (!isIntersecting) return
			elem.target.classList.add(CLASS_ANIMATED)
		})
	}, {
		rootMargin: '0% 0% -100px 0%',
		threshold: 0
	})
	const elements = document.querySelectorAll('.js-c-anime-elem')
	const elementsArr = Array.prototype.slice.call(elements)
	elementsArr.forEach(elem => observer.observe(elem))
}, false)

/* Lazy loading image
------------------------------------- */
window.addEventListener('load', () => {
	let observer = new IntersectionObserver(entries => {
		entries.forEach(elem => {
			let isIntersecting = elem.isIntersecting
			if (!isIntersecting) return

			let $target = elem.target
			let src = $target.dataset.src
			let srcset = $target.dataset.srcset
			if (src) {
				$target.src = src
				$target.removeAttribute('data-src')
			}
			if (srcset) {
				$target.srcset = srcset
				$target.removeAttribute('data-srcset')
			}
		})
	}, {
		rootMargin: '10% 10%',
		threshold: 0
	})
	const elements = document.querySelectorAll('[data-src],[data-srcset]')
	const elementsArr = Array.prototype.slice.call(elements)
	elementsArr.forEach(elem => observer.observe(elem))
}, false)

/* page top btn
------------------------------------- */
$(function () {
	let $pageTop = $('.js-page-top')
	$window.on('load scroll', () => {
		if (getDevice() === 'sp') return
		//スマホ以外はページトップ表示
		const scrollPosition = 300
		const scrollValue = $(this).scrollTop()
		if (scrollValue > scrollPosition) {
			$pageTop.addClass(CLASS_SHOWN)
		} else {
			$pageTop.removeClass(CLASS_SHOWN)
		}
	})
})

/* hamburger menu
------------------------------------- */
$(function () {
	let $navBtn = $('.js-nav-btn'),
		$navCon = $('.js-nav-content'),
		$navBtnTxt = $('.js-nav-btn-txt'),
		$navOverlay = $('.js-nav-overlay')
	function navOpen_() {
		$navOverlay.fadeIn(ANIMATE_SPEED)
		$navCon.addClass(CLASS_OPEN)
		$navBtn.addClass(CLASS_OPEN)
		$navBtnTxt.text('close')
	}
	function navReset_() {
		$navOverlay.fadeOut(ANIMATE_SPEED)
		$navCon.removeClass(CLASS_OPEN)
		$navBtn.removeClass(CLASS_OPEN)
		$navBtnTxt.text('menu')
	}
	$navBtn.on('click', function() {
		if ($navCon.hasClass(CLASS_OPEN)) {
			navReset_()
		} else {
			navOpen_()
		}
		return false
	})
	$navOverlay.on('click', function() {
		navReset_()
	})
	$navCon.on('click', function (event) {
		event.stopPropagation()
	})
})

/* Toggle click
------------------------------------- */
$(function () {
	let $toggleTrigger = $('.js-c-toggle-trigger')
	$toggleTrigger.on('click', function() {
		const $this = $(this)
		$this.toggleClass(CLASS_ACTIVE)
		$this.next('.js-c-toggle-content').slideToggle(ANIMATE_SPEED)
	})
})

/* Tab Switch
------------------------------------- */
$(function () {
	let $switchTabList = $('.js-c-switch-tab-list'),
		$switchTab = $('.js-c-switch-tab'),
		$switchConList = $('.js-c-switch-content-list'),
		$switchCon = $('.js-c-switch-content')
	$switchTab.on('click', function() {
		const $this = $(this)
		let $parent = $this.parent($switchTabList),
			$children = $parent.children($switchTab),
			$content = $parent.next($switchConList).children($switchCon),
			num = $children.index(this)
		//class remove
		$content.removeClass(CLASS_ACTIVE)
		$children.removeClass(CLASS_ACTIVE)
		//class add
		$content.eq(num).addClass(CLASS_ACTIVE)
		$this.addClass(CLASS_ACTIVE)
	})
})

//tab パラメータで初期開いているタブを変更する ?tab=tab01_01となっていれば
//data-tab-name="tab01"の子要素のdata-tab-num="01"のタブがアクティブになる
$(function () {
	const tabPram = getParam('tab')
	if (tabPram && $('.js-c-switch-tab').length > 0) {
		//tab01_01を[ 'tab01', '01' ]に分離
		const tabPramArray = tabPram.split("_")
		if (tabPramArray) {
			let tabId = tabPramArray[0],
				tabNum = tabPramArray[1]
			let $tabList = $('.js-c-switch-tab-list[data-tab-name="' + tabId + '"]'),
				$tabContentList = $('.js-c-switch-content-list[data-tab-name="' + tabId + '"]')

			// class remove
			$tabList.children('.js-c-switch-tab').removeClass(CLASS_ACTIVE)
			$tabContentList.children('.js-c-switch-content').removeClass(CLASS_ACTIVE)
			// class add
			$tabContentList.children('.js-c-switch-content[data-tab-num="' + tabNum + '"]').addClass(CLASS_ACTIVE)
		}
	}
})


/*
  Define custom javascript HERE:
===============================================================*/
$(document).ready(function(){
  console.log('>>> main.js');
});