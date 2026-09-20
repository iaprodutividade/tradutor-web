// Lista ampla de idiomas — a tradução é feita por um modelo de linguagem
// (não um dicionário de pares fixos), então qualquer combinação de origem/
// destino funciona. A única limitação real de fidelidade visual é fonte:
// idiomas com alfabeto não-latino (CJK, árabe, devanágari etc.) podem
// precisar de fonte de fallback — isso é tratado no backend, não aqui.
export const IDIOMAS = [
  { codigo: "pt", nome: "Português" },
  { codigo: "en", nome: "Inglês" },
  { codigo: "es", nome: "Espanhol" },
  { codigo: "fr", nome: "Francês" },
  { codigo: "de", nome: "Alemão" },
  { codigo: "it", nome: "Italiano" },
  { codigo: "nl", nome: "Holandês" },
  { codigo: "ru", nome: "Russo" },
  { codigo: "zh", nome: "Chinês (simplificado)" },
  { codigo: "ja", nome: "Japonês" },
  { codigo: "ko", nome: "Coreano" },
  { codigo: "ar", nome: "Árabe" },
  { codigo: "hi", nome: "Hindi" },
  { codigo: "tr", nome: "Turco" },
  { codigo: "pl", nome: "Polonês" },
  { codigo: "sv", nome: "Sueco" },
  { codigo: "no", nome: "Norueguês" },
  { codigo: "da", nome: "Dinamarquês" },
  { codigo: "fi", nome: "Finlandês" },
  { codigo: "el", nome: "Grego" },
  { codigo: "he", nome: "Hebraico" },
  { codigo: "th", nome: "Tailandês" },
  { codigo: "vi", nome: "Vietnamita" },
  { codigo: "id", nome: "Indonésio" },
  { codigo: "uk", nome: "Ucraniano" },
  { codigo: "cs", nome: "Tcheco" },
  { codigo: "ro", nome: "Romeno" },
  { codigo: "hu", nome: "Húngaro" },
  { codigo: "bg", nome: "Búlgaro" },
  { codigo: "sk", nome: "Eslovaco" },
  { codigo: "hr", nome: "Croata" },
  { codigo: "fa", nome: "Persa" },
  { codigo: "ur", nome: "Urdu" },
  { codigo: "bn", nome: "Bengali" },
  { codigo: "ms", nome: "Malaio" },
  { codigo: "tl", nome: "Filipino (tagalo)" },
] as const;

export type CodigoIdioma = (typeof IDIOMAS)[number]["codigo"];
