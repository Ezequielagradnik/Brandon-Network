export type Lang = "es" | "en" | "pt";

export const LANGS: Lang[] = ["es", "en", "pt"];

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
        { title: "Mercados que te importan", desc: "Las noticias financieras que realmente afectan tu patrimonio, curadas y al día. Sin ruido." },
        { title: "Tu situación fiscal, siempre en orden", desc: "Tus formularios y estado ante el IRS (W-8BEN, 1042-S, transcripts) a la vista y al día, con el respaldo del equipo de Brandon." },
        { title: "El criterio de Brandon, en video", desc: "Análisis y explicaciones claras sobre planificación patrimonial y herencia, cuando los necesites." },
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
    login: { phrasePre: "Preservando tu", phraseAccent: "legado", note: "Acceso exclusivo para clientes y administradores de Brandon Network.", google: "Continuar con Google", connecting: "Conectando…" },
    sidebar: { noticias: "Noticias", irs: "IRS", videos: "Videos", admin: "Admin", logout: "Cerrar sesión", expand: "Expandir", collapse: "Colapsar" },
    noticias: {
      title: "Noticias del",
      accent: "mercado",
      subtitle: "Lo último de los mercados financieros, curado para tu patrimonio.",
      agoMin: "hace {n} min",
      agoH: "hace {n} h",
      cat: { Todas: "Todas", Macro: "Macro", "Renta fija": "Renta fija", Patrimonio: "Patrimonio", Mercados: "Mercados" },
    },
    irs: {
      title: "Estado",
      accent: "fiscal",
      subtitle: "Formularios y consentimientos del IRS por cliente.",
      connected: "Conectado vía IRS",
      cols: { client: "Cliente", form: "Formulario", status: "Estado", updated: "Actualizado", detail: "Ver detalle" },
      status: { Vigente: "Vigente", Pendiente: "Pendiente", Consentido: "Consentido", "En revisión": "En revisión" },
    },
    videos: {
      title: "Análisis en",
      accent: "video",
      subtitle: "Contenido educativo y de mercado por el equipo de Brandon Network.",
      source: "Google Drive · Gonzi",
    },
    admin: {
      title: "Panel de",
      accent: "administración",
      subtitle: "Métricas de uso y gestión de usuarios de Brandon Network.",
      back: "Volver al panel",
      metrics: ["Usuarios activos", "Logins hoy", "Total usuarios", "Sesiones abiertas"],
      usersTitle: "Usuarios",
      cols: { user: "Usuario", email: "Email", role: "Rol", status: "Estado" },
      active: "Activo",
      inactive: "Inactivo",
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
        { title: "Markets that matter to you", desc: "The financial news that actually affects your wealth, curated and up to date. No noise." },
        { title: "Your tax standing, always in order", desc: "Your forms and IRS status (W-8BEN, 1042-S, transcripts) in plain view and up to date, backed by the Brandon team." },
        { title: "Brandon's judgment, on video", desc: "Clear analysis and explanations on wealth planning and inheritance, whenever you need them." },
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
    login: { phrasePre: "Preserving your", phraseAccent: "legacy", note: "Exclusive access for Brandon Network clients and administrators.", google: "Continue with Google", connecting: "Connecting…" },
    sidebar: { noticias: "News", irs: "IRS", videos: "Videos", admin: "Admin", logout: "Sign out", expand: "Expand", collapse: "Collapse" },
    noticias: {
      title: "Market",
      accent: "news",
      subtitle: "The latest from financial markets, curated for your wealth.",
      agoMin: "{n} min ago",
      agoH: "{n} h ago",
      cat: { Todas: "All", Macro: "Macro", "Renta fija": "Fixed income", Patrimonio: "Wealth", Mercados: "Markets" },
    },
    irs: {
      title: "Tax",
      accent: "standing",
      subtitle: "IRS forms and consents by client.",
      connected: "Connected via IRS",
      cols: { client: "Client", form: "Form", status: "Status", updated: "Updated", detail: "View detail" },
      status: { Vigente: "Active", Pendiente: "Pending", Consentido: "Consented", "En revisión": "Under review" },
    },
    videos: {
      title: "Analysis on",
      accent: "video",
      subtitle: "Educational and market content by the Brandon Network team.",
      source: "Google Drive · Gonzi",
    },
    admin: {
      title: "Admin",
      accent: "panel",
      subtitle: "Usage metrics and user management for Brandon Network.",
      back: "Back to app",
      metrics: ["Active users", "Logins today", "Total users", "Open sessions"],
      usersTitle: "Users",
      cols: { user: "User", email: "Email", role: "Role", status: "Status" },
      active: "Active",
      inactive: "Inactive",
    },
  },

  pt: {
    nav: { platform: "A plataforma", how: "Como funciona", access: "Entrar" },
    hero: {
      eyebrow: "Brandon Network",
      h1Pre: "O que você construiu, protegido e à",
      h1Accent: "vista",
      sub: "A Brandon Network reúne num único lugar privado as notícias que movem o seu patrimônio, a sua situação fiscal perante o IRS e o critério de quem cuida dele há mais de 60 anos.",
      ctaPrimary: "Entrar",
      ctaSecondary: "Conheça a plataforma",
    },
    trust: [
      { big: "60", small: "anos de trajetória" },
      { big: "Coral Gables", small: "Miami, Estados Unidos" },
      { big: "LatAm", small: "famílias, empresas e fundações" },
    ],
    pillars: {
      title: "O que você vai encontrar",
      accent: "dentro",
      items: [
        { title: "Mercados que importam para você", desc: "As notícias financeiras que realmente afetam o seu patrimônio, selecionadas e atualizadas. Sem ruído." },
        { title: "Sua situação fiscal, sempre em ordem", desc: "Seus formulários e status perante o IRS (W-8BEN, 1042-S, transcripts) à vista e atualizados, com o respaldo da equipe da Brandon." },
        { title: "O critério da Brandon, em vídeo", desc: "Análises e explicações claras sobre planejamento patrimonial e herança, quando você precisar." },
      ],
    },
    how: {
      title: "Como",
      accent: "funciona",
      steps: [
        { t: "Você entra com a sua conta Google.", d: "Acesso seguro, sem senhas para lembrar." },
        { t: "Vê o seu patrimônio, as suas notícias e a sua situação fiscal num só lugar.", d: "Tudo reunido, claro e atualizado." },
        { t: "Entende cada decisão com o acompanhamento da Brandon.", d: "O critério de quem cuida dele há seis décadas." },
      ],
    },
    audience: {
      title: "Para",
      accent: "quem",
      items: [
        { t: "Famílias", d: "que querem preservar o seu legado." },
        { t: "Empreendedores", d: "que protegem o que construíram." },
        { t: "Fundações", d: "que planejam a longo prazo." },
      ],
    },
    privacy: {
      title: "Privado, como deve",
      accent: "ser",
      body: "A sua informação patrimonial é privada e tratada como tal. Acesso seguro, dados protegidos, nada de ruído público.",
    },
    cta: {
      title: "Organize hoje o que a sua família vai agradecer",
      accent: "amanhã",
      button: "Acessar a Brandon Network",
    },
    footer: {
      address: "Brandon Brokerage Latam · Coral Gables, Miami, Estados Unidos",
      rights: "Brandon Network. Todos os direitos reservados.",
    },
    login: { phrasePre: "Preservando o seu", phraseAccent: "legado", note: "Acesso exclusivo para clientes e administradores da Brandon Network.", google: "Continuar com Google", connecting: "Conectando…" },
    sidebar: { noticias: "Notícias", irs: "IRS", videos: "Vídeos", admin: "Admin", logout: "Sair", expand: "Expandir", collapse: "Recolher" },
    noticias: {
      title: "Notícias do",
      accent: "mercado",
      subtitle: "As últimas dos mercados financeiros, selecionadas para o seu patrimônio.",
      agoMin: "há {n} min",
      agoH: "há {n} h",
      cat: { Todas: "Todas", Macro: "Macro", "Renta fija": "Renda fixa", Patrimonio: "Patrimônio", Mercados: "Mercados" },
    },
    irs: {
      title: "Situação",
      accent: "fiscal",
      subtitle: "Formulários e consentimentos do IRS por cliente.",
      connected: "Conectado via IRS",
      cols: { client: "Cliente", form: "Formulário", status: "Status", updated: "Atualizado", detail: "Ver detalhe" },
      status: { Vigente: "Vigente", Pendiente: "Pendente", Consentido: "Consentido", "En revisión": "Em revisão" },
    },
    videos: {
      title: "Análises em",
      accent: "vídeo",
      subtitle: "Conteúdo educativo e de mercado pela equipe da Brandon Network.",
      source: "Google Drive · Gonzi",
    },
    admin: {
      title: "Painel de",
      accent: "administração",
      subtitle: "Métricas de uso e gestão de usuários da Brandon Network.",
      back: "Voltar ao painel",
      metrics: ["Usuários ativos", "Logins hoje", "Total de usuários", "Sessões abertas"],
      usersTitle: "Usuários",
      cols: { user: "Usuário", email: "Email", role: "Função", status: "Status" },
      active: "Ativo",
      inactive: "Inativo",
    },
  },
} as const;

export type Dict = (typeof dict)[Lang];

export function getDict(lang: Lang): Dict {
  return dict[lang];
}
