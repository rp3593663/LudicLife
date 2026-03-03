class newCartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    const overlay = this.querySelector('#new-CartDrawer-Overlay');
    if (overlay) {
      overlay.addEventListener('click', this.close.bind(this));
    }
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    const cartLink1 = document.querySelector('#cart-icon-bubble1');
    
    if (cartLink) {
      cartLink.setAttribute('role', 'button');
      cartLink.setAttribute('aria-haspopup', 'dialog');
      cartLink.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    }
    
    if (cartLink1) {
      cartLink1.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink1.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    }
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('newCartDrawer');
        const focusElement = this.querySelector('new-cart-drawer .drawer__inner') || this.querySelector('new-cart-drawer .drawer__close');
        if (containerToTrapFocusOn && focusElement) {
          trapFocus(containerToTrapFocusOn, focusElement);
        }
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    // alert('test');
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');

    // ensure the cart count bubble is up‑to‑date when the drawer goes
    // away – useful if the user removed the last item while the
    // drawer remained open or if it was updated via AJAX elsewhere.
    if (typeof updateCartIconBubble === 'function') {
      updateCartIconBubble();
    }
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    if (!parsedState || !parsedState.sections) {
      console.error('Invalid cart state received');
      return;
    }
    
    const drawerInner = this.querySelector('new-cart-drawer .drawer__inner');
    if (!drawerInner) {
      console.error('Cart drawer inner element not found');
      return;
    }
    
    if (drawerInner.classList.contains('is-empty')) {
      drawerInner.classList.remove('is-empty');
    }
    
    this.productId = parsedState.id;
    console.log('=======PID', this.productId);
    
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);
      
      if (sectionElement && parsedState.sections && parsedState.sections[section.id]) {
        sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      }
    });

    setTimeout(() => {
      const overlay = this.querySelector('#new-CartDrawer-Overlay');
      if (overlay) {
        overlay.removeEventListener('click', this.close.bind(this));
        overlay.addEventListener('click', this.close.bind(this));
      }
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const element = doc.querySelector(selector);
    return element ? element.innerHTML : '';
  }

  

  getSectionsToRender() {
    return [
      {
        id: 'new-cart-drawer',
        selector: '#newCartDrawer',
      },
      {
        id: 'header',
        selector: '#cart-icon-bubble',
      }
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    if (!html) return null;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('new-cart-drawer', newCartDrawer);

class newCartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      // {
      //   id: 'newCartDrawer',
      //   section: 'cart-drawer',
      //   selector: '.drawer__inner',
      // },
      {
        id: 'newCartDrawer',
        section: 'new-cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      }
    ];
  }
}

customElements.define('new-cart-drawer-items', newCartDrawerItems);
