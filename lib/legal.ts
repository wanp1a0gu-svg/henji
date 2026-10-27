/**
 * Legal documents (Privacy Policy / Terms of Service).
 *
 * Provided in English and Chinese. Other locales fall back to English.
 * Drafted as a working template for the Traces website — legal review
 * is recommended before heavy commercial use.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export type LegalDocKey = "privacy" | "terms";

export const legalDocs: Record<LegalDocKey, Record<"en" | "zh", LegalDoc>> = {
  privacy: {
    en: {
      title: "Privacy Policy",
      intro:
        'Traces ("we", "us") operates this website and the services offered on it. This policy explains what personal data we collect, why we collect it, and how we handle it. By using this website you acknowledge the practices described here.',
      sections: [
        {
          heading: "1. Data We Collect",
          paragraphs: [
            "Account data: when you create an account we collect your email address. Your password is stored in hashed form by our authentication infrastructure and is never visible to us.",
            "Birth information you submit: for a Bazi reading you may provide your name (optional), date of birth, time of birth, gender, and the focus area you are interested in. This information is used to generate your reading.",
            "Reading content: reports generated on this site are saved to your account so that you can view them later.",
            "Essential technical data: we use browser storage required to keep you signed in and to operate the site. We do not use third-party advertising trackers.",
          ],
        },
        {
          heading: "2. How We Use Your Data",
          paragraphs: [
            "To generate and save your readings, to operate your account and sign-in, to send service emails such as verification codes, and to respond to your support requests.",
            "We do not sell your personal data, and we do not use it for advertising.",
          ],
        },
        {
          heading: "3. Sharing",
          paragraphs: [
            "We share data only with service providers that make the website work: hosting, authentication and database services, and email delivery.",
            "When paid products are offered, payments are processed by third-party payment providers (such as PayPal); we do not store full payment card details.",
          ],
        },
        {
          heading: "4. Retention and Deletion",
          paragraphs: [
            "Your data is kept while your account is active. You can delete individual readings at any time in your account, or clear all saved readings at once.",
            "To delete your entire account and associated data, contact us through the contact channel on this website.",
          ],
        },
        {
          heading: "5. Your Rights",
          paragraphs: [
            "You may request access to, correction of, or deletion of your personal data at any time by contacting us. We will respond within a reasonable period.",
          ],
        },
        {
          heading: "6. Cookies and Local Storage",
          paragraphs: [
            "We use essential cookie/local storage technology to keep you signed in. We do not use advertising or cross-site tracking cookies.",
            "For traffic statistics and abuse prevention we record the pages you visit, the interface language, a randomly generated visitor ID stored in your browser, and your IP address as seen by our server. This data is used only in aggregate for site operation and is not sold or shared with advertisers.",
          ],
        },
        {
          heading: "7. Children",
          paragraphs: [
            "This service is not intended for children under 16. If you believe a child has provided personal data to us, please contact us and we will delete it.",
          ],
        },
        {
          heading: "8. Changes to This Policy",
          paragraphs: [
            "We may update this policy from time to time. Material changes will be reflected on this page with an updated date.",
          ],
        },
        {
          heading: "9. Contact",
          paragraphs: [
            "For any privacy-related questions or requests, contact us through the contact channel on this website (the WhatsApp button at the bottom right).",
          ],
        },
      ],
    },
    zh: {
      title: "隐私政策",
      intro:
        "痕迹（下称「我们」）运营本网站及网站提供的服务。本政策说明我们收集哪些个人数据、为什么收集、以及如何处理。使用本网站即表示你了解本政策所述的实践。",
      sections: [
        {
          heading: "一、我们收集的数据",
          paragraphs: [
            "账号数据：当你注册账号时，我们收集你的邮箱地址。密码由认证基础设施以加密哈希形式存储，我们无法查看。",
            "你提交的出生信息：进行八字测算时，你可能会提供姓名（选填）、出生日期、出生时间、性别以及关注的方面。这些信息用于生成你的测算报告。",
            "测算内容：在本站生成的报告会保存到你的账号，方便你随时查看。",
            "必要的技术数据：我们使用维持登录状态和网站运行所必需的浏览器存储。我们不使用第三方广告追踪器。",
          ],
        },
        {
          heading: "二、数据的使用",
          paragraphs: [
            "用于生成并保存你的测算报告、运营账号与登录、发送验证码等服务邮件、以及回应你的支持请求。",
            "我们不会出售你的个人数据，也不会将其用于广告。",
          ],
        },
        {
          heading: "三、数据共享",
          paragraphs: [
            "仅在网站运行所必需的服务商范围内共享数据：托管、认证与数据库服务、邮件发送服务。",
            "当提供付费产品时，支付由第三方支付服务商（如 PayPal）处理；我们不存储完整的支付卡信息。",
          ],
        },
        {
          heading: "四、保留与删除",
          paragraphs: [
            "数据在账号存续期间保留。你可以随时在个人中心删除单条测算记录，也可以一键清空全部记录。",
            "如需注销账号并删除全部关联数据，请通过网站上的联系方式联系我们。",
          ],
        },
        {
          heading: "五、你的权利",
          paragraphs: [
            "你可以随时联系我们，请求查阅、更正或删除你的个人数据。我们将在合理期限内响应。",
          ],
        },
        {
          heading: "六、Cookie 与本地存储",
          paragraphs: [
            "我们使用维持登录所必需的 Cookie/本地存储技术，不使用广告或跨站追踪 Cookie。",
            "为统计访问量与防范滥用，我们会记录你访问的页面、界面语言、浏览器本地生成的随机访客标识，以及服务端看到的 IP 地址。这些数据仅用于站点运营分析，不会出售或提供给广告商。",
          ],
        },
        {
          heading: "七、未成年人",
          paragraphs: [
            "本服务不面向 16 岁以下的未成年人。如果你认为有未成年人向我们提供了个人数据，请联系我们删除。",
          ],
        },
        {
          heading: "八、政策更新",
          paragraphs: [
            "我们可能不时更新本政策。重大变更将在本页面更新并标注日期。",
          ],
        },
        {
          heading: "九、联系我们",
          paragraphs: [
            "如有任何隐私相关问题或请求，请通过网站上的联系方式联系我们（右下角 WhatsApp 按钮）。",
          ],
        },
      ],
    },
  },
  terms: {
    en: {
      title: "Terms of Service",
      intro:
        'These Terms govern your use of the Traces website and services. By accessing or using the website, you agree to these Terms. If you do not agree, please do not use the service.',
      sections: [
        {
          heading: "1. The Service",
          paragraphs: [
            "Traces provides content about Chinese metaphysics (Bazi / Four Pillars), educational materials, and personalized readings generated from the birth information you provide.",
            "Readings and content are provided for cultural interest, reflection and entertainment. They are not medical, legal, financial, or psychological advice, and they are not a substitute for professional consultation. You are solely responsible for decisions you make.",
          ],
        },
        {
          heading: "2. Accounts",
          paragraphs: [
            "You must provide a valid email address to create an account and keep your password confidential. You are responsible for activity that occurs under your account.",
            "You may delete your readings at any time; to delete your account, contact us.",
          ],
        },
        {
          heading: "3. Payments",
          paragraphs: [
            "When paid products are offered, prices are shown before checkout and payments are processed by third-party payment providers.",
            "Because readings are digital content delivered electronically, purchases are generally non-refundable once the reading has been generated and delivered. If something goes wrong, contact us and we will work with you to resolve it.",
          ],
        },
        {
          heading: "4. Intellectual Property",
          paragraphs: [
            "Website content and generated readings are provided for your personal, non-commercial use. You may not resell, redistribute, or republish them without our written permission.",
          ],
        },
        {
          heading: "5. Acceptable Use",
          paragraphs: [
            "You agree not to use the service unlawfully, to attempt to disrupt or overload the service, to scrape or bulk-query the service, or to impersonate others.",
          ],
        },
        {
          heading: "6. Disclaimers",
          paragraphs: [
            'The service is provided "as is" and "as available". We do not guarantee that readings will meet your expectations or that the service will be uninterrupted or error-free.',
          ],
        },
        {
          heading: "7. Limitation of Liability",
          paragraphs: [
            "To the maximum extent permitted by law, we are not liable for indirect or consequential damages arising from your use of the service, and our total liability is limited to the amount you paid us (if any) in the twelve months before the claim.",
          ],
        },
        {
          heading: "8. Changes and Termination",
          paragraphs: [
            "We may modify, suspend, or discontinue the service (or any part of it) at any time. We may update these Terms; material changes will be posted on this page.",
          ],
        },
        {
          heading: "9. Contact",
          paragraphs: [
            "Questions about these Terms? Reach us through the contact channel on this website (the WhatsApp button at the bottom right).",
          ],
        },
      ],
    },
    zh: {
      title: "服务条款",
      intro:
        "本条款约束你对痕迹网站及服务的使用。访问或使用本网站，即表示你同意本条款；如不同意，请勿使用本服务。",
      sections: [
        {
          heading: "一、服务内容",
          paragraphs: [
            "痕迹提供中国传统命理（八字）相关内容、课程资料，以及基于你提供的出生信息生成的个人测算报告。",
            "测算与内容仅供文化兴趣、思考和娱乐参考，不构成医疗、法律、金融或心理建议，也不能替代专业咨询。你对自己的决策负全部责任。",
          ],
        },
        {
          heading: "二、账号",
          paragraphs: [
            "注册账号需提供有效邮箱，并请妥善保管密码。你对账号下发生的活动负责。",
            "你可以随时删除测算记录；如需注销账号，请联系我们。",
          ],
        },
        {
          heading: "三、付款",
          paragraphs: [
            "当提供付费产品时，价格会在结算前明示，支付由第三方支付服务商处理。",
            "由于测算属于电子交付的数字内容，报告生成并交付后一般不予退款。如遇问题请联系我们，我们会与你协商解决。",
          ],
        },
        {
          heading: "四、知识产权",
          paragraphs: [
            "网站内容与生成的测算报告仅供你个人非商业使用。未经书面许可，不得转售、转发或重新发布。",
          ],
        },
        {
          heading: "五、使用规范",
          paragraphs: [
            "你同意不将本服务用于非法用途，不试图干扰或过载服务，不抓取或批量查询服务，不冒用他人身份。",
          ],
        },
        {
          heading: "六、免责声明",
          paragraphs: [
            "本服务按「现状」和「可用」状态提供。我们不保证测算结果符合你的预期，也不保证服务不中断、无错误。",
          ],
        },
        {
          heading: "七、责任限制",
          paragraphs: [
            "在法律允许的最大范围内，我们不对因使用本服务产生的间接或后果性损失负责，我们的全部责任以你在索赔前十二个月内向我们支付的金额（如有）为限。",
          ],
        },
        {
          heading: "八、变更与终止",
          paragraphs: [
            "我们可能随时修改、暂停或终止服务（或其任何部分），并可能更新本条款；重大变更将在本页面发布。",
          ],
        },
        {
          heading: "九、联系我们",
          paragraphs: [
            "如对本条款有疑问，请通过网站上的联系方式联系我们（右下角 WhatsApp 按钮）。",
          ],
        },
      ],
    },
  },
};

export function getLegalDoc(key: LegalDocKey, locale: string): LegalDoc {
  return legalDocs[key][locale === "zh" ? "zh" : "en"];
}
