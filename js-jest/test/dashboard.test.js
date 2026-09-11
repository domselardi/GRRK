const {Shop, Item} = require("../src/gilded_rose");
const { buildDashboardData } = require("../dashboard/build");

// Runs a shop for some days and builds the dashboard data from its timeline
function dashboardDataAfter(days, items, categories) {
  const gildedRose = new Shop(items);
  for (let day = 1; day <= days; day++) gildedRose.updateQuality();
  return buildDashboardData(gildedRose.timeline, categories);
}

describe("Dashboard data", function() {
  it("keeps each item's history, one value per day", function() {
    const data = dashboardDataAfter(3, [new Item("Elixir of the Mongoose", 5, 10)], ["normal"]);
    expect(data.days).toEqual([0, 1, 2, 3]);
    expect(data.items[0]).toMatchObject({
      label: "Elixir of the Mongoose (5, 10)",
      category: "normal",
      quality: [10, 9, 8, 7],
      sellIn: [5, 4, 3, 2],
      qualityChange: [null, -1, -1, -1],
    });
  });

  it("finds the days a different rule took over", function() {
    const data = dashboardDataAfter(30, [new Item("Backstage passes to a TAFKAL80ETC concert", 15, 20)], ["backstagePasses"]);
    expect(data.items[0].ruleChanges).toEqual([
      { day: 6, before: 1, after: 2 },     // 10 days left: +2 a day
      { day: 11, before: 2, after: 3 },    // 5 days left: +3 a day
      { day: 16, before: 3, after: -50 },  // the concert is over: drops to 0
      { day: 17, before: -50, after: 0 },  // stays at 0
    ]);
  });
});
