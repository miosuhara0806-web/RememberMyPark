/* 画像、タップ領域、復活範囲はここで調整します。座標は画像全体に対する百分率。 */
window.PARK_CONFIG = {
  images: {
    before: "assets/maps/park-before.png",
    after: "assets/maps/park-after.png",
    fallbackBefore: "assets/maps/placeholder-before.svg",
    fallbackAfter: "assets/maps/placeholder-after.svg"
  },
  guide: {
    image: "assets/characters/star-bunny-base.png",
    alt: "基本衣装の星うさぎ",
    message: "まだ眠っている乗り物があるよ。どこから直してみようか？",
    restoredMessage: "わあ……！ 遊園地にあかりが戻ったよ！ ぼく、またここでみんなと遊べるんだね！"
  },
  ending: {
    // 夜景の専用イラストが届いたら、この1か所に相対パスを指定。
    // 未指定・読み込み失敗時は、正式な復活後マップを使用する。
    image: null,
    paragraphs: [
      "忘れられていた遊園地に、もう一度あかりが灯りました。",
      "木馬たちが回り、観覧車が空を彩り、小さな列車が走り出します。",
      "ここにある思い出は、これからも続いていくのでしょう。"
    ],
    message: "ありがとう！ ぼく、この遊園地が大好きなんだ。これからも、ずっと！"
  },
  attractions: [
    {
      id: "carousel", name: "メリーゴーランド", english: "MERRY-GO-ROUND", number: "01",
      description: "くるくる巡る、小さな夢の記憶。", icon: "carousel",
      guide: {
        image: "assets/characters/star-bunny-carousel.png",
        alt: "メリーゴーランド衣装の星うさぎ",
        message: "この木馬たち、みんなお気に入りの飾りがあったんだ。一緒に思い出してくれる？"
      },
      hotspot: { x: 27, y: 37, width: 31, height: 35 },
      restoration: { x: 26, y: 35, radiusX: 29, radiusY: 37 }
    },
    {
      id: "ferris-wheel", name: "観覧車", english: "FERRIS WHEEL", number: "02",
      description: "空にいちばん近い場所で、また会おう。", icon: "wheel",
      guide: {
        image: "assets/characters/star-bunny-ferris-wheel.png",
        alt: "観覧車衣装の星うさぎ",
        message: "ゴンドラの並び方が分からなくなっちゃったの。もとの場所に戻してあげよう？"
      },
      hotspot: { x: 74, y: 31, width: 29, height: 46 },
      restoration: { x: 75, y: 31, radiusX: 28, radiusY: 42 }
    },
    {
      id: "mini-train", name: "ミニトレイン", english: "MINI TRAIN", number: "03",
      description: "思い出を乗せて、ゆっくり走り出す。", icon: "train",
      guide: {
        image: "assets/characters/star-bunny-train.png",
        alt: "ミニトレイン衣装の星うさぎ",
        message: "しゅっぱーつ！ ……って言いたいんだけどね。線路がバラバラになっちゃったの！"
      },
      hotspot: { x: 76, y: 76, width: 35, height: 28 },
      restoration: { x: 76, y: 77, radiusX: 34, radiusY: 30 }
    }
  ]
};
