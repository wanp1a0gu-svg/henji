/**
 * 商城商品数据（痕迹 Traces Shop）。
 *
 * 图片来源：自有店铺商品图（已裁剪压缩为 webp @ public/shop/）。
 * 价格：USD（网站面向海外）。改商品只需编辑本文件 + 放图到 public/shop/。
 *
 * ⚠️ 表述约定：只做"材质 + 工艺 + 文化寓意"描述，避免任何功效承诺
 * （如 "brings luck / guaranteed fortune"），符合支付通道与广告合规。
 */

export interface ShopProduct {
  id: string;
  image: string;
  price: number;
  name: string;
  nameZh: string;
  desc: string;
  descZh: string;
  badge?: "bestseller" | "premium" | "new";
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "amber-bracelet",
    image: "/shop/amber-bracelet.webp",
    price: 0.01,
    name: "Red Amber Multi-Loop Bracelet",
    nameZh: "天然血珀多圈手串",
    desc:
      "Three loops of 7mm natural red amber beads with hand-set floral charms — warm, luminous, quietly grounding.",
    descZh: "天然净水血珀与花珀三圈设计，配花丝金饰，温润通透。",
    badge: "bestseller",
  },
  {
    id: "multigem-bracelet",
    image: "/shop/multigem-bracelet.webp",
    price: 0.01,
    name: "Multigem Harmony Bracelet",
    nameZh: "【万物生】多宝手串",
    desc:
      "Five precious stones in one strand — honey amber, South Red agate, amethyst, Hetian jade and lapis lazuli, linked with gold-plated accents.",
    descZh: "蜜蜡、南红、紫晶石、和田玉、青金石五宝成串，配鎏金饰件。",
    badge: "premium",
  },
  {
    id: "fox-pendant",
    image: "/shop/fox-pendant.webp",
    price: 0.01,
    name: "Nine-Tailed Fox Crystal Pendant",
    nameZh: "九尾狐白水晶吊坠",
    desc:
      "Clear quartz carved as the nine-tailed fox — a Chinese symbol of wisdom and transformation — on a beaded chain.",
    descZh: "白水晶精雕九尾狐（智慧与蜕变的东方意象），配白水晶珠链。",
    badge: "new",
  },
  {
    id: "jade-leaf-pendant",
    image: "/shop/jade-leaf-pendant.webp",
    price: 0.01,
    name: "Hetian Jade Leaf Pendant",
    nameZh: "和田玉冰透满绿叶子吊坠",
    desc:
      "Icy green Hetian jade in the classic leaf shape, set in S925 silver with gold plating. Jade has symbolized purity and protection in China for millennia.",
    descZh: "冰透满绿和田玉叶子，S925 银镀金镶嵌。玉，中国千年以来的温润之石。",
    badge: "bestseller",
  },
  {
    id: "amber-pendant",
    image: "/shop/amber-pendant.webp",
    price: 0.01,
    name: "Royal Amber Statement Pendant",
    nameZh: "天然血珀重工大吊坠",
    desc:
      "A single deep-red amber bead crowned in ornate gold-plated filigree — a bold statement piece.",
    descZh: "天然血珀大珠，重工鎏金吊扣，气场十足。",
    badge: "premium",
  },
  {
    id: "amethyst-bracelet",
    image: "/shop/amethyst-bracelet.webp",
    price: 0.01,
    name: "Amethyst & Quartz Bracelet",
    nameZh: "【紫梦星河】紫水晶多宝手串",
    desc:
      "Alternating amethyst and clear quartz with carved rose accents — a soft, dreamy palette.",
    descZh: "天然紫水晶与白水晶交替成串，雕花点缀，梦幻柔和。",
    badge: "new",
  },
];
