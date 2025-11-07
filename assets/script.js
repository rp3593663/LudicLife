$(document).ready(function () {


  var $element_feature_product = $('.custom-featured-products'); 
  var column__lg = $element_feature_product.data("column-desktop"); 
  $element_feature_product.slick({
    dots: false,
    arrows: true,
    slidesToShow: column__lg,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 3000,
    infinite: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3
        }
      },
      {
        breakpoint: 767,
        settings: "unslick" // Mobile will not have slick functionality
      }
    ]
  });

  var $element_subbanner = $('.sub_banners_block'); 
  $element_subbanner.slick({
    dots: false,
    arrows: false,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 3000,
    infinite: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4
        }
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 4
        }
      }
    ]
  });

  var currentUrl = window.location.href;
  $('.support_sidemenu .side_link').each(function() {
    if (this.href === currentUrl) {
      $(this).addClass('active');
    }
  });

});

document.addEventListener('DOMContentLoaded', () => {
  const priceFilterItems = document.querySelectorAll('.price-filter li');

  // Function to add 'selected' class based on input values
  function applySelectedClass() {
    const minInput = document.querySelector('price-range input[name="filter.v.price.gte"]');
    const maxInput = document.querySelector('price-range input[name="filter.v.price.lte"]');

    if (minInput && maxInput) {
      const minValue = normalizeNumber(minInput.value.trim());
      const maxValue = normalizeNumber(maxInput.value.trim());

      console.log('Normalized minValue====', minValue);
      console.log('Normalized maxValue====', maxValue);

      if (minValue && maxValue) {
        priceFilterItems.forEach((item) => {
          const itemMin = item.getAttribute('data-min');
          const itemMax = item.getAttribute('data-max');

          console.log('iMin====', itemMin);
          console.log('iMax====', itemMax);

          if (minValue === itemMin && maxValue === itemMax) {
            item.classList.add('selected'); // Add 'selected' class to the matching <li>
          } else {
            item.classList.remove('selected'); // Ensure other <li>s do not have the class
          }
        });
      }
    }
  }

  // Function to normalize numbers by removing commas and decimals
  function normalizeNumber(value) {
    return value.replace(/,/g, '').split('.')[0];
  }

  // Function to handle click event
  function handleClick(item) {
    // Remove 'selected' class from all siblings
    priceFilterItems.forEach((sibling) => {
      sibling.classList.remove('selected');
    });

    // Add 'selected' class to the clicked item
    item.classList.add('selected');

    // Get min and max price values
    const minPrice = item.getAttribute('data-min');
    const maxPrice = item.getAttribute('data-max');

    // Get the price range inputs
    const minInput = document.querySelector('price-range input[name="filter.v.price.gte"]');
    const maxInput = document.querySelector('price-range input[name="filter.v.price.lte"]');

    // Clear and set new values for the inputs
    clearFields([minInput, maxInput], () => {
      minInput.value = formatNumber(minPrice);
      maxInput.value = formatNumber(maxPrice);
      triggerInputChange(minInput);
      triggerInputChange(maxInput);
    });
  }

  // On click, update selected class and input values
  priceFilterItems.forEach((item) => {
    item.addEventListener('click', () => handleClick(item));
  });

  // Apply 'selected' class on page load
  applySelectedClass();

  function formatNumber(value) {
    return value.replace(/,/g, '').trim();
  }

  function triggerInputChange(input) {
    const inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);

    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);
  }

  function clearFields(inputs, callback) {
    let clearedCount = 0;

    inputs.forEach((input) => {
      input.value = '';
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);

      const changeEvent = new Event('change', { bubbles: true });
      input.dispatchEvent(changeEvent);

      clearedCount++;
      if (clearedCount === inputs.length && callback) {
        callback();
      }
    });
  }
});


