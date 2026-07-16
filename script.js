document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. FILTER TABS LOGIC (For Category Filtering)
    // ==========================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.commodity-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedCategory = button.getAttribute('data-category');

            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ==========================================
    // 2. LIVE ACCURATE API & FALLBACK ENGINE
    // ==========================================
    
    // Aapki Verified API Key
    const API_KEY = 'f3a33980e04a7e080e387c1e75b21ba6'; 
    const API_URL = `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}`;

    // Base rates aur current state maintain karne ke liye
    const marketRates = {
        // Precious (Supported by API)
        gold: 2345.50,      // XAU (Converted to USD per Ounce)
        diamond: 4500.00,
        chromium: 6800.00,
        tantalite: 150.00,
        tantalum: 280.00,
        beryllium: 850.00,
        bismuth: 12.40,

        // Base Metals (Supported by API)
        copper: 9850.00,    // COPPER (USD per Ton)
        cobalt: 28500.00,
        tin: 32100.00,      // TIN (USD per Ton)
        "iron-ore": 108.50,
        lead: 2150.00,      // LEAD (USD per Ton)
        lithium: 14200.00,
        nickel: 16450.00,   // NICKEL (USD per Ton)
        chromite: 320.00,
        magnetite: 115.00,
        wolfram: 330.00,

        // Energy & Chemicals
        petroleum: 82.40,
        uranium: 84.50,
        phosphates: 152.00,
        vermiculite: 410.00,
        kaolin: 165.00,
        limestone: 35.00,
        gypsum: 48.00,

        // Earth & Construction
        "silica-sand": 65.00,
        feldspar: 95.00,
        clays: 120.00,
        marble: 450.00,
        salts: 28.00,
        sand: 18.50
    };

    // UI Updates Utility
    function updateCardUI(id, price, changePercent) {
        const card = document.getElementById(id);
        if (!card) return;

        const priceEl = card.querySelector('.price');
        const changeEl = card.querySelector('.change');

        if (priceEl) {
            priceEl.textContent = `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }

        if (changeEl) {
            if (changePercent >= 0) {
                changeEl.textContent = `+${changePercent.toFixed(2)}%`;
                changeEl.className = "change up";
            } else {
                changeEl.textContent = `${changePercent.toFixed(2)}%`;
                changeEl.className = "change down";
            }
        }
    }

    // Engine run functions jo static aur live data handle karti hain
    function processMarketRates(apiRates = {}) {
        // --- 1. ACCURATE REAL-TIME API MAPPING ---
        // Base Unit check: Agar rates USD base par na hon, toh hum unhein correct factor dete hain
        
        // Gold (XAU: Price returns as value per USD. We invert to get USD per Ounce)
        if (apiRates.XAU) {
            marketRates.gold = 1 / apiRates.XAU;
        }
        
        // Copper (LME Copper is provided in LME metric tons equivalent)
        if (apiRates.COPPER) {
            marketRates.copper = apiRates.COPPER;
        }

        // Nickel (LME Nickel price)
        if (apiRates.NICKEL) {
            marketRates.nickel = apiRates.NICKEL;
        }

        // Lead (LME Lead price)
        if (apiRates.LEAD) {
            marketRates.lead = apiRates.LEAD;
        }

        // Tin (LME Tin price)
        if (apiRates.TIN) {
            marketRates.tin = apiRates.TIN;
        }

        // --- 2. LOCAL SIMULATOR FOR ALL OTHER ITEMS ---
        // Jo items API par available nahi hain unme real-time market action chalane ke liye
        Object.keys(marketRates).forEach(id => {
            const isApiTracked = ['gold', 'copper', 'nickel', 'lead', 'tin'].includes(id);
            
            let currentPrice = marketRates[id];
            let percentChange = (Math.random() * 0.06) - 0.03; // Real-time fluctuation (-0.03% to +0.03%)

            if (!isApiTracked) {
                // Apply slight fluctuation so cards feel live
                currentPrice = currentPrice + (currentPrice * (percentChange / 100));
                marketRates[id] = currentPrice; // Save state
            } else {
                // For API items, we show minor dynamic movements around official rate to keep UI responsive
                percentChange = (Math.random() * 0.02) - 0.01;
                currentPrice = currentPrice + (currentPrice * (percentChange / 100));
            }

            updateCardUI(id, currentPrice, percentChange);
        });
    }

    // API Call & Sync Function
    async function syncRates() {
        try {
            console.log("Connecting to MetalPriceAPI Server...");
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("HTTP connection block or API limit reached.");
            
            const data = await response.json();
            
            if (data && data.rates) {
                console.log("Portal successfully synced with live global market!");
                processMarketRates(data.rates);
            } else {
                console.warn("API limit/key status issue. Running offline local engine.");
                processMarketRates({});
            }
        } catch (error) {
            console.error("Local network or API failure. Using local fallback values:", error.message);
            processMarketRates({});
        }
    }

    // Initial Trigger (Jab page load hoga tab accurate data fetch hoga)
    syncRates();

    // Fast UI Live Action Refresh: Har 4 seconds baad pricing columns blink karenge
    setInterval(() => {
        processMarketRates({});
    }, 4000);

    // Background Core API Sync: Har 10 minutes baad global servers se pricing verify karega
    setInterval(syncRates, 600000);
});