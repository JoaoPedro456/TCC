export const formatarMoeda = (valor) => {
  if (valor == null || isNaN(valor)) valor = 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
};
