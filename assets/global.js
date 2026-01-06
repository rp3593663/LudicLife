function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

class SectionId {
  static #separator = '__';

  // for a qualified section id (e.g. 'template--22224696705326__main'), return just the section id (e.g. 'template--22224696705326')
  static parseId(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[0];
  }

  // for a qualified section id (e.g. 'template--22224696705326__main'), return just the section name (e.g. 'main')
  static parseSectionName(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[1];
  }

  // for a section id (e.g. 'template--22224696705326') and a section name (e.g. 'recommended-products'), return a qualified section id (e.g. 'template--22224696705326__recommended-products')
  static getIdForSection(sectionId, sectionName) {
    return `${sectionId}${SectionId.#separator}${sectionName}`;
  }
}

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement('div');
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll('[id], [form]').forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = 'none';

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll('script').forEach((oldScriptTag) => {
      const newScriptTag = document.createElement('script');
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));


  if (summary.nextElementSibling) {
    if (summary.nextElementSibling.getAttribute('id')) {
      summary.setAttribute('aria-controls', summary.nextElementSibling.id);
    }
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer, menu-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (event.target !== container && event.target !== last && event.target !== first) return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === 'INPUT' &&
    ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(':focus-visible');
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    'ARROWUP',
    'ARROWDOWN',
    'ARROWLEFT',
    'ARROWRIGHT',
    'TAB',
    'ENTER',
    'SPACE',
    'ESCAPE',
    'HOME',
    'END',
    'PAGEUP',
    'PAGEDOWN',
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    'focus',
    () => {
      if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add('focused');
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  // document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.target.name === 'plus') {
      if (parseInt(this.input.dataset.min) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.dataset.min === previousValue && event.target.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle('disabled', parseInt(value) <= parseInt(this.input.min));
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    }
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement('form');
  form.setAttribute('method', method);
  form.setAttribute('action', path);

  for (var key in params) {
    var hiddenField = document.createElement('input');
    hiddenField.setAttribute('type', 'hidden');
    hiddenField.setAttribute('name', key);
    hiddenField.setAttribute('value', params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler, this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = '';
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach((summary) =>
      summary.addEventListener('click', this.onSummaryClick.bind(this))
    );
    this.querySelectorAll(
      'button:not(.localization-selector):not(.country-selector__close-button):not(.country-filter__reset-button)'
    ).forEach((button) => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary'))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);

      if (window.matchMedia('(max-width: 990px)')) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach((details) => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach((submenu) => {
      submenu.classList.remove('submenu-open');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent) elementToFocus?.setAttribute('aria-expanded', false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement))
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu-open');
    parentMenuElement && parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header');
    this.borderOffset =
      this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty(
      '--header-bottom-position',
      `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
    );
    this.header.classList.add('menu-open');

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    window.addEventListener('resize', this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    // document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove('menu-open');
    window.removeEventListener('resize', this.onResize);
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        '--header-bottom-position',
        `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
      );
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  };
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener('click', this.hide.bind(this, false));
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class BulkModal extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      if (this.innerHTML.trim() === '') {
        const productUrl = this.dataset.url.split('?')[0];
        fetch(`${productUrl}?section_id=bulk-quick-order-list`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            const sourceQty = html.querySelector('.quick-order-list-container').parentNode;
            this.innerHTML = sourceQty.innerHTML;
          })
          .catch((e) => {
            console.error(e);
          });
      }
    };

    new IntersectionObserver(handleIntersection.bind(this)).observe(
      document.querySelector(`#QuickBulk-${this.dataset.productId}-${this.dataset.sectionId}`)
    );
  }
}

customElements.define('bulk-modal', BulkModal);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    this.loadContent.bind(this);
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
      if (deferredElement.nodeName == 'VIDEO' && deferredElement.getAttribute('autoplay')) {
        // force autoplay for safari
        deferredElement.play();
      }
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter((element) => element.clientWidth > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor(
      (this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) / this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    const previousPage = this.currentPage;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent('slideChanged', {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.slider.scrollLeft === 0) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset;
    return element.offsetLeft + element.clientWidth <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition =
      event.currentTarget.name === 'next'
        ? this.slider.scrollLeft + step * this.sliderItemOffset
        : this.slider.scrollLeft - step * this.sliderItemOffset;
    this.setSlidePosition(this.slideScrollPosition);
  }

  setSlidePosition(position) {
    this.slider.scrollTo({
      left: position,
    });
  }
}


customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.announcementBarSlider = this.querySelector('.announcement-bar-slider');
    // Value below should match --duration-announcement-bar CSS value
    this.announcerBarAnimationDelay = this.announcementBarSlider ? 250 : 0;

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach((link) => link.addEventListener('click', this.linkToSlide.bind(this)));
    this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.announcementBarSlider) {
      this.announcementBarArrowButtonWasClicked = false;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.addEventListener('change', () => {
        if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
      });

      [this.prevButton, this.nextButton].forEach((button) => {
        button.addEventListener(
          'click',
          () => {
            this.announcementBarArrowButtonWasClicked = true;
          },
          { once: true }
        );
      });
    }

    if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this));

    if (this.querySelector('.slideshow__autoplay')) {
      this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay');
      this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
      this.autoplayButtonIsSetToPlay = true;
      this.play();
    } else {
      this.reducedMotion.matches || this.announcementBarArrowButtonWasClicked ? this.pause() : this.play();
    }
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    this.wasClicked = true;

    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) {
      this.applyAnimationToAnnouncementBar(event.currentTarget.name);
      return;
    }

    if (isFirstSlide && event.currentTarget.name === 'previous') {
      this.slideScrollPosition =
        this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === 'next') {
      this.slideScrollPosition = 0;
    }

    this.setSlidePosition(this.slideScrollPosition);

    this.applyAnimationToAnnouncementBar(event.currentTarget.name);
  }

  setSlidePosition(position) {
    if (this.setPositionTimeout) clearTimeout(this.setPositionTimeout);
    this.setPositionTimeout = setTimeout(() => {
      this.slider.scrollTo({
        left: position,
      });
    }, this.announcerBarAnimationDelay);
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled');

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove('slider-counter__link--active');
      link.removeAttribute('aria-current');
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');
    this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
      this.play();
    } else if (!this.reducedMotion.matches && !this.announcementBarArrowButtonWasClicked) {
      this.play();
    }
  }

  focusInHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
        this.play();
      } else if (this.autoplayButtonIsSetToPlay) {
        this.pause();
      }
    } else if (this.announcementBarSlider.contains(event.target)) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.playSlideshow);
    } else {
      this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.pauseSlideshow);
    }
  }

  autoRotateSlides() {
    const slideScrollPosition =
      this.currentPage === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.sliderItemOffset;

    this.setSlidePosition(slideScrollPosition);
    this.applyAnimationToAnnouncementBar();
  }

  setSlideVisibility(event) {
    this.sliderItemsToShow.forEach((item, index) => {
      const linkElements = item.querySelectorAll('a');
      if (index === this.currentPage - 1) {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.removeAttribute('tabindex');
          });
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
      } else {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.setAttribute('tabindex', '-1');
          });
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
      }
    });
    this.wasClicked = false;
  }

  applyAnimationToAnnouncementBar(button = 'next') {
    if (!this.announcementBarSlider) return;

    const itemsCount = this.sliderItems.length;
    const increment = button === 'next' ? 1 : -1;

    const currentIndex = this.currentPage - 1;
    let nextIndex = (currentIndex + increment) % itemsCount;
    nextIndex = nextIndex === -1 ? itemsCount - 1 : nextIndex;

    const nextSlide = this.sliderItems[nextIndex];
    const currentSlide = this.sliderItems[currentIndex];

    const animationClassIn = 'announcement-bar-slider--fade-in';
    const animationClassOut = 'announcement-bar-slider--fade-out';

    const isFirstSlide = currentIndex === 0;
    const isLastSlide = currentIndex === itemsCount - 1;

    const shouldMoveNext = (button === 'next' && !isLastSlide) || (button === 'previous' && isFirstSlide);
    const direction = shouldMoveNext ? 'next' : 'previous';

    currentSlide.classList.add(`${animationClassOut}-${direction}`);
    nextSlide.classList.add(`${animationClassIn}-${direction}`);

    setTimeout(() => {
      currentSlide.classList.remove(`${animationClassOut}-${direction}`);
      nextSlide.classList.remove(`${animationClassIn}-${direction}`);
    }, this.announcerBarAnimationDelay * 2);
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition =
      this.slider.scrollLeft +
      this.sliderFirstItemNode.clientWidth *
        (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('change', (event) => {
      // alert('caled');
      const target = this.getInputForEventTarget(event.target);
      this.updateSelectionMetadata(event);

      publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
        data: {
          event,
          target,
          selectedOptionValues: this.selectedOptionValues,
        },
      });
    });
  }

  // varaint selection
  updateSelectionMetadata({ target }) {
    const { value, tagName } = target;

    if (tagName === 'SELECT' && target.selectedOptions.length) {
      Array.from(target.options)
        .find((option) => option.getAttribute('selected'))
        .removeAttribute('selected');
      target.selectedOptions[0].setAttribute('selected', 'selected');

      const swatchValue = target.selectedOptions[0].dataset.optionSwatchValue;
      const selectedDropdownSwatchValue = target
        .closest('.product-form__input')
        .querySelector('[data-selected-value] > .swatch');
      if (!selectedDropdownSwatchValue) return;
      if (swatchValue) {
        selectedDropdownSwatchValue.style.setProperty('--swatch--background', swatchValue);
        selectedDropdownSwatchValue.classList.remove('swatch--unavailable');
      } else {
        selectedDropdownSwatchValue.style.setProperty('--swatch--background', 'unset');
        selectedDropdownSwatchValue.classList.add('swatch--unavailable');
      }

      selectedDropdownSwatchValue.style.setProperty(
        '--swatch-focal-point',
        target.selectedOptions[0].dataset.optionSwatchFocalPoint || 'unset'
      );
    } else if (tagName === 'INPUT' && target.type === 'radio') {
      const selectedSwatchValue = target.closest(`.product-form__input`).querySelector('[data-selected-value]');
      if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    }
  }

  getInputForEventTarget(target) {
    return target.tagName === 'SELECT' ? target.selectedOptions[0] : target;
  }

  get selectedOptionValues() {
    return Array.from(this.querySelectorAll('select option[selected], fieldset input:checked')).map(
      ({ dataset }) => dataset.optionValueId
    );
  }
}

customElements.define('variant-selects', VariantSelects);

class ProductRecommendations extends HTMLElement {
  observer = undefined;

  constructor() {
    super();
  }

  connectedCallback() {
    this.initializeRecommendations(this.dataset.productId);
  }

  initializeRecommendations(productId) {
    this.observer?.unobserve(this);
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        this.loadRecommendations(productId);
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    this.observer.observe(this);
  }

  loadRecommendations(productId) {
    fetch(`${this.dataset.url}&product_id=${productId}&section_id=${this.dataset.sectionId}`)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector('product-recommendations');

        if (recommendations?.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        }

        if (!this.querySelector('slideshow-component') && this.classList.contains('complementary-products')) {
          this.remove();
        }

        if (html.querySelector('.grid__item')) {
          this.classList.add('product-recommendations--loaded');
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }
}

customElements.define('product-recommendations', ProductRecommendations);

class AccountIcon extends HTMLElement {
  constructor() {
    super();

    this.icon = this.querySelector('.icon');
  }

  connectedCallback() {
    document.addEventListener('storefront:signincompleted', this.handleStorefrontSignInCompleted.bind(this));
  }

  handleStorefrontSignInCompleted(event) {
    if (event?.detail?.avatar) {
      this.icon?.replaceWith(event.detail.avatar.cloneNode());
    }
  }
}

customElements.define('account-icon', AccountIcon);

class BulkAdd extends HTMLElement {
  constructor() {
    super();
    this.queue = [];
    this.requestStarted = false;
    this.ids = [];
  }

  startQueue(id, quantity) {
    this.queue.push({ id, quantity });
    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        if (!this.requestStarted) {
          this.sendRequest(this.queue);
        }
      } else {
        clearInterval(interval);
      }
    }, 250);
  }

  sendRequest(queue) {
    this.requestStarted = true;
    const items = {};
    queue.forEach((queueItem) => {
      items[parseInt(queueItem.id)] = queueItem.quantity;
    });
    this.queue = this.queue.filter((queueElement) => !queue.includes(queueElement));
    const quickBulkElement = this.closest('quick-order-list') || this.closest('quick-add-bulk');
    quickBulkElement.updateMultipleQty(items);
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;

    if (inputValue < event.target.dataset.min) {
      this.setValidity(event, index, window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min));
    } else if (inputValue > parseInt(event.target.max)) {
      this.setValidity(event, index, window.quickOrderListStrings.max_error.replace('[max]', event.target.max));
    } else if (inputValue % parseInt(event.target.step) != 0) {
      this.setValidity(event, index, window.quickOrderListStrings.step_error.replace('[step]', event.target.step));
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.startQueue(index, inputValue);
    }
  }

  getSectionsUrl() {
    if (window.pageNumber) {
      return `${window.location.pathname}?page=${window.pageNumber}`;
    } else {
      return `${window.location.pathname}`;
    }
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }
}

if (!customElements.get('bulk-add')) {
  customElements.define('bulk-add', BulkAdd);
}



/*New Custom JS For Menu*/
$(function() {
  $('.header-main .list-menu .header__menu-item').on('mouseenter',function(){
      $('.header-wrapper,.list-menu li').removeClass('is-subnav-active').removeClass('mega-menu-active');
      if($(this).closest('li').hasClass('sub-mega-menu')){
        $(this).closest('li').addClass('is-subnav-active');
        $(this).closest('.header-wrapper').addClass('mega-menu-active');
      }
  })
  $('.top-nav-subnav').on('mouseleave',function(){
      $(this).closest('.sub-mega-menu').removeClass('is-subnav-active');
      $(this).closest('.header-wrapper').removeClass('mega-menu-active');
  })
  
  /*Mobile Menu*/
  $('.menu-drawer .menu-colse-icon').on('click',function(){
    $('body').removeClass('overflow-hidden-tablet');
    $('.menu-drawer-container').removeClass('menu-opening').removeAttr('open');
  })
})


// JK
$(document).on('click', '.variant_card_size', function(){
  $('.variant_card_media .variant_list').removeClass('is_open');
  $(this).parents('.variant_card_media').find('.variant_list').addClass('is_open');
});

// $(document).on('click','.open_new_drawer',function(event){
//   event.preventDefault();
//   $('cart-drawer').removeClass('animate active');
//   $('body').removeClass('open_oneCartDrawer');
//   $('new-cart-drawer').removeClass('is-empty');
//   document.querySelector('#cart-icon-bubble').click();
// });

$(document).on('click','#new-CartDrawer-Overlay', function(){
  $('new-cart-drawer').removeClass('animate active');
  $('body').removeClass('overflow-hidden');
  $('body').removeClass('open_oneCartDrawer');
});

// $(document).on('click','#CartDrawer-Overlay', function(){
//   $('cart-drawer').removeClass('animate active');
//   $('body').removeClass('open_oneCartDrawer');
// });

if($('new-cart-drawer .drawer__inner.is-empty').length){
  $('new-cart-drawer').addClass('is-empty');
}else{
  $('new-cart-drawer').removeClass('is-empty');
}

$(document).on('click','.card_variant',function(event){
  event.preventDefault();
  var id= $(this).attr('data-id');
  $('.variant_card_media .variant_list').removeClass('is_open');
    $.ajax({
      url: '/cart/add.js',
      type: 'POST',
      dataType: 'json',
      data: {
        id: id,
        quantity: 1
      },
      success:function(data) {
        $.ajax({
          url: '/cart',
          type: 'GET',
          success: function(cartData) {
            var newCartHtml = $(cartData).find('#CartDrawer').html(); 
            $('#CartDrawer').html(newCartHtml);
            var newCartHtml3 = $(cartData).find('#cart-icon-bubble').html(); 
            $('#cart-icon-bubble').html(newCartHtml3);
            // $('cart-drawer').addClass('active');
            // if($('cart-drawer.is-empty').length){
            //   $('cart-drawer').removeClass('is-empty');
            // }
            if($('new-cart-drawer.is-empty').length){
              $('new-cart-drawer').removeClass('is-empty');
            }
            $('new-cart-drawer').addClass('animate active');
            $('body').addClass('open_oneCartDrawer');
            var newCartHtml1 = $(cartData).find('#newCartDrawer').html(); 
            $('#newCartDrawer').html(newCartHtml1);
            //document.querySelector('#cart-icon-bubble').click()
          },
          error: function(e) {
            console.log('Error updating cart:', e);
          }
        });
      },error:function(e){
        console.log(e);
        var massage = $(e).attr("responseJSON");
        alert($(massage).attr("description"));
      }
    });
});


$(document).on('click', '.product-form__input .size_var', function(){
  $('.product-form__input .size_var').removeClass('is_selected');
  $(this).addClass('is_selected');
  $('.product-form__input .default_variant_uk').removeClass('is_tab_active');
  $('.product-form__input .default_variant_uk[data-con="'+ $(this).attr('data-icon') +'"]').addClass('is_tab_active');
});

  $(document).on('change', '.custom_variants input, .custom_variants-mobile input', function(){
    //  alert('hello1111================')
  if ($(this).hasClass('pre_book')) {
      setTimeout(function() {
        $('.product-form__submit span').text('Pre-book');
        $('.custom_product-form__submit span').text('Pre-book');
      }, 800); // Adjust the delay time (500ms) as needed
  }
  else if ($(this).hasClass('disabled')) {
      $('.custom_product-form__submit span').text('Notify Me');
      $('.custom_product-form__submit').addClass('disabled');
    } else {
    //  alert('hello2================')
      $('.custom_product-form__submit span').text('Add to Bag');
      $('.custom_product-form__submit').prop('disabled', false).removeClass('disabled');
    }
    if($('variant-selects .product-form__input input[value="'+ $(this).attr('value') +'"]').length){
      $('variant-selects .product-form__input input[value="'+ $(this).attr('value') +'"] + label').trigger('click');  
    //  alert('hello1================')
    }

    
    $('.custom_variants input[value="'+ $(this).attr('value') +'"]').prop('checked', true);
    $('.custom-mobile-variants input[value="'+ $(this).attr('value') +'"]').prop('checked', true);
    if($(this).parents('.custom_variants-mobile').length){
      setTimeout(function(){ $('.product-form__buttons .product-form__submit').trigger('click'); }, 1000);
      $('.product__info-container .custom-mobile-variants').removeClass('size-activate');
    }
    // openVariantPopup();
  });

let defaultSelectedSize = null;
  function openVariantPopup() {
    const btn = document.getElementById('sizeConfirmBtn');
    const isSizePopupVisible = getComputedStyle(document.querySelector('.size-chart-popup__content')).display != 'block';

    if (!defaultSelectedSize) {
      const checkedRadio = document.querySelector(
        '.size-chart-popup__size-box input[type="radio"]:checked'
      );

      if (checkedRadio) {
        defaultSelectedSize = checkedRadio.value;
        localStorage.setItem('Keep Size old', defaultSelectedSize);
      }
    }

    console.log('defaultSelectedSize:', defaultSelectedSize);
    if ( isSizePopupVisible && $('input.keep_size[type="radio"]')) {
      localStorage.setItem('Keep Size old', event.target.value);
      console.log('Stored size from popup:', event.target.value);
    }
    $('.size-chart-popup__content').fadeIn(100);
    $('.size-chart-popup-overlay').addClass('show');
    $('.size-chart-size-box-sizes').addClass('popup-active');
    $('body').addClass('size-chart-popup-pdp');
    const sizeSpecSpans = document.querySelectorAll('.size_specification_value');
    document.querySelectorAll('.default_variant_uk input[type="radio"]').forEach(input => {
      input.addEventListener('change', () => {
          if (input.checked) {
            const selectedSize = input.value;
             sizeSpecSpans.forEach(span => {
              if (span.dataset.variantTitle === selectedSize) {
                span.style.display = 'block';
              } else {
                span.style.display = 'none';
              }
            });
          }
        });
    });
  }
  function closeVariantPopup() {
    $('.size-chart-popup__content').fadeOut(100);
    $('.size-chart-popup-overlay').removeClass('show');
    $('.size-chart-size-box-sizes').removeClass('popup-active');
    $('body').removeClass('size-chart-popup-pdp');
  }

  function closeVariantPopupKeep(){
    var keep_old_size = localStorage.getItem('Keep Size old');
    $('input.keep_size[type="radio"][value="' + keep_old_size + '"]').prop('checked', true);
    $('input[type="radio"][value="' + keep_old_size + '"]').prop('checked', true);
    $('input[type="radio"][value="' + keep_old_size + '"]').trigger('click');
    $('input.keep_size[type="radio"][value="' + keep_old_size + '"]').trigger('click');
    $('.size-chart-popup__content').fadeOut(100);
    $('.size-chart-popup-overlay').removeClass('show');
    $('.size-chart-size-box-sizes').removeClass('popup-active');
    $('body').removeClass('size-chart-popup-pdp');
  }
  

  function updateRadioDataVals() {
    document.querySelectorAll('.popup-active input[type="radio"]').forEach(input => {
      input.dataset.val = input.value;
    });
  }

  // function addPopupVariantToCart() {
  //   const selectedVariant = document.querySelector(
  //     '.size-chart-popup input[type="radio"]:checked'
  //   );

  //   if (!selectedVariant) {
  //     alert('Please select a size');
  //     return;
  //   }

  //   const variantId = selectedVariant.getAttribute('data-variant-id');

  //   if (!variantId) {
  //     alert('Invalid variant selected');
  //     return;
  //   }

  //   fetch('/cart/add.js', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       id: variantId,
  //       quantity: 1
  //     })
  //   })
  //   .then(res => res.json())
  //   .then(data => {
  //     console.log('Variant added:', data);

  //     // Close popup
  //     if (typeof closeVariantPopup === 'function') {
  //       closeVariantPopup();
  //     }

  //     render_cart();
  //     // Refresh cart / open drawer
  //     document.dispatchEvent(new CustomEvent('cart:refresh'));

  //   })
  //   .catch(err => {
  //     console.error(err);
  //     alert('Something went wrong. Please try again.');
  //   });
  // }

  // Run once on load
  document.addEventListener('DOMContentLoaded', updateRadioDataVals);

  // Run again if popup opens dynamically
  // Example: trigger this manually after popup opens
  // You may need to adapt this if your popup uses different JS
  document.addEventListener('popup:opened', updateRadioDataVals);

  
$(document).on('change', '.custom_variants input, .product-form__input input', function(){
  // alert("xys================");
  setTimeout(() => {
    if ($(this).hasClass('disabled')) {
      $('.product-form__submit span').text('Notify Me');
      $('.size-chart-add-to-cart-btn').text('Notify Me');
      $('.product-form__submit').addClass('disabled');
      $('.size-chart-add-to-cart-btn').addClass('disabled');
    } else {
      $('.product-form__submit span').text('Add to Bag');
      $('.size-chart-add-to-cart-btn').text('Add to Bag');
      $('.product-form__submit').prop('disabled', false).removeClass('disabled');
      $('.size-chart-add-to-cart-btn').prop('disabled', false).removeClass('disabled');
    }
  }, 500);
});


 // Click event (for click-based interaction)
$(document).ready(function() {
  // Click event for tabs in the left section
  $('.meta_scroll_text').click(function() {
    var index = $(this).attr('id'); // Get the ID of the clicked tab (e.g., 'ind_1')

    // Remove 'is_selected' from all tabs in the left section
    $('.meta_sroll_left .meta_scroll_text').removeClass('is_selected');

    // Add 'is_selected' to the clicked tab
    $(this).addClass('is_selected');

    // Hide all right section images
    $('.meta_sroll_right .meta_sroll_right_item').hide();

    // Show the right section image corresponding to the selected tab
    var imageToShow = $('.meta_sroll_right .meta_sroll_right_item[data-index="' + index + '"]');
    imageToShow.show();
     var imageMain = imageToShow.find('.meta_image_main');
    
    // Initially, hide the image to enable slideDown effect
    imageMain.hide();
    
    // Slide down the image
    imageMain.slideDown(500);
  });

  // Initialize by triggering the click event on the first tab
  $('.meta_scroll_text').first().trigger('click');
});






  // const faqs2 = document.querySelectorAll("#faq_section_2");
  // faqs2.forEach((faq2) => {
  //   faq2.addEventListener("click", function () {
  //     faqs2.forEach((otherFaq2) => {
  //       if (otherFaq2 !== faq2) {
  //         const otherFaqMain2 = otherFaq2.querySelector(".faq_main");
  //         const otherFaqAnswer2 = otherFaq2.querySelector(".meta_answer");

  //         otherFaqAnswer2.style.display = "none";
  //         otherFaqMain2.classList.remove("active");
  //       }
  //     });
  //     const answer2 = faq2.querySelector(".meta_answer");
  //     const faqMain2 = faq2.querySelector(".faq_main");
  //     const isAnswerVisible2 = answer2.style.display === "block";
  //     answer2.style.display = isAnswerVisible2 ? "none" : "block";
  //     faqMain2.classList.toggle("active", !isAnswerVisible2);
  //   });
  // });

const faqs2 = document.querySelectorAll("#faq_section_2");

faqs2.forEach((faq2, index) => {
  const faqMain2 = faq2.querySelector(".faq_main");
  const answer2 = faq2.querySelector(".meta_answer");

  // Open the first FAQ by default
  if (index === 0) {
    answer2.style.height = answer2.scrollHeight + "px";
    answer2.classList.add("open"); // so toggle works correctly
  }

  faq2.addEventListener("click", function () {
    faqs2.forEach((otherFaq2) => {
      if (otherFaq2 !== faq2) {
        const otherAnswer2 = otherFaq2.querySelector(".meta_answer");
        const otherFaqMain2 = otherFaq2.querySelector(".faq_main");
        otherAnswer2.style.height = 0;
        otherAnswer2.classList.remove("open");
        otherFaqMain2.classList.remove("active");
      }
    });

    const isOpen = answer2.classList.contains("open");
    if (isOpen) {
      answer2.style.height = 0;
      answer2.classList.remove("open");
      faqMain2.classList.remove("active");
    } else {
      answer2.style.height = answer2.scrollHeight + "px";
      answer2.classList.add("open");
      faqMain2.classList.add("active");
    }
  });
});






  
 const faqs1 = document.querySelectorAll("#faq_section_1");

// Automatically open the "Details" tab by default
// faqs1.forEach((faq1) => {
//   const faqMain1 = faq1.querySelector(".faq_main");
//   const answer1 = faq1.querySelector(".meta_answer");
  
//   // Check if the title is "Details" and open it
//   if (faqMain1 && faqMain1.textContent.trim() === "Details") {
//     answer1.style.display = "block"; // Show the answer
//     faqMain1.classList.add("active"); // Add the active class
//   }
// });

// Add click event listeners as before
// faqs1.forEach((faq1) => {
//   faq1.addEventListener("click", function () {
//     faqs1.forEach((otherFaq1) => {
//       if (otherFaq1 !== faq1) {
//         const otherFaqMain1 = otherFaq1.querySelector(".faq_main");
//         const otherFaqAnswer1 = otherFaq1.querySelector(".meta_answer");

//         otherFaqAnswer1.style.display = "none";
//         otherFaqMain1.classList.remove("active");
//       }
//     });
//     const answer1 = faq1.querySelector(".meta_answer");
//     const faqMain1 = faq1.querySelector(".faq_main");
//     const isAnswerVisible1 = answer1.style.display === "block";
//     answer1.style.display = isAnswerVisible1 ? "none" : "block";
//     faqMain1.classList.toggle("active", !isAnswerVisible1);
//   });
// });

let opened = false;

// faqs1.forEach((faq1) => {
//   const faqMain1 = faq1.querySelector(".faq_main");
//   const answer1 = faq1.querySelector(".meta_answer");
//   const title = faqMain1?.textContent.trim();

//   // Try to open "Lace Calendar" first
//   if (!opened && title === "Lace Calendar") {
//     answer1.style.display = "block";
//     faqMain1.classList.add("active");
//     opened = true;
//   }
// });

// // If "Lace Calendar" not found, open "Details"
// if (!opened) {
//   faqs1.forEach((faq1) => {
//     const faqMain1 = faq1.querySelector(".faq_main");
//     const answer1 = faq1.querySelector(".meta_answer");
//     const title = faqMain1?.textContent.trim();

//     if (title === "Details") {
//       answer1.style.display = "block";
//       faqMain1.classList.add("active");
//     }
//   });
// }


// faqs1.forEach((faq1) => {
//   faq1.addEventListener("click", function (e) {
//     // ✅ Only toggle when clicking on the question title
//     if (!e.target.closest(".faq_main")) return;

//     faqs1.forEach((otherFaq1) => {
//       if (otherFaq1 !== faq1) {
//         const otherFaqMain1 = otherFaq1.querySelector(".faq_main");
//         const otherFaqAnswer1 = otherFaq1.querySelector(".meta_answer");

//         otherFaqAnswer1.style.display = "none";
//         otherFaqMain1.classList.remove("active");
//       }
//     });

//     const answer1 = faq1.querySelector(".meta_answer");
//     const faqMain1 = faq1.querySelector(".faq_main");
//     const isAnswerVisible1 = answer1.style.display === "block";

//     // ✅ Do NOT close if this is Lace Calendar and click happened inside answer
//     if (
//       faqMain1.textContent.trim() === "Lace Calendar" &&
//       e.target.closest(".meta_answer")
//     ) {
//       return;
//     }

//     answer1.style.display = isAnswerVisible1 ? "none" : "block";
//     faqMain1.classList.toggle("active", !isAnswerVisible1);
//   });
// });





faqs1.forEach((faq1) => {
  const faqMain1 = faq1.querySelector(".faq_main");
  const answer1 = faq1.querySelector(".meta_answer");
  const title = faqMain1?.textContent.trim();

  // Open "Lace Calendar" first
  if (!opened && title === "Lace Calendar") {
    answer1.style.height = answer1.scrollHeight + "px";
    answer1.classList.add("open");
    faqMain1.classList.add("active");
    opened = true;
  }
});

// If "Lace Calendar" not found, open "Details"
if (!opened) {
  faqs1.forEach((faq1) => {
    const faqMain1 = faq1.querySelector(".faq_main");
    const answer1 = faq1.querySelector(".meta_answer");
    const title = faqMain1?.textContent.trim();

    if (title === "Details") {
      answer1.style.height = answer1.scrollHeight + "px";
      answer1.classList.add("open");
      faqMain1.classList.add("active");
    }
  });
}

faqs1.forEach((faq1) => {
  const faqMain1 = faq1.querySelector(".faq_main");
  const answer1 = faq1.querySelector(".meta_answer");

  faq1.addEventListener("click", function (e) {
    // Only toggle when clicking on the question title
    if (!e.target.closest(".faq_main")) return;

    faqs1.forEach((otherFaq1) => {
      if (otherFaq1 !== faq1) {
        const otherFaqMain1 = otherFaq1.querySelector(".faq_main");
        const otherFaqAnswer1 = otherFaq1.querySelector(".meta_answer");

        otherFaqAnswer1.style.height = 0;
        otherFaqAnswer1.classList.remove("open");
        otherFaqMain1.classList.remove("active");
      }
    });

    const isOpen = answer1.classList.contains("open");

    // Do NOT close if this is Lace Calendar and click happened inside answer
    if (
      faqMain1.textContent.trim() === "Lace Calendar" &&
      e.target.closest(".meta_answer")
    ) {
      return;
    }

    if (isOpen) {
      answer1.style.height = 0;
      answer1.classList.remove("open");
      faqMain1.classList.remove("active");
    } else {
      answer1.style.height = answer1.scrollHeight + "px";
      answer1.classList.add("open");
      faqMain1.classList.add("active");
    }
  });
});


// ========================== ********* ==========================
// ========================== Lace calendar code in PDP page accordian ==========================
// ========================== ********* ==========================

document.addEventListener("DOMContentLoaded", function () {
  const imageViewer = document.getElementById("imageViewer");
  const images = imageViewer?.querySelectorAll("img");
  const days = document.querySelectorAll(".day");

  // Define original colors for each day
  const originalColors = [
    "#85C3E8", "#A09390", "#DCA18E", "#948F8D", "#D4BA97",
    "linear-gradient(180deg, #EB2C7C 7.73%, #E84F3C 48.15%, #FFDD2A 119.54%)",
    "#8BC640"
  ];

  // Reset all circles to base grey
  days.forEach((day) => {
    day.querySelector(".circle").style.background = "#E9E9E9";
  });

  // Show only the first image on load
  if (images) {
    images.forEach(img => img.classList.remove("active"));
    images[0]?.classList.add("active");
  }

  // === RANDOM BLINKING ===
  let blinking = true;
  let blinkCount = 0;
  let currentBlinkIndex = -1;
  let blinkTimeout;

  // Function to start blinking on a random day
  function startBlinking() {
    if (!blinking) return;

    // Choose a new random day (different from current)
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * days.length);
    } while (newIndex === currentBlinkIndex);

    currentBlinkIndex = newIndex;
    const circle = days[currentBlinkIndex].querySelector(".circle");
    blinkCount = 0;

    const blinkInterval = setInterval(() => {
      if (!blinking || blinkCount >= 6) {
        clearInterval(blinkInterval);
        circle.style.background = "#E9E9E9";

        // Continue blinking on a new random circle
        blinkTimeout = setTimeout(startBlinking, 500); // Delay before next blink cycle
        return;
      }

      const isEven = blinkCount % 2 === 0;
      circle.style.background = isEven ? originalColors[currentBlinkIndex] : "#E9E9E9";
      blinkCount++;
    }, 500);
  }

  // Start the initial blinking cycle
  startBlinking();


  // === CLICK TO SELECT ===
  days.forEach((day, idx) => {
    day.addEventListener("click", function () {
      blinking = false; // Stop blinking when clicked
      clearTimeout(blinkTimeout); 

      // Reset all to grey
      days.forEach((d) => {
        d.querySelector(".circle").style.background = "#E9E9E9";
      });

      // Set clicked circle to its color
      const circle = day.querySelector(".circle");
      circle.style.background = originalColors[idx];

      // Swap images
      if (images) {
        images.forEach(img => img.classList.remove("active"));
        images[idx + 1]?.classList.add("active");
      }
    });
  });
});


document.addEventListener("DOMContentLoaded", function () {
  const dayCircles = document.querySelectorAll(".day");

  function isMobile() {
    return window.innerWidth <= 767;
  }

  dayCircles.forEach((day) => {
    day.addEventListener("click", () => {
      if (!isMobile()) return;

      // Remove active class from all
      dayCircles.forEach((d) => d.querySelector(".circle").classList.remove("active"));

      // Add to the clicked one
      day.querySelector(".circle").classList.add("active");
    });
  });
});







// size chart opens and overlay on it

// $(document).ready(function () {
//   // Open and close size modal & add item to cart
//   if ($(window).width() < 768) {
//     $('.product-form__buttons .custom_product-form__submit').click(function (event) {
//       $('.product__info-container .custom-mobile-variants').removeClass('size-activate');
//       $('.product__info-container .custom-mobile-variants').addClass('size-activate');
//     });

//     // Close modal when clicking outside
//     $(document).click(function (event) {
//       if (!$(event.target).closest('.custom-mobile-variants').length && 
//           !$(event.target).closest('.custom_product-form__submit').length) {
//         $('.product__info-container .custom-mobile-variants').removeClass('size-activate');
//       }
//     });
//   }
// });
$(document).ready(function () {
  var $modal = $("#cspopupModal");
  var $NewSizeButton = $(".new_size_guide");
  if ($NewSizeButton.length) {
    $NewSizeButton.on("click", function () {
      $modal.css("display", "flex");
      $("body").addClass("cs-popup-is-opened");
      $(".custom-mobile-variants").removeClass("size-activate");
    });
  }
});

$(document).ready(function () {
  if ($(window).width() < 768) {
    // Open size modal
    $('.product-form__buttons .custom_product-form__submit').click(function () {
      $('.product__info-container .custom-mobile-variants').addClass('size-activate');
      $('.custom-mobile-overlay').fadeIn(); // Show overlay
      $('body').addClass('body-no-scroll'); // Disable body scroll
    });

    // Close size modal and overlay when clicking outside
    $(document).click(function (event) {
      if (!$(event.target).closest('.custom-mobile-variants').length && 
          !$(event.target).closest('.custom_product-form__submit').length) {
        $('.product__info-container .custom-mobile-variants').removeClass('size-activate');
        $('.custom-mobile-overlay').fadeOut('fast'); // Hide overlay smoothly
        $('body').removeClass('body-no-scroll'); // Enable body scroll
      }
    });

    // Close size modal when clicking on the overlay
    $('.custom-mobile-overlay').click(function () {
      $('.product__info-container .custom-mobile-variants').removeClass('size-activate');
      $(this).fadeOut('fast'); // Hide overlay smoothly
      $('body').removeClass('body-no-scroll'); // Enable body scroll
    });

    // Ensure both elements smoothly transition together
    $('.product__info-container .custom-mobile-variants').on('transitionend', function () {
      if (!$(this).hasClass('size-activate')) {
        $('.custom-mobile-overlay').stop(true, true).fadeOut('fast'); // Sync overlay fade-out
      }
    });
  }
});


$('.reserve-link').on('click', function (e) {
  e.preventDefault();    
  $('.reserve_popup').addClass('active');
  $('.reserve_overlay').addClass('active');
  $('body').addClass('reserve_popup_open');
});
$('.reserve-btn').on('click', function (e) {
  e.preventDefault();    
  $('.reserve_popup').addClass('active');
  $('.reserve_overlay').addClass('active');
  $('body').addClass('reserve_popup_open');
});
$('.reserve_overlay, .close-popup').on('click', function () {
  $('.reserve_popup').removeClass('active');
  $('.reserve_overlay').removeClass('active');
  $('body').removeClass('reserve_popup_open');
});

$(document).ready(function () {
  function updateSelectedVariant() {
    const selectedColor = $("input[name='reserve_product']:checked").val();
    const selectedProduct = $("input[name='reserve_product']:checked").data("title"); // Fixed data-title retrieval

    let matchFound = false;

    // Find matching variants within the corresponding product
    $(`.product_reserve_item[data-title="${selectedProduct}"] input[name='reserve_buy_variant']`).each(function () {
      const variantColor = $(this).data("color");
      if (variantColor === selectedColor) {
        $(this).prop("checked", true); // Check the corresponding variant
        $("#reserve_v_id").val($(this).val()); // Set the variant ID in the hidden field
        matchFound = true;
      }
    });

    // Reset the hidden field if no match is found
    if (!matchFound) {
      $("#reserve_v_id").val("");
    }
  }

  // Initial check on page load
  updateSelectedVariant();

  // Update when a product is selected
  $("input[name='reserve_product']").on("change", function () {
    updateSelectedVariant();
  });
});


$(document).ready(function () {
  $('input[name="reserve_product"]').on('change', function () {
    $('.reserve_product').each(function () {
      var sanitizedId = $(this).find('input[type="radio"]').attr('id').split('_')[2];
      var outOfStockVariants = $('#reserve_oos_variants_' + sanitizedId);
      if ($(this).find('input[type="radio"]').prop('checked')) {
        outOfStockVariants.show();
        outOfStockVariants.find('input[type="radio"]').prop('checked', false); 
        $('#reserve_size_error_block').html('');
      } else {
        outOfStockVariants.hide();
        outOfStockVariants.find('input[type="radio"]').prop('checked', false);
        $('#reserve_size_error_block').html('');
      }
    });
  });
});
$('input[name="reserve_product"]').on('change', function () {
  $('#reserve_size_error_block').html('');  // Clear error message when a size is selected
});
$('input[name="reserve_variant"]').on('change', function () {
  $('#reserve_size_error_block').html('');  // Clear error message when a size is selected
});

$('#reserve-product-button').on('click', function (e) {
  e.preventDefault(); 
  var selectedSize= $("input[name='reserve_variant']:checked").val();
  var selectedOOSProduct= $("input[name='reserve_product']:checked").val();
  var selectedSizeValue = $("input[name='reserve_variant']:checked").data('reserve-size');
  var selectedVariantId = $("#reserve_v_id").val();
  if(!selectedOOSProduct){
    $('#reserve_size_error_block').html('<p class="error"><i class="ri-error-warning-line"></i>Please select variant.</p>');
  }else{
    if (!selectedSize) {
      $('#reserve_size_error_block').html('<p class="error"><i class="ri-error-warning-line"></i>Please select your size.</p>');
    } else {
      $('#reserve_size_error_block').html('');
      var properties = {
        "Size": selectedSizeValue,
        "Reserve Product": 'Yes'
      };
      var quantity = 1; 
      $.ajax({
        type: 'POST',
        url: '/cart/add.js',
        data: {
          id: selectedVariantId,
          quantity: quantity,
          properties: properties 
        },
        dataType: 'json',
        success: function (response) {
          $('new-cart-drawer').addClass('active');
          $('new-cart-drawer').addClass('animate');
          $('.reserve_popup').removeClass('active');
          $('.reserve_overlay').removeClass('active');
          $('body').removeClass('reserve_popup_open');
          render_cart();
        },
        error: function (error) {
          console.log('Error adding product to cart:', error);
        }
      });
    }
  }
    
});


function render_cart() {
  $.ajax({
      url: '/?section_id=new-cart-drawer',
      type: 'GET',
  }).then(res => {
      var new_cart_html = $(res).find("new-cart-drawer").children();
      $("new-cart-drawer").empty();
      $("new-cart-drawer").append(new_cart_html);
      var cart_count = $("new-cart-drawer .item_count_display_none").text();
      $(".cart-count-bubble span[aria-hidden=true]").text(cart_count);
      $(".cart-count-bubble span.visually-hidden").text(cart_count + "item");
  });
  $.ajax({
      url: '/?section_id=cart-icon-bubble',
      type: 'GET',
  }).then(res => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(res, 'text/html');
      const cart_icon_buble_shopsection = doc.querySelector('#shopify-section-cart-icon-bubble');
      const cart_icon_buble = document.querySelector('#cart-icon-bubble');
      cart_icon_buble.innerHTML = cart_icon_buble_shopsection.innerHTML;
  });
  $.ajax({
      url: '/?section_id=main-cart-items',
      type: 'GET',
  }).then(res => {
      var new_cart_html = $(res).find("#main-cart-items").children();
      $("#main-cart-items").empty();
      $("#main-cart-items").append(new_cart_html);
      setTimeout(function() {
          var cart_count = $("cart-drawer .item_count_display_none").text();
          if(cart_count === ''){
              $("cart-items").addClass('is-empty'); 
              $('#main-cart-footer').addClass('is-empty');
          }
      }, 500);
  });
}


// slider-text-image class banner clickable

$(document).ready(function() {
  // Use setTimeout to delay the execution if necessary
    // Check if the parent element has the class 'slider-text-image'
    if ($('.slider-text-image').length > 0) {
      
      // Define the URL you want the grid to be linked to
      var linkUrl = '/collections/sliders'; // Change this URL to your desired destination
      
      // Add a click event on the entire parent div with the class 'slider-text-image'
      $('.slider-text-image').on('click', function() {
        // Redirect to the linkUrl when clicked
        window.location.href = linkUrl;
      });
      
      // Ensure the cursor is a pointer when hovering over the banner
      $('.slider-text-image').css('cursor', 'pointer');
    }
});


document.addEventListener('DOMContentLoaded', function () {
  // For each variant-product-wrapper on the page
  document.querySelectorAll('.variant-product-wrapper').forEach(wrapper => {
    const toggle = wrapper.querySelector('.variant-toggle');
    const items = wrapper.querySelectorAll('.variant-item');
    const variantInner = wrapper.querySelector('.variant-product-inner');
    let expanded = false;

    const firstItem = items[0];
    firstItem.style.transition = 'max-width 0.6s ease';

    // Slide out first item after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        firstItem.style.maxWidth = '40px';
      }, 300);
    });

    toggle.addEventListener('click', () => {
      expanded = !expanded;
      toggle.textContent = expanded ? '–' : '+';

      variantInner.classList.toggle('expanded', expanded);

      items.forEach((item, index) => {
        if (index === 0) return;
        if (expanded) {
          item.classList.remove('collapsing');
        } else {
          item.classList.add('collapsing');
        }
      });
    });
  });
});


// document.addEventListener('DOMContentLoaded', function () {
//   const isMobile = window.innerWidth <= 768;
//   if (!isMobile) return;

//   const banners = document.querySelectorAll('.slideshow__text-wrapper');

//   function handleVariantVisibility() {
//     banners.forEach(banner => {
//       const variantWrapper = banner.querySelector('.variantWrapper');
//       if (!variantWrapper) return;

//       const rect = banner.getBoundingClientRect();
//       const bannerWidth = banner.offsetWidth;
//       const bannerHeight = banner.offsetHeight;

//       // Horizontal (slide visibility)
//       const visibleWidth = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
//       const horizontalRatio = visibleWidth / bannerWidth;

//       // Vertical visible height and ratio
//       const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
//       const verticalRatio = visibleHeight / bannerHeight;

//       const threshold = 0.15;

//       if (horizontalRatio >= threshold && verticalRatio > threshold) {
//         variantWrapper.classList.remove('scrolled-out');
//       } else {
//         variantWrapper.classList.add('scrolled-out');
//       }
//     });
//   }

//   window.addEventListener('scroll', handleVariantVisibility);
//   window.addEventListener('resize', handleVariantVisibility);
//   handleVariantVisibility();

//   // Re-check every 100ms to catch slide changes
//   setInterval(handleVariantVisibility, 100);
// });




// document.addEventListener('DOMContentLoaded', function () {
//   const isMobile = window.innerWidth <= 768;
//   if (!isMobile) return; // only for mobile

//   // Select all banner wrappers and their variant wrappers
//   const banners = document.querySelectorAll('.slideshow__text-wrapper');

//   // We'll assume variant wrapper is inside banner as .variantWrapper
//   banners.forEach((banner) => {
//     const variantWrapper = banner.querySelector('.variantWrapper');
//     if (!variantWrapper) return; // skip if no variant wrapper

//     function checkPosition() {
//       const bannerRect = banner.getBoundingClientRect();
//       const bannerHeight = banner.offsetHeight;

//       const visibleHeight = Math.min(bannerRect.bottom, window.innerHeight) - Math.max(bannerRect.top, 0);
//       const visibleRatio = visibleHeight / bannerHeight;

//       const threshold = 0.3; // threshold for visibility

//       if (visibleRatio <= threshold) {
//         variantWrapper.classList.add('scrolled-out');
//       } else {
//         variantWrapper.classList.remove('scrolled-out');
//       }
//     }

//     // Run on scroll and resize
//     window.addEventListener('scroll', checkPosition);
//     window.addEventListener('resize', checkPosition);
//     // Initial check
//     checkPosition();
    
//   });
// });







  // Logo Scroll 
  document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.logo-scroll-track');
    if (!track) return;

    const trackHeight = track.offsetHeight;
    const speedFactor = 0.1;

    window.addEventListener('scroll', function () {
      const scrollY = window.scrollY;
      const translateY = (scrollY * speedFactor) % trackHeight;

      track.style.transform = `translateY(-${translateY}px)`;
    });
  });
