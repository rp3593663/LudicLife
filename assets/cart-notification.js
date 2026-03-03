class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);

    if (this.notification) {
      this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
      this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
        closeButton.addEventListener('click', this.close.bind(this))
      );
    }
  }

  open() {
    if (!this.notification) return;
    
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener(
      'transitionend',
      () => {
        if (this.notification) {
          this.notification.focus();
          trapFocus(this.notification);
        }
      },
      { once: true }
    );

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    if (this.notification) {
      this.notification.classList.remove('active');
    }
    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) {
    if (!parsedState || !parsedState.sections) return;
    
    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      const element = document.getElementById(section.id);
      if (element && parsedState.sections[section.id]) {
        element.innerHTML = this.getSectionInnerHTML(
          parsedState.sections[section.id],
          section.selector
        );
      }
    });

    if (this.header) this.header.reveal();
    if (this.notification) this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: 'cart-notification-button',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const element = doc.querySelector(selector);
    return element ? element.innerHTML : '';
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
