const { execFileSync } = require("child_process");
const path = require("path");
const {Shop, Item} = require("../src/gilded_rose");

const BRIE = "Aged Brie";
const SULFURAS = "Sulfuras, Hand of Ragnaros";
const PASSES = "Backstage passes to a TAFKAL80ETC concert";

// Runs one day for a single item and returns the item afterwards
function afterOneDay(name, sellIn, quality) {
  const gildedRose = new Shop([new Item(name, sellIn, quality)]);
  return gildedRose.updateQuality()[0];
}

describe("Gilded Rose", function() {
  describe("normal items", function() {
    it("lower sellIn and quality by 1 each day", function() {
      expect(afterOneDay("Elixir", 5, 10)).toMatchObject({ sellIn: 4, quality: 9 });
    });

    it("lose quality twice as fast once the sell-by date has passed", function() {
      expect(afterOneDay("Elixir", 0, 10)).toMatchObject({ sellIn: -1, quality: 8 });
    });

    it("never have negative quality", function() {
      expect(afterOneDay("Elixir", 5, 0).quality).toBe(0);
      expect(afterOneDay("Elixir", 0, 1).quality).toBe(0);
    });
  });

  describe("Aged Brie", function() {
    it("gains 1 quality each day", function() {
      expect(afterOneDay(BRIE, 5, 10)).toMatchObject({ sellIn: 4, quality: 11 });
    });

    it("gains 2 quality once the sell-by date has passed", function() {
      expect(afterOneDay(BRIE, 0, 10)).toMatchObject({ sellIn: -1, quality: 12 });
    });

    it("never goes above 50 quality", function() {
      expect(afterOneDay(BRIE, 5, 50).quality).toBe(50);
      expect(afterOneDay(BRIE, 0, 49).quality).toBe(50);
    });
  });

  describe("Sulfuras", function() {
    it("never has to be sold and never changes quality", function() {
      expect(afterOneDay(SULFURAS, 0, 80)).toMatchObject({ sellIn: 0, quality: 80 });
      expect(afterOneDay(SULFURAS, -1, 80)).toMatchObject({ sellIn: -1, quality: 80 });
    });
  });

  describe("Backstage passes", function() {
    it("gain 1 quality when there are more than 10 days left", function() {
      expect(afterOneDay(PASSES, 11, 20)).toMatchObject({ sellIn: 10, quality: 21 });
    });

    it("gain 2 quality when there are 10 days or less", function() {
      expect(afterOneDay(PASSES, 10, 20).quality).toBe(22);
      expect(afterOneDay(PASSES, 6, 20).quality).toBe(22);
    });

    it("gain 3 quality when there are 5 days or less", function() {
      expect(afterOneDay(PASSES, 5, 20).quality).toBe(23);
      expect(afterOneDay(PASSES, 1, 20).quality).toBe(23);
    });

    it("drop to 0 quality after the concert", function() {
      expect(afterOneDay(PASSES, 0, 20)).toMatchObject({ sellIn: -1, quality: 0 });
    });

    it("never go above 50 quality", function() {
      expect(afterOneDay(PASSES, 10, 49).quality).toBe(50);
      expect(afterOneDay(PASSES, 5, 49).quality).toBe(50);
    });
  });

  it("works with an empty shop", function() {
    expect(new Shop().updateQuality()).toEqual([]);
  });

  // Saves the full 30-day fixture report, so any change in behavior shows up as a diff
  it("prints the same 30-day report", function() {
    const fixture = path.join(__dirname, "texttest_fixture.js");
    const report = execFileSync("node", [fixture, "30"], { encoding: "utf8" });
    expect(report).toMatchSnapshot();
  });
});
