"use strict";

const getAvgItemPrice = async (seedID, herbID) => {
  try {
    const response = await fetch("https://prices.runescape.wiki/api/v1/osrs/latest");
    const data = await response.json();
    const herb_high_price = data["data"][herbID]["high"];
    const herb_low_price = data["data"][herbID]["low"];
    const seed_high_price = data["data"][seedID]["high"];
    const seed_low_price = data["data"][seedID]["low"];

    const herbPrice = Math.round((herb_high_price + herb_low_price) / 2);
    const seedPrice = Math.round((seed_high_price + seed_low_price) / 2);

    return [seedPrice, herbPrice];
  } catch (error) {
    console.error("Error:", error);
  }
};

const RANARR_SEED_ID = 5295;
const RANARR_HERB_ID = 257;

let typingTimer;
const doneTypingInterval = 800; // 800 milliseconds

const herbCountInput = document.getElementById("herbCountInput");

herbCountInput.addEventListener("input", function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(calcRunProfit, doneTypingInterval);
});

const calcRunProfit = () => {
  getAvgItemPrice(RANARR_SEED_ID, RANARR_HERB_ID)
    .then((prices) => {
      const [ranarrSeedPrice, ranarrHerbPrice] = prices;
      // Calculations
      let patchCount = 8; // ! Will be user in
      let herbCount = parseInt(herbCountInput.value); // ! Will be user in

      let seedCost = patchCount * ranarrSeedPrice;
      let harvestValue = herbCount * ranarrHerbPrice;
      let herbRunProfit = harvestValue - seedCost;
      console.log(herbRunProfit.toLocaleString("en-US"));

      document.getElementById("harvest-count").textContent = herbCount;
      document.getElementById("profit-amount").textContent = herbRunProfit.toLocaleString("en-US");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};
