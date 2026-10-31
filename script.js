
/* =========================================
   LIORIELLE FLORAL ATELIER
   MERGED SCRIPT — SHOP, BOUQUET CREATOR,
   DOODLE GIFT, DIGITAL GIFTS & KEEPSAKES
========================================= */

(() => {
    "use strict";

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const money = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    });

    function readStorage(key, fallback = []) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "null");
            return Array.isArray(value) ? value : fallback;
        } catch (error) {
            console.warn(`Could not read ${key}.`, error);
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Could not save ${key}.`, error);
            return false;
        }
    }

    function announce(message, id = "liorielle-live-status") {
        let status = document.getElementById(id);

        if (!status) {
            status = document.createElement("p");
            status.id = id;
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");
            status.className = "visually-hidden";
            document.body.appendChild(status);
        }

        status.textContent = message;
    }

    /* =========================================
       HOMEPAGE & MOBILE NAVIGATION
    ========================================= */

    function initHomepage() {
        const menuToggle = $("#menuToggle");
        const mainNav = $("#mainNav");
        const backToTop = $("#backToTop");
        const currentYear = $("#currentYear");

        if (currentYear) {
            currentYear.textContent = new Date().getFullYear();
        }

        if (menuToggle && mainNav) {
            menuToggle.addEventListener("click", () => {
                const expanded =
                    menuToggle.getAttribute("aria-expanded") === "true";

                menuToggle.setAttribute("aria-expanded", String(!expanded));
                menuToggle.setAttribute(
                    "aria-label",
                    expanded ? "Open navigation" : "Close navigation"
                );

                mainNav.classList.toggle("open", !expanded);
            });

            $$("a", mainNav).forEach(link => {
                link.addEventListener("click", () => {
                    menuToggle.setAttribute("aria-expanded", "false");
                    menuToggle.setAttribute("aria-label", "Open navigation");
                    mainNav.classList.remove("open");
                });
            });
        }

        if (backToTop) {
            const update = () => {
                backToTop.classList.toggle("visible", window.scrollY > 450);
            };

            window.addEventListener("scroll", update, { passive: true });
            update();

            backToTop.addEventListener("click", () => {
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        }

        // Shared mobile navigation for pages with a header/nav.
        $$("header").forEach((header, index) => {
            const nav = $("nav", header);
            if (!nav || $(".liorielle-menu-toggle", header)) return;

            nav.classList.add("liorielle-mobile-nav");
            if (!nav.id) nav.id = `liorielle-mobile-nav-${index + 1}`;

            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "liorielle-menu-toggle";
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-controls", nav.id);
            toggle.setAttribute("aria-label", "Open navigation menu");
            toggle.innerHTML = '<span class="liorielle-menu-icon" aria-hidden="true"><span></span><span></span></span><span class="liorielle-menu-label">Menu</span>';

            header.insertBefore(toggle, nav);

            const label = $(".liorielle-menu-label", toggle);

            function closeMenu() {
                nav.classList.remove("liorielle-nav-visible");
                toggle.setAttribute("aria-expanded", "false");
                toggle.setAttribute("aria-label", "Open navigation menu");
                label.textContent = "Menu";
            }

            toggle.addEventListener("click", () => {
                const open = toggle.getAttribute("aria-expanded") === "true";

                nav.classList.toggle("liorielle-nav-visible", !open);
                toggle.setAttribute("aria-expanded", String(!open));
                toggle.setAttribute(
                    "aria-label",
                    open ? "Open navigation menu" : "Close navigation menu"
                );
                label.textContent = open ? "Menu" : "Close";
            });

            $$("a", nav).forEach(link =>
                link.addEventListener("click", closeMenu)
            );

            document.addEventListener("keydown", event => {
                if (event.key === "Escape") closeMenu();
            });

            window.addEventListener("resize", () => {
                if (window.innerWidth > 760) closeMenu();
            });
        });

        console.log("Liorielle Floral Atelier is ready. 🌷");
    }

    /* =========================================
       FLOWER SHOP — FILTERS, FAVORITES, DETAILS
       + PERSISTENT MINI-CART
    ========================================= */

    function initFlowerShop() {
        const grid = $("#flower-grid");
        if (!grid) return;

        const cards = $$(".flower-card", grid);
        const search = $("#flower-search");
        const sort = $("#flower-sort");
        const filterButtons = $$(".flower-filter");
        const favoritesOnly =
    $("#favorites-only-filter") || $("#favorites-only");
        const countLabel = $("#flower-count");
        const emptyState = $("#flower-empty");
        const reset = $("#reset-flower-filters");

        const dialog = $("#flower-dialog");
        const dialogImage = $("#dialog-flower-image");
        const dialogName = $("#dialog-flower-name");
        const dialogDescription = $("#dialog-flower-description");
        const dialogPrice = $("#dialog-flower-price");
        const dialogFavorite = $("#dialog-favorite-button");
        const dialogClose = $(".flower-dialog-close");

        const FAVORITES_KEY = "liorielle-favorites";
        const CART_KEY = "liorielle-cart";

        let category = "all";
        let currentDialogId = null;
        let favoritesMode = false;

        function cardId(card) {
            return $("[data-favorite]", card)?.dataset.favorite
                || card.dataset.id
                || card.dataset.name;
        }

        function getCard(id) {
            return cards.find(card => cardId(card) === id);
        }

        function updateFavoriteButtons() {
            const favorites = readStorage(FAVORITES_KEY);

            $$("[data-favorite]").forEach(button => {
                const saved = favorites.includes(button.dataset.favorite);
                button.classList.toggle("is-favorite", saved);
                button.setAttribute("aria-pressed", String(saved));
                button.textContent = saved ? "♥" : "♡";
            });

            if (dialogFavorite && currentDialogId) {
                const saved = favorites.includes(currentDialogId);
                dialogFavorite.textContent = saved
                    ? "♥ Saved to favorites"
                    : "♡ Save to favorites";
                dialogFavorite.setAttribute("aria-pressed", String(saved));
            }
        }

        function toggleFavorite(id) {
            const favorites = readStorage(FAVORITES_KEY);
            const alreadySaved = favorites.includes(id);

            const updated = alreadySaved
                ? favorites.filter(item => item !== id)
                : [...favorites, id];

            if (!writeStorage(FAVORITES_KEY, updated)) {
                alert("Your browser couldn't save this favorite.");
                return;
            }

            updateFavoriteButtons();

            const card = getCard(id);
            announce(
                `${card?.dataset.name || "Flower"} ${
                    alreadySaved ? "removed from" : "added to"
                } favorites.`
            );

            applyFilters();
        }

        function applyFilters() {
            const term = (search?.value || "").trim().toLowerCase();
            const sortMode = sort?.value || "featured";
            const favorites = readStorage(FAVORITES_KEY);

            const matching = cards.filter(card => {
                const name = (card.dataset.name || "").toLowerCase();
                const description = (card.dataset.description || "").toLowerCase();
                const cardCategory = card.dataset.category || "";

                const matchesTerm =
                    name.includes(term) ||
                    description.includes(term) ||
                    cardCategory.toLowerCase().includes(term);

                const matchesCategory =
                    category === "all" || cardCategory === category;

                const matchesFavorite =
                    !favoritesMode || favorites.includes(cardId(card));

                return matchesTerm && matchesCategory && matchesFavorite;
            });

            matching.sort((a, b) => {
                const priceA = Number(a.dataset.price) || 0;
                const priceB = Number(b.dataset.price) || 0;

                if (sortMode === "price-low") return priceA - priceB;
                if (sortMode === "price-high") return priceB - priceA;
                if (sortMode === "name") {
                    return (a.dataset.name || "").localeCompare(b.dataset.name || "");
                }

                return cards.indexOf(a) - cards.indexOf(b);
            });

            cards.forEach(card => { card.hidden = true; });

            matching.forEach(card => {
                card.hidden = false;
                grid.appendChild(card);
            });

            if (countLabel) {
                countLabel.textContent =
                    `${matching.length} ${matching.length === 1
                        ? "little treasure"
                        : "little treasures"}`;
            }

            if (emptyState) emptyState.hidden = matching.length !== 0;
            grid.hidden = matching.length === 0;
        }

        function setCategory(value) {
            category = value;

            filterButtons.forEach(button => {
                const active = button.dataset.category === value;
                button.classList.toggle("active", active);
                button.setAttribute("aria-pressed", String(active));
            });

            applyFilters();
        }

        function openDetails(id) {
            const card = getCard(id);
            if (!card) return;

            currentDialogId = id;

            const image = $(".flower-card-image img", card);

            if (dialogImage) {
                dialogImage.src = image?.src || card.dataset.image || "";
                dialogImage.alt = image?.alt || card.dataset.name || "Flower";
            }

            if (dialogName) dialogName.textContent = card.dataset.name || "";
            if (dialogDescription) {
                dialogDescription.textContent = card.dataset.description || "";
            }
            if (dialogPrice) {
                dialogPrice.textContent = money.format(Number(card.dataset.price) || 0);
            }

            updateFavoriteButtons();

            if (dialog?.showModal) dialog.showModal();
            else {
                alert(
                    `${card.dataset.name}\n${card.dataset.description}\n` +
                    money.format(Number(card.dataset.price) || 0)
                );
            }
        }

        /* ---------- Mini-cart UI ---------- */

        const cartStyles = document.createElement("style");
        cartStyles.id = "liorielle-cart-styles";
        cartStyles.textContent = `
            .liorielle-cart-launcher {
                position:fixed;right:22px;bottom:22px;z-index:999;
                border:0;border-radius:999px;padding:14px 20px;
                background:#7b455b;color:#fff;font:inherit;
                box-shadow:0 8px 28px #39202b30;cursor:pointer;
            }
            .liorielle-cart-badge {
                display:inline-grid;place-items:center;margin-left:8px;
                min-width:23px;height:23px;border-radius:50%;
                background:#f4dbe3;color:#61374a;font-size:12px;
            }
            .liorielle-cart-panel {
                position:fixed;right:20px;bottom:82px;z-index:1000;
                width:min(390px,calc(100vw - 28px));max-height:72vh;
                overflow:auto;background:#fffaf9;color:#49313b;
                border:1px solid #ead6dd;border-radius:18px;padding:18px;
                box-shadow:0 16px 45px #39202b2b;
            }
            .liorielle-cart-panel[hidden] {display:none}
            .liorielle-cart-header,.liorielle-cart-row,.liorielle-cart-footer {
                display:flex;align-items:center;justify-content:space-between;gap:12px;
            }
            .liorielle-cart-header h2 {font-size:1.2rem;margin:0}
            .liorielle-cart-row {padding:14px 0;border-bottom:1px solid #eadfe3}
            .liorielle-cart-item-name {font-weight:600}
            .liorielle-cart-muted {font-size:.88rem;color:#806975}
            .liorielle-cart-qty {display:flex;align-items:center;gap:8px;margin-top:6px}
            .liorielle-cart-qty button,.liorielle-cart-remove {
                border:1px solid #dfc5cf;background:#fff;border-radius:8px;
                padding:4px 9px;cursor:pointer;color:#654052;
            }
            .liorielle-cart-actions {display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
            .liorielle-cart-actions button {
                border:1px solid #c99aaa;border-radius:999px;padding:10px 13px;
                background:#fff;color:#654052;cursor:pointer;font:inherit;
            }
            .liorielle-cart-actions .primary {background:#7b455b;color:white}
            .liorielle-add-button {
                display:block;width:100%;margin-top:12px;padding:10px 14px;
                border:1px solid #bd8a9c;border-radius:999px;
                background:#fff7f8;color:#704356;cursor:pointer;font:inherit;
            }
            .liorielle-add-button:hover {background:#f5e4e9}
            @media(max-width:480px) {
                .liorielle-cart-launcher {right:14px;bottom:14px}
                .liorielle-cart-panel {right:14px;bottom:76px}
            }
        `;
        if (!$("#liorielle-cart-styles")) document.head.appendChild(cartStyles);

        const launcher = document.createElement("button");
        launcher.type = "button";
        launcher.className = "liorielle-cart-launcher";
        launcher.setAttribute("aria-expanded", "false");
        launcher.innerHTML = '♡ My Cart <span class="liorielle-cart-badge">0</span>';

        const panel = document.createElement("section");
        panel.className = "liorielle-cart-panel";
        panel.hidden = true;
        panel.setAttribute("aria-label", "Shopping cart");

        const header = document.createElement("div");
        header.className = "liorielle-cart-header";

        const heading = document.createElement("h2");
        heading.textContent = "Your Little Bouquet Cart";

        const close = document.createElement("button");
        close.type = "button";
        close.textContent = "✕";
        close.setAttribute("aria-label", "Close cart");

        header.append(heading, close);

        const itemsContainer = document.createElement("div");
        const subtotal = document.createElement("p");
        subtotal.className = "liorielle-cart-footer";

        const actions = document.createElement("div");
        actions.className = "liorielle-cart-actions";

        const clearButton = document.createElement("button");
        clearButton.type = "button";
        clearButton.textContent = "Clear cart";

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "primary";
        copyButton.textContent = "Copy order summary";

        actions.append(clearButton, copyButton);
        panel.append(header, itemsContainer, subtotal, actions);
        document.body.append(launcher, panel);

        function getCart() {
            return readStorage(CART_KEY);
        }

        function saveCart(cart) {
            const ok = writeStorage(CART_KEY, cart);
            renderCart();
            return ok;
        }

        function addToCart(card) {
            const id = cardId(card);
            const name = card.dataset.name || "Flower";
            const price = Number(card.dataset.price) || 0;
            const image = $(".flower-card-image img", card)?.src || "";

            if (!id || !price) {
                announce("This product is missing its ID or price.");
                return;
            }

            const cart = getCart();
            const existing = cart.find(item => item.id === id);

            if (existing) {
                existing.quantity = Math.min(99, (Number(existing.quantity) || 1) + 1);
            } else {
                cart.push({ id, name, price, image, quantity: 1 });
            }

            if (!saveCart(cart)) {
                announce("The cart couldn't be saved in this browser.");
                return;
            }

            panel.hidden = false;
            launcher.setAttribute("aria-expanded", "true");
            announce(`${name} added to your cart.`);
        }

        function changeQuantity(id, delta) {
            const cart = getCart();
            const item = cart.find(entry => entry.id === id);
            if (!item) return;

            item.quantity = (Number(item.quantity) || 1) + delta;

            const updated = item.quantity <= 0
                ? cart.filter(entry => entry.id !== id)
                : cart.map(entry => entry.id === id
                    ? { ...entry, quantity: Math.min(99, item.quantity) }
                    : entry);

            saveCart(updated);
        }

        function renderCart() {
            const cart = getCart();
            const count = cart.reduce(
                (sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0
            );
            const total = cart.reduce(
                (sum, item) =>
                    sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
                0
            );

            $(".liorielle-cart-badge", launcher).textContent = count;
            itemsContainer.replaceChildren();

            if (!cart.length) {
                const empty = document.createElement("p");
                empty.className = "liorielle-cart-muted";
                empty.textContent = "Your cart is waiting for a little floral magic.";
                itemsContainer.appendChild(empty);
            }

            cart.forEach(item => {
                const row = document.createElement("div");
                row.className = "liorielle-cart-row";

                const details = document.createElement("div");
                const name = document.createElement("div");
                name.className = "liorielle-cart-item-name";
                name.textContent = item.name;

                const price = document.createElement("div");
                price.className = "liorielle-cart-muted";
                price.textContent = money.format(Number(item.price) || 0);

                const quantity = document.createElement("div");
                quantity.className = "liorielle-cart-qty";

                const minus = document.createElement("button");
                minus.type = "button";
                minus.textContent = "−";
                minus.setAttribute("aria-label", `Remove one ${item.name}`);
                minus.addEventListener("click", () => changeQuantity(item.id, -1));

                const qty = document.createElement("span");
                qty.textContent = Number(item.quantity) || 1;

                const plus = document.createElement("button");
                plus.type = "button";
                plus.textContent = "+";
                plus.setAttribute("aria-label", `Add one ${item.name}`);
                plus.addEventListener("click", () => changeQuantity(item.id, 1));

                quantity.append(minus, qty, plus);
                details.append(name, price, quantity);

                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "liorielle-cart-remove";
                remove.textContent = "Remove";
                remove.addEventListener("click", () => {
                    saveCart(getCart().filter(entry => entry.id !== item.id));
                });

                row.append(details, remove);
                itemsContainer.appendChild(row);
            });

            subtotal.replaceChildren();

            const label = document.createElement("strong");
            label.textContent = "Subtotal";

            const amount = document.createElement("strong");
            amount.textContent = money.format(total);

            subtotal.append(label, amount);
            clearButton.disabled = cart.length === 0;
            copyButton.disabled = cart.length === 0;
        }

        function copyCartSummary() {
            const cart = getCart();
            if (!cart.length) return;

            const lines = [
                "Liorielle Floral Atelier — Order Summary",
                "",
                ...cart.map(item =>
                    `${item.name} × ${item.quantity} — ${
                        money.format((Number(item.price) || 0) * (Number(item.quantity) || 0))
                    }`
                ),
                "",
                `Subtotal: ${money.format(cart.reduce(
                    (sum, item) =>
                        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
                    0
                ))}`,
                "",
                "This is a cart summary, not a confirmed order."
            ];

            const text = lines.join("\n");

            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => announce("Order summary copied."))
                    .catch(() => window.prompt("Copy your order summary:", text));
            } else {
                window.prompt("Copy your order summary:", text);
            }
        }

        cards.forEach(card => {
            if ($(".liorielle-add-button", card)) return;

            const button = document.createElement("button");
            button.type = "button";
            button.className = "liorielle-add-button";
            button.textContent = "＋ Add to Cart";
            button.addEventListener("click", () => addToCart(card));

            const content =
                $(".flower-card-content", card) ||
                $(".flower-card-info", card) ||
                $(".flower-card-body", card) ||
                card;

            content.appendChild(button);
        });

        launcher.addEventListener("click", () => {
            panel.hidden = !panel.hidden;
            launcher.setAttribute("aria-expanded", String(!panel.hidden));
        });

        close.addEventListener("click", () => {
            panel.hidden = true;
            launcher.setAttribute("aria-expanded", "false");
        });

        clearButton.addEventListener("click", () => {
            if (!getCart().length) return;

            if (confirm("Clear all items from your cart?")) {
                saveCart([]);
            }
        });

        copyButton.addEventListener("click", copyCartSummary);

        if (search) search.addEventListener("input", applyFilters);
        if (sort) sort.addEventListener("change", applyFilters);

        filterButtons
    .filter(button => button !== favoritesOnly)
    .forEach(button => {
        button.addEventListener("click", () =>
            setCategory(button.dataset.category || "all")
        );
    });

        if (favoritesOnly) {
            favoritesOnly.addEventListener("click", () => {
                favoritesMode = !favoritesMode;
                favoritesOnly.classList.toggle("active", favoritesMode);
                favoritesOnly.setAttribute("aria-pressed", String(favoritesMode));
                favoritesOnly.textContent = favoritesMode
                    ? "♥ Showing Favorites"
                    : "♡ Favorites Only";
                applyFilters();
            });
        }

        grid.addEventListener("click", event => {
            const favoriteButton = event.target.closest("[data-favorite]");
            if (favoriteButton) {
                toggleFavorite(favoriteButton.dataset.favorite);
                return;
            }

            const detailButton = event.target.closest("[data-details]");
            if (detailButton) openDetails(detailButton.dataset.details);
        });

        if (reset) {
            reset.addEventListener("click", () => {
                if (search) search.value = "";
                if (sort) sort.value = "featured";

                favoritesMode = false;

                if (favoritesOnly) {
                    favoritesOnly.classList.remove("active");
                    favoritesOnly.setAttribute("aria-pressed", "false");
                    favoritesOnly.textContent = "♡ Favorites Only";
                }

                setCategory("all");
            });
        }

        if (dialogClose && dialog) {
            dialogClose.addEventListener("click", () => dialog.close());

            dialog.addEventListener("click", event => {
                if (event.target === dialog) dialog.close();
            });

            dialog.addEventListener("close", () => {
                currentDialogId = null;
            });
        }

        if (dialogFavorite) {
            dialogFavorite.addEventListener("click", () => {
                if (currentDialogId) toggleFavorite(currentDialogId);
            });
        }

        updateFavoriteButtons();
        renderCart();
        applyFilters();
    }

    /* =========================================
       BOUQUET CREATOR + DOODLE GIFT STYLE
    ========================================= */

    function initBouquetCreator() {
        const page = $(".creator-page");
        if (!page) return;

        const flowerInputs = $$('input[name="flower"]', page);
        const quantityInputs = $$('input[name^="qty-"]', page);
        const wrappingInputs = $$('input[name="wrapping"]', page);
        const ribbonInputs = $$('input[name="ribbon"]', page);
        const styleInputs = $$('input[name="bouquet-style"]', page);

        const sizeSelect = $("#bouquet-size", page);
        const recipientInput = $("#note-recipient", page);
        const noteInput = $("#bouquet-note", page);
        const noteCount = $("#note-count", page);

        const previewArt = $("#creator-preview-art", page);
        const previewBouquet = $("#creator-bouquet", page);
        const previewRibbon = $("#creator-ribbon-bow", page);
        const previewTitle = $("#preview-title", page);
        const previewSummary = $("#preview-summary", page);
        const previewRecipient = $("#preview-recipient", page);
        const previewMessage = $("#preview-message", page);
        const totalElement = $("#creator-total", page);

        const saveButton = $("#save-bouquet", page);
        const resetButton = $("#reset-bouquet", page);
        const saveStatus = $("#creator-save-status", page);

        const flowers = {
            rose: { name: "Classic roses", emoji: "🌹", price: 120 },
            tulip: { name: "Sweet tulips", emoji: "🌷", price: 100 },
            sunflower: { name: "Sunny sunflowers", emoji: "🌻", price: 90 },
            daisy: { name: "Little daisies", emoji: "🌼", price: 70 }
        };

        const wrappingPrices = { ivory: 0, blush: 50, sage: 50 };
        const sizePrices = { petite: 100, classic: 180, grand: 300 };

        const wrappingNames = {
            ivory: "Warm ivory",
            blush: "Soft blush",
            sage: "Garden sage"
        };

        const ribbonNames = {
            rose: "Rose",
            mulberry: "Mulberry",
            sage: "Sage",
            gold: "Champagne"
        };

        function selectedValue(inputs, fallback) {
            return inputs.find(input => input.checked)?.value || fallback;
        }

        function getSelections() {
            const selectedFlowers = [];

            flowerInputs.forEach(input => {
                if (!input.checked || !flowers[input.value]) return;

                const quantityInput = $(`[name="qty-${input.value}"]`, page);
                const quantity = Math.min(
                    12,
                    Math.max(1, Number(quantityInput?.value) || 1)
                );

                selectedFlowers.push({
                    id: input.value,
                    name: flowers[input.value].name,
                    emoji: flowers[input.value].emoji,
                    quantity,
                    unitPrice: flowers[input.value].price
                });
            });

            const wrapping = selectedValue(wrappingInputs, "ivory");
            const ribbon = selectedValue(ribbonInputs, "rose");
            const size = sizeSelect?.value || "classic";
            const style = selectedValue(styleInputs, "classic");

            const flowerTotal = selectedFlowers.reduce(
                (sum, flower) => sum + flower.quantity * flower.unitPrice, 0
            );

            const total = flowerTotal
                + (wrappingPrices[wrapping] ?? 0)
                + (sizePrices[size] ?? 180);

            return {
                flowers: selectedFlowers,
                wrapping,
                wrappingName: wrappingNames[wrapping] || wrapping,
                ribbon,
                ribbonName: ribbonNames[ribbon] || ribbon,
                size,
                style,
                flowerTotal,
                wrappingPrice: wrappingPrices[wrapping] ?? 0,
                sizePrice: sizePrices[size] ?? 180,
                total,
                recipient: recipientInput?.value.trim() || "",
                note: noteInput?.value.trim() || ""
            };
        }

        function getTitle(selectedFlowers) {
            if (!selectedFlowers.length) return "A Little Love Story";
            if (selectedFlowers.length > 1) return "The Garden Mix";

            return {
                rose: "Rosé Reverie",
                tulip: "Sunday Tulips",
                sunflower: "Golden Hour",
                daisy: "Little Meadow"
            }[selectedFlowers[0].id] || "A Little Love Story";
        }

        function updateStyleCards(style) {
            styleInputs.forEach(input => {
                const card = input.closest(".creator-style-option");
                if (card) card.classList.toggle("active", input.checked);
            });

            if (previewArt) previewArt.dataset.style = style;
        }

        function updatePreview() {
            if (!previewArt || !previewBouquet) return;

            const selection = getSelections();
            previewBouquet.replaceChildren();

            if (!selection.flowers.length) {
                const placeholder = document.createElement("span");
                placeholder.className = "preview-flower";
                placeholder.textContent = "✿";
                placeholder.style.fontSize = "72px";
                previewBouquet.appendChild(placeholder);
            } else {
                let index = 0;

                selection.flowers.forEach(flower => {
                    for (let i = 0; i < flower.quantity; i++) {
                        const bloom = document.createElement("span");
                        bloom.className = "preview-flower";
                        bloom.textContent = flower.emoji;

                        bloom.style.setProperty(
                            "--flower-tilt",
                            `${((index % 5) - 2) * 7}deg`
                        );

                        bloom.style.fontSize =
                            `${Math.max(23, 38 - Math.floor(index / 5) * 2)}px`;

                        bloom.setAttribute("aria-hidden", "true");
                        previewBouquet.appendChild(bloom);
                        index++;
                    }
                });
            }

            previewArt.dataset.wrapping = selection.wrapping;
            updateStyleCards(selection.style);

            if (previewRibbon) {
                previewRibbon.textContent = "🎀";
                previewRibbon.style.filter =
                    selection.ribbon === "gold"
                        ? "sepia(.7) saturate(1.5)"
                        : selection.ribbon === "sage"
                            ? "hue-rotate(65deg) saturate(.65)"
                            : selection.ribbon === "mulberry"
                                ? "hue-rotate(270deg) saturate(.8)"
                                : "none";
            }

            if (selection.style === "doodle") {
                previewArt.classList.add("doodle-style");
            } else {
                previewArt.classList.remove("doodle-style");
            }

            if (previewTitle) previewTitle.textContent = getTitle(selection.flowers);

            const stemCount = selection.flowers.reduce(
                (sum, flower) => sum + flower.quantity, 0
            );

            const flowerDescription = selection.flowers.length
                ? selection.flowers.map(flower =>
                    `${flower.quantity} ${flower.name.toLowerCase()}`
                ).join(", ")
                : "No flowers selected yet";

            if (previewSummary) {
                previewSummary.textContent =
                    `${flowerDescription}. ${selection.wrappingName} wrapping, ` +
                    `${selection.ribbonName.toLowerCase()} ribbon, ` +
                    `${selection.size} size (${stemCount} stems).`;
            }

            if (previewRecipient) {
                previewRecipient.textContent =
                    selection.recipient || "For someone special";
            }

            if (previewMessage) {
                previewMessage.textContent =
                    selection.note || "Your words will find their way here.";
            }

            if (totalElement) totalElement.textContent = money.format(selection.total);
            if (noteCount && noteInput) noteCount.textContent = noteInput.value.length;
            if (saveStatus) saveStatus.textContent = "";
        }

        function setQuantityAvailability() {
            flowerInputs.forEach(input => {
                const quantityInput = $(`[name="qty-${input.value}"]`, page);
                if (quantityInput) quantityInput.disabled = !input.checked;
            });
        }

        function saveBouquet() {
            const selection = getSelections();

            if (!selection.flowers.length) {
                if (saveStatus) {
                    saveStatus.textContent =
                        "Choose at least one flower before saving your creation.";
                }
                flowerInputs[0]?.focus();
                return;
            }

            const keepsakes = readStorage("liorielle-keepsakes");

            
const doodleDraft = (() => {
    try {
        return JSON.parse(
            localStorage.getItem("liorielle-current-doodle-design") || "null"
        );
    } catch (error) {
        return null;
    }
})();

const isDoodle = selection.style === "doodle";

const creation = {
    id: `bouquet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "bouquet",
    title: getTitle(selection.flowers),
    createdAt: new Date().toISOString(),
    flowers: selection.flowers,
    wrapping: selection.wrapping,
    wrappingName: selection.wrappingName,
    ribbon: selection.ribbon,
    ribbonName: selection.ribbonName,
    size: selection.size,
    style: selection.style,
    recipient: selection.recipient,
    note: selection.note,
    total: selection.total,

    doodleDesign: isDoodle && Array.isArray(doodleDraft?.stickers)
        ? doodleDraft
        : null,

    doodleBackground: isDoodle
        ? doodleDraft?.background || "#fffaf4"
        : null
};


            if (writeStorage("liorielle-keepsakes", [...keepsakes, creation])) {
                if (saveStatus) {
                    saveStatus.textContent =
                        "Your bouquet has been saved to Keepsakes. ♡";
                }
            } else if (saveStatus) {
                saveStatus.textContent =
                    "We couldn't save this bouquet. Check your browser storage settings.";
            }
        }

        function resetCreator() {
            flowerInputs.forEach(input => { input.checked = false; });

            quantityInputs.forEach(input => {
                input.value = input.defaultValue || "3";
            });

            wrappingInputs.forEach(input => {
                input.checked = input.value === "ivory";
            });

            ribbonInputs.forEach(input => {
                input.checked = input.value === "rose";
            });

            styleInputs.forEach(input => {
                input.checked = input.value === "classic";
            });

            if (sizeSelect) sizeSelect.value = "classic";
            if (recipientInput) recipientInput.value = "";
            if (noteInput) noteInput.value = "";

            setQuantityAvailability();
            updatePreview();

            if (saveStatus) {
                saveStatus.textContent = "A fresh canvas, ready for your next idea. ✿";
            }
        }

        flowerInputs.forEach(input => {
            input.addEventListener("change", () => {
                setQuantityAvailability();
                updatePreview();
            });
        });

        quantityInputs.forEach(input => {
            input.addEventListener("input", () => {
                const value = Number(input.value);

                if (input.value !== "" && value > 12) input.value = "12";
                if (input.value !== "" && value < 1) input.value = "1";

                updatePreview();
            });

            input.addEventListener("change", () => {
                if (input.value === "") input.value = "1";
                updatePreview();
            });
        });

        [...wrappingInputs, ...ribbonInputs, ...styleInputs].forEach(input => {
            input.addEventListener("change", updatePreview);
        });

        sizeSelect?.addEventListener("change", updatePreview);
        recipientInput?.addEventListener("input", updatePreview);
        noteInput?.addEventListener("input", updatePreview);

        saveButton?.addEventListener("click", saveBouquet);
        resetButton?.addEventListener("click", resetCreator);

        setQuantityAvailability();
        updatePreview();
    }
    
/* =========================================
   READY-MADE DOODLE GIFT EDITOR
========================================= */

function initDoodleEditor() {
    const page = $(".creator-page");
    if (!page) return;

    const styleInputs = $$('input[name="bouquet-style"]', page);
    const styleStep = $(".creator-style-step", page);
    if (!styleStep) return;

    const KEY = "liorielle-current-doodle-design";

    const stickers = [
        { emoji: "🌷", name: "Tulip" },
        { emoji: "🌹", name: "Rose" },
        { emoji: "🌼", name: "Daisy" },
        { emoji: "🌻", name: "Sunflower" },
        { emoji: "🌸", name: "Cherry blossom" },
        { emoji: "💐", name: "Bouquet" },
        { emoji: "♡", name: "Heart" },
        { emoji: "♥", name: "Love heart" },
        { emoji: "☆", name: "Star" },
        { emoji: "✿", name: "Flower doodle" },
        { emoji: "🦋", name: "Butterfly" },
        { emoji: "🎀", name: "Bow" },
        { emoji: "☁️", name: "Cloud" },
        { emoji: "☀️", name: "Sun" },
        { emoji: "✨", name: "Sparkles" },
        { emoji: "🍓", name: "Strawberry" },
        { emoji: "🐝", name: "Little bee" },
        { emoji: "🍃", name: "Leaf" },
        { emoji: "🧸", name: "Teddy bear" },
        { emoji: "💌", name: "Love letter" }
    ];

    const palettes = [
        { name: "Rose", color: "#c86f8d" },
        { name: "Blush", color: "#f3b8c8" },
        { name: "Mulberry", color: "#78435f" },
        { name: "Sage", color: "#81977b" },
        { name: "Butter", color: "#e6bd62" },
        { name: "Lilac", color: "#ad91d1" },
        { name: "Chocolate", color: "#805a49" },
        { name: "Ink", color: "#493a46" }
    ];

    const backgrounds = [
        { name: "Paper", color: "#fffaf4" },
        { name: "Blush", color: "#fff0f3" },
        { name: "Lavender", color: "#f5f0ff" },
        { name: "Sage", color: "#f0f5ed" },
        { name: "Butter", color: "#fff8df" },
        { name: "White", color: "#ffffff" }
    ];

    const editor = document.createElement("section");
    editor.className = "liorielle-doodle-editor";
    editor.hidden = true;
    editor.innerHTML = `
        <div class="ld-heading">
            <span>✿ YOUR LITTLE DOODLE STUDIO</span>
            <h3>Make it your own</h3>
            <p>Pick a sticker, then move it around your canvas.</p>
        </div>

        <div class="ld-label">1. Choose your ready-made doodles</div>
        <div class="ld-sticker-library"></div>

        <div class="ld-label">2. Customize your colors</div>
        <div class="ld-palette" aria-label="Doodle sticker colors"></div>

        <div class="ld-label">3. Choose a paper background</div>
        <div class="ld-backgrounds" aria-label="Canvas backgrounds"></div>

        <div class="ld-label">4. Arrange your design</div>
        <div class="ld-canvas" role="group"
             aria-label="Doodle gift canvas">
            <span class="ld-canvas-hint">your little love story ♡</span>
            <div class="ld-sticker-layer"></div>
        </div>

        <div class="ld-selected-controls">
            <span class="ld-selected-label">Select a sticker to edit it.</span>
            <button type="button" class="ld-smaller">− Smaller</button>
            <button type="button" class="ld-larger">＋ Larger</button>
            <button type="button" class="ld-rotate">↻ Rotate</button>
            <button type="button" class="ld-remove">Remove</button>
        </div>

        <div class="ld-bottom-actions">
            <button type="button" class="ld-undo">↶ Undo</button>
            <button type="button" class="ld-clear">Clear canvas</button>
        </div>

        <p class="ld-status" role="status" aria-live="polite"></p>
    `;

    styleStep.insertAdjacentElement("afterend", editor);

    const css = document.createElement("style");
    css.id = "liorielle-doodle-styles";
    css.textContent = `
        .liorielle-doodle-editor {
            margin: 22px 0;
            padding: clamp(16px, 3vw, 26px);
            border: 1px solid #ead5df;
            border-radius: 20px;
            background: #fffaf9;
            color: #583c4a;
        }

        .liorielle-doodle-editor[hidden] { display: none; }

        .ld-heading span {
            font-size: .72rem;
            letter-spacing: .12em;
            color: #a16c83;
        }

        .ld-heading h3 {
            margin: 8px 0;
            font-size: 1.45rem;
        }

        .ld-heading p {
            line-height: 1.6;
            color: #806975;
        }

        .ld-label {
            margin: 22px 0 10px;
            font-size: .9rem;
            font-weight: 700;
        }

        .ld-sticker-library,
        .ld-palette,
        .ld-backgrounds {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .ld-sticker-choice {
            display: grid;
            place-items: center;
            gap: 3px;
            min-width: 65px;
            min-height: 65px;
            padding: 8px;
            border: 1px solid #ead5df;
            border-radius: 12px;
            background: #fff;
            color: inherit;
            cursor: pointer;
        }

        .ld-sticker-choice span { font-size: 1.7rem; }
        .ld-sticker-choice small { font-size: .68rem; }

        .ld-sticker-choice:hover,
        .ld-sticker-choice:focus-visible {
            border-color: #b77d96;
            background: #fff0f4;
        }

        .ld-color-choice {
            width: 30px;
            height: 30px;
            border: 2px solid #fff;
            outline: 1px solid #e2d1d9;
            border-radius: 50%;
            cursor: pointer;
        }

        .ld-color-choice[aria-pressed="true"] {
            outline: 3px solid #9c657e;
        }

        .ld-bg-choice {
            padding: 8px 12px;
            border: 1px solid #ead5df;
            border-radius: 999px;
            color: #583c4a;
            cursor: pointer;
        }

        .ld-bg-choice[aria-pressed="true"] {
            border-color: #9c657e;
            box-shadow: 0 0 0 2px #f0dce5;
        }

        .ld-canvas {
            position: relative;
            width: 100%;
            min-height: 340px;
            aspect-ratio: 4 / 3;
            overflow: hidden;
            border: 1px solid #e8d8dd;
            border-radius: 14px;
            background: #fffaf4;
            touch-action: pan-y;
            isolation: isolate;
        }

        .ld-canvas-hint {
            position: absolute;
            top: 12px;
            left: 0;
            right: 0;
            text-align: center;
            color: #a78391;
            font-family: Georgia, serif;
            font-style: italic;
            pointer-events: none;
        }

        .ld-sticker-layer {
            position: absolute;
            inset: 0;
        }

        .ld-sticker {
            position: absolute;
            display: grid;
            place-items: center;
            width: 58px;
            height: 58px;
            padding: 0;
            border: 1px solid transparent;
            border-radius: 12px;
            background: transparent;
            cursor: grab;
            user-select: none;
            touch-action: none;
            transform-origin: center;
        }

        .ld-sticker span {
            display: block;
            font-size: 38px;
            line-height: 1;
            pointer-events: none;
        }

        .ld-sticker.selected {
            border: 1px dashed #a56581;
            background: #ffffff80;
        }

        .ld-sticker:active { cursor: grabbing; }

        .ld-selected-controls,
        .ld-bottom-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
        }

        .ld-selected-label {
            width: 100%;
            margin-bottom: 4px;
            font-size: .84rem;
            color: #806975;
        }

        .ld-selected-controls button,
        .ld-bottom-actions button {
            padding: 8px 12px;
            border: 1px solid #dfc5cf;
            border-radius: 999px;
            background: white;
            color: #704356;
            cursor: pointer;
            font: inherit;
        }

        .ld-selected-controls button:disabled { opacity: .45; cursor: not-allowed; }

        .ld-status {
            min-height: 1.4em;
            font-size: .85rem;
            color: #806975;
        }

        @media (max-width: 480px) {
            .ld-canvas { min-height: 280px; }
            .ld-sticker { width: 48px; height: 48px; }
            .ld-sticker span { font-size: 32px; }
        }
    `;
    if (!$("#liorielle-doodle-styles")) document.head.appendChild(css);

    const library = $(".ld-sticker-library", editor);
    const palette = $(".ld-palette", editor);
    const backgroundOptions = $(".ld-backgrounds", editor);
    const canvas = $(".ld-canvas", editor);
    const layer = $(".ld-sticker-layer", editor);
    const hint = $(".ld-canvas-hint", editor);
    const selectedLabel = $(".ld-selected-label", editor);
    const status = $(".ld-status", editor);

    let selectedId = null;
    let currentColor = palettes[0].color;
    let currentBackground = backgrounds[0].color;
    let nextId = 1;
    let history = [];

    function getDesign() {
        return [...layer.querySelectorAll(".ld-sticker")].map(node => ({
            id: node.dataset.id,
            emoji: node.dataset.emoji,
            name: node.dataset.name,
            color: node.dataset.color,
            x: Number(node.dataset.x),
            y: Number(node.dataset.y),
            rotation: Number(node.dataset.rotation),
            scale: Number(node.dataset.scale)
        }));
    }

    function saveDraft() {
        const data = {
            version: 1,
            background: currentBackground,
            stickers: getDesign()
        };

        try {
            localStorage.setItem(KEY, JSON.stringify(data));
            status.textContent = "Your doodle design is saved in this browser ♡";
        } catch (error) {
            status.textContent = "Couldn't save the draft. Try removing a few stickers.";
        }
    }

    function remember() {
        history.push(JSON.stringify({
            background: currentBackground,
            stickers: getDesign()
        }));

        if (history.length > 40) history.shift();
        saveDraft();
    }

    function findSticker(id) {
        return [...layer.children].find(node => node.dataset.id === id);
    }

    function updateSticker(node) {
        if (!node) return;

        const x = Number(node.dataset.x);
        const y = Number(node.dataset.y);
        const rotation = Number(node.dataset.rotation);
        const scale = Number(node.dataset.scale);

        node.style.left = `${x}%`;
        node.style.top = `${y}%`;
        node.style.transform =
            `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;

        const emoji = $("span", node);
        if (emoji) emoji.style.color = node.dataset.color;
    }

    function selectSticker(id) {
        selectedId = id;

        $$(".ld-sticker", layer).forEach(node => {
            const selected = node.dataset.id === id;
            node.classList.toggle("selected", selected);
            node.setAttribute("aria-pressed", String(selected));
        });

        const node = id ? findSticker(id) : null;

        selectedLabel.textContent = node
            ? `${node.dataset.name} selected`
            : "Select a sticker to edit it.";

        [".ld-smaller", ".ld-larger", ".ld-rotate", ".ld-remove"]
            .forEach(selector => {
                $(selector, editor).disabled = !node;
            });
    }

    function addSticker(item, x = 50, y = 50, saved = null) {
        const node = document.createElement("button");
        node.type = "button";
        node.className = "ld-sticker";
        node.dataset.id = saved?.id || `doodle-${nextId++}`;
        node.dataset.emoji = item.emoji;
        node.dataset.name = item.name;
        node.dataset.color = saved?.color || currentColor;
        node.dataset.x = saved?.x ?? x;
        node.dataset.y = saved?.y ?? y;
        node.dataset.rotation = saved?.rotation ?? 0;
        node.dataset.scale = saved?.scale ?? 1;
        node.setAttribute("aria-label", `${item.name}, move or select`);
        node.setAttribute("aria-pressed", "false");

        const icon = document.createElement("span");
        icon.textContent = item.emoji;
        icon.setAttribute("aria-hidden", "true");
        node.appendChild(icon);

        node.addEventListener("click", event => {
            if (node.dataset.dragged === "true") {
                node.dataset.dragged = "false";
                event.preventDefault();
                return;
            }

            selectSticker(node.dataset.id);
        });

        node.addEventListener("pointerdown", event => {
            if (event.button !== 0 && event.pointerType === "mouse") return;

            const rect = canvas.getBoundingClientRect();
            const startX = event.clientX;
            const startY = event.clientY;
            const originalX = Number(node.dataset.x);
            const originalY = Number(node.dataset.y);
            let moved = false;

            selectSticker(node.dataset.id);
            node.setPointerCapture(event.pointerId);

            function move(moveEvent) {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;

                if (!moved) return;

                node.dataset.x = Math.max(
                    5, Math.min(95, originalX + dx / rect.width * 100)
                );

                node.dataset.y = Math.max(
                    8, Math.min(94, originalY + dy / rect.height * 100)
                );

                node.dataset.dragged = "true";
                updateSticker(node);
            }

            function finish() {
                node.removeEventListener("pointermove", move);
                node.removeEventListener("pointerup", finish);
                node.removeEventListener("pointercancel", finish);

                if (moved) remember();
            }

            node.addEventListener("pointermove", move);
            node.addEventListener("pointerup", finish);
            node.addEventListener("pointercancel", finish);
        });

        layer.appendChild(node);
        updateSticker(node);
        selectSticker(node.dataset.id);
        hint.hidden = true;
        return node;
    }

    stickers.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ld-sticker-choice";
        button.innerHTML = `<span aria-hidden="true">${item.emoji}</span>`;

        const label = document.createElement("small");
        label.textContent = item.name;
        button.appendChild(label);

        button.addEventListener("click", () => {
            const node = addSticker(item, 50, 50);
            node.dataset.color = currentColor;
            updateSticker(node);
            remember();
            status.textContent = `${item.name} added! Drag it to arrange your design.`;
        });

        library.appendChild(button);
    });

    palettes.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ld-color-choice";
        button.style.background = item.color;
        button.title = item.name;
        button.setAttribute("aria-label", `${item.name} sticker color`);
        button.setAttribute("aria-pressed", String(item.color === currentColor));

        button.addEventListener("click", () => {
            currentColor = item.color;

            $$(".ld-color-choice", palette).forEach(other => {
                other.setAttribute(
                    "aria-pressed",
                    String(other === button)
                );
            });

            const node = findSticker(selectedId);
            if (node) {
                node.dataset.color = currentColor;
                updateSticker(node);
                remember();
            }
        });

        palette.appendChild(button);
    });

    backgrounds.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ld-bg-choice";
        button.textContent = item.name;
        button.style.background = item.color;
        button.setAttribute("aria-pressed", String(item.color === currentBackground));

        button.addEventListener("click", () => {
            currentBackground = item.color;
            canvas.style.background = currentBackground;

            $$(".ld-bg-choice", backgroundOptions).forEach(other => {
                other.setAttribute("aria-pressed", String(other === button));
            });

            remember();
        });

        backgroundOptions.appendChild(button);
    });

    $(".ld-smaller", editor).addEventListener("click", () => {
        const node = findSticker(selectedId);
        if (!node) return;

        node.dataset.scale = Math.max(.55, Number(node.dataset.scale) - .15);
        updateSticker(node);
        remember();
    });

    $(".ld-larger", editor).addEventListener("click", () => {
        const node = findSticker(selectedId);
        if (!node) return;

        node.dataset.scale = Math.min(2.2, Number(node.dataset.scale) + .15);
        updateSticker(node);
        remember();
    });

    $(".ld-rotate", editor).addEventListener("click", () => {
        const node = findSticker(selectedId);
        if (!node) return;

        node.dataset.rotation = (Number(node.dataset.rotation) + 15) % 360;
        updateSticker(node);
        remember();
    });

    $(".ld-remove", editor).addEventListener("click", () => {
        const node = findSticker(selectedId);
        if (!node) return;

        node.remove();
        selectSticker(null);
        hint.hidden = layer.children.length > 0;
        remember();
    });

    $(".ld-clear", editor).addEventListener("click", () => {
        if (!layer.children.length) return;

        if (!confirm("Clear all doodles from your canvas?")) return;

        layer.replaceChildren();
        selectSticker(null);
        hint.hidden = false;
        remember();
        status.textContent = "Your canvas is clear and ready for new doodles.";
    });

    $(".ld-undo", editor).addEventListener("click", () => {
        if (history.length < 2) {
            status.textContent = "Nothing to undo yet.";
            return;
        }

        history.pop();
        const previous = JSON.parse(history[history.length - 1]);

        currentBackground = previous.background;
        canvas.style.background = currentBackground;
        layer.replaceChildren();

        previous.stickers.forEach(saved => {
            const item = stickers.find(sticker => sticker.emoji === saved.emoji)
                || { emoji: saved.emoji, name: saved.name };

            addSticker(item, saved.x, saved.y, saved);
        });

        selectSticker(null);
        hint.hidden = layer.children.length > 0;
        saveDraft();
    });

    function loadDraft() {
        try {
            const saved = JSON.parse(localStorage.getItem(KEY) || "null");
            if (!saved || !Array.isArray(saved.stickers)) return;

            currentBackground = saved.background || backgrounds[0].color;
            canvas.style.background = currentBackground;

            saved.stickers.forEach(item => {
                const sticker = stickers.find(entry => entry.emoji === item.emoji)
                    || { emoji: item.emoji, name: item.name || "Doodle" };

                addSticker(sticker, item.x, item.y, item);
            });

            hint.hidden = layer.children.length > 0;
        } catch (error) {
            console.warn("Could not load doodle draft.", error);
        }
    }

    function updateEditorVisibility() {
        const doodleSelected =
            styleInputs.find(input => input.checked)?.value === "doodle";

        editor.hidden = !doodleSelected;
    }

    styleInputs.forEach(input =>
        input.addEventListener("change", updateEditorVisibility)
    );


    // Keep the bouquet reset button from leaving old doodles behind.
    $("#reset-bouquet", page)?.addEventListener("click", () => {
        layer.replaceChildren();
        currentBackground = backgrounds[0].color;
        canvas.style.background = currentBackground;
        hint.hidden = false;
        selectSticker(null);
        history = [];
        localStorage.removeItem(KEY);
    });

    loadDraft();
    updateEditorVisibility();
    selectSticker(null);
}

/* READY-MADE DOODLE EDITOR */
function initDoodleEditor() {
    const options = document.querySelector(".creator-options");
    const styleStep = document.querySelector(".creator-style-step");

    if (!options || !styleStep) return;

    const STORAGE_KEY = "liorielle-current-doodle-design";
    const BG_KEY = "liorielle-current-doodle-background";

    const stickers = [
        { symbol: "🌷", name: "Tulip" },
        { symbol: "🌹", name: "Rose" },
        { symbol: "🌼", name: "Daisy" },
        { symbol: "🌻", name: "Sunflower" },
        { symbol: "✿", name: "Flower" },
        { symbol: "♡", name: "Heart outline" },
        { symbol: "♥", name: "Heart" },
        { symbol: "✨", name: "Sparkles" },
        { symbol: "⭐", name: "Star" },
        { symbol: "🦋", name: "Butterfly" },
        { symbol: "🐝", name: "Bee" },
        { symbol: "☀", name: "Sun" },
        { symbol: "☁", name: "Cloud" },
        { symbol: "🍓", name: "Strawberry" },
        { symbol: "🎀", name: "Bow" },
        { symbol: "☺", name: "Smiley" }
    ];

    const backgrounds = {
        paper: "#fffaf4",
        blush: "#fff0f3",
        sage: "#edf2e8",
        lavender: "#f2edfa"
    };

    function readDesign() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function saveDesign() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
        localStorage.setItem(BG_KEY, JSON.stringify(background));
    }

    let design = readDesign();
    let background = "paper";
    let selectedId = null;
    let nextId = Math.max(0, ...design.map(item => Number(item.id) || 0)) + 1;

    try {
        const storedBackground = JSON.parse(
            localStorage.getItem(BG_KEY) || '"paper"'
        );
        if (backgrounds[storedBackground]) background = storedBackground;
    } catch {}

    // Create editor styles without requiring changes to style.css.
    if (!document.querySelector("#liorielle-doodle-styles")) {
        const style = document.createElement("style");
        style.id = "liorielle-doodle-styles";
        style.textContent = `
            .doodle-editor {
                margin-top: 22px;
                padding: 18px;
                border: 1px solid #eadbd7;
                border-radius: 16px;
                background: #fffdfb;
            }
            .doodle-editor[hidden] { display: none !important; }
            .doodle-editor h3 { margin-top: 0; }
            .doodle-editor p { font-size: .9rem; line-height: 1.5; }
            .doodle-sticker-library {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 8px;
                margin: 14px 0;
            }
            .doodle-sticker-choice {
                min-height: 55px;
                border: 1px solid #eadbd7;
                border-radius: 10px;
                background: white;
                cursor: pointer;
                font-size: 1.7rem;
            }
            .doodle-sticker-choice:hover,
            .doodle-sticker-choice:focus-visible {
                border-color: #b77987;
                background: #fff2f4;
            }
            .doodle-board {
                position: relative;
                width: 100%;
                min-height: 250px;
                overflow: hidden;
                border: 1px solid #e4d3cc;
                border-radius: 12px;
                background: #fffaf4;
                touch-action: pan-y;
            }
            .doodle-board::before {
                content: "your little doodle garden";
                position: absolute;
                top: 10px;
                left: 0;
                right: 0;
                text-align: center;
                color: #ad8c87;
                font: italic 12px Georgia, serif;
                pointer-events: none;
            }
            .doodle-canvas-sticker {
                position: absolute;
                transform: translate(-50%, -50%);
                display: grid;
                place-items: center;
                min-width: 30px;
                min-height: 30px;
                padding: 2px;
                border: 1px solid transparent;
                border-radius: 8px;
                background: transparent;
                cursor: grab;
                touch-action: none;
                user-select: none;
                line-height: 1.1;
            }
            .doodle-canvas-sticker.is-selected {
                border: 1px dashed #b77987;
                background: #ffffff70;
            }
            .doodle-editor-controls {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-top: 12px;
            }
            .doodle-editor-controls button,
            .doodle-editor-controls select {
                min-height: 36px;
                padding: 7px 10px;
                border: 1px solid #e2ceca;
                border-radius: 8px;
                background: white;
                cursor: pointer;
            }
            .doodle-editor-controls label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: .85rem;
            }
            .doodle-editor-controls input[type="range"] {
                width: 90px;
            }
            .doodle-editor-status {
                min-height: 1.2em;
                color: #805563;
                font-size: .85rem;
            }
            @media (max-width: 480px) {
                .doodle-editor { padding: 12px; }
                .doodle-sticker-library {
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                }
            }
        `;
        document.head.appendChild(style);
    }

    const editor = document.createElement("section");
    editor.className = "doodle-editor";
    editor.hidden = true;
    editor.innerHTML = `
        <h3>🌷 Your Doodle Garden</h3>
        <p>Tap a ready-made sticker to add it. Drag stickers to arrange
        them, then select one to customize it.</p>

        <div class="doodle-sticker-library" aria-label="Ready-made stickers">
            ${stickers.map((sticker, index) => `
                <button type="button"
                    class="doodle-sticker-choice"
                    data-sticker-index="${index}"
                    aria-label="Add ${sticker.name}"
                    title="${sticker.name}">${sticker.symbol}</button>
            `).join("")}
        </div>

        <label for="doodle-background">Paper color</label>
        <select id="doodle-background">
            <option value="paper">Cream paper</option>
            <option value="blush">Blush pink</option>
            <option value="sage">Sage green</option>
            <option value="lavender">Soft lavender</option>
        </select>

        <div class="doodle-board" id="doodle-board"
            aria-label="Doodle design board"></div>

        <div class="doodle-editor-controls">
            <label>Size
                <input id="doodle-size" type="range"
                    min="20" max="64" value="34">
            </label>
            <label>Rotate
                <input id="doodle-rotation" type="range"
                    min="-45" max="45" value="0">
            </label>
            <button type="button" id="doodle-remove">Remove selected</button>
            <button type="button" id="doodle-clear">Clear all</button>
        </div>

        <p class="doodle-editor-status" id="doodle-status"
            aria-live="polite">Choose a sticker to get started.</p>
    `;

    styleStep.insertAdjacentElement("afterend", editor);

    const board = editor.querySelector("#doodle-board");
    const backgroundSelect = editor.querySelector("#doodle-background");
    const sizeControl = editor.querySelector("#doodle-size");
    const rotationControl = editor.querySelector("#doodle-rotation");
    const status = editor.querySelector("#doodle-status");

    backgroundSelect.value = background;
    board.style.backgroundColor = backgrounds[background];

    function say(message) {
        status.textContent = message;
    }

    function selectedSticker() {
        return design.find(item => item.id === selectedId);
    }

    function selectSticker(id) {
        selectedId = id;
        const item = selectedSticker();

        if (item) {
            sizeControl.value = item.size;
            rotationControl.value = item.rotation;
            say("Sticker selected. Drag it or use the controls.");
        }

        render();
    }

    function render() {
        board.replaceChildren();
        board.style.backgroundColor = backgrounds[background];

        design.forEach(item => {
            const sticker = document.createElement("button");
            sticker.type = "button";
            sticker.className = "doodle-canvas-sticker";
            sticker.textContent = item.symbol;
            sticker.setAttribute("aria-label", `Sticker: ${item.name}`);
            sticker.setAttribute("aria-pressed",
                String(item.id === selectedId));

            if (item.id === selectedId) {
                sticker.classList.add("is-selected");
            }

            sticker.style.left = `${item.x}%`;
            sticker.style.top = `${item.y}%`;
            sticker.style.fontSize = `${item.size}px`;
            sticker.style.color = item.color || "#9d5369";
            sticker.style.transform =
                `translate(-50%, -50%) rotate(${item.rotation}deg)`;

            sticker.addEventListener("click", event => {
                event.stopPropagation();
                selectSticker(item.id);
            });

            // Pointer dragging works with a mouse or touch.
            sticker.addEventListener("pointerdown", event => {
                if (event.button !== 0 && event.pointerType === "mouse") return;

                event.preventDefault();
                event.stopPropagation();
                selectSticker(item.id);

                const rect = board.getBoundingClientRect();
                const pointerId = event.pointerId;
                sticker.setPointerCapture(pointerId);

                function move(moveEvent) {
                    if (moveEvent.pointerId !== pointerId) return;

                    const current = selectedSticker();
                    if (!current) return;

                    current.x = Math.max(5, Math.min(95,
                        ((moveEvent.clientX - rect.left) / rect.width) * 100
                    ));
                    current.y = Math.max(8, Math.min(95,
                        ((moveEvent.clientY - rect.top) / rect.height) * 100
                    ));

                    sticker.style.left = `${current.x}%`;
                    sticker.style.top = `${current.y}%`;
                    saveDesign();
                }

                function finish(finishEvent) {
                    if (finishEvent.pointerId !== pointerId) return;
                    sticker.removeEventListener("pointermove", move);
                    sticker.removeEventListener("pointerup", finish);
                    sticker.removeEventListener("pointercancel", finish);
                    saveDesign();
                }

                sticker.addEventListener("pointermove", move);
                sticker.addEventListener("pointerup", finish);
                sticker.addEventListener("pointercancel", finish);
            });

            board.appendChild(sticker);
        });
    }

    function addSticker(stickerData) {
        if (design.length >= 40) {
            say("You can add up to 40 stickers per design.");
            return;
        }

        const item = {
            id: nextId++,
            symbol: stickerData.symbol,
            name: stickerData.name,
            x: 20 + Math.random() * 60,
            y: 25 + Math.random() * 60,
            size: 34,
            rotation: Math.round(Math.random() * 16 - 8),
            color: "#9d5369"
        };

        design.push(item);
        selectedId = item.id;
        saveDesign();
        render();
        sizeControl.value = item.size;
        rotationControl.value = item.rotation;
        say(`${item.name} added! Drag it wherever you like.`);
    }

    editor.querySelectorAll("[data-sticker-index]").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.stickerIndex);
            if (stickers[index]) addSticker(stickers[index]);
        });
    });

    backgroundSelect.addEventListener("change", () => {
        background = backgroundSelect.value;
        saveDesign();
        render();
        say("Paper color updated.");
    });

    sizeControl.addEventListener("input", () => {
        const item = selectedSticker();
        if (!item) return say("Select a sticker first.");
        item.size = Number(sizeControl.value);
        saveDesign();
        render();
    });

    rotationControl.addEventListener("input", () => {
        const item = selectedSticker();
        if (!item) return say("Select a sticker first.");
        item.rotation = Number(rotationControl.value);
        saveDesign();
        render();
    });

    editor.querySelector("#doodle-remove").addEventListener("click", () => {
        if (selectedId === null) return say("Select a sticker to remove.");
        design = design.filter(item => item.id !== selectedId);
        selectedId = null;
        saveDesign();
        render();
        say("Sticker removed.");
    });

    editor.querySelector("#doodle-clear").addEventListener("click", () => {
        design = [];
        selectedId = null;
        saveDesign();
        render();
        say("Your doodle board is clear.");
    });

    // Show the editor only when Doodle Style is selected.
    function updateVisibility() {
        const doodleSelected = document.querySelector(
            'input[name="bouquet-style"][value="doodle"]:checked'
        );
        editor.hidden = !doodleSelected;
    }

    document.querySelectorAll('input[name="bouquet-style"]').forEach(input => {
        input.addEventListener("change", updateVisibility);
    });

    // Keep the existing Reset Bouquet button in sync with doodles.
    document.querySelector("#reset-bouquet")?.addEventListener("click", () => {
        design = [];
        selectedId = null;
        background = "paper";
        nextId = 1;
        backgroundSelect.value = background;
        saveDesign();
        render();
        say("Doodle board reset.");
    });

    render();
    updateVisibility();
}

    /* =========================================
       DIGITAL GIFTS
    ========================================= */

    function initDigitalGifts() {
        const page = $(".gifts-page");
        if (!page) return;

        const recipient = $("#gift-recipient");
        const sender = $("#gift-sender");
        const occasion = $("#gift-occasion");
        const message = $("#gift-message");
        const envelope = $("#gift-envelope");
        const openButton = $("#gift-open-envelope");
        const closeButton = $("#gift-close-envelope");

        const previewTitle = $("#preview-title", page);
        const previewSender = $("#preview-sender", page);
        const previewOccasion = $("#preview-occasion", page);
        const previewMessage = $("#preview-message", page);
        const charCount = $("#gift-char-count");
        const hint = $("#gift-preview-hint");
        const saveStatus = $("#gift-save-status");

        const resetButton = $("#gift-reset");
        const saveButton = $("#gift-save");
        const copyButton = $("#gift-copy-message");
        const downloadButton = $("#gift-download");

        const KEY = "liorielle-digital-gifts";
        let theme = "rosewater";
        let isOpen = false;

        const themes = {
            rosewater: "gift-theme-rosewater",
            sage: "gift-theme-sage",
            midnight: "gift-theme-midnight"
        };

        function updatePreview() {
            if (previewTitle) {
                previewTitle.textContent = recipient.value.trim()
                    ? `Dear ${recipient.value.trim()},`
                    : "Dear Someone Special,";
            }

            if (previewSender) {
                previewSender.textContent = sender.value.trim()
                    ? `${sender.value.trim()} ♡`
                    : "Someone who cares ♡";
            }

            if (previewOccasion) {
                previewOccasion.textContent = occasion.value.toUpperCase();
            }

            if (previewMessage) {
                previewMessage.replaceChildren();

                const text = message.value.trim();
                const paragraphs = text
                    ? text.split(/\n+/)
                    : ["Your words will appear here."];

                paragraphs.forEach(line => {
                    if (!line.trim()) return;
                    const p = document.createElement("p");
                    p.textContent = line;
                    previewMessage.appendChild(p);
                });
            }

            if (charCount) charCount.textContent = message.value.length;
        }

        function selectTheme(value) {
            if (!themes[value] || !envelope) return;

            theme = value;
            envelope.classList.remove(...Object.values(themes));
            envelope.classList.add(themes[value]);

            $$(".gift-theme-option").forEach(button => {
                const selected = button.dataset.theme === value;
                button.classList.toggle("selected", selected);
                button.setAttribute("aria-pressed", String(selected));
            });
        }

        function setOpen(value) {
            isOpen = value;
            envelope?.classList.toggle("is-open", isOpen);
            if (openButton) openButton.hidden = isOpen;
            if (closeButton) closeButton.hidden = !isOpen;

            if (hint) {
                hint.textContent = isOpen
                    ? "A little piece of your heart, written just for them."
                    : "A little surprise is waiting inside.";
            }
        }

        function getData() {
            return {
                id: `gift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                type: "digital-letter",
                recipient: recipient.value.trim(),
                sender: sender.value.trim(),
                occasion: occasion.value,
                message: message.value.trim(),
                theme,
                createdAt: new Date().toISOString()
            };
        }

        function plainText(data) {
            return [
                data.occasion,
                "",
                `Dear ${data.recipient || "Someone Special"},`,
                "",
                data.message || "A little note, just for you.",
                "",
                "With love,",
                data.sender || "Someone who cares"
            ].join("\n");
        }

        function saveGift() {
            const data = getData();

            if (!data.recipient) {
                saveStatus.textContent =
                    "Add the recipient's name before saving your letter.";
                recipient.focus();
                return;
            }

            if (!data.message) {
                saveStatus.textContent =
                    "Write a little message before saving your letter.";
                message.focus();
                return;
            }

            const gifts = readStorage(KEY);
            gifts.unshift(data);

            if (writeStorage(KEY, gifts.slice(0, 50))) {
                saveStatus.textContent =
                    "Your digital letter has been saved in this browser ♡";
            } else {
                saveStatus.textContent =
                    "The letter couldn't be saved. Check your browser storage.";
            }
        }

        async function copyLetter() {
            const text = plainText(getData());

            try {
                await navigator.clipboard.writeText(text);
                if (hint) hint.textContent = "Your letter has been copied ♡";
            } catch (error) {
                window.prompt("Copy your letter:", text);
            }
        }

        function downloadLetter() {
            const data = getData();

            if (!data.message) {
                if (hint) hint.textContent = "Write your message first.";
                message.focus();
                return;
            }

            const blob = new Blob([plainText(data)], {
                type: "text/plain;charset=utf-8"
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const safeName = (data.recipient || "special-letter")
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
                .trim()
                .replace(/\s+/g, "-")
                .slice(0, 50);

            link.href = url;
            link.download = `liorielle-letter-${safeName || "special-letter"}.txt`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        }

        function resetLetter() {
            recipient.value = "";
            sender.value = "";
            occasion.value = "Just Because";
            message.value = "";

            selectTheme("rosewater");
            setOpen(false);
            updatePreview();

            if (saveStatus) saveStatus.textContent = "Start fresh with a new little letter.";
        }

        [recipient, sender, message].forEach(input =>
            input?.addEventListener("input", updatePreview)
        );

        occasion?.addEventListener("change", updatePreview);

        $$(".gift-theme-option").forEach(button => {
            button.addEventListener("click", () => selectTheme(button.dataset.theme));
        });

        openButton?.addEventListener("click", () => setOpen(true));
        closeButton?.addEventListener("click", () => setOpen(false));

        envelope?.addEventListener("click", event => {
            if (event.target.closest("button, a")) return;
            setOpen(!isOpen);
        });

        saveButton?.addEventListener("click", saveGift);
        copyButton?.addEventListener("click", copyLetter);
        downloadButton?.addEventListener("click", downloadLetter);
        resetButton?.addEventListener("click", resetLetter);

        updatePreview();
    }

    /* =========================================
       KEEPSAKES LIBRARY
    ========================================= */

    function initKeepsakes() {
        const page = $(".keepsakes-page");
        if (!page) return;

        const BOUQUET_KEY = "liorielle-keepsakes";
        const LETTER_KEY = "liorielle-digital-gifts";

        const grid = $("#keepsake-grid");
        const emptyState = $("#keepsake-empty");
        const emptyTitle = $("#keepsake-empty-title");
        const emptyMessage = $("#keepsake-empty-message");
        const search = $("#keepsake-search");
        const resultCount = $("#keepsake-results-count");

        const totalCount = $("#keepsake-total-count");
        const bouquetCount = $("#keepsake-bouquet-count");
        const letterCount = $("#keepsake-letter-count");

        const dialog = $("#keepsake-detail-dialog");
        const detailType = $("#keepsake-detail-type");
        const detailTitle = $("#keepsake-detail-title");
        const detailContent = $("#keepsake-detail-content");
        const detailClose = $("#keepsake-detail-close");
        const detailRemove = $("#keepsake-detail-remove");
        const detailCopy = $("#keepsake-detail-copy");
        const detailStatus = $("#keepsake-detail-status");

        let filter = "all";
        let allItems = [];
        let currentItem = null;

        const text = value =>
            typeof value === "string" || typeof value === "number"
                ? String(value)
                : "";

        const firstText = (...values) =>
            values.map(text).map(value => value.trim()).find(Boolean) || "";

        function dateLabel(value) {
            const date = new Date(value || "");
            return Number.isNaN(date.getTime())
                ? "A little creation"
                : date.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                });
        }

        function flowerSummary(item) {
            if (Array.isArray(item.flowers)) {
                const parts = item.flowers.map(flower => {
                    if (typeof flower === "string") return flower;
                    if (!flower || typeof flower !== "object") return "";

                    const name = firstText(flower.name, flower.label, flower.type);
                    const qty = flower.quantity ?? flower.count;

                    return name && qty != null ? `${qty} ${name}` : name;
                }).filter(Boolean);

                if (parts.length) return parts.join(", ");
            }

            if (item.flowers && typeof item.flowers === "object") {
                const parts = Object.entries(item.flowers).map(([name, value]) => {
                    if (typeof value === "number" && value > 0) {
                        return `${value} ${name}`;
                    }

                    if (value && typeof value === "object") {
                        const qty = value.quantity ?? value.count;
                        return Number(qty) > 0
                            ? `${qty} ${firstText(value.name, name)}`
                            : "";
                    }

                    return "";
                }).filter(Boolean);

                if (parts.length) return parts.join(", ");
            }

            return firstText(item.flowerSummary, item.description, item.details)
                || "A custom floral arrangement";
        }

        function normalizeItems(key, type) {
            return readStorage(key).map((raw, index) => {
                const item = raw && typeof raw === "object" ? raw : {};
                const bouquet = type === "bouquet";

                return {
                    type,
                    storageKey: key,
                    storageIndex: index,
                    storageId: item.id ?? null,
                    title: bouquet
                        ? firstText(
                            item.title,
                            item.name,
                            item.recipient && `Bouquet for ${item.recipient}`,
                            item.size && `${item.size} Bouquet`
                        ) || "A Bouquet of Your Own"
                        : firstText(
                            item.recipient && `Letter for ${item.recipient}`,
                            item.title,
                            item.name
                        ) || "A Little Letter",
                    description: bouquet
                        ? flowerSummary(item)
                        : firstText(item.message, item.note).slice(0, 105)
                            || "A personal letter, saved with love.",
                    date: item.createdAt || item.date || item.savedAt,
                    raw: item
                };
            });
        }

        function loadCollection() {
            const bouquets = normalizeItems(BOUQUET_KEY, "bouquet");
            const letters = normalizeItems(LETTER_KEY, "letter");
            allItems = [...bouquets, ...letters];

            if (totalCount) totalCount.textContent = allItems.length;
            if (bouquetCount) bouquetCount.textContent = bouquets.length;
            if (letterCount) letterCount.textContent = letters.length;

            render();
        }

        function el(tag, className, value) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (value !== undefined) element.textContent = value;
            return element;
        }

        

function createCard(item) {
    const card = el("article", "keepsake-card");
    const artwork = el(
        "div",
        `keepsake-card-art ${item.type === "bouquet" ? "bouquet-art" : "letter-art"}`
    );

    artwork.appendChild(
        el("span", "keepsake-card-type",
            item.type === "bouquet" ? "Bouquet" : "Digital Letter")
    );

    const design = item.doodleDesign;
    const stickers = Array.isArray(design)
        ? design
        : Array.isArray(design?.stickers)
            ? design.stickers
            : [];

    if (item.type === "bouquet" && item.style === "doodle" && stickers.length) {
        const doodlePreview = el("div", "keepsake-doodle-preview");

        doodlePreview.style.cssText = `
            position: absolute;
            inset: 0;
            overflow: hidden;
            background: ${design?.background || item.doodleBackground || "#fffaf4"};
        `;

        stickers.forEach(doodle => {
            const sticker = el("span", "keepsake-doodle-sticker");
            sticker.textContent = doodle.emoji || "✿";

            sticker.style.cssText = `
                position: absolute;
                left: ${Number(doodle.x) || 50}%;
                top: ${Number(doodle.y) || 50}%;
                transform: translate(-50%, -50%)
                    rotate(${Number(doodle.rotation) || 0}deg)
                    scale(${Number(doodle.scale) || 1});
                font-size: 28px;
                line-height: 1;
                color: ${doodle.color || "#c86f8d"};
            `;

            doodlePreview.appendChild(sticker);
        });

        artwork.style.position = "relative";
        artwork.appendChild(doodlePreview);
    } else {
        artwork.appendChild(
            el("span", "keepsake-card-art-icon",
                item.type === "bouquet" ? "💐" : "💌")
        );
    }

    artwork.appendChild(
        el("span", "keepsake-card-art-label", "made with love")
    );

    const content = el("div", "keepsake-card-content");

    content.append(
        el("span", "keepsake-card-date", dateLabel(item.date || item.createdAt)),
        el("h3", "", item.title),
        el("p", "keepsake-card-description", item.description || item.note || "")
    );

    const actions = el("div", "keepsake-card-actions");
    const view = el("button", "", "View details");
    const remove = el("button", "", "Remove");

    view.type = remove.type = "button";
    view.addEventListener("click", () => openDetails(item));
    remove.addEventListener("click", () => removeItem(item));

    actions.append(view, remove);
    content.appendChild(actions);
    card.append(artwork, content);

    return card;
}



        function render() {
            const query = (search?.value || "").trim().toLowerCase();

            const filtered = allItems.filter(item => {
                const typeMatches = filter === "all" || item.type === filter;
                const raw = item.raw;

                const searchText = [
                    item.title, item.description, item.type,
                    raw.recipient, raw.sender, raw.message, raw.occasion,
                    raw.wrapping, raw.ribbon, raw.size, raw.style, raw.note,
                    JSON.stringify(raw.flowers || {})
                ].map(text).join(" ").toLowerCase();

                return typeMatches && (!query || searchText.includes(query));
            });

            grid.replaceChildren();
            filtered.forEach(item => grid.appendChild(createCard(item)));

            if (resultCount) {
                resultCount.textContent =
                    `Showing ${filtered.length} ${filtered.length === 1 ? "keepsake" : "keepsakes"}`;
            }

            if (emptyState) emptyState.hidden = filtered.length !== 0;
            grid.hidden = filtered.length === 0;

            if (filtered.length === 0 && emptyTitle && emptyMessage) {
                emptyTitle.textContent = allItems.length
                    ? "Nothing found just yet."
                    : "Your shelf is waiting.";

                emptyMessage.textContent = allItems.length
                    ? "Try another search or switch to a different category."
                    : "Save a bouquet or digital letter, and it will appear here.";
            }
        }

        function addRow(label, value) {
            const row = el("p");
            const strong = el("strong", "", `${label}: `);
            const span = el("span", "", value);
            row.append(strong, span);
            detailContent.appendChild(row);
        }

        function openDetails(item) {
            currentItem = item;
            detailContent.replaceChildren();
            detailStatus.textContent = "";

            const raw = item.raw;
            detailTitle.textContent = item.title;

            if (item.type === "letter") {
                detailType.textContent = "A DIGITAL LETTER";
                detailCopy.hidden = false;

                addRow("To", firstText(raw.recipient, "Someone special"));
                addRow("From", firstText(raw.sender, "Someone who cares"));
                addRow("Occasion", firstText(raw.occasion, "Just Because"));
                addRow("Theme", firstText(raw.theme, "rosewater"));
                addRow("Message", firstText(raw.message, "No message was saved."));
            } else {
                detailType.textContent = "A CUSTOM BOUQUET";
                detailCopy.hidden = true;
                
if (raw.style === "doodle" && raw.doodleDesign) {
    const savedDesign = raw.doodleDesign;
    const savedCanvas = document.createElement("div");

    savedCanvas.style.cssText = `
        position: relative;
        width: 100%;
        aspect-ratio: 4 / 3;
        min-height: 240px;
        overflow: hidden;
        border: 1px solid #ead5df;
        border-radius: 14px;
        margin: 12px 0 20px;
        background: ${savedDesign.background || "#fffaf4"};
    `;

    (savedDesign.stickers || []).forEach(sticker => {
        const item = document.createElement("span");
        item.textContent = sticker.emoji || "✿";
        item.setAttribute("aria-label", sticker.name || "Doodle sticker");

        item.style.cssText = `
            position: absolute;
            left: ${Number(sticker.x) || 50}%;
            top: ${Number(sticker.y) || 50}%;
            font-size: ${38 * Math.min(2.2, Math.max(.55, Number(sticker.scale) || 1))}px;
            color: ${sticker.color || "#c86f8d"};
            transform: translate(-50%, -50%) rotate(${Number(sticker.rotation) || 0}deg);
        `;

        savedCanvas.appendChild(item);
    });

    detailContent.appendChild(savedCanvas);
}

                addRow("Flowers", flowerSummary(raw));
                addRow("Size", firstText(raw.size, "Not specified"));
                addRow("Style", firstText(raw.style, "classic"));
                addRow("Wrapping", firstText(raw.wrappingName, raw.wrapping, "Not specified"));
                addRow("Ribbon", firstText(raw.ribbonName, raw.ribbon, "Not specified"));

                if (raw.recipient) addRow("For", raw.recipient);
                if (raw.note) addRow("Note", raw.note);
                if (raw.total != null) addRow("Displayed total", money.format(Number(raw.total) || 0));

                detailContent.appendChild(el(
                    "p", "",
                    "This is a saved design, not a confirmed order."
                ));
            }

            if (dialog.showModal) dialog.showModal();
            else dialog.setAttribute("open", "");
        }

        function closeDetails() {
            currentItem = null;

            if (dialog.close && dialog.open) dialog.close();
            else dialog.removeAttribute("open");
        }

        function removeItem(item) {
            if (!confirm(`Remove "${item.title}" from your keepsakes?`)) return;

            const current = readStorage(item.storageKey);
            let index = item.storageIndex;

            if (
                item.storageId !== null &&
                current[index]?.id !== item.storageId
            ) {
                index = current.findIndex(entry => entry?.id === item.storageId);
            }

            if (index < 0 || index >= current.length) {
                loadCollection();
                return;
            }

            current.splice(index, 1);

            if (!writeStorage(item.storageKey, current)) {
                alert("This item couldn't be removed from browser storage.");
                return;
            }

            closeDetails();
            loadCollection();
        }

        async function copyLetter() {
            if (!currentItem || currentItem.type !== "letter") return;

            const raw = currentItem.raw;
            const content = [
                firstText(raw.occasion, "A Little Letter"),
                "",
                `Dear ${firstText(raw.recipient, "Someone Special")},`,
                "",
                firstText(raw.message),
                "",
                "With love,",
                firstText(raw.sender, "Someone who cares")
            ].join("\n");

            try {
                await navigator.clipboard.writeText(content);
                detailStatus.textContent = "Letter text copied ♡";
            } catch (error) {
                window.prompt("Copy your letter:", content);
            }
        }

        $$(".keepsake-filter").forEach(button => {
            button.addEventListener("click", () => {
                filter = button.dataset.filter || "all";

                $$(".keepsake-filter").forEach(other => {
                    const active = other === button;
                    other.classList.toggle("active", active);
                    other.setAttribute("aria-pressed", String(active));
                });

                render();
            });
        });

        search?.addEventListener("input", render);
        $("#keepsake-refresh")?.addEventListener("click", loadCollection);
        detailClose?.addEventListener("click", closeDetails);

        dialog?.addEventListener("click", event => {
            if (event.target === dialog) closeDetails();
        });

        detailRemove?.addEventListener("click", () => {
            if (currentItem) removeItem(currentItem);
        });

        detailCopy?.addEventListener("click", copyLetter);

        window.addEventListener("focus", loadCollection);
        window.addEventListener("storage", loadCollection);

        loadCollection();
    }

    /* =========================================
       INITIALIZE ALL FEATURES
    ========================================= */

   
function init() {
    initHomepage();
    initFlowerShop();
    initBouquetCreator();
    initDoodleEditor();
    initDigitalGifts();
    initKeepsakes();
}


    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
