export type Lang = "es" | "en";

export const dict = {
  es: {
    nav: { platform: "La plataforma", how: "Cómo funciona", access: "Acceder" },
    hero: {
      eyebrow: "Brandon Network",
      h1Pre: "Lo que construiste, protegido y a la",
      h1Accent: "vista",
      sub: "Brandon Network reúne en un solo lugar privado las noticias que mueven tu patrimonio, tu situación fiscal ante el IRS y el criterio de quienes lo cuidan hace más de 60 años.",
      ctaPrimary: "Acceder",
      ctaSecondary: "Conocé la plataforma",
    },
    trust: [
      { big: "60", small: "años de trayectoria" },
      { big: "Coral Gables", small: "Miami, Estados Unidos" },
      { big: "LatAm", small: "familias, empresas y fundaciones" },
    ],
    pillars: {
      title: "Lo que vas a encontrar",
      accent: "adentro",
      items: [
        {
          title: "Mercados que te importan",
          desc: "Las noticias financieras que realmente afectan tu patrimonio, curadas y al día. Sin ruido.",
        },
        {
          title: "Tu situación fiscal, siempre en orden",
          desc: "Tus formularios y estado ante el IRS (W-8BEN, 1042-S, transcripts) a la vista y al día, con el respaldo del equipo de Brandon.",
        },
        {
          title: "El criterio de Brandon, en video",
          desc: "Análisis y explicaciones claras sobre planificación patrimonial y herencia, cuando los necesites.",
        },
      ],
    },
    how: {
      title: "Cómo",
      accent: "funciona",
      steps: [
        { t: "Ingresás con tu cuenta de Google.", d: "Acceso seguro, sin contraseñas que recordar." },
        { t: "Ves tu patrimonio, tus noticias y tu estado fiscal en un solo lugar.", d: "Todo reunido, claro y al día." },
        { t: "Entendés cada decisión con el acompañamiento de Brandon.", d: "El criterio de quienes lo cuidan hace seis décadas." },
      ],
    },
    audience: {
      title: "Para",
      accent: "quién",
      items: [
        { t: "Familias", d: "que quieren preservar su legado." },
        { t: "Emprendedores", d: "que blindan lo que construyeron." },
        { t: "Fundaciones", d: "que planifican a largo plazo." },
      ],
    },
    privacy: {
      title: "Privado, como debe",
      accent: "ser",
      body: "Tu información patrimonial es privada y se trata como tal. Acceso seguro, datos protegidos, nada de ruido público.",
    },
    cta: {
      title: "Ordená hoy lo que tu familia va a agradecer",
      accent: "mañana",
      button: "Acceder a Brandon Network",
    },
    footer: {
      address: "Brandon Brokerage Latam · Coral Gables, Miami, Estados Unidos",
      rights: "Brandon Network. Todos los derechos reservados.",
    },
  },
  en: {
    nav: { platform: "The platform", how: "How it works", access: "Sign in" },
    hero: {
      eyebrow: "Brandon Network",
      h1Pre: "What you built, protected and in full",
      h1Accent: "view",
      sub: "Brandon Network brings together in one private place the news that moves your wealth, your tax standing with the IRS, and the judgment of those who have looked after it for more than 60 years.",
      ctaPrimary: "Sign in",
      ctaSecondary: "Explore the platform",
    },
    trust: [
      { big: "60", small: "years of experience" },
      { big: "Coral Gables", small: "Miami, United States" },
      { big: "LatAm", small: "families, companies & foundations" },
    ],
    pillars: {
      title: "What you'll find",
      accent: "inside",
      items: [
        {
          title: "Markets that matter to you",
          desc: "The financial news that actually affects your wealth, curated and up to date. No noise.",
        },
        {
          title: "Your tax standing, always in order",
          desc: "Your forms and IRS status (W-8BEN, 1042-S, transcripts) in plain view and up to date, backed by the Brandon team.",
        },
        {
          title: "Brandon's judgment, on video",
          desc: "Clear analysis and explanations on wealth planning and inheritance, whenever you need them.",
        },
      ],
    },
    how: {
      title: "How it",
      accent: "works",
      steps: [
        { t: "Sign in with your Google account.", d: "Secure access, no passwords to remember." },
        { t: "See your wealth, your news and your tax standing in one place.", d: "All together, clear and current." },
        { t: "Understand every decision with Brandon by your side.", d: "The judgment of those who have cared for it for six decades." },
      ],
    },
    audience: {
      title: "Who it's",
      accent: "for",
      items: [
        { t: "Families", d: "who want to preserve their legacy." },
        { t: "Entrepreneurs", d: "who safeguard what they built." },
        { t: "Foundations", d: "that plan for the long term." },
      ],
    },
    privacy: {
      title: "Private, as it should",
      accent: "be",
      body: "Your wealth information is private and treated as such. Secure access, protected data, no public noise.",
    },
    cta: {
      title: "Put in order today what your family will thank you for",
      accent: "tomorrow",
      button: "Access Brandon Network",
    },
    footer: {
      address: "Brandon Brokerage Latam · Coral Gables, Miami, United States",
      rights: "Brandon Network. All rights reserved.",
    },
  },
} as const;

export type Dict = (typeof dict)[Lang];
