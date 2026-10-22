/**
 * 商城商品数据（痕迹 Traces Shop）— 符纸系列。
 *
 * 图片来源：站主自摄（原图裁切 → 1200×1200 深底 → webp @ public/shop/talisman/）。
 * 价格：USD（网站面向海外）。改商品只需编辑本文件 + 放图。
 *
 * ⚠️ 合规约定（重要）：只描述「形制 + 工艺 + 传统名称/寓意」，
 *    绝不出现功效承诺（brings luck / guarantees fortune / cures 等）。
 *    这是支付通道（PayPal）与广告合规的硬要求。
 */

export type ShopCategory = "wealth" | "relation" | "protection" | "clearing" | "custom";

/** 子类别（同类合并展示）：把「同一个意思」的几款归到一组，避免看起来重复 */
export type ShopGroup =
  | "wealth-deity"
  | "career"
  | "marriage"
  | "social"
  | "wellbeing"
  | "warding"
  | "clearing"
  | "custom";

export const SHOP_GROUPS: Record<ShopGroup, { en: string; zh: string }> = {
  "wealth-deity": { en: "Wealth Deities", zh: "财神系" },
  career: { en: "Career & Rank", zh: "事业系" },
  marriage: { en: "Marriage & Love", zh: "姻缘系" },
  social: { en: "Social & Allies", zh: "人际系" },
  wellbeing: { en: "Wellbeing", zh: "护身系" },
  warding: { en: "Warding", zh: "辟邪系" },
  clearing: { en: "Clearing", zh: "化煞系" },
  custom: { en: "Made to Order", zh: "定制" },
};

/** 分组展示顺序 */
export const SHOP_GROUP_ORDER: ShopGroup[] = [
  "wealth-deity",
  "career",
  "marriage",
  "social",
  "wellbeing",
  "warding",
  "clearing",
  "custom",
];

export interface ShopProduct {
  id: string;
  image: string;
  price: number;
  name: string;
  nameZh: string;
  desc: string;
  descZh: string;
  category: ShopCategory;
  /** 子类别：同一子类别在页面上归成一组 */
  group: ShopGroup;
  /** 使用方式（海外买家不懂怎么用，必须写清楚） */
  usage: string;
  usageZh: string;
  badge?: "bestseller" | "premium" | "new";
}

/** 分类顺序即前台展示顺序 */
export const SHOP_CATEGORIES: ShopCategory[] = [
  "wealth",
  "relation",
  "protection",
  "clearing",
  "custom",
];

const TALISMAN_DESC_EN =
  "Hand-drawn cinnabar talisman on traditional yellow paper. Each piece is brushed by hand, so brushwork and tone vary slightly.";
const TALISMAN_DESC_ZH =
  "传统黄纸朱砂手绘，笔迹与色泽逐张略有差异，属手工常态。";
const USAGE_EN =
  "Keep it flat and dry. Fold and carry it in a wallet or pouch, or place it in a drawer — avoid water, fire and direct sunlight.";
const USAGE_ZH =
  "平放保存，避免水、火与阳光直射。可折叠后放入钱包或随身小袋，也可平放于抽屉中。";

export const SHOP_PRODUCTS: ShopProduct[] = [
  // ---------------------------------------------------------------- 财运事业
  {
    id: "caishen",
    image: "/shop/talisman/caishen.webp",
    price: 66,
    name: "Wealth Deity Talisman",
    nameZh: "财神符",
    desc: `${TALISMAN_DESC_EN} The wealth-deity motif is one of the most common in Chinese folk paper charms.`,
    descZh: `${TALISMAN_DESC_ZH}财神符文，是民间流传最广的符样之一。`,
    category: "wealth",
    group: "wealth-deity",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
    badge: "bestseller",
  },
  {
    id: "piancai",
    image: "/shop/talisman/piancai.webp",
    price: 66,
    name: "Windfall Talisman",
    nameZh: "偏财符",
    desc: `${TALISMAN_DESC_EN} The "windfall" (pian cai) motif differs from the wealth-deity charm in its seal script and layout.`,
    descZh: `${TALISMAN_DESC_ZH}偏财符文，与财神符的符箓结构与布局不同。`,
    category: "wealth",
    group: "wealth-deity",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "qingcaishen",
    image: "/shop/talisman/qingcaishen.webp",
    price: 66,
    name: "Invitation to the Wealth Deity",
    nameZh: "请财神符",
    desc: `${TALISMAN_DESC_EN} A "welcoming" variant of the wealth-deity charm, traditionally used when setting up a home or shop altar.`,
    descZh: `${TALISMAN_DESC_ZH}「请财神」符样，传统上用于安宅、开张等场合。`,
    category: "wealth",
    group: "wealth-deity",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "shengguan",
    image: "/shop/talisman/shengguan.webp",
    price: 66,
    name: "Promotion Talisman",
    nameZh: "升官符",
    desc: `${TALISMAN_DESC_EN} The "rising rank" (sheng guan) motif — an old stationery-style charm once kept in scholar-officials' desks.`,
    descZh: `${TALISMAN_DESC_ZH}升官符文，旧时读书人与仕宦案头的符样。`,
    category: "wealth",
    group: "career",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "shiye",
    image: "/shop/talisman/shiye.webp",
    price: 66,
    name: "Career Talisman",
    nameZh: "事业符",
    desc: `${TALISMAN_DESC_EN} A straightforward career-themed charm: bold central script with a seal-block base.`,
    descZh: `${TALISMAN_DESC_ZH}事业主题符样，中央大字、底部印篆，形制端正。`,
    category: "wealth",
    group: "career",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "shiye-hehe",
    image: "/shop/talisman/shiye-hehe.webp",
    price: 66,
    name: "Workplace Harmony Talisman",
    nameZh: "事业和合符",
    desc: `${TALISMAN_DESC_EN} A "harmony at work" variant — traditionally kept by people navigating difficult colleagues.`,
    descZh: `${TALISMAN_DESC_ZH}事业和合符样，旧时多用于期望同事关系顺遂的场合。`,
    category: "wealth",
    group: "career",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },

  // ---------------------------------------------------------------- 姻缘人际
  {
    id: "hehe",
    image: "/shop/talisman/hehe.webp",
    price: 66,
    name: "Harmony Union Talisman",
    nameZh: "和合符",
    desc: `${TALISMAN_DESC_EN} The "he he" (harmonious union) motif, one of the classic pair-charm designs in Daoist paper arts.`,
    descZh: `${TALISMAN_DESC_ZH}和合符文，道家纸符中常见的「成双」类符样。`,
    category: "relation",
    group: "marriage",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
    badge: "bestseller",
  },
  {
    id: "baoyou-yinyuan",
    image: "/shop/talisman/baoyou-yinyuan.webp",
    price: 66,
    name: "Blessing of Marriage Talisman",
    nameZh: "保佑姻缘符",
    desc: `${TALISMAN_DESC_EN} A marriage-blessing charm with a lotus-seat motif at the base of the script.`,
    descZh: `${TALISMAN_DESC_ZH}姻缘类符样，符文底部带莲座纹。`,
    category: "relation",
    group: "marriage",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "zhan-taohua",
    image: "/shop/talisman/zhan-taohua.webp",
    price: 66,
    name: "Severing Unwanted Attachments",
    nameZh: "斩桃花符",
    desc: `${TALISMAN_DESC_EN} The "cutting the peach blossom" motif — in folk practice, for closing off unwanted romantic entanglements.`,
    descZh: `${TALISMAN_DESC_ZH}斩桃花符样，民间用于了断不必要的感情牵扯。`,
    category: "relation",
    group: "marriage",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "guiren",
    image: "/shop/talisman/guiren.webp",
    price: 66,
    name: "Benefactor Talisman",
    nameZh: "贵人符",
    desc: `${TALISMAN_DESC_EN} The "gui ren" (benefactor) motif — a charm about meeting the right people at the right time.`,
    descZh: `${TALISMAN_DESC_ZH}贵人符文，取「遇人得助」之意。`,
    category: "relation",
    group: "social",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
    badge: "bestseller",
  },
  {
    id: "fang-xiaoren",
    image: "/shop/talisman/fang-xiaoren.webp",
    price: 66,
    name: "Guarding Against Ill-Wishers",
    nameZh: "防小人符",
    desc: `${TALISMAN_DESC_EN} The "defend against the petty" (fang xiao ren) motif, traditionally carried in the workplace.`,
    descZh: `${TALISMAN_DESC_ZH}防小人符样，旧时多随身携带于职场场合。`,
    category: "relation",
    group: "social",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },

  // ---------------------------------------------------------------- 平安护身
  {
    id: "jiankang",
    image: "/shop/talisman/jiankang.webp",
    price: 66,
    name: "Wellness Talisman",
    nameZh: "健康符",
    desc: `${TALISMAN_DESC_EN} A wellness-themed charm; the brushwork is deliberately thin and steady.`,
    descZh: `${TALISMAN_DESC_ZH}健康类符样，笔势偏细而稳。`,
    category: "protection",
    group: "wellbeing",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "quxie",
    image: "/shop/talisman/quxie.webp",
    price: 66,
    name: "Warding-Off Charm",
    nameZh: "驱邪符",
    desc: `${TALISMAN_DESC_EN} A "qu xie" (warding) charm with a dense vertical seal script and a stamped seal at the foot.`,
    descZh: `${TALISMAN_DESC_ZH}驱邪符样，纵向符箓密集，符脚带印篆。`,
    category: "protection",
    group: "warding",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "qugui",
    image: "/shop/talisman/qugui.webp",
    price: 66,
    name: "Ghost-Warding Charm",
    nameZh: "驱鬼符",
    desc: `${TALISMAN_DESC_EN} A folk "ghost-warding" design, kept for its traditional motif rather than any practical claim.`,
    descZh: `${TALISMAN_DESC_ZH}民间驱鬼符样，取其传统形制与纹样。`,
    category: "protection",
    group: "warding",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },

  // ---------------------------------------------------------------- 化煞转运
  {
    id: "baijie",
    image: "/shop/talisman/baijie.webp",
    price: 66,
    name: "Hundred Resolutions Talisman",
    nameZh: "百解符咒",
    desc: `${TALISMAN_DESC_EN} The "hundred resolutions" (bai jie) charm — traditionally used for disputes and legal matters.`,
    descZh: `${TALISMAN_DESC_ZH}百解符咒，传统上用于化解口舌官非类事。`,
    category: "clearing",
    group: "clearing",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },
  {
    id: "zhuanyun",
    image: "/shop/talisman/zhuanyun.webp",
    price: 66,
    name: "Turning-Fortune Talisman",
    nameZh: "转运符",
    desc: `${TALISMAN_DESC_EN} The "zhuan yun" (turn of fortune) motif, with a long flowing script and a seal at the base.`,
    descZh: `${TALISMAN_DESC_ZH}转运符样，符箓线条绵长，符脚收于印篆。`,
    category: "clearing",
    group: "clearing",
    usage: USAGE_EN,
    usageZh: USAGE_ZH,
  },

  // ---------------------------------------------------------------- 私人定制
  {
    id: "custom",
    image: "/shop/talisman/custom.webp",
    price: 99,
    name: "Custom Talisman",
    nameZh: "私人定制符",
    desc:
      "A talisman brushed to order: you choose the name and the intention, we write it in cinnabar on traditional yellow paper. Hand-brushed one at a time; please allow a few days before shipping.",
    descZh:
      "按需手绘：由你提供姓名与所请之事，以朱砂手书于传统黄纸之上。逐张手绘，出货需数个工作日。",
    category: "custom",
    group: "custom",
    usage:
      "After ordering, reply to the order email with the name and the wording you want on the charm. Keep the finished piece flat and dry, away from water and fire.",
    usageZh:
      "下单后请回复订单邮件，注明姓名与需要书写的内容。成品请平放保存，避水避火。",
    badge: "new",
  },
];
