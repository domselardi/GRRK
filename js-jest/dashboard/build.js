// Builds the dashboard data and opens the dashboard in the browser: npm run dashboard
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { Shop, Item } = require("../src/gilded_rose");
const CATALOG = require("../src/catalog.json");

const DAYS = 30;

// Same inventory as test/texttest_fixture.js
const INVENTORY = [
  new Item("+5 Dexterity Vest", 10, 20),
  new Item("Aged Brie", 2, 0),
  new Item("Elixir of the Mongoose", 5, 7),
  new Item("Sulfuras, Hand of Ragnaros", 0, 80),
  new Item("Sulfuras, Hand of Ragnaros", -1, 80),
  new Item("Backstage passes to a TAFKAL80ETC concert", 15, 20),
  new Item("Backstage passes to a TAFKAL80ETC concert", 10, 49),
  new Item("Backstage passes to a TAFKAL80ETC concert", 5, 49),
  new Item("Conjured Mana Cake", 3, 6),
];

// Turns the shop's timeline into the one set of data that every chart on the dashboard uses
function buildDashboardData(timeline, categories) {
  const days = timeline.map((_, day) => day);
  const items = timeline[0].map((start, i) => {
    const quality = timeline.map(snapshot => snapshot[i].quality);
    const qualityChange = quality.map((value, day) => (day === 0 ? null : value - quality[day - 1]));
    return {
      label: `${start.name} (${start.sellIn}, ${start.quality})`,   // starting values tell look-alike items apart
      category: categories[i],
      quality,
      sellIn: timeline.map(snapshot => snapshot[i].sellIn),
      qualityChange,
      ruleChanges: ruleChangesOf(qualityChange),
    };
  });
  return { days, items };
}

// A different rule took over on a day when the item's quality change differs from the day before
function ruleChangesOf(qualityChange) {
  return qualityChange
    .map((after, day) => ({ day, before: qualityChange[day - 1], after }))
    .filter(change => change.day >= 2 && change.after !== change.before);
}

// Opens a file in the default browser on macOS, Windows or Linux
function openInBrowser(file) {
  const command = { darwin: "open", win32: 'start ""' }[process.platform] ?? "xdg-open";
  exec(`${command} "${file}"`);
}

// Runs only as a command (npm run dashboard), not when a test imports this file
if (require.main === module) {
  const shop = new Shop(INVENTORY);
  for (let day = 1; day <= DAYS; day++) shop.updateQuality();

  // The categories only color the charts; these items use the catalog's exact names
  const data = buildDashboardData(shop.timeline, INVENTORY.map(item => CATALOG[item.name]));
  fs.writeFileSync(path.join(__dirname, "data.js"), `const DASHBOARD_DATA = ${JSON.stringify(data)};\n`);

  const page = path.join(__dirname, "index.html");
  console.log(`Dashboard ready: ${page}`);
  if (!process.argv.includes("--no-open")) openInBrowser(page);
}

module.exports = { buildDashboardData };
