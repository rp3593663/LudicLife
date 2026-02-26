document.addEventListener("DOMContentLoaded", function () {
  localStorage.removeItem('removedItems'); // Clears storage properly on page load
  attachRemoveEventListeners(); // Attach event listeners after page load
});


// Function to remove item from cart whole product delete
// function removeItemFromCart(line) {
//   fetch('/cart/change.js', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       line: line, // Line item position (1-based index)
//       quantity: 0
//     })
//   })
//   .then(response => response.json())
//   .then(cart => {
//     if (cart.items_removed && cart.items_removed.length > 0) {
//     let removedItem = cart.items_removed[0];
//     console.log('✅ Item removed:', cart.items_removed[0].variant_id, 'Quantity:', removedItem.quantity);
//     storeDeletedVariant(cart.items_removed[0].variant_id, removedItem.quantity);
//     //showUndoMessage();
//     refreshCart(); // Refresh only the cart
//     }
//   })  
//   .catch(error => console.error('❌ Error removing item:', error));
// }

// delete single item from cart
function removeItemFromCart(line) {
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      const item = cart.items[line - 1];
      if (!item) {
        console.error('❌ No item found at line', line);
        return;
      }

      const newQty = item.quantity - 1;

      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line: line,
          quantity: newQty
        })
      })
      .then(response => response.json())
      .then(updatedCart => {
        console.log('✅ Removed 1 quantity of:', item.variant_id);
        storeDeletedVariant(item.variant_id); // Store 1 instance
        refreshCart(); // Refresh cart
      });
    })
    .catch(error => console.error('❌ Error removing item:', error));
}


$.each(items, function(index, item) {
  var crossSellProduct = item.name;
  $(".also-like-product-content[data-cross-sell-product='" + crossSellProduct + "']").css("display", "none");
});

// Function to add an item back to the cart (Undo feature)
function addItemToCart(variantId, quantity) {
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: variantId, // Variant ID of the deleted item
      quantity: quantity
    })
  })
  .then(response => response.json())
  .then(cart => {
    console.log('✅ Item restored:', cart);
    refreshCart(); // Refresh only the cart
  })
  .catch(error => console.error('❌ Error restoring item:', error));
}

// Function to refresh only the cart (No full page reload)
function refreshCart() {
  $.ajax({
    url: '/?section_id=new-cart-drawer',
    type: 'GET',
  }).then((res) => {
    var new_cart_html = $(res).find('new-cart-drawer').children();
    $('new-cart-drawer').empty();
    $('new-cart-drawer').append(new_cart_html);
    showUndoMessage();
    var cart_count = $('new-cart-drawer .item_count_display_none').text();
    $('.cart-count-bubble span[aria-hidden=true]').text(cart_count);
    $('.cart-count-bubble span.visually-hidden').text(cart_count + 'item');
  });
  $.ajax({
    url: '/?section_id=cart-icon-bubble',
    type: 'GET',
  }).then((res) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(res, 'text/html');
    const cart_icon_buble_shopsection = doc.querySelector('#shopify-section-cart-icon-bubble');
    const cart_icon_buble = document.querySelector('#cart-icon-bubble');
    cart_icon_buble.innerHTML = cart_icon_buble_shopsection.innerHTML;
  });
}
function showUndoMessage() {
  let deletedItems = localStorage.getItem('removedItems') || '';
  let deletedList = deletedItems.split(',').filter(Boolean);
  const deletedCount = deletedList.length;
  console.log(deletedCount, "=====================");

  if (deletedCount === 0) return;

  // Select the target div
  const messageContainer = document.getElementById('undo-message-text');

  if (!messageContainer) {
      console.error('❌ Error: Undo message container not found.');
      return;
  }

  // Append the message instead of replacing innerHTML
  messageContainer.innerHTML = ''; // Clear previous messages
  const undoMessage = document.createElement('div');
  undoMessage.className = 'undo-message-content';
  undoMessage.innerHTML = `
  <p>
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 13 14" fill="none">
  <path d="M4.5 1H8.5M0.5 3H12.5M11.1667 3L10.6991 10.0129C10.629 11.065 10.5939 11.5911 10.3667 11.99C10.1666 12.3412 9.8648 12.6235 9.50113 12.7998C9.088 13 8.56073 13 7.5062 13H5.4938C4.43927 13 3.91202 13 3.49889 12.7998C3.13517 12.6235 2.83339 12.3412 2.63332 11.99C2.40607 11.5911 2.371 11.065 2.30086 10.0129L1.83333 3M5.16667 6V9.33333M7.83333 6V9.33333" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
    ${deletedCount} item${deletedCount > 1 ? 's' : ''} removed from bag
    </p>
    <a href="#" class="undo-link">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
    <path d="M5.34729 14.2324H11.3473C13.4173 14.2324 15.0973 12.5524 15.0973 10.4824C15.0973 8.41242 13.4173 6.73242 11.3473 6.73242H3.09729" stroke="#1A1A1A" stroke-width="1.2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.82271 8.60758L2.90271 6.68758L4.82271 4.76758" stroke="#1A1A1A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Undo
    </a>
  `;

  messageContainer.appendChild(undoMessage);

  // Attach event listener for undo action
  undoMessage.querySelector('.undo-link').addEventListener('click', (event) => {
      event.preventDefault();
      undoDelete(); // Call undo function
      // messageContainer.innerHTML = ''; // Clear the message after undo
  });
}



   // Store deleted variant IDs in localStorage only single id
  //  function storeDeletedVariant(variantId) {
  //   let deletedItems = localStorage.getItem('removedItems');
  //   deletedItems = deletedItems ? deletedItems.split(',') : [];
    
  //   if (!deletedItems.includes(variantId)) {
  //     deletedItems.push(variantId);
  //     localStorage.setItem('removedItems', deletedItems.join(','));
  //   }
  // }


  // allow duplicate id to add in local storage
  function storeDeletedVariant(variantId) {
    let deletedItems = localStorage.getItem('removedItems');
    deletedItems = deletedItems ? deletedItems.split(',') : [];
  
    deletedItems.push(variantId); // Store multiple entries of same ID
    localStorage.setItem('removedItems', deletedItems.join(','));
  }
  

  // Store deleted variant IDs and quantities in localStorage
  // function storeDeletedVariant(variantId, quantity) {
  //   let deletedItems = JSON.parse(localStorage.getItem('removedItems')) || [];

  //   // Store variant ID with quantity
  //   // deletedItems.push({ variantId, quantity });
  //   deletedItems.push(`${variantId}|${quantity}`);
  //   localStorage.setItem('removedItems', JSON.stringify(deletedItems));
  // }

  
  // Undo last deleted item
  // function undoDelete() {
  //   let deletedItems = localStorage.getItem('removedItems') || '';
  //   let deletedList = deletedItems.split(',').filter(Boolean);

  //   if (deletedList.length === 0) return;

  //   const lastDeletedVariant = deletedList.pop();
  //   addItemToCart(lastDeletedVariant);
  //   localStorage.setItem('removedItems', deletedList.join(','));
  // }


  // undo deleted product qunaty
  function undoDelete() {
    let deletedItems = localStorage.getItem('removedItems') || '';
    let deletedList = deletedItems.split(',').filter(Boolean);
  
    if (deletedList.length === 0) return;
  
    const lastDeletedVariant = deletedList.pop();
  
    addItemToCart(lastDeletedVariant, 1); // Restore one quantity
    localStorage.setItem('removedItems', deletedList.join(','));
  }
  



  // Undo last deleted item
//   function undoDelete() {
//     let deletedItems = JSON.parse(localStorage.getItem('removedItems')) || [];
    
//     if (deletedItems.length === 0) {
//         localStorage.removeItem('removedItems');
//         return;
//     }

//     // Retrieve and split the last deleted item
//     let lastDeleted = deletedItems.pop();
//     let [variantId, quantity] = lastDeleted.split('|');

//     // Restore variant with original quantity
//     addItemToCart(parseInt(variantId, 10), parseInt(quantity, 10));

//     // Update localStorage
//     if (deletedItems.length > 0) {
//         localStorage.setItem('removedItems', JSON.stringify(deletedItems));
//     } else {
//         localStorage.removeItem('removedItems');
//     }
// }

// Function to reattach event listeners after cart refresh
function attachRemoveEventListeners() {
  document.querySelectorAll('.cart-remove-button').forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const lineIndex = button.dataset.index;
      if (!lineIndex) {
        console.error("❌ Missing line index.");
        return;
      }
      removeItemFromCart(lineIndex);
    });
  });
}

document.addEventListener("DOMContentLoaded", attachRemoveEventListeners);




// AJAX SIZE CHANGE
document.addEventListener('click', function(e){

  const btn = e.target.closest('.change-variant');
  if (!btn) return;

  e.preventDefault();

  const line = btn.dataset.line;
  const newVariantId = btn.dataset.variantId;

  if (!line || !newVariantId) return;

  fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line: line,
      id: newVariantId,
      quantity: 1
    })
  })
  .then(res => res.json())
  .then(() => {
    refreshCart(); // your existing function
  })
  .catch(err => console.error('Variant change error:', err));

});




// ==============================OLD CODE==============================


// class CartRemoveButton extends HTMLElement {
//   constructor() {
//     super();

//     this.addEventListener('click', (event) => {
//       event.preventDefault();
//       const cartItems = this.closest('cart-items') || this.closest('new-cart-drawer-items');
//       cartItems.updateQuantity(this.dataset.index, 0);
//     });
//   }
// }

// customElements.define('cart-remove-button', CartRemoveButton);

// class CartItems extends HTMLElement {
//   constructor() {
//     super();
//     this.lineItemStatusElement =
//       document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

//     const debouncedOnChange = debounce((event) => {
//       this.onChange(event);
//     }, ON_CHANGE_DEBOUNCE_TIMER);

//     this.addEventListener('change', debouncedOnChange.bind(this));
//   }

//   cartUpdateUnsubscriber = undefined;

//   connectedCallback() {
//     this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
//       if (event.source === 'cart-items') {
//         return;
//       }
//       this.onCartUpdate();
//     });
//   }

//   disconnectedCallback() {
//     if (this.cartUpdateUnsubscriber) {
//       this.cartUpdateUnsubscriber();
//     }
//   }

//   resetQuantityInput(id) {
//     const input = this.querySelector(`#Quantity-${id}`);
//     input.value = input.getAttribute('value');
//     this.isEnterPressed = false;
//   }

//   setValidity(event, index, message) {
//     event.target.setCustomValidity(message);
//     event.target.reportValidity();
//     this.resetQuantityInput(index);
//     event.target.select();
//   }

//   validateQuantity(event) {
//     const inputValue = parseInt(event.target.value);
//     const index = event.target.dataset.index;
//     let message = '';

//     if (inputValue < event.target.dataset.min) {
//       message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
//     } else if (inputValue > parseInt(event.target.max)) {
//       message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
//     } else if (inputValue % parseInt(event.target.step) !== 0) {
//       message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
//     }

//     if (message) {
//       this.setValidity(event, index, message);
//     } else {
//       event.target.setCustomValidity('');
//       event.target.reportValidity();
//       this.updateQuantity(
//         index,
//         inputValue,
//         document.activeElement.getAttribute('name'),
//         event.target.dataset.quantityVariantId
//       );
//     }
//   }

//   onChange(event) {
//     this.validateQuantity(event);
//   }

//   onCartUpdate() {
//     if (this.tagName === 'NEW-CART-DRAWER-ITEMS') {
//       fetch(`${routes.cart_url}?section_id=new-cart-drawer`)
//         .then((response) => response.text())
//         .then((responseText) => {
//           const html = new DOMParser().parseFromString(responseText, 'text/html');
//           const selectors = ['new-cart-drawer-items', '.cart-drawer__footer'];
//           for (const selector of selectors) {
//             const targetElement = document.querySelector(selector);
//             const sourceElement = html.querySelector(selector);
//             if (targetElement && sourceElement) {
//               targetElement.replaceWith(sourceElement);
//             }
//           }
//         })
//         .catch((e) => {
//           console.error(e);
//         });
//     } else {
//       fetch(`${routes.cart_url}?section_id=main-cart-items`)
//         .then((response) => response.text())
//         .then((responseText) => {
//           const html = new DOMParser().parseFromString(responseText, 'text/html');
//           const sourceQty = html.querySelector('cart-items');
//           this.innerHTML = sourceQty.innerHTML;
//         })
//         .catch((e) => {
//           console.error(e);
//         });
//     }
//   }

//   getSectionsToRender() {
//     return [
//       {
//         id: 'main-cart-items',
//         section: document.getElementById('main-cart-items').dataset.id,
//         selector: '.js-contents',
//       },
//       {
//         id: 'newCartDrawer',
//         section: 'new-cart-drawer',
//         selector: '.drawer__inner',
//       },
      
//       {
//         id: 'cart-icon-bubble',
//         section: 'cart-icon-bubble',
//         selector: '.shopify-section',
//       },
//       {
//         id: 'cart-live-region-text',
//         section: 'cart-live-region-text',
//         selector: '.shopify-section',
//       },
//       {
//         id: 'main-cart-footer',
//         section: document.getElementById('main-cart-footer').dataset.id,
//         selector: '.js-contents',
//       },
//     ];
//   }

//   updateQuantity(line, quantity, name, variantId) {
//     this.enableLoading(line);

//     const body = JSON.stringify({
//       line,
//       quantity,
//       sections: this.getSectionsToRender().map((section) => section.section),
//       sections_url: window.location.pathname,
//     });

//     fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
//       .then((response) => {
//         return response.text();
//       })
//       .then((state) => {
//         const parsedState = JSON.parse(state);
//         const quantityElement =
//           document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
//         const items = document.querySelectorAll('.cart-item');

//         if (parsedState.errors) {
//           quantityElement.value = quantityElement.getAttribute('value');
//           this.updateLiveRegions(line, parsedState.errors);
//           return;
//         }

//         this.classList.toggle('is-empty', parsedState.item_count === 0);
//         const cartDrawerWrapper = document.querySelector('new-cart-drawer');
//         const cartFooter = document.getElementById('main-cart-footer');

//         if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
//         if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

//         this.getSectionsToRender().forEach((section) => {
//           const elementToReplace =
//             document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
//           elementToReplace.innerHTML = this.getSectionInnerHTML(
//             parsedState.sections[section.section],
//             section.selector
//           );
//         });
//         const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
//         let message = '';
//         if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
//           if (typeof updatedValue === 'undefined') {
//             message = window.cartStrings.error;
//           } else {
//             message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
//           }
//         }
//         this.updateLiveRegions(line, message);

//         const lineItem =
//           document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
//         if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
//           cartDrawerWrapper
//             ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
//             : lineItem.querySelector(`[name="${name}"]`).focus();
//         } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
//           trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
//         } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
//           trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
//         }

//         publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
//       })
//       .catch(() => {
//         this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
//         const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
//         errors.textContent = window.cartStrings.error;
//       })
//       .finally(() => {
//         this.disableLoading(line);
//       });
//   }

//   updateLiveRegions(line, message) {
//     const lineItemError =
//       document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
//     if (lineItemError) lineItemError.querySelector('.cart-item__error-text').innerHTML = message;

//     this.lineItemStatusElement.setAttribute('aria-hidden', true);

//     const cartStatus =
//       document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
//     cartStatus.setAttribute('aria-hidden', false);

//     setTimeout(() => {
//       cartStatus.setAttribute('aria-hidden', true);
//     }, 1000);
//   }

//   getSectionInnerHTML(html, selector) {
//     return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
//   }

//   enableLoading(line) {
//     const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
//     mainCartItems.classList.add('cart__items--disabled');

//     const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
//     const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

//     [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

//     document.activeElement.blur();
//     this.lineItemStatusElement.setAttribute('aria-hidden', false);
//   }

//   disableLoading(line) {
//     const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
//     mainCartItems.classList.remove('cart__items--disabled');

//     const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
//     const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

//     cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
//     cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
//   }
// }

// customElements.define('cart-items', CartItems);

// if (!customElements.get('cart-note')) {
//   customElements.define(
//     'cart-note',
//     class CartNote extends HTMLElement {
//       constructor() {
//         super();

//         this.addEventListener(
//           'input',
//           debounce((event) => {
//             const body = JSON.stringify({ note: event.target.value });
//             fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
//           }, ON_CHANGE_DEBOUNCE_TIMER)
//         );
//       }
//     }
//   );
// }
