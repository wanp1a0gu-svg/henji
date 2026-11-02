import { Locale } from "./i18n";

/**
 * 「什么时候该用这个功能」的说明文案。
 *
 * 为什么单独一个文件：塔罗 / 文王卦 / 紫微三个页面的 i18n 结构各不相同，
 * 硬塞进去会破坏原有类型；而这三个页要展示的是同一套东西
 * （适用场景 + 不适用场景），独立成表更好维护。
 */
export type WhenCopy = {
  /** 小标题，例如「适合问这些」 */
  title: string;
  /** 3 条适用场景 */
  items: string[];
  /** 不适用的情况，用来划边界 */
  notFor: string;
};

type Kind = "tarot" | "bagua" | "ziwei";

const WHEN: Record<Kind, Record<Locale, WhenCopy>> = {
  tarot: {
    zh: {
      title: "适合问这些",
      items: [
        "一个具体的选择摆在眼前（换不换工作、要不要开口）",
        "关系里看不透对方的想法，或不知道下一步怎么走",
        "心里其实已有答案，想借一副牌再确认一次直觉",
      ],
      notFor: "不适合问一生格局与长期趋势——那是八字和紫微的事。",
    },
    en: {
      title: "Good questions for tarot",
      items: [
        "A concrete choice is right in front of you (switch jobs, speak up or not)",
        "You can't read where a relationship is heading",
        "You already have a hunch and want a second look at it",
      ],
      notFor: "Not for your lifetime pattern or long-range trends — that's BaZi and Zi Wei.",
    },
    ja: {
      title: "こんな問いに向いています",
      items: [
        "目の前に具体的な選択がある（転職するか、言い出すか）",
        "相手の気持ちや関係の行き先が読めない",
        "答えはもうあるが、直感をもう一度確かめたい",
      ],
      notFor: "一生の格局や長期の流れには向きません（それは八字と紫微の役目）。",
    },
    ko: {
      title: "이런 질문에 맞습니다",
      items: [
        "눈앞에 구체적인 선택이 있다 (이직할지, 말할지)",
        "상대의 생각이나 관계의 방향이 보이지 않는다",
        "답은 이미 있지만 직감을 한 번 더 확인하고 싶다",
      ],
      notFor: "평생의格局이나 장기 흐름에는 맞지 않습니다 — 그건 사주와 자미두수의 몫입니다.",
    },
    es: {
      title: "Buenas preguntas para el tarot",
      items: [
        "Tienes una decisión concreta delante (cambiar de trabajo, dar el paso)",
        "No ves hacia dónde va una relación",
        "Ya tienes una intuición y quieres confirmarla",
      ],
      notFor: "No sirve para el patrón de toda una vida ni tendencias a largo plazo: eso es BaZi y Zi Wei.",
    },
    fr: {
      title: "Bonnes questions pour le tarot",
      items: [
        "Un choix concret se présente (changer de travail, oser parler)",
        "Vous ne voyez pas où va une relation",
        "Vous avez déjà une intuition et voulez la vérifier",
      ],
      notFor: "Pas pour le schéma d'une vie ni les tendances longues : c'est le rôle du BaZi et du Zi Wei.",
    },
    de: {
      title: "Gute Fragen für Tarot",
      items: [
        "Eine konkrete Entscheidung steht an (Job wechseln, ansprechen)",
        "Du erkennst nicht, wohin eine Beziehung läuft",
        "Du hast eine Ahnung und willst sie prüfen",
      ],
      notFor: "Nicht für das Lebensmuster oder langfristige Trends – das ist BaZi und Zi Wei.",
    },
    pt: {
      title: "Boas perguntas para o tarot",
      items: [
        "Tens uma decisão concreta à frente (mudar de trabalho, dar o passo)",
        "Não percebes para onde vai uma relação",
        "Já tens uma intuição e queres confirmá-la",
      ],
      notFor: "Não serve para o padrão de uma vida nem tendências longas: isso é BaZi e Zi Wei.",
    },
    ru: {
      title: "Хорошие вопросы для таро",
      items: [
        "Перед вами конкретный выбор (менять работу, решиться на разговор)",
        "Непонятно, куда движутся отношения",
        "Предчувствие уже есть — хочется его проверить",
      ],
      notFor: "Не для устройства всей жизни и долгих трендов — это Бацзы и Цзы Вэй.",
    },
    ar: {
      title: "أسئلة مناسبة للتاروت",
      items: [
        "أمامك خيار محدد (تغيير العمل، أو الإفصاح)",
        "لا ترى إلى أين تتجه العلاقة",
        "لديك حدس وتريد التحقق منه",
      ],
      notFor: "ليس لطبيعة العمر كله أو الاتجاهات البعيدة — ذلك للبازي وتسي وي.",
    },
  },

  bagua: {
    zh: {
      title: "适合问这些",
      items: [
        "一件事已经启动或即将决定，想知道它接下来怎么走",
        "在等一个结果：面试、offer、谈判、审批",
        "出行、签约、见面这类具体安排，问个吉凶",
      ],
      notFor: "别对同一件事反复起卦——第一卦最准，反复问只会越问越乱。",
    },
    en: {
      title: "Good questions for the I Ching",
      items: [
        "A matter is already moving and you want its direction",
        "You're waiting on one result: interview, offer, negotiation",
        "Concrete plans: travel, signing, a meeting",
      ],
      notFor: "Don't cast again for the same matter — the first cast is the answer.",
    },
    ja: {
      title: "こんな問いに向いています",
      items: [
        "物事がすでに動き出した／決断が近い。行く末を知りたい",
        "結果待ちの一件（面接、オファー、交渉、審査）",
        "旅行・契約・面会など具体的な予定の吉凶",
      ],
      notFor: "同じことを何度も立てないでください。最初の卦が答えです。",
    },
    ko: {
      title: "이런 질문에 맞습니다",
      items: [
        "일이 이미 움직이기 시작했거나 결정을 앞두고 있다",
        "결과를 기다리는 한 건 (면접, 오퍼, 협상, 승인)",
        "여행·계약·약속 같은 구체적인 일정의 길흉",
      ],
      notFor: "같은 일을 반복해서 점치지 마세요. 첫 괘가 답입니다.",
    },
    es: {
      title: "Buenas preguntas para el I Ching",
      items: [
        "Un asunto ya está en marcha y quieres su dirección",
        "Esperas un resultado: entrevista, oferta, negociación",
        "Planes concretos: viaje, firma, una reunión",
      ],
      notFor: "No preguntes dos veces lo mismo: la primera tirada es la respuesta.",
    },
    fr: {
      title: "Bonnes questions pour le Yi Jing",
      items: [
        "Une affaire est lancée et vous voulez sa direction",
        "Vous attendez un résultat : entretien, offre, négociation",
        "Des projets concrets : voyage, signature, rendez-vous",
      ],
      notFor: "Ne posez pas deux fois la même question : le premier jet est la réponse.",
    },
    de: {
      title: "Gute Fragen für das I Ging",
      items: [
        "Eine Sache ist im Gang und du willst ihre Richtung wissen",
        "Du wartest auf ein Ergebnis: Interview, Angebot, Verhandlung",
        "Konkrete Vorhaben: Reise, Vertrag, ein Treffen",
      ],
      notFor: "Frag nicht zweimal dasselbe – der erste Wurf ist die Antwort.",
    },
    pt: {
      title: "Boas perguntas para o I Ching",
      items: [
        "Um assunto já está em curso e queres a sua direção",
        "Esperas um resultado: entrevista, proposta, negociação",
        "Planos concretos: viagem, assinatura, uma reunião",
      ],
      notFor: "Não perguntes duas vezes a mesma coisa: o primeiro lançamento é a resposta.",
    },
    ru: {
      title: "Хорошие вопросы для И цзин",
      items: [
        "Дело уже пошло — хочется понять его направление",
        "Ждёте одного результата: собеседование, оффер, переговоры",
        "Конкретные планы: поездка, подписание, встреча",
      ],
      notFor: "Не спрашивайте об одном и том же дважды — первый расклад и есть ответ.",
    },
    ar: {
      title: "أسئلة مناسبة للإي تشينغ",
      items: [
        "أمر بدأ بالفعل وتريد معرفة اتجاهه",
        "تنتظر نتيجة واحدة: مقابلة، عرض، مفاوضة",
        "خطط محددة: سفر، توقيع، لقاء",
      ],
      notFor: "لا تسأل عن الأمر نفسه مرتين — الرمية الأولى هي الجواب.",
    },
  },

  ziwei: {
    zh: {
      title: "适合看这些",
      items: [
        "想弄清自己的性格底色、天生的强项与短板",
        "看一生格局：命宫、财帛、官禄、夫妻各宫落在哪",
        "现在走的大限到哪一步，什么时候该冲、什么时候该守",
      ],
      notFor: "不适合问一件小事的具体结果——那种问文王卦更直接。",
    },
    en: {
      title: "Good questions for Zi Wei",
      items: [
        "You want your baseline: strengths and weak spots",
        "The whole picture: life, wealth, career and marriage palaces",
        "Where your current decade stands — when to push, when to hold",
      ],
      notFor: "Not for the outcome of one small event — the I Ching is more direct for that.",
    },
    ja: {
      title: "こんな問いに向いています",
      items: [
        "自分の性格の土台、強みと弱みを知りたい",
        "一生の格局：命宮・財帛・官禄・夫妻の各宮",
        "今の大限がどこまで進んだか、攻め時と守り時",
      ],
      notFor: "小さな一件の結果を訊くのには向きません（それは文王卦が直接的）。",
    },
    ko: {
      title: "이런 질문에 맞습니다",
      items: [
        "타고난 성향과 강점·약점을 알고 싶다",
        "평생의 구조: 명궁·재백·관록·부처 각 궁",
        "지금 대운이 어디인지, 언제 밀고 언제 지킬지",
      ],
      notFor: "작은 일 하나의 결과를 묻기에는 맞지 않습니다 — 그건 주역이 더 직접적입니다.",
    },
    es: {
      title: "Buenas preguntas para Zi Wei",
      items: [
        "Quieres tu base: fortalezas y puntos débiles",
        "El panorama completo: palacios de vida, riqueza, carrera y pareja",
        "En qué punto está tu década actual: cuándo empujar y cuándo esperar",
      ],
      notFor: "No para el resultado de un hecho pequeño: para eso el I Ching es más directo.",
    },
    fr: {
      title: "Bonnes questions pour le Zi Wei",
      items: [
        "Connaître votre base : forces et points faibles",
        "La vue d'ensemble : palais de vie, richesse, carrière, couple",
        "Où en est votre décennie en cours : quand pousser, quand attendre",
      ],
      notFor: "Pas pour le résultat d'un petit événement : le Yi Jing est plus direct.",
    },
    de: {
      title: "Gute Fragen für Zi Wei",
      items: [
        "Deine Grundlage: Stärken und Schwächen",
        "Das Gesamtbild: Lebens-, Vermögens-, Karriere- und Partnerpalast",
        "Wo deine aktuelle Dekade steht – wann drücken, wann halten",
      ],
      notFor: "Nicht für das Ergebnis eines kleinen Ereignisses – dafür ist das I Ging direkter.",
    },
    pt: {
      title: "Boas perguntas para Zi Wei",
      items: [
        "Queres a tua base: forças e pontos fracos",
        "O panorama completo: palácios de vida, riqueza, carreira e casamento",
        "Onde está a tua década atual: quando empurrar e quando esperar",
      ],
      notFor: "Não para o resultado de um facto pequeno: para isso o I Ching é mais direto.",
    },
    ru: {
      title: "Хорошие вопросы для Цзы Вэй",
      items: [
        "Понять свою основу: сильные и слабые стороны",
        "Общая картина: дворцы жизни, богатства, карьеры и брака",
        "На каком этапе ваша текущая декада — когда действовать, когда ждать",
      ],
      notFor: "Не для исхода одного небольшого события — для этого прямее И цзин.",
    },
    ar: {
      title: "أسئلة مناسبة لتسي وي",
      items: [
        "معرفة أساسك: القوة والضعف",
        "الصورة الكاملة: قصور الحياة والمال والعمل والزوج",
        "أين يقف عقدك الحالي: متى تندفع ومتى تنتظر",
      ],
      notFor: "ليس لنتيجة حادثة صغيرة — الإي تشينغ أدق لذلك.",
    },
  },
};

export function getWhen(kind: Kind, locale: Locale): WhenCopy {
  return WHEN[kind][locale] || WHEN[kind].en;
}
