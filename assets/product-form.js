if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        if (!this.form) {
          console.error('Product form not found');
          return;
        }
        
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('new-cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        
        if (!this.submitButton) {
          console.error('Submit button not found');
          return;
        }
        
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('new-cart-drawer')) {
          this.submitButton.setAttribute('aria-haspopup', 'dialog');
        }

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;
        this.handleErrorMessage();

        this.submitButton.classList.add('loading');
        this.submitButton.setAttribute('aria-disabled', 'true');
        const buttonsContainer = this.querySelector('.product-form__buttons');
        if (buttonsContainer) buttonsContainer.classList.add('loading');
        const spinner = this.querySelector('.loading__spinner');
        if (spinner) {
          spinner.classList.remove('hidden');
        }

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (!response) {
              console.error('Empty response from cart add');
              this.handleErrorMessage('Failed to add item to cart');
              return;
            }
            
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);
              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error) {
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });

              // also update bubble directly for immediate visual feedback
              if (typeof updateCartIconBubble === 'function' && typeof response.item_count === 'number') {
                updateCartIconBubble(response.item_count);
              }
            }
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    if (this.cart && this.cart.renderContents) {
                      this.cart.renderContents(response);
                    }
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              if (this.cart && this.cart.renderContents) {
                this.cart.renderContents(response);
              }
            }
          })
          .catch((e) => {
            console.error('Error adding to cart:', e);
            this.handleErrorMessage('Failed to add item to cart. Please try again.');
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            this.submitButton.removeAttribute('aria-disabled');
            const buttonsContainer = this.querySelector('.product-form__buttons');
            if (buttonsContainer) buttonsContainer.classList.remove('loading');
            if (this.cart && this.cart.classList && this.cart.classList.contains('is-empty')) {
              this.cart.classList.remove('is-empty');
            }
            const spinner = this.querySelector('.loading__spinner');
            if (spinner) {
              spinner.classList.add('hidden');
            }
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          //this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
