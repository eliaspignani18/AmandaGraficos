// ═══════════════════════════════════════════
    //  DATOS DEL CATÁLOGO
    // ═══════════════════════════════════════════
    let catalogItems = [];  // se carga desde productos.json

    // ═══════════════════════════════════════════
    //  RENDERIZADO DEL CATÁLOGO
    // ═══════════════════════════════════════════
    const shopGrid = document.getElementById("shop-grid");

    function catBg(cat) {
      const map = { futbol:"linear-gradient(145deg,#d8ecff,#f2f8ff)", simpsons:"linear-gradient(145deg,#fff0b6,#fff8de)", "cine-series":"linear-gradient(145deg,#e7dcff,#f6f1ff)", autos:"linear-gradient(145deg,#ffdbe5,#fff0f5)", argentina:"linear-gradient(145deg,#dcead8,#f4fbf2)" };
      return map[cat] || "#f5f5f5";
    }

    let currentFilter = "all";
    let currentSearch = "";

    function renderCatalog() {
      let items = currentFilter === "all"
        ? catalogItems
        : catalogItems.filter(i => i.category === currentFilter);

      if (currentSearch) {
        const q = currentSearch.toLowerCase();
        items = items.filter(i =>
          i.title.toLowerCase().includes(q) ||
          i.desc.toLowerCase().includes(q) ||
          i.meta.toLowerCase().includes(q) ||
          i.badge.toLowerCase().includes(q) ||
          i.tags.some(t => t.toLowerCase().includes(q))
        );
      }

      if (items.length === 0) {
        shopGrid.innerHTML = '<div class="shop-empty">No encontramos stickers que coincidan.<br>Probá con otra categoría o palabra.</div>';
        return;
      }

      shopGrid.innerHTML = items.map((item) => `
        <article class="shop-card" data-cat="${item.category}" data-idx="${catalogItems.indexOf(item)}" tabindex="0" role="button" aria-label="Ver ${item.title}">
          <div class="shop-visual" style="background:${catBg(item.category)}">
            <span class="shop-badge">${item.badge}</span>
            <img class="shop-photo" src="${encodeURI('images/' + item.file)}" alt="${item.title}" loading="lazy">
          </div>
          <div class="shop-body">
            <div class="shop-meta">
              <strong>${item.title}</strong>
              <span>${item.meta}</span>
            </div>
            <p>${item.desc}</p>
            <div class="shop-tags">${item.tags.map(t => `<span>${t}</span>`).join("")}</div>
          </div>
          <button class="shop-add-btn" data-idx="${catalogItems.indexOf(item)}" type="button">+ Agregar al pedido</button>
        </article>
      `).join("");

      // Click en botón o card → abrir modal
      shopGrid.querySelectorAll(".shop-add-btn").forEach(btn => {
        btn.addEventListener("click", e => { e.stopPropagation(); openModal(+btn.dataset.idx); });
      });
      shopGrid.querySelectorAll(".shop-card").forEach(card => {
        card.addEventListener("click", () => openModal(+card.dataset.idx));
        card.addEventListener("keydown", e => { if (e.key === "Enter") openModal(+card.dataset.idx); });

        // Spotlight glow
        card.addEventListener("mousemove", function(e) {
          var rect = card.getBoundingClientRect();
          card.style.setProperty("--glow-x", (e.clientX - rect.left) + "px");
          card.style.setProperty("--glow-y", (e.clientY - rect.top) + "px");
        });
        card.addEventListener("mouseleave", function() {
          card.style.removeProperty("--glow-x");
          card.style.removeProperty("--glow-y");
        });
      });
    }

    // Cargar productos desde JSON y luego renderizar
    fetch('productos.json')
      .then(r => r.json())
      .then(data => {
        catalogItems = data;
        renderCatalog();
      })
      .catch(err => {
        console.error('Error cargando productos:', err);
        document.getElementById('shop-grid').innerHTML =
          '<div class="shop-empty">No pudimos cargar el catálogo. Recargá la página o probá más tarde.</div>';
      });

    document.querySelectorAll(".shop-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".shop-filter").forEach(b => b.classList.toggle("active", b === btn));
        currentFilter = btn.dataset.filter;
        // Cargar productos desde JSON y luego renderizar
    fetch('productos.json')
      .then(r => r.json())
      .then(data => {
        catalogItems = data;
        renderCatalog();
      })
      .catch(err => {
        console.error('Error cargando productos:', err);
        document.getElementById('shop-grid').innerHTML =
          '<div class="shop-empty">No pudimos cargar el catálogo. Recargá la página o probá más tarde.</div>';
      });
      });
    });

    // Buscador
    document.getElementById("shopSearch").addEventListener("input", (e) => {
      currentSearch = e.target.value.trim();
      // Cargar productos desde JSON y luego renderizar
    fetch('productos.json')
      .then(r => r.json())
      .then(data => {
        catalogItems = data;
        renderCatalog();
      })
      .catch(err => {
        console.error('Error cargando productos:', err);
        document.getElementById('shop-grid').innerHTML =
          '<div class="shop-empty">No pudimos cargar el catálogo. Recargá la página o probá más tarde.</div>';
      });
    });

    // ═══════════════════════════════════════════
    //  MODAL
    // ═══════════════════════════════════════════
    const modal        = document.getElementById("stickerModal");
    const modalImg     = document.getElementById("modalImg");
    const modalVisual  = document.getElementById("modalVisual");
    const modalBadge   = document.getElementById("modalBadge");
    const modalTitle   = document.getElementById("modalTitle");
    const modalDesc    = document.getElementById("modalDesc");
    const modalSize    = document.getElementById("modalSize");
    const modalQty     = document.getElementById("modalQty");
    const modalPrice   = document.getElementById("modalPrice");
    const modalPriceUnit = document.getElementById("modalPriceUnit");
    const modalConfirm = document.getElementById("modalConfirm");
    let currentItem    = null;

    // Precio base unitario según tamaño (en pesos argentinos)
    const PRICES = {
      "Chico (5×5 cm)":     210,
      "Mediano (10×10 cm)": 670,
      "Grande (15×15 cm)":  1480,
      "A consultar":         null
    };

    function formatPrice(n) {
      return "$" + n.toLocaleString("es-AR");
    }

    function updateModalPrice() {
      const unit = PRICES[modalSize.value];
      const qty  = Math.max(1, +modalQty.value || 1);
      if (unit === null || unit === undefined) {
        modalPrice.textContent = "A consultar";
        modalPriceUnit.textContent = "";
      } else {
        modalPrice.textContent = formatPrice(unit * qty);
        modalPriceUnit.textContent = qty === 1
          ? `(${formatPrice(unit)} / unidad)`
          : `(${qty} × ${formatPrice(unit)})`;
      }
    }

    function openModal(idx) {
      currentItem = catalogItems[idx];
      modalImg.src  = encodeURI("images/" + currentItem.file);
      modalImg.alt  = currentItem.title;
      modalVisual.style.background = catBg(currentItem.category);
      modalBadge.textContent = currentItem.badge;
      modalTitle.textContent  = currentItem.title;
      modalDesc.textContent   = currentItem.desc;
      modalSize.value = "Mediano (10×10 cm)";
      modalQty.value  = "10";
      updateModalPrice();
      modalConfirm.innerHTML = '<span>🛒</span> Agregar al pedido';
      modalConfirm.classList.remove("added");
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }

    document.getElementById("modalClose").addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

    document.getElementById("qtyMinus").addEventListener("click", () => {
      modalQty.value = Math.max(1, +modalQty.value - 1);
      updateModalPrice();
    });
    document.getElementById("qtyPlus").addEventListener("click", () => {
      modalQty.value = +modalQty.value + 1;
      updateModalPrice();
    });
    modalQty.addEventListener("input", updateModalPrice);
    modalSize.addEventListener("change", updateModalPrice);

    // ═══════════════════════════════════════════
    //  CARRITO
    // ═══════════════════════════════════════════
    let cart = [];

    function updateCartUI() {
      const fab      = document.getElementById("cartFab");
      const count    = document.getElementById("cartCount");
      const items    = document.getElementById("cartItems");
      const summary  = document.getElementById("cartSummary");

      const total = cart.reduce((s, i) => s + i.qty, 0);

      if (cart.length === 0) {
        fab.classList.remove("visible");
        count.style.display = "none";
        items.innerHTML = '<div class="cart-empty">Tu pedido está vacío.<br>Agregá stickers del catálogo.</div>';
        summary.textContent = "";
        return;
      }

      fab.classList.add("visible");
      count.style.display = "grid";
      count.textContent = cart.length;

      items.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
          <img class="cart-item-img" src="${encodeURI('images/' + item.file)}" alt="${item.title}">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.title}</div>
            <div class="cart-item-detail">${item.size} · ${item.qty} unidades</div>
          </div>
          <button class="cart-item-remove" data-i="${i}" aria-label="Quitar">✕</button>
        </div>
      `).join("");

      items.querySelectorAll(".cart-item-remove").forEach(btn => {
        btn.addEventListener("click", () => {
          cart.splice(+btn.dataset.i, 1);
          updateCartUI();
        });
      });

      const types = [...new Set(cart.map(i => i.title))].length;
      summary.textContent = `${types} diseño${types > 1 ? "s" : ""} · ${total} unidades en total`;
    }

    // Toast global
    function showToast(msg, duration = 2000) {
      const toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.classList.add("show");
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toast.classList.remove("show"), duration);
    }

    // Confirmar desde modal
    modalConfirm.addEventListener("click", () => {
      if (!currentItem) return;
      const qty  = Math.max(1, parseInt(modalQty.value) || 1);
      const size = modalSize.value;
      const existing = cart.find(i => i.file === currentItem.file && i.size === size);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ ...currentItem, qty, size });
      }
      updateCartUI();
      showToast(`✓ ${currentItem.title} agregado al pedido`);

      // Feedback visual
      modalConfirm.innerHTML = "✓ ¡Agregado!";
      modalConfirm.classList.add("added");
      setTimeout(() => {
        closeModal();
      }, 700);
    });

    // Toggle panel carrito
    document.getElementById("cartToggle").addEventListener("click", () => {
      document.getElementById("cartPanel").classList.toggle("open");
    });

    // Vaciar carrito
    document.getElementById("cartClear").addEventListener("click", () => {
      cart = [];
      updateCartUI();
    });

    // Enviar por WhatsApp
    document.getElementById("cartWA").addEventListener("click", () => {
      if (cart.length === 0) return;
      let msg = "¡Hola Amanda Gráficos! Quiero hacer un pedido 🎨%0A%0A";
      cart.forEach(item => {
        msg += `▸ ${item.title} — ${item.size} — ${item.qty} unidades%0A`;
      });
      const total = cart.reduce((s, i) => s + i.qty, 0);
      msg += `%0ATotal: ${total} unidades en ${cart.length} diseño${cart.length > 1 ? "s" : ""}.%0A%0AQuedo a la espera. ¡Gracias!`;
      window.open("https://wa.me/5493416117794?text=" + msg, "_blank");
    });

    // ═══════════════════════════════════════════
    //  FORMULARIO DE PEDIDO (existente)
    // ═══════════════════════════════════════════
    function sendToWhatsApp(event) {
      event.preventDefault();
      const name     = document.getElementById("name").value.trim();
      const product  = document.getElementById("product").value;
      const quantity = document.getElementById("quantity").value;
      const date     = document.getElementById("date").value.trim();
      const details  = document.getElementById("details").value.trim();

      // Validación: nombre, producto y cantidad son obligatorios
      const errors = [];
      if (!name)     errors.push({id: "name",     msg: "Por favor ingresá tu nombre"});
      if (!product)  errors.push({id: "product",  msg: "Elegí un producto"});
      if (!quantity) errors.push({id: "quantity", msg: "Elegí una cantidad"});

      // Limpiar errores previos
      document.querySelectorAll(".form-error").forEach(el => el.remove());
      document.querySelectorAll(".field-error").forEach(el => el.classList.remove("field-error"));

      if (errors.length > 0) {
        errors.forEach(err => {
          const field = document.getElementById(err.id);
          field.classList.add("field-error");
          const msgEl = document.createElement("small");
          msgEl.className = "form-error";
          msgEl.textContent = err.msg;
          field.parentNode.appendChild(msgEl);
        });
        // Foco en el primer campo con error
        document.getElementById(errors[0].id).focus();
        return;
      }

      let message = "Hola Amanda Gráficos, quiero pedir un presupuesto.%0A%0A";
      message += "Nombre: " + encodeURIComponent(name) + "%0A";
      message += "Producto: " + encodeURIComponent(product) + "%0A";
      message += "Cantidad: " + encodeURIComponent(quantity) + "%0A";
      if (date)    message += "Fecha estimada: " + encodeURIComponent(date) + "%0A";
      if (details) message += "Detalle: " + encodeURIComponent(details) + "%0A";
      message += "%0AQuedo a la espera. ¡Gracias!";
      window.open("https://wa.me/5493416117794?text=" + message, "_blank");
    }