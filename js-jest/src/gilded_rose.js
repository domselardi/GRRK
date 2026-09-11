class Item {
  constructor(name, sellIn, quality){
    this.name = name;
    this.sellIn = sellIn;
    this.quality = quality;
  }
}

// The inn's product catalog: the category of every product the inn sells, normal ones included
const CATALOG = require('./catalog.json');

// Every category describes how the quality of its products changes each day:
//   qualityChange           change per day, doubled once the sell-by date has passed
//   whenDaysLeft            (optional) a different change when few days are left, listed far to near
//   dropsToZeroAfterSellBy  (optional) quality becomes 0 once the sell-by date has passed
//   neverChanges            (optional) sellIn and quality never change
const CATEGORIES = {
  legendary: {
    neverChanges: true,
  },
  aged: {
    qualityChange: +1,
  },
  backstagePasses: {
    qualityChange: +1,
    whenDaysLeft: [{ atMost: 10, qualityChange: +2 }, { atMost: 5, qualityChange: +3 }],
    dropsToZeroAfterSellBy: true,
  },
  normal: {
    qualityChange: -1,
  },
  conjured: {
    qualityChange: -2,   // twice as fast as normal
  },
};

// Quality never goes above 50 or below 0
const limit = quality => Math.min(50, Math.max(0, quality));

// Today's change: the closest "days left" rule wins (5 days left -> +3), otherwise the usual change
function qualityChangeFor(category, daysLeft) {
  const match = (category.whenDaysLeft ?? []).findLast(rule => daysLeft <= rule.atMost);
  return match ? match.qualityChange : category.qualityChange;
}

function updateItem(item, category) {
  if (category.neverChanges) return;

  const change = qualityChangeFor(category, item.sellIn);   // based on the days left before today ends
  item.sellIn -= 1;
  const sellByPassed = item.sellIn < 0;

  if (sellByPassed && category.dropsToZeroAfterSellBy) item.quality = 0;
  else item.quality = limit(item.quality + (sellByPassed ? 2 * change : change));
}

// Product names are compared by their letters and digits only: casing, spaces, commas, accents
// and other marks don't count. "SULFURAS, Hand of Ragnaros!" finds "Sulfuras, Hand of Ragnaros".
const searchKey = name => name.normalize('NFD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// The catalog, ready to search by search key.
// Two products that only differ in casing or marks would clash, so that is an error.
function searchableCatalog(catalog) {
  const names = Object.keys(catalog);
  const keys = names.map(searchKey);
  const clash = names.find((name, index) => keys.indexOf(keys[index]) !== index);   // same key seen earlier
  if (clash !== undefined) throw new Error(`The catalog lists "${clash}" twice (casing and marks are ignored)`);
  return new Map(names.map((name, index) => [keys[index], catalog[name]]));
}

class Shop {
  constructor(items=[], catalog=CATALOG){
    this.items = items;
    this.catalog = searchableCatalog(catalog);
  }
  updateQuality() {
    this.items.forEach(item => updateItem(item, this.categoryOf(item.name)));
    return this.items;
  }
  // Every product must be in the catalog
  categoryOf(productName) {
    const key = searchKey(productName);
    if (!this.catalog.has(key)) throw new Error(`Product "${productName}" is not in the catalog`);
    const categoryName = this.catalog.get(key);
    if (!Object.hasOwn(CATEGORIES, categoryName)) throw new Error(`Unknown category "${categoryName}" for "${productName}"`);
    return CATEGORIES[categoryName];
  }
}

module.exports = {
  Item,
  Shop
}
