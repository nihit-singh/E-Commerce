let cart = []; 
let featuredBooks = []; 
let currentCategory = 'all'; // State variable for current category

// --- 1. Data Fetching and Rendering ---

async function fetchBooksAndInitialize() {
    try {
        const response = await fetch('books.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        featuredBooks = await response.json();
        
        // Initial render and setup
        filterAndRenderBooks(); 
        setupEventListeners();

    } catch (error) {
        console.error('Could not fetch book data:', error);
        document.getElementById('book-list-container').innerHTML = 
            '<p style="text-align: center; grid-column: 1 / -1; color: red; margin-top: 50px;">Error loading books. Please check the books.json file path.</p>';
    }
}

// Renders the book cards based on current filters
function renderBookCards(books) {
    const container = document.getElementById('book-list-container');
    container.innerHTML = '';

    if (books.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #7f8c8d; margin-top: 50px;">No books found matching your criteria.</p>';
        return;
    }

    books.forEach(book => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        
        card.innerHTML = `
            <img src="${book.image}" alt="${book.title} book cover">
            <h3>${book.title}</h3>
            <p>${book.description}</p>
            <div class="rating">${book.rating} (${book.reviews.toLocaleString()})</div>
            <div class="price" data-price="${book.price.toFixed(2)}">$${book.price.toFixed(2)}</div>
            <button class="add-cart" data-book-id="${book.id}">+ Add to Cart</button>
        `;
        container.appendChild(card);
    });

    bindAddToCartListeners();
}

/**
 * Filters the featuredBooks array based on the current category 
 * state and the search input value, then calls renderBookCards.
 */
function filterAndRenderBooks() {
    const searchTerm = document.getElementById('search').value.toLowerCase().trim();
    
    let filteredBooks = featuredBooks.filter(book => {
        // 1. Category Filter: Checks if the book's category matches the active category ('all' bypasses this)
        const categoryMatch = currentCategory === 'all' || 
                              book.category.toLowerCase() === currentCategory;

        // 2. Search Term Filter: Checks if the search term is found in the title, description, or category
        const searchMatch = book.title.toLowerCase().includes(searchTerm) ||
                            book.description.toLowerCase().includes(searchTerm) ||
                            book.category.toLowerCase().includes(searchTerm);
        
        return categoryMatch && searchMatch;
    });

    renderBookCards(filteredBooks);
}

// --- 2. Cart Management Functions (Unchanged) ---

function renderCart() {
  const cartList = document.getElementById('cart-items-list');
  const subtotalElement = document.getElementById('cart-subtotal');
  const cartCountBadge = document.getElementById('cart-count-badge');
  let subtotal = 0;

  cartList.innerHTML = ''; 

  if (cart.length === 0) {
    cartList.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
  } else {
    cart.forEach(item => {
      const itemPrice = item.price * item.quantity;
      subtotal += itemPrice;

      const itemDiv = document.createElement('div');
      itemDiv.classList.add('cart-item');
      itemDiv.innerHTML = `
        <span class="cart-item-title">${item.title}</span>
        <span class="cart-item-quantity">Qty: ${item.quantity}</span>
        <span class="cart-item-price">$${itemPrice.toFixed(2)}</span>
        <button class="cart-item-remove" data-item-id="${item.id}">&times;</button>
      `;
      cartList.appendChild(itemDiv);
    });
  }

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  cartCountBadge.textContent = cart.length;

  document.querySelectorAll('.cart-item-remove').forEach(removeBtn => {
    removeBtn.addEventListener('click', (event) => {
      removeItemFromCart(parseInt(event.currentTarget.getAttribute('data-item-id')));
    });
  });
}

function addItemToCart(bookId) {
  const book = featuredBooks.find(b => b.id === bookId);
  if (!book) return; 

  const existingItem = cart.find(item => item.id === bookId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: book.id,
      title: book.title,
      price: book.price,
      quantity: 1
    });
  }

  renderCart(); 
  showNotification(`✅ "${book.title}" added to cart!`);
}

function removeItemFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    renderCart();
    showNotification(`🗑️ Item removed from cart.`);
}

// --- 3. Sidebar Toggle & Notification Functions (Unchanged) ---

function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  sidebar.classList.toggle('cart-open');
  overlay.classList.toggle('cart-open');

  if (sidebar.classList.contains('cart-open')) {
    renderCart(); 
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.id = 'page-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0'; 
    setTimeout(() => {
      notification.remove();
    }, 500); 
  }, 3000); 
}

// --- 4. Event Listener Setup ---

function bindAddToCartListeners() {
    document.querySelectorAll('.add-cart').forEach(btn => {
        if (btn.hasAttribute('data-listener-bound')) return;
        btn.setAttribute('data-listener-bound', 'true');

        btn.addEventListener('click', (event) => {
            const bookId = parseInt(event.currentTarget.getAttribute('data-book-id'));

            if (btn.disabled) return;
            btn.disabled = true;
            
            const originalText = btn.textContent;
            btn.textContent = '...Adding';

            // Simulate an AJAX request delay
            setTimeout(() => {
                addItemToCart(bookId);

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 1500);

            }, 800); 
        });
    });
}

// Sets up the live search listener
function setupSearchListener() {
    const searchInput = document.getElementById('search');
    // Using 'keyup' for live searching
    searchInput.addEventListener('keyup', filterAndRenderBooks);
}

// Sets up listeners for the category links
function setupCategoryListeners() {
    const categoryLinks = document.querySelectorAll('.category-link');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. Update active state in UI
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // 2. Update state variable and re-render
            currentCategory = link.getAttribute('data-category');
            filterAndRenderBooks();
        });
    });
}


function setupEventListeners() {
    // Cart/Sidebar Listeners
    document.getElementById('toggle-cart-btn').addEventListener('click', toggleCart);
    document.getElementById('close-cart-btn').addEventListener('click', toggleCart);
    document.getElementById('cart-overlay').addEventListener('click', toggleCart);

    // Filter/Search Listeners
    setupSearchListener();
    setupCategoryListeners();
}


// --- 5. Initialization ---
document.addEventListener('DOMContentLoaded', fetchBooksAndInitialize);