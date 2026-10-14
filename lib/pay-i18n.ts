/**
 * PayPal 支付相关 UI 文案（10 语言）。
 */
import { Locale } from "./i18n";

export interface PayMessages {
  processing: string;
  success: string;
  error: string;
  unavailable: string;
  sandbox: string;
  baziNote: string;
  baziNeedPay: string;
  shopSuccess: string;
  loginToBuy: string;
}

const zh: PayMessages = {
  processing: "支付处理中…",
  success: "支付成功",
  error: "支付未完成，请重试。",
  unavailable: "支付通道配置中，即将开通。",
  sandbox: "沙盒测试模式",
  baziNote: "先填好左侧表单，再完成支付——付款成功后自动开始生成报告。",
  baziNeedPay: "请先完成 PayPal 支付，付款后将自动生成报告。",
  shopSuccess: "支付成功！我们将在 24 小时内通过邮件与你确认发货。",
  loginToBuy: "登录后即可购买",
};

const en: PayMessages = {
  processing: "Processing payment…",
  success: "Payment successful",
  error: "Payment was not completed — please try again.",
  unavailable: "Payments are being set up — coming very soon.",
  sandbox: "Sandbox test mode",
  baziNote: "Fill in the form first, then pay — your reading starts automatically right after payment.",
  baziNeedPay: "Please complete the PayPal payment first — your reading starts right after payment.",
  shopSuccess: "Payment received! We'll confirm shipping with you by email within 24 hours.",
  loginToBuy: "Sign in to purchase",
};

const ja: PayMessages = {
  processing: "お支払いを処理中…",
  success: "お支払いが完了しました",
  error: "お支払いが完了しませんでした。もう一度お試しください。",
  unavailable: "決済チャネルを準備中です。まもなくご利用いただけます。",
  sandbox: "サンドボックステストモード",
  baziNote: "フォーム入力後にお支払いください。決済完了後、鑑定レポートの生成が自動的に始まります。",
  baziNeedPay: "先に PayPal でのお支払いを完了してください。完了後すぐに鑑定が始まります。",
  shopSuccess: "お支払いありがとうございます！24 時間以内にメールで発送をご連絡します。",
  loginToBuy: "ログインして購入",
};

const ko: PayMessages = {
  processing: "결제 처리 중…",
  success: "결제가 완료되었습니다",
  error: "결제가 완료되지 않았습니다. 다시 시도해 주세요.",
  unavailable: "결제 채널을 준비 중입니다. 곧 오픈됩니다.",
  sandbox: "샌드박스 테스트 모드",
  baziNote: "양식을 먼저 작성한 뒤 결제하세요. 결제 완료 후 리포트 생성이 자동으로 시작됩니다.",
  baziNeedPay: "먼저 PayPal 결제를 완료해 주세요. 결제 후 바로 리포트가 생성됩니다.",
  shopSuccess: "결제해 주셔서 감사합니다! 24시간 이내에 이메일로 배송 안내를 드립니다.",
  loginToBuy: "로그인 후 구매",
};

const es: PayMessages = {
  processing: "Procesando el pago…",
  success: "Pago realizado correctamente",
  error: "El pago no se completó. Inténtalo de nuevo.",
  unavailable: "Estamos configurando los pagos — muy pronto disponibles.",
  sandbox: "Modo de prueba (sandbox)",
  baziNote: "Completa primero el formulario y luego paga — tu lectura comienza automáticamente tras el pago.",
  baziNeedPay: "Completa primero el pago con PayPal — tu lectura comienza justo después del pago.",
  shopSuccess: "¡Pago recibido! Te confirmaremos el envío por correo en un plazo de 24 horas.",
  loginToBuy: "Inicia sesión para comprar",
};

const fr: PayMessages = {
  processing: "Paiement en cours…",
  success: "Paiement réussi",
  error: "Le paiement n'a pas abouti — veuillez réessayer.",
  unavailable: "Les paiements sont en cours de configuration — bientôt disponibles.",
  sandbox: "Mode test (sandbox)",
  baziNote: "Remplissez d'abord le formulaire, puis payez — votre lecture démarre automatiquement après le paiement.",
  baziNeedPay: "Veuillez d'abord effectuer le paiement PayPal — votre lecture démarre juste après.",
  shopSuccess: "Paiement reçu ! Nous confirmerons l'expédition par e-mail sous 24 heures.",
  loginToBuy: "Connectez-vous pour acheter",
};

const de: PayMessages = {
  processing: "Zahlung wird verarbeitet…",
  success: "Zahlung erfolgreich",
  error: "Die Zahlung wurde nicht abgeschlossen — bitte erneut versuchen.",
  unavailable: "Die Zahlungsabwicklung wird eingerichtet — bald verfügbar.",
  sandbox: "Sandbox-Testmodus",
  baziNote: "Bitte zuerst das Formular ausfüllen, dann bezahlen — die Lesung startet automatisch nach der Zahlung.",
  baziNeedPay: "Bitte schließe zuerst die PayPal-Zahlung ab — danach startet die Lesung automatisch.",
  shopSuccess: "Zahlung erhalten! Wir bestätigen den Versand innerhalb von 24 Stunden per E-Mail.",
  loginToBuy: "Zum Kaufen anmelden",
};

const pt: PayMessages = {
  processing: "Processando o pagamento…",
  success: "Pagamento concluído",
  error: "O pagamento não foi concluído — tente novamente.",
  unavailable: "Os pagamentos estão sendo configurados — em breve disponíveis.",
  sandbox: "Modo de teste (sandbox)",
  baziNote: "Preencha primeiro o formulário e depois pague — sua leitura começa automaticamente após o pagamento.",
  baziNeedPay: "Complete primeiro o pagamento via PayPal — sua leitura começa logo após.",
  shopSuccess: "Pagamento recebido! Confirmaremos o envio por e-mail em até 24 horas.",
  loginToBuy: "Entre para comprar",
};

const ru: PayMessages = {
  processing: "Обработка платежа…",
  success: "Платёж успешно выполнен",
  error: "Платёж не завершён — попробуйте ещё раз.",
  unavailable: "Платежи настраиваются — скоро будут доступны.",
  sandbox: "Тестовый режим (sandbox)",
  baziNote: "Сначала заполните форму, затем оплатите — чтение запустится автоматически после оплаты.",
  baziNeedPay: "Сначала завершите оплату через PayPal — чтение начнётся сразу после оплаты.",
  shopSuccess: "Платёж получен! Мы подтвердим отправку по e-mail в течение 24 часов.",
  loginToBuy: "Войдите, чтобы купить",
};

const ar: PayMessages = {
  processing: "جارٍ معالجة الدفع…",
  success: "تم الدفع بنجاح",
  error: "لم يكتمل الدفع — حاول مرة أخرى.",
  unavailable: "يجري إعداد الدفع — سيتوفر قريباً.",
  sandbox: "وضع الاختبار (sandbox)",
  baziNote: "املأ النموذج أولاً ثم ادفع — تبدأ القراءة تلقائياً بعد الدفع.",
  baziNeedPay: "أكمل الدفع عبر PayPal أولاً — تبدأ القراءة فور الدفع.",
  shopSuccess: "تم استلام الدفع! سنؤكد الشحن عبر البريد الإلكتروني خلال 24 ساعة.",
  loginToBuy: "سجّل الدخول للشراء",
};

const MESSAGES: Record<Locale, PayMessages> = { zh, en, ja, ko, es, fr, de, pt, ru, ar };

export function getPayMessages(locale: Locale): PayMessages {
  return MESSAGES[locale] || en;
}
