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

    const MINS = {
      vinilo: {
        "Mini (3×3 cm)":      20,
        "Chico (5×5 cm)":    20,
        "Mediano (10×10 cm)": 10,
        "Grande (15×15 cm)":  10,
      },
      dtf: {
        "Mini (3×3 cm)":      150,
        "Chico (5×5 cm)":     50,
        "Mediano (10×10 cm)": 10,
      }
    };

    function checkMins() {
      const errors = [];
      ['vinilo', 'dtf'].forEach(mat => {
        const minsForMat = MINS[mat];
        const totals = {};
        cart.filter(i => (i.material || 'vinilo') === mat).forEach(item => {
          if (minsForMat[item.size] !== undefined)
            totals[item.size] = (totals[item.size] || 0) + item.qty;
        });
        Object.entries(minsForMat).forEach(([size, min]) => {
          if (totals[size] && totals[size] < min)
            errors.push({ size, mat, current: totals[size], min, falta: min - totals[size] });
        });
      });
      return errors;
    }

    // Tabla de precios por tamaño y cantidad (precio real + precio de lista sin descuento).
    // MISMAS tablas que AmandaGestion (ST_PRICE_TABLE y ST_DTF_PRICE_TABLE) e index.html, con las
    // escalas mayoristas: no se muestran (desde MAYORISTA_DESDE dice "a consultar"), pero hacen que
    // los precios por debajo den igual que en Gestión. Si se cambia un precio, cambiarlo en todos lados.
    const PRICE_TABLE = {
      "Mini (3×3 cm)": [
        { qty: 10,  price: 1260,   list: 1520 },
        { qty: 20,  price: 2260,   list: 3040 },
        { qty: 50,  price: 5640,   list: 7590 },
        { qty: 100, price: 10370,  list: 15180 },
        { qty: 200, price: 20210,  list: 30320 },
        { qty: 500, price: 45550,  list: 75820 },
      ],
      "Chico (5×5 cm)": [
        { qty: 10,  price: 3040,   list: 3670 },
        { qty: 20,  price: 5460,   list: 7350 },
        { qty: 50,  price: 13640,  list: 18370 },
        { qty: 100, price: 25090,  list: 36740 },
        { qty: 200, price: 48910,  list: 73370 },
        { qty: 500, price: 110210, list: 183470 },
      ],
      "Mediano (10×10 cm)": [
        { qty: 10,  price: 9870,   list: 14480 },
        { qty: 20,  price: 18470,  list: 29070 },
        { qty: 50,  price: 45970,  list: 72630 },
        { qty: 100, price: 87330,  list: 145370 },
        { qty: 200, price: 164470, list: 290740 },
        { qty: 500, price: 370080, list: 726840 },
      ],
      "Grande (15×15 cm)": [
        { qty: 10,  price: 21730,  list: 32330 },
        { qty: 20,  price: 41140,  list: 64550 },
        { qty: 50,  price: 89210,  list: 161530 },
        { qty: 100, price: 168880, list: 322960 },
        { qty: 200, price: 316140, list: 646020 },
        { qty: 500, price: 711300, list: 1615100 },
      ],
    };

    // Paquete por ítem (bolsita + tarjeta, vinilo y DTF), igual que en Gestión: va incluida en el precio que se muestra
    const BOLSA = { "Mini (3×3 cm)": 263, "Chico (5×5 cm)": 263, "Mediano (10×10 cm)": 448, "Grande (15×15 cm)": 448 };

    const DTF_PRICE_TABLE = {
      "Mini (3×3 cm)": [
        { qty: 35,   price: 4800,   list: 6000 },
        { qty: 50,   price: 6900,   list: 9000 },
        { qty: 100,  price: 12700,  list: 16900 },
        { qty: 150,  price: 18800,  list: 26100 },
        { qty: 200,  price: 24700,  list: 24700 },
        { qty: 250,  price: 30400,  list: 30400 },
        { qty: 500,  price: 59500,  list: 59500 },
        { qty: 1000, price: 115000, list: 115000 },
      ],
      "Chico (5×5 cm)": [
        { qty: 14,  price: 5600,   list: 7000 },
        { qty: 20,  price: 7700,   list: 10000 },
        { qty: 50,  price: 19200,  list: 25600 },
        { qty: 100, price: 35300,  list: 49000 },
        { qty: 200, price: 68700,  list: 68700 },
        { qty: 500, price: 165000, list: 165000 },
      ],
      "Mediano (10×10 cm)": [
        { qty: 3,   price: 5600,   list: 7000 },
        { qty: 8,   price: 14900,  list: 19400 },
        { qty: 20,  price: 34900,  list: 46500 },
        { qty: 50,  price: 84400,  list: 117200 },
        { qty: 100, price: 163100, list: 234400 },
        { qty: 250, price: 379700, list: 379700 },
      ],
    };

    // Desde esta cantidad el precio es mayorista y se pasa por WhatsApp (sale de Gestión)
    const MAYORISTA_DESDE = 200;

    let currentMaterial = 'vinilo';

    const VINILO_SIZES = ["Mini (3×3 cm)", "Chico (5×5 cm)", "Mediano (10×10 cm)", "Grande (15×15 cm)", "A consultar"];
    const DTF_SIZES    = ["Mini (3×3 cm)", "Chico (5×5 cm)", "Mediano (10×10 cm)", "A consultar"];

    function setMaterial(mat) {
      currentMaterial = mat;
      document.querySelectorAll('.modal-mat-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.mat === mat)
      );
      const sizes       = mat === 'dtf' ? DTF_SIZES : VINILO_SIZES;
      const defaultSize = mat === 'dtf' ? "Chico (5×5 cm)" : "Mediano (10×10 cm)";
      const defaultQty  = mat === 'dtf' ? 50 : 10;
      modalSize.innerHTML = sizes.map(s =>
        `<option${s === defaultSize ? ' selected' : ''}>${s}</option>`
      ).join('');
      modalQty.value = defaultQty;
      updateModalPrice();
    }

    function formatPrice(n) {
      return "$" + n.toLocaleString("es-AR");
    }

    function getTieredPrice(size, qty, priceTable) {
      const pt    = priceTable || PRICE_TABLE;
      const table = pt[size];
      if (!table) return null;
      if (qty >= MAYORISTA_DESDE) return null;   // precio mayorista: "A consultar"
      let tier = table[0];
      for (const t of table) { if (qty >= t.qty) tier = t; }
      // Mismo cálculo que Gestión: nunca más caro que la escala siguiente, y la bolsa incluida
      const tope      = Math.min(Infinity, ...table.filter(t => t.qty > qty).map(t => t.price));
      const neto      = Math.min(Math.round(tier.price / tier.qty * qty), tope);
      const listNeto  = Math.round(tier.list / tier.qty * qty);
      const bolsa     = BOLSA[size] || 0;   // vinilo y DTF llevan el mismo paquete
      const total     = neto + bolsa;
      const listTotal = listNeto + bolsa;
      const pct       = Math.round((1 - neto / listNeto) * 100);
      return { total, listTotal, unitPrice: Math.round(total / qty), pct };
    }

    function updateModalPrice() {
      const size        = modalSize.value;
      const qty         = Math.max(1, +modalQty.value || 1);
      const priceListEl = document.getElementById("modalPriceList");
      const priceOffEl  = document.getElementById("modalPriceOff");

      if (size === "A consultar") {
        modalPrice.textContent      = "A consultar";
        modalPriceUnit.textContent  = "";
        priceListEl.style.display   = "none";
        priceOffEl.style.display    = "none";
        return;
      }

      const table = currentMaterial === 'dtf' ? DTF_PRICE_TABLE : PRICE_TABLE;
      const r = getTieredPrice(size, qty, table);
      if (!r) {
        modalPrice.textContent     = qty >= MAYORISTA_DESDE ? "Precio mayorista" : "A consultar";
        modalPriceUnit.textContent = qty >= MAYORISTA_DESDE ? "(consultanos por WhatsApp)" : "";
        priceListEl.style.display  = "none";
        priceOffEl.style.display   = "none";
        return;
      }
      modalPrice.textContent     = formatPrice(r.total);
      modalPriceUnit.textContent = `(${qty} × ${formatPrice(r.unitPrice)})`;

      if (r.pct > 0) {
        priceListEl.textContent   = formatPrice(r.listTotal);
        priceOffEl.textContent    = `${r.pct}% off`;
        priceListEl.style.display = "";
        priceOffEl.style.display  = "";
      } else {
        priceListEl.style.display = "none";
        priceOffEl.style.display  = "none";
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
      setMaterial('vinilo');
      modalConfirm.innerHTML = '<span>🛒</span> Agregar al pedido';
      modalConfirm.classList.remove("added");
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }

    document.querySelectorAll('.modal-mat-btn').forEach(btn => {
      btn.addEventListener('click', () => setMaterial(btn.dataset.mat));
    });

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
            <div class="cart-item-detail">${item.size}${item.material === 'dtf' ? ' · DTF' : ''} · ${item.qty} unidades</div>
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
      const existing = cart.find(i => i.file === currentItem.file && i.size === size && i.material === currentMaterial);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ ...currentItem, qty, size, material: currentMaterial });
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

    // Cerrar panel carrito
    document.getElementById("cartClose").addEventListener("click", () => {
      document.getElementById("cartPanel").classList.remove("open");
    });

    // Vaciar carrito
    document.getElementById("cartClear").addEventListener("click", () => {
      cart = [];
      updateCartUI();
    });

    // Enviar por WhatsApp
    document.getElementById("cartWA").addEventListener("click", () => {
      if (cart.length === 0) return;

      const errors = checkMins();
      const warning = document.getElementById("cartMinWarning");
      if (errors.length > 0) {
        warning.innerHTML = errors.map(e =>
          `Necesitás ${e.falta} ${e.size.split(" ")[0].toLowerCase()}${e.falta > 1 ? "s" : ""} más en ${e.mat === 'dtf' ? 'DTF' : 'vinilo'} (mín. ${e.min})`
        ).join("<br>");
        return;
      }
      warning.innerHTML = "";

      let msg = "¡Hola Amanda Gráficos! Quiero hacer un pedido 🎨%0A%0A";
      cart.forEach(item => {
        msg += `▸ ${item.title} — ${item.size}${item.material === 'dtf' ? ' (DTF)' : ''} — ${item.qty} unidades%0A`;
      });
      const total = cart.reduce((s, i) => s + i.qty, 0);
      msg += `%0ATotal: ${total} unidades en ${cart.length} diseño${cart.length > 1 ? "s" : ""}.%0A%0AQuedo a la espera. ¡Gracias!`;
      window.open("https://wa.me/5493417481079?text=" + msg, "_blank");
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
      window.open("https://wa.me/5493417481079?text=" + message, "_blank");
    }