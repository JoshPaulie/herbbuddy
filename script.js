"use strict";

const RANARR_SEED_ID = 5295;
const RANARR_HERB_ID = 257;

let typingTimer;
const doneTypingInterval = 800; // milliseconds

const herbCountInput = document.getElementById("herbCountInput");
const patchCountInput = document.getElementById("patchCountInput");
const mainContent = document.getElementById("main-content");

herbCountInput.addEventListener("input", function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(calcRunProfit, doneTypingInterval);
});

patchCountInput.addEventListener("input", function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(calcRunProfit, doneTypingInterval);
});

const calcRunProfit = () => {
  getAvgItemPrice(RANARR_SEED_ID, RANARR_HERB_ID)
    .then((prices) => {
      const [ranarrSeedPrice, ranarrHerbPrice] = prices;

      let patchCount = parseInt(patchCountInput.value);
      let herbCount = parseInt(herbCountInput.value);

      let seedCost = patchCount * ranarrSeedPrice;
      let harvestValue = herbCount * ranarrHerbPrice;
      let herbRunProfit = harvestValue - seedCost;

      document.getElementById("harvest-count").textContent = herbCount;
      document.getElementById("patch-count").textContent = patchCount;
      document.getElementById("profit-amount").textContent = herbRunProfit.toLocaleString("en-US");

      mainContent.style.display = "block";
      if (isNaN(herbCount) | isNaN(patchCount) | isNaN(herbRunProfit)) {
        mainContent.style.display = "none";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};

const extractPrices = (data, id) => {
  const high_price = data["data"][id]["high"];
  const low_price = data["data"][id]["low"];
  return { high_price, low_price };
};

const calcAveragePrice = (high_price, low_price) => {
  return Math.round((high_price + low_price) / 2);
};

const getAvgItemPrice = async (seedID, herbID) => {
  try {
    const data = await fetchData("https://prices.runescape.wiki/api/v1/osrs/latest");

    const { high_price: seed_high_price, low_price: seed_low_price } = extractPrices(data, seedID);
    const { high_price: herb_high_price, low_price: herb_low_price } = extractPrices(data, herbID);

    const seedPrice = calcAveragePrice(seed_high_price, seed_low_price);
    const herbPrice = calcAveragePrice(herb_high_price, herb_low_price);

    return [seedPrice, herbPrice];
  } catch (error) {
    console.error("Error:", error);
  }
};
