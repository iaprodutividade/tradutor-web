"use client";

import { useEffect, useId, useRef, useState } from "react";

export type CardFormData = {
  token: string;
  installments: number;
  payment_method_id: string;
  issuer_id?: string;
  payer: { email: string; identification: { type: string; number: string } };
};

type MercadoPagoBrick = { unmount: () => void };
type MercadoPagoInstance = {
  bricks: () => {
    create: (type: string, containerId: string, settings: unknown) => Promise<MercadoPagoBrick>;
  };
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, opts?: { locale?: string }) => MercadoPagoInstance;
  }
}

let sdkPromise: Promise<void> | null = null;
function carregarSdk(): Promise<void> {
  if (typeof window !== "undefined" && window.MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o SDK do Mercado Pago."));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

// Card Payment Brick — coleta os dados do cartão (número, validade, CVV) e o
// CPF/e-mail do pagador dentro do próprio iframe do Mercado Pago; devolve um
// token tokenizado no onSubmit. O número do cartão nunca passa pelo nosso
// frontend nem backend.
export function CardPaymentBrick({
  valorCentavos,
  onPagar,
}: {
  valorCentavos: number;
  onPagar: (dados: CardFormData) => Promise<void>;
}) {
  const containerId = `mp-card-brick-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const brickRef = useRef<MercadoPagoBrick | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function montar() {
      try {
        await carregarSdk();
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : String(e));
          setCarregando(false);
        }
        return;
      }
      if (cancelado) return;

      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
      if (!publicKey || !window.MercadoPago) {
        setErro("Não deu pra carregar o pagamento por cartão agora. Tenta o Pix.");
        setCarregando(false);
        return;
      }

      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      try {
        const brick = await mp.bricks().create("cardPayment", containerId, {
          initialization: { amount: valorCentavos / 100 },
          callbacks: {
            onReady: () => {
              if (!cancelado) setCarregando(false);
            },
            onSubmit: (formData: CardFormData) =>
              onPagar(formData).catch((e) => {
                if (!cancelado) setErro(e instanceof Error ? e.message : String(e));
                throw e;
              }),
            onError: (e: unknown) => {
              if (!cancelado) setErro(typeof e === "string" ? e : "Erro ao carregar o formulário de cartão.");
            },
          },
        });
        if (cancelado) {
          brick.unmount();
        } else {
          brickRef.current = brick;
        }
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : String(e));
          setCarregando(false);
        }
      }
    }

    montar();
    return () => {
      cancelado = true;
      brickRef.current?.unmount();
      brickRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, valorCentavos]);

  return (
    <div className="space-y-2">
      {carregando && <p className="text-center text-sm text-[var(--text-muted)]">Carregando pagamento por cartão...</p>}
      {erro && <p className="text-center text-sm text-[var(--accent-danger)]">{erro}</p>}
      <div id={containerId} />
    </div>
  );
}
