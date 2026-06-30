// Data mock para construir el diseño. Se reemplaza por las APIs reales
// (Finnhub / proveedor IRS / Google Drive) en el próximo paso.

export type MarketIndex = {
  label: string;
  value: string;
  changePct: number;
};

export const MARKET_INDICES: MarketIndex[] = [
  { label: "S&P 500", value: "5.464,62", changePct: 0.42 },
  { label: "Nasdaq", value: "17.689,36", changePct: 0.91 },
  { label: "Dow Jones", value: "39.150,33", changePct: -0.18 },
  { label: "Oro", value: "2.331,80", changePct: 0.27 },
];

export type NewsItem = {
  id: number;
  source: string;
  minutesAgo: number;
  title: string;
  category: string;
};

export const NEWS_CATEGORIES = [
  "Todas",
  "Macro",
  "Renta fija",
  "Patrimonio",
  "Mercados",
];

export const NEWS: NewsItem[] = [
  {
    id: 1,
    source: "Reuters",
    minutesAgo: 12,
    title: "La Fed mantiene tasas y revisa al alza las proyecciones de inflación para 2026",
    category: "Macro",
  },
  {
    id: 2,
    source: "Bloomberg",
    minutesAgo: 34,
    title: "El oro toca máximos del trimestre ante la demanda de refugio de capitales familiares",
    category: "Patrimonio",
  },
  {
    id: 3,
    source: "Financial Times",
    minutesAgo: 58,
    title: "Los bonos del Tesoro a 10 años caen tras los datos de empleo en EE.UU.",
    category: "Renta fija",
  },
  {
    id: 4,
    source: "WSJ",
    minutesAgo: 92,
    title: "Wall Street cierra mixta mientras los inversores esperan la temporada de balances",
    category: "Mercados",
  },
  {
    id: 5,
    source: "Reuters",
    minutesAgo: 140,
    title: "Las fundaciones aceleran la diversificación hacia activos reales fuera de EE.UU.",
    category: "Patrimonio",
  },
  {
    id: 6,
    source: "Bloomberg",
    minutesAgo: 178,
    title: "El dólar se debilita frente a una canasta de monedas tras señales de la Fed",
    category: "Macro",
  },
];

export type IrsRow = {
  id: number;
  client: string;
  form: "W-8BEN" | "1042-S" | "Form 8821" | "Transcript";
  status: "Vigente" | "Pendiente" | "Consentido" | "En revisión";
  updated: string;
};

export const IRS_ROWS: IrsRow[] = [
  { id: 1, client: "Familia Restrepo", form: "W-8BEN", status: "Vigente", updated: "12 jun 2026" },
  { id: 2, client: "Inversiones Vega LLC", form: "1042-S", status: "Pendiente", updated: "08 jun 2026" },
  { id: 3, client: "Fundación Aurora", form: "Form 8821", status: "Consentido", updated: "21 may 2026" },
  { id: 4, client: "M. Salazar", form: "Transcript", status: "En revisión", updated: "03 jun 2026" },
  { id: 5, client: "Grupo Andino S.A.", form: "W-8BEN", status: "Vigente", updated: "29 abr 2026" },
  { id: 6, client: "C. Ferreira", form: "Form 8821", status: "Pendiente", updated: "14 jun 2026" },
];

export type VideoItem = {
  id: number;
  title: string;
  author: string;
  duration: string;
};

export const VIDEOS: VideoItem[] = [
  { id: 1, title: "Panorama macro: qué esperar del segundo semestre", author: "Hashi", duration: "08:42" },
  { id: 2, title: "Estructuras de protección patrimonial en EE.UU.", author: "Hashi", duration: "14:10" },
  { id: 3, title: "W-8BEN explicado: errores comunes", author: "Hashi", duration: "06:55" },
  { id: 4, title: "Renta fija en un ciclo de tasas a la baja", author: "Hashi", duration: "11:28" },
  { id: 5, title: "Planificación sucesoria para familias LatAm", author: "Hashi", duration: "19:03" },
  { id: 6, title: "Diversificación de divisas: marco práctico", author: "Hashi", duration: "09:17" },
];

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "cliente" | "admin";
  active: boolean;
};

export const ADMIN_METRICS = [
  { label: "Usuarios activos", value: "48" },
  { label: "Logins hoy", value: "17" },
  { label: "Total usuarios", value: "63" },
  { label: "Sesiones abiertas", value: "12" },
];

export const ADMIN_USERS: AdminUser[] = [
  { id: 1, name: "Gonzalo Ibáñez", email: "gonzi@bblatam.com", role: "admin", active: true },
  { id: 2, name: "Hashi Tanaka", email: "hashi@bblatam.com", role: "admin", active: true },
  { id: 3, name: "Familia Restrepo", email: "restrepo@gmail.com", role: "cliente", active: true },
  { id: 4, name: "M. Salazar", email: "msalazar@gmail.com", role: "cliente", active: false },
  { id: 5, name: "C. Ferreira", email: "cferreira@gmail.com", role: "cliente", active: true },
];
