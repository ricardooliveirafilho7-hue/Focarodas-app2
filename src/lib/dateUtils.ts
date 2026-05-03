export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(`${dateStr}T12:00:00`);
};

export const formatDate = (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateStr) return '-';
  return parseLocalDate(dateStr).toLocaleDateString('pt-BR', options);
};

export const formatDateTime = (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateStr) return '-';
  return parseLocalDate(dateStr).toLocaleString('pt-BR', options);
};
