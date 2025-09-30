"use strict";

// Semantic version
const VERSION = "2.1.0";

const HERB_DATA_CSV = `name,herb_id,seed_id
Guam,249,5291
Marrentill,251,5292
Tarromin,253,5293
Harralander,255,5294
Ranarr,257,5295
Toadflax,2998,5296
Irit,259,5297
Avantoe,261,5298
Kwuarm,263,5299
Huasca,30097,30088
Snapdragon,3000,5300
Cadantine,265,5301
Lantadyme,2481,5302
Dwarf,267,5303
Torstol,269,5304`;

let herbData = [];
let cachedPrices = {}; // Will store prices by herb name: { herbName: { seedPrice, herbPrice, lastFetched } }
let isLoadingPrices = false;

// DOM elements
const herbCountInput = document.getElementById("herbCountInput");
const patchCountInput = document.getElementById("patchCountInput");
const herbTypeSelect = document.getElementById("herbTypeSelect");
const refreshPricesBtn = document.getElementById("refreshPricesBtn");
const mainContent = document.getElementById("main-content");

// Parse CSV data into usable format
const parseHerbData = () => {
  const lines = HERB_DATA_CSV.trim().split("\n");
  const headers = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    herbData.push({
      name: values[0],
      herbId: parseInt(values[1]),
      seedId: parseInt(values[2]),
    });
  }
};

// Populate herb dropdown
const populateHerbDropdown = () => {
  // Clear existing options first
  herbTypeSelect.innerHTML = "";

  herbData.forEach((herb) => {
    const option = document.createElement("option");
    option.value = herb.name;
    option.textContent = herb.name;
    if (herb.name === "Ranarr") {
      option.selected = true;
    }
    herbTypeSelect.appendChild(option);
  });
};

// Get selected herb data
const getSelectedHerbData = () => {
  const selectedName = herbTypeSelect.value;
  return herbData.find((herb) => herb.name === selectedName);
};

// Get cached prices for the selected herb
const getSelectedHerbPrices = () => {
  const selectedHerb = getSelectedHerbData();
  if (!selectedHerb) return null;
  return cachedPrices[selectedHerb.name] || null;
};

// Set cached prices for a specific herb
const setHerbPrices = (herbName, seedPrice, herbPrice) => {
  cachedPrices[herbName] = {
    seedPrice,
    herbPrice,
    lastFetched: new Date(),
  };
};

// Save selected herb to localStorage
const saveSelectedHerb = () => {
  localStorage.setItem("selectedHerb", herbTypeSelect.value);
};

// Load selected herb from localStorage
const loadSelectedHerb = () => {
  const savedHerb = localStorage.getItem("selectedHerb");
  if (savedHerb && herbData.some((herb) => herb.name === savedHerb)) {
    herbTypeSelect.value = savedHerb;
  }
};

// Add event listeners
const addEventListeners = () => {
  // Add direct input listeners without debounce since prices are cached
  herbCountInput.addEventListener("input", calcRunProfit);
  patchCountInput.addEventListener("input", calcRunProfit);

  herbTypeSelect.addEventListener("change", () => {
    saveSelectedHerb();
    updateHerbNameDisplay();
    updatePriceDisplays(); // Reset price displays to loading state
    fetchAndCachePrices();
  });

  refreshPricesBtn.addEventListener("click", fetchAndCachePrices);
};

// Update herb name in the results display
const updateHerbNameDisplay = () => {
  const selectedHerb = getSelectedHerbData();
  if (selectedHerb) {
    // Convert to title case
    const titleCase = selectedHerb.name.charAt(0).toUpperCase() + selectedHerb.name.slice(1).toLowerCase();
    document.getElementById("herb-name").textContent = titleCase;
  }
};

// Update price displays
const updatePriceDisplays = () => {
  const herbPriceElement = document.getElementById("herbPriceValue");
  const seedPriceElement = document.getElementById("seedPriceValue");
  const selectedHerbPrices = getSelectedHerbPrices();

  if (isLoadingPrices) {
    herbPriceElement.textContent = "Loading...";
    seedPriceElement.textContent = "Loading...";
    herbPriceElement.classList.add("loading");
    seedPriceElement.classList.add("loading");
  } else if (selectedHerbPrices && selectedHerbPrices.herbPrice && selectedHerbPrices.seedPrice) {
    herbPriceElement.textContent = `${selectedHerbPrices.herbPrice.toLocaleString("en-US")} gp`;
    seedPriceElement.textContent = `${selectedHerbPrices.seedPrice.toLocaleString("en-US")} gp`;
    herbPriceElement.classList.remove("loading");
    seedPriceElement.classList.remove("loading");
  } else {
    herbPriceElement.textContent = "Click refresh to load prices";
    seedPriceElement.textContent = "Click refresh to load prices";
    herbPriceElement.classList.remove("loading");
    seedPriceElement.classList.remove("loading");
  }
};

// Set loading state for inputs
const setInputsLoadingState = (loading) => {
  isLoadingPrices = loading;
  herbCountInput.disabled = loading;
  patchCountInput.disabled = loading;
  herbTypeSelect.disabled = loading;

  if (loading) {
    herbCountInput.style.opacity = "0.6";
    patchCountInput.style.opacity = "0.6";
    herbTypeSelect.style.opacity = "0.6";
  } else {
    herbCountInput.style.opacity = "1";
    patchCountInput.style.opacity = "1";
    herbTypeSelect.style.opacity = "1";
  }
};

// Fetch data from API
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Extract prices from API response
const extractPrices = (data, id) => {
  const highPrice = data["data"][id]["high"];
  const lowPrice = data["data"][id]["low"];
  return { highPrice, lowPrice };
};

// Calculate average price
const calcAveragePrice = (highPrice, lowPrice) => {
  return Math.round((highPrice + lowPrice) / 2);
};

// Fetch and cache prices for selected herb
const fetchAndCachePrices = async () => {
  const selectedHerb = getSelectedHerbData();
  if (!selectedHerb) return;

  // Check if we already have cached prices for this herb
  const existingPrices = getSelectedHerbPrices();
  if (existingPrices && existingPrices.seedPrice && existingPrices.herbPrice) {
    console.log(`Using cached prices for ${selectedHerb.name}`);
    updatePriceDisplays();
    calcRunProfit();
    return;
  }

  try {
    // Show loading state
    setInputsLoadingState(true);
    updatePriceDisplays();
    refreshPricesBtn.style.opacity = "0.5";
    refreshPricesBtn.disabled = true;

    const data = await fetchData("https://prices.runescape.wiki/api/v1/osrs/latest");

    const { highPrice: seedHighPrice, lowPrice: seedLowPrice } = extractPrices(data, selectedHerb.seedId);
    const { highPrice: herbHighPrice, lowPrice: herbLowPrice } = extractPrices(data, selectedHerb.herbId);

    const seedPrice = calcAveragePrice(seedHighPrice, seedLowPrice);
    const herbPrice = calcAveragePrice(herbHighPrice, herbLowPrice);

    // Store prices for this specific herb
    setHerbPrices(selectedHerb.name, seedPrice, herbPrice);

    console.log(`Prices updated for ${selectedHerb.name}: Seed=${seedPrice}gp, Herb=${herbPrice}gp`);

    // Update price displays
    updatePriceDisplays();

    // Always recalculate profit when prices are updated
    calcRunProfit();
  } catch (error) {
    console.error("Error fetching prices:", error);
    // Show error state in price displays
    const herbPriceElement = document.getElementById("herbPriceValue");
    const seedPriceElement = document.getElementById("seedPriceValue");
    herbPriceElement.textContent = "Error loading prices";
    seedPriceElement.textContent = "Error loading prices";
  } finally {
    // Reset loading state
    setInputsLoadingState(false);
    updatePriceDisplays();
    refreshPricesBtn.style.opacity = "1";
    refreshPricesBtn.disabled = false;
  }
};

// Calculate herb run profit using cached prices
const calcRunProfit = () => {
  try {
    const selectedHerbPrices = getSelectedHerbPrices();

    // If no cached prices and not loading, don't show anything
    if (!selectedHerbPrices || !selectedHerbPrices.seedPrice || !selectedHerbPrices.herbPrice) {
      if (!isLoadingPrices) {
        console.log("Prices not loaded yet");
        mainContent.style.display = "none";
      }
      return;
    }

    const patchCount = parseInt(patchCountInput.value);
    const herbCount = parseInt(herbCountInput.value);

    if (isNaN(patchCount) || isNaN(herbCount)) {
      mainContent.style.display = "none";
      return;
    }

    const seedCost = patchCount * selectedHerbPrices.seedPrice;
    const harvestValue = herbCount * selectedHerbPrices.herbPrice;
    const herbRunProfit = harvestValue - seedCost;

    document.getElementById("harvest-count").textContent = herbCount;
    document.getElementById("patch-count").textContent = patchCount;

    const profitAmountElement = document.getElementById("profit-amount");
    profitAmountElement.textContent = herbRunProfit.toLocaleString("en-US");

    // Apply color styling based on profit/loss
    if (herbRunProfit < 0) {
      profitAmountElement.style.color = "var(--ctp-macchiato-red)";
    } else {
      profitAmountElement.style.color = "var(--ctp-macchiato-green)";
    }

    mainContent.style.display = "block";
  } catch (error) {
    console.error("Error calculating profit:", error);
    mainContent.style.display = "none";
  }
};

// Initialize the app
const init = async () => {
  parseHerbData();
  populateHerbDropdown();
  loadSelectedHerb();
  updateHerbNameDisplay();
  updatePriceDisplays(); // Show loading state initially
  addEventListeners();

  // Display version
  const versionElement = document.getElementById("version-display");
  if (versionElement) {
    versionElement.textContent = `v${VERSION}`;
  }

  await fetchAndCachePrices();
};

// Modal functionality
const initModal = () => {
  const modal = document.getElementById("profitModal");
  const profitInfoIcon = document.getElementById("profitInfoIcon");
  const closeModal = document.getElementById("closeModal");

  // Open modal when info icon is clicked
  profitInfoIcon.addEventListener("click", () => {
    modal.style.display = "block";
  });

  // Close modal when X is clicked
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display === "block") {
      modal.style.display = "none";
    }
  });
};

// Start the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  init();
  initModal();
});
