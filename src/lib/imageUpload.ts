import { isSupabaseConfigured, supabase } from './supabase';

const VEHICLE_PHOTOS_BUCKET = 'vehicle-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

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

const isInlinePreview = (value: string) => value.startsWith('data:') || value.startsWith('blob:');

const parseStoragePath = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed || isInlinePreview(trimmed)) return trimmed;
  if (trimmed.startsWith(`${VEHICLE_PHOTOS_BUCKET}:`)) return trimmed.slice(VEHICLE_PHOTOS_BUCKET.length + 1);
  if (trimmed.startsWith(`${VEHICLE_PHOTOS_BUCKET}/`)) return trimmed.slice(VEHICLE_PHOTOS_BUCKET.length + 1);

  try {
    const url = new URL(trimmed);
    const publicPrefix = `/storage/v1/object/public/${VEHICLE_PHOTOS_BUCKET}/`;
    const signedPrefix = `/storage/v1/object/sign/${VEHICLE_PHOTOS_BUCKET}/`;
    const prefix = url.pathname.includes(publicPrefix) ? publicPrefix : signedPrefix;
    const index = url.pathname.indexOf(prefix);
    if (index >= 0) return decodeURIComponent(url.pathname.slice(index + prefix.length));
  } catch {
    // Not an absolute URL; treat as a storage path.
  }

  return trimmed;
};

export const getVehiclePhotoUrl = async (value?: string | null) => {
  const pathOrUrl = parseStoragePath(value || '');
  if (!pathOrUrl) return '';
  if (isInlinePreview(pathOrUrl)) return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  if (!isSupabaseConfigured) {
    throw new Error('Supabase nao configurado. Nao foi possivel carregar a foto.');
  }

  const { data, error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .createSignedUrl(pathOrUrl, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Nao foi possivel gerar URL assinada para a foto.');
  }

  return data.signedUrl;
};

export const uploadVehiclePhoto = async (file: File, vehicleHint: string, ownerClientId: string) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem valido.');
  }
  const maxSizeMb = 8;
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`A imagem deve ter no maximo ${maxSizeMb}MB.`);
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase nao configurado. Upload local foi removido para evitar fotos que nao aparecem em outros dispositivos.');
  }

  const ownerFolder = sanitizeFileName(ownerClientId || '');
  if (!ownerFolder) {
    throw new Error('Cliente do veiculo nao identificado. Nao foi possivel definir o escopo seguro da foto.');
  }

  const extension = file.name.split('.').pop() || 'jpg';
  const safeName = sanitizeFileName(vehicleHint || file.name || 'veiculo');
  const path = `${ownerFolder}/${safeName}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) {
    throw new Error(`Nao foi possivel enviar a foto. Verifique se o bucket vehicle-photos existe no Supabase. Detalhe: ${error.message}`);
  }

  return `${VEHICLE_PHOTOS_BUCKET}:${path}`;
};
