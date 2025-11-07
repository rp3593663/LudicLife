const productInfoWrapper = document.querySelector('.product__info-wrapper');
let startY = 0;
let swipeThreshold = 421; 

function isMobileView() {
  return window.innerWidth <= 768; 
}

// Detect touch start
productInfoWrapper.addEventListener('touchstart', (e) => {
  if (!isMobileView()) return; 

  startY = e.touches[0].clientY;
  productInfoWrapper.classList.add('swipe-active');
  
});

// Detect touch move
productInfoWrapper.addEventListener('touchmove', (e) => {
  if (!isMobileView()) return; 

  let currentY = e.touches[0].clientY;
  let diffY = currentY - startY;

  if (diffY > swipeThreshold) {
    productInfoWrapper.classList.add('swipe-active');
  }
});

// Remove the swipe-active class on swipe down
productInfoWrapper.addEventListener('touchmove', (e) => {
  if (!isMobileView()) return; 

  let currentY = e.touches[0].clientY;
  let diffY = currentY - startY;

    if (startY < swipeThreshold) {
    productInfoWrapper.classList.remove('swipe-active');
  }
});
