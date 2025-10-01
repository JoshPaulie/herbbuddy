"use strict";

const RANARR_SEED_ID = 5295;
const RANARR_HERB_ID = 257;
const DONE_TYPING_INTERVAL = 800; // milliseconds

let typingTimer;

const herbCountInput = document.getElementById("herbCountInput");
const patchCountInput = document.getElementById("patchCountInput");
const mainContent = document.getElementById("main-content");

const addTypingListener = (element) => {
  element.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(calcRunProfit, DONE_TYPING_INTERVAL);
  });
};

addTypingListener(herbCountInput);
addTypingListener(patchCountInput);

const calcRunProfit = async () => {
  try {
    const [ranarrSeedPrice, ranarrHerbPrice] = await getAvgItemPrice(
      RANARR_SEED_ID,
      RANARR_HERB_ID,
    );

    const patchCount = parseInt(patchCountInput.value);
    const herbCount = parseInt(herbCountInput.value);

    if (isNaN(patchCount) || isNaN(herbCount)) {
      mainContent.style.display = "none";
      return;
    }

    const seedCost = patchCount * ranarrSeedPrice;
    const harvestValue = herbCount * ranarrHerbPrice;
    const herbRunProfit = harvestValue - seedCost;

    document.getElementById("harvest-count").textContent = herbCount;
    document.getElementById("patch-count").textContent = patchCount;
    document.getElementById("profit-amount").textContent =
      herbRunProfit.toLocaleString("en-US");

    mainContent.style.display = "block";
  } catch (error) {
    console.error("Error calculating profit:", error);
    mainContent.style.display = "none";
  }
};

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

const extractPrices = (data, id) => {
  const highPrice = data["data"][id]["high"];
  const lowPrice = data["data"][id]["low"];
  return { highPrice, lowPrice };
};

const calcAveragePrice = (highPrice, lowPrice) => {
  return Math.round((highPrice + lowPrice) / 2);
};

const getAvgItemPrice = async (seedID, herbID) => {
  try {
    const data = await fetchData(
      "https://prices.runescape.wiki/api/v1/osrs/latest",
    );

    const { highPrice: seedHighPrice, lowPrice: seedLowPrice } = extractPrices(
      data,
      seedID,
    );
    const { highPrice: herbHighPrice, lowPrice: herbLowPrice } = extractPrices(
      data,
      herbID,
    );

    const seedPrice = calcAveragePrice(seedHighPrice, seedLowPrice);
    const herbPrice = calcAveragePrice(herbHighPrice, herbLowPrice);

    return [seedPrice, herbPrice];
  } catch (error) {
    console.error("Error fetching item prices:", error);
    throw error;
  }
};
