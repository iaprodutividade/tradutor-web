import type { CSSProperties, ReactNode } from "react";

// Mesmo padrão "glass/3D" do Mural Financeiro/srty/Governança IA (ver
// feedback_srty_referencia_visual_padrao na memória).
const CONTORNO_TEXTO: CSSProperties = {
  WebkitTextStroke: "0.4px rgba(0,0,0,0.35)",
  paintOrder: "stroke fill",
};

export type CorAcaoTile = "azul" | "ambar" | "esmeralda" | "violeta" | "rosa";

const CORES: Record<CorAcaoTile, { grad: string; sombra: string; sombraHover: string }> = {
  azul: {
    grad: "from-sky-500 to-blue-600",
    sombra:
      "shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_12px_2px_rgba(56,189,248,0.45),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
    sombraHover:
      "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_0_22px_4px_rgba(56,189,248,0.7),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
  },
  ambar: {
    grad: "from-amber-400 to-orange-600",
    sombra:
      "shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_12px_2px_rgba(251,146,60,0.45),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
    sombraHover:
      "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_0_22px_4px_rgba(251,146,60,0.7),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
  },
  esmeralda: {
    grad: "from-emerald-500 to-emerald-600",
    sombra:
      "shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_12px_2px_rgba(52,211,153,0.45),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
    sombraHover:
      "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_0_22px_4px_rgba(52,211,153,0.7),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
  },
  violeta: {
    grad: "from-violet-500 to-purple-600",
    sombra:
      "shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_12px_2px_rgba(167,139,250,0.45),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
    sombraHover:
      "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_0_22px_4px_rgba(167,139,250,0.7),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
  },
  rosa: {
    grad: "from-rose-500 to-red-600",
    sombra:
      "shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_12px_2px_rgba(251,113,133,0.45),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
    sombraHover:
      "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_0_22px_4px_rgba(251,113,133,0.7),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]",
  },
};

export function AcaoTile({
  icon,
  label,
  cor,
  badge,
  pulsando,
}: {
  icon: ReactNode;
  label: string;
  cor: CorAcaoTile;
  badge?: ReactNode;
  pulsando?: boolean;
}) {
  const c = CORES[cor];
  return (
    <span className="flex w-20 flex-col items-center gap-2">
      <span
        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b text-white transition duration-200 ${c.grad} ${c.sombra} ${c.sombraHover} group-hover:-translate-y-0.5 group-hover:brightness-110 group-active:translate-y-0 group-active:scale-95 group-active:brightness-90`}
      >
        {pulsando && (
          <span className="absolute inset-0 -z-10 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_1] rounded-2xl bg-white/40" />
        )}
        {icon}
        {badge}
      </span>
      <span className="text-center text-xs font-medium leading-tight text-[var(--text-secondary)] transition group-hover:text-[var(--text-primary)]">
        {label}
      </span>
    </span>
  );
}

export function AcaoPill({
  icon,
  label,
  cor,
  pulsando,
  pressionado,
  iconDepois,
  className = "",
}: {
  icon?: ReactNode;
  label: string;
  cor: CorAcaoTile;
  pulsando?: boolean;
  pressionado?: boolean;
  iconDepois?: boolean;
  className?: string;
}) {
  const c = CORES[cor];
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b px-5 py-2.5 text-sm font-semibold text-white transition duration-200 ${c.grad} ${className} ${
        pressionado
          ? "scale-90 brightness-90 shadow-[inset_0_2px_5px_rgba(0,0,0,0.65)]"
          : `${c.sombra} ${c.sombraHover} group-hover:-translate-y-0.5 group-hover:gap-2.5 group-hover:brightness-110 group-active:translate-y-0 group-active:scale-95 group-active:brightness-90`
      }`}
    >
      {pulsando && (
        <span className="absolute inset-0 -z-10 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_1] rounded-xl bg-white/40" />
      )}
      {iconDepois ? (
        <>
          <span style={CONTORNO_TEXTO}>{label}</span>
          {icon}
        </>
      ) : (
        <>
          {icon}
          <span style={CONTORNO_TEXTO}>{label}</span>
        </>
      )}
    </span>
  );
}
