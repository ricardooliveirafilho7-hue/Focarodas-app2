import { isSupabaseConfigured, supabase } from './supabase';

const sanitizeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem selecionada.'));
    reader.readAsDataURL(file);
  });

export const uploadVehiclePhoto = async (file: File, vehicleHint: string) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem valido.');
  }

  if (!isSupabaseConfigured) {
    return fileToDataUrl(file);
  }

  const extension = file.name.split('.').pop() || 'jpg';
  const safeName = sanitizeFileName(vehicleHint || file.name || 'veiculo');
  const path = `${safeName}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from('vehicle-photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) {
    throw new Error(`Nao foi possivel enviar a foto. Verifique se o bucket vehicle-photos existe no Supabase. Detalhe: ${error.message}`);
  }

  const { data } = supabase.storage.from('vehicle-photos').getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error('Foto enviada, mas nao foi possivel gerar a URL publica.');
  }

  return data.publicUrl;
};
