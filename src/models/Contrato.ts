export interface Contrato {
  id?: string;
  numero: string;
  dataEmissao: string;
  termos: string;
  locacaoId: string;
}

export const contratoInicial: Contrato = {
  numero: "",
  dataEmissao: "",
  termos: "",
  locacaoId: "",
};

export function gerarNumeroContrato(): string {
  return `CT-${Date.now()}`;
}

export const termosPadrao =
  "O locatário se compromete a devolver o veículo na data prevista, nas mesmas condições da retirada, " +
  "e a pagar o valor das diárias e eventuais danos.";
