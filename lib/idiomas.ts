// Lista ampla de idiomas — a tradução é feita por um modelo de linguagem
// (não um dicionário de pares fixos), então qualquer combinação de origem/
// destino funciona. A única limitação real de fidelidade visual é fonte:
// idiomas com alfabeto não-latino (CJK, árabe, devanágari etc.) podem
// precisar de fonte de fallback — isso é tratado no backend, não aqui.
export const IDIOMAS = [
  { codigo: "de", nome: "Alemão" },
  { codigo: "ar", nome: "Árabe" },
  { codigo: "bn", nome: "Bengali" },
  { codigo: "bg", nome: "Búlgaro" },
  { codigo: "zh", nome: "Chinês (simplificado)" },
  { codigo: "ko", nome: "Coreano" },
  { codigo: "hr", nome: "Croata" },
  { codigo: "da", nome: "Dinamarquês" },
  { codigo: "sk", nome: "Eslovaco" },
  { codigo: "es", nome: "Espanhol" },
  { codigo: "tl", nome: "Filipino (tagalo)" },
  { codigo: "fi", nome: "Finlandês" },
  { codigo: "fr", nome: "Francês" },
  { codigo: "el", nome: "Grego" },
  { codigo: "he", nome: "Hebraico" },
  { codigo: "hi", nome: "Hindi" },
  { codigo: "nl", nome: "Holandês" },
  { codigo: "hu", nome: "Húngaro" },
  { codigo: "id", nome: "Indonésio" },
  { codigo: "en", nome: "Inglês" },
  { codigo: "it", nome: "Italiano" },
  { codigo: "ja", nome: "Japonês" },
  { codigo: "ms", nome: "Malaio" },
  { codigo: "no", nome: "Norueguês" },
  { codigo: "fa", nome: "Persa" },
  { codigo: "pl", nome: "Polonês" },
  { codigo: "pt", nome: "Português" },
  { codigo: "ro", nome: "Romeno" },
  { codigo: "ru", nome: "Russo" },
  { codigo: "sv", nome: "Sueco" },
  { codigo: "th", nome: "Tailandês" },
  { codigo: "cs", nome: "Tcheco" },
  { codigo: "tr", nome: "Turco" },
  { codigo: "uk", nome: "Ucraniano" },
  { codigo: "ur", nome: "Urdu" },
  { codigo: "vi", nome: "Vietnamita" },
] as const;

export type CodigoIdioma = (typeof IDIOMAS)[number]["codigo"];
