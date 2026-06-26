import QRCode from "qrcode";

export interface QrBarangPayload {
  v: 1;
  t: "barang";
  id_barang: string;
  kode_barang: string;
  id_ruangan: string;
  kode_ruangan: string;
  nama_barang: string;
}

export interface QrRuanganPayload {
  v: 1;
  t: "ruangan";
  id_ruangan: string;
  kode_ruangan: string;
  nama_ruangan: string;
}

export type QrPayload = QrBarangPayload | QrRuanganPayload;

export function buildBarangPayload(params: {
  idBarang: string;
  kodeBarang: string;
  idRuangan: string;
  kodeRuangan: string;
  namaBarang: string;
}): QrBarangPayload {
  return {
    v: 1,
    t: "barang",
    id_barang: params.idBarang,
    kode_barang: params.kodeBarang,
    id_ruangan: params.idRuangan,
    kode_ruangan: params.kodeRuangan,
    nama_barang: params.namaBarang,
  };
}

export function buildRuanganPayload(params: {
  idRuangan: string;
  kodeRuangan: string;
  namaRuangan: string;
}): QrRuanganPayload {
  return {
    v: 1,
    t: "ruangan",
    id_ruangan: params.idRuangan,
    kode_ruangan: params.kodeRuangan,
    nama_ruangan: params.namaRuangan,
  };
}

export async function generateQrDataUrl(payload: QrPayload): Promise<string> {
  return QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
}
