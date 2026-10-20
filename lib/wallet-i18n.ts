import { Locale } from "./i18n";

/**
 * 钱包（余额）相关文案：账户页的余额卡 + 流水列表。
 * 后台管理面板是中文界面，不走这里。
 */
export interface WalletMessages {
  /** 区块小标题（大写风格） */
  eyebrow: string;
  title: string;
  /** "可用余额" */
  balanceLabel: string;
  /** 余额旁边的单位说明 */
  currencyNote: string;
  /** 交易记录标题 */
  transactionsTitle: string;
  empty: string;
  emptyHint: string;
  loading: string;
  loadError: string;
  /** 流水类型 */
  kindGrant: string;
  kindAdjust: string;
  kindPurchase: string;
  /** "余额"快照前缀 */
  balanceAfter: string;
}

const walletMessages: Record<Locale, WalletMessages> = {
  en: {
    eyebrow: "WALLET",
    title: "My Balance",
    balanceLabel: "Available balance",
    currencyNote: "USD · usable across the site",
    transactionsTitle: "Transactions",
    empty: "No transactions yet",
    emptyHint: "Recharges and purchases will appear here.",
    loading: "Loading…",
    loadError: "Failed to load wallet",
    kindGrant: "Top-up",
    kindAdjust: "Adjustment",
    kindPurchase: "Purchase",
    balanceAfter: "Balance",
  },
  zh: {
    eyebrow: "钱包",
    title: "我的余额",
    balanceLabel: "可用余额",
    currencyNote: "USD · 全站通用",
    transactionsTitle: "交易记录",
    empty: "还没有交易记录",
    emptyHint: "充值和消费都会记在这里。",
    loading: "加载中…",
    loadError: "钱包加载失败",
    kindGrant: "充值 / 赠送",
    kindAdjust: "金额调整",
    kindPurchase: "消费",
    balanceAfter: "余额",
  },
  ja: {
    eyebrow: "ウォレット",
    title: "残高",
    balanceLabel: "利用可能残高",
    currencyNote: "USD · サイト内で共通利用",
    transactionsTitle: "取引履歴",
    empty: "取引履歴はまだありません",
    emptyHint: "チャージと購入がここに表示されます。",
    loading: "読み込み中…",
    loadError: "ウォレットの読み込みに失敗しました",
    kindGrant: "チャージ / 付与",
    kindAdjust: "調整",
    kindPurchase: "購入",
    balanceAfter: "残高",
  },
  ko: {
    eyebrow: "지갑",
    title: "내 잔액",
    balanceLabel: "사용 가능 잔액",
    currencyNote: "USD · 사이트 전체에서 사용",
    transactionsTitle: "거래 내역",
    empty: "거래 내역이 없습니다",
    emptyHint: "충전과 결제 내역이 여기에 표시됩니다.",
    loading: "불러오는 중…",
    loadError: "지갑을 불러오지 못했습니다",
    kindGrant: "충전 / 지급",
    kindAdjust: "조정",
    kindPurchase: "결제",
    balanceAfter: "잔액",
  },
  es: {
    eyebrow: "CARTERA",
    title: "Mi saldo",
    balanceLabel: "Saldo disponible",
    currencyNote: "USD · válido en todo el sitio",
    transactionsTitle: "Movimientos",
    empty: "Aún no hay movimientos",
    emptyHint: "Las recargas y compras aparecerán aquí.",
    loading: "Cargando…",
    loadError: "No se pudo cargar la cartera",
    kindGrant: "Recarga / regalo",
    kindAdjust: "Ajuste",
    kindPurchase: "Compra",
    balanceAfter: "Saldo",
  },
  fr: {
    eyebrow: "PORTEFEUILLE",
    title: "Mon solde",
    balanceLabel: "Solde disponible",
    currencyNote: "USD · utilisable sur tout le site",
    transactionsTitle: "Transactions",
    empty: "Aucune transaction pour l'instant",
    emptyHint: "Les recharges et les achats apparaîtront ici.",
    loading: "Chargement…",
    loadError: "Impossible de charger le portefeuille",
    kindGrant: "Recharge / offert",
    kindAdjust: "Ajustement",
    kindPurchase: "Achat",
    balanceAfter: "Solde",
  },
  de: {
    eyebrow: "GUTHABEN",
    title: "Mein Guthaben",
    balanceLabel: "Verfügbares Guthaben",
    currencyNote: "USD · gültig für die ganze Website",
    transactionsTitle: "Transaktionen",
    empty: "Noch keine Transaktionen",
    emptyHint: "Aufladungen und Käufe erscheinen hier.",
    loading: "Wird geladen…",
    loadError: "Guthaben konnte nicht geladen werden",
    kindGrant: "Aufladung / Geschenk",
    kindAdjust: "Anpassung",
    kindPurchase: "Kauf",
    balanceAfter: "Guthaben",
  },
  pt: {
    eyebrow: "CARTEIRA",
    title: "Meu saldo",
    balanceLabel: "Saldo disponível",
    currencyNote: "USD · válido em todo o site",
    transactionsTitle: "Transações",
    empty: "Nenhuma transação ainda",
    emptyHint: "Recargas e compras aparecerão aqui.",
    loading: "Carregando…",
    loadError: "Falha ao carregar a carteira",
    kindGrant: "Recarga / bônus",
    kindAdjust: "Ajuste",
    kindPurchase: "Compra",
    balanceAfter: "Saldo",
  },
  ru: {
    eyebrow: "КОШЕЛЁК",
    title: "Мой баланс",
    balanceLabel: "Доступный баланс",
    currencyNote: "USD · действует на всём сайте",
    transactionsTitle: "История операций",
    empty: "Операций пока нет",
    emptyHint: "Пополнения и покупки появятся здесь.",
    loading: "Загрузка…",
    loadError: "Не удалось загрузить кошелёк",
    kindGrant: "Пополнение / бонус",
    kindAdjust: "Корректировка",
    kindPurchase: "Покупка",
    balanceAfter: "Баланс",
  },
  ar: {
    eyebrow: "المحفظة",
    title: "رصيدي",
    balanceLabel: "الرصيد المتاح",
    currencyNote: "دولار أمريكي · صالح في كل الموقع",
    transactionsTitle: "سجل المعاملات",
    empty: "لا توجد معاملات بعد",
    emptyHint: "ستظهر عمليات الشحن والشراء هنا.",
    loading: "جارٍ التحميل…",
    loadError: "تعذّر تحميل المحفظة",
    kindGrant: "شحن / منحة",
    kindAdjust: "تعديل",
    kindPurchase: "شراء",
    balanceAfter: "الرصيد",
  },
};

export function getWalletMessages(locale: Locale): WalletMessages {
  return walletMessages[locale] || walletMessages.en;
}
