/* 画像、タップ領域、復活範囲はここで調整します。座標は画像全体に対する百分率。 */
window.PARK_CONFIG = {
  images: {
    before: "assets/maps/park-before.png",
    after: "assets/maps/park-after.png",
    fallbackBefore: "assets/maps/placeholder-before.svg",
    fallbackAfter: "assets/maps/placeholder-after.svg"
  },
  attractions: [
    {
      id: "carousel", name: "メリーゴーランド", english: "MERRY-GO-ROUND", number: "01",
      description: "くるくる巡る、小さな夢の記憶。", icon: "carousel",
      hotspot: { x: 27, y: 37, width: 31, height: 35 },
      restoration: { x: 26, y: 35, radiusX: 29, radiusY: 37 }
    },
    {
      id: "ferris-wheel", name: "観覧車", english: "FERRIS WHEEL", number: "02",
      description: "空にいちばん近い場所で、また会おう。", icon: "wheel",
      hotspot: { x: 74, y: 31, width: 29, height: 46 },
      restoration: { x: 75, y: 31, radiusX: 28, radiusY: 42 }
    },
    {
      id: "mini-train", name: "ミニトレイン", english: "MINI TRAIN", number: "03",
      description: "思い出を乗せて、ゆっくり走り出す。", icon: "train",
      hotspot: { x: 76, y: 76, width: 35, height: 28 },
      restoration: { x: 76, y: 77, radiusX: 34, radiusY: 30 }
    }
  ]
};
