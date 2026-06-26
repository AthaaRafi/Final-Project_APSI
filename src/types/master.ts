export interface Gedung {
  id: string;
  kode: string;
  nama: string;
}

export interface JenisBarang {
  id: string;
  kode: string;
  nama: string;
}

export interface KategoriApproval {
  id: string;
  nama: string;
  wajibApproval: boolean;
  deskripsi: string | null;
}

export type TipeRuangan = "KELAS" | "LABORATORIUM";

export interface PenanggungJawab {
  id: string;
  userId: string;
  user: {
    id: string;
    nama: string;
    email: string;
    role: string;
  };
}

export interface Ruangan {
  id: string;
  kodeRuangan: string;
  namaRuangan: string;
  tipe: TipeRuangan;
  lantai: number | null;
  gedungId: string;
  gedung: Gedung;
  penanggungJawab: PenanggungJawab[];
}

export interface PjLaboranOption {
  id: string;
  nama: string;
  email: string;
  role: string;
}

export type Role = "PENGGUNA" | "PJ_RUANG" | "LABORAN" | "INVENTARIS" | "PIMPINAN";
export type StatusUser = "PENDING_VERIFICATION" | "ACTIVE" | "INACTIVE";

export interface ManagedUserArea {
  id: string;
  ruanganId: string;
  ruangan: {
    id: string;
    kodeRuangan: string;
    namaRuangan: string;
  };
}

export interface ManagedUser {
  id: string;
  email: string;
  nama: string;
  role: Role;
  status: StatusUser;
  areas: ManagedUserArea[];
}

// ── Barang ─────────────────────────────────────────────────────────────────────

export type Kondisi = "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT";
export type StatusBarang =
  | "NORMAL"
  | "DILAPORKAN_RUSAK"
  | "MENUNGGU_VALIDASI"
  | "DALAM_PERAWATAN"
  | "TERJADWAL_PERAWATAN"
  | "HILANG"
  | "DIAJUKAN_HAPUS"
  | "NONAKTIF";
export type FlagVerifikasi = "BELUM" | "TERVERIFIKASI" | "ANOMALI";

export interface RuanganSimple {
  id: string;
  kodeRuangan: string;
  namaRuangan: string;
  gedung: { id: string; kode: string; nama: string };
}

export interface Barang {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  jenisId: string;
  jenis: JenisBarang;
  kategoriApprovalId: string;
  kategoriApproval: KategoriApproval;
  tahunPembelian: number;
  nomorUrut: number;
  lokasiTerdaftarId: string;
  lokasiTerdaftar: RuanganSimple;
  lokasiAktualId: string;
  lokasiAktual: RuanganSimple;
  kondisi: Kondisi;
  statusBarang: StatusBarang;
  flagVerifikasi: FlagVerifikasi;
  penguasaan: string;
  fotoPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiwayatBarang {
  id: string;
  barangId: string;
  aktivitas: string;
  aktor: string;
  waktu: string;
}

export interface BarangDetail {
  barang: Barang;
  qr: { id: string; payload: string } | null;
  riwayat: RiwayatBarang[];
}

// ── Stock Opname ───────────────────────────────────────────────────────────────

export type StatusOpname = "AKTIF" | "SELESAI" | "BATAL";
export type StatusMatching = "COCOK" | "TIDAK_COCOK" | "TIDAK_TERDAFTAR";

export interface OpnameDetailBarang {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kondisi: Kondisi;
  statusBarang: StatusBarang;
  lokasiTerdaftar: RuanganSimple;
  lokasiAktual: RuanganSimple;
}

export interface OpnameDetail {
  id: string;
  opnameId: string;
  kodeBarangScan: string;
  barangId: string | null;
  barang: OpnameDetailBarang | null;
  statusMatching: StatusMatching;
  keterangan: string | null;
  ruanganAktualId: string | null;
  kondisi: Kondisi | null;
  waktuScan: string;
}

export interface BaselineBarang {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kondisi: Kondisi;
  statusBarang: StatusBarang;
  lokasiTerdaftar: { id: string; kodeRuangan: string; namaRuangan: string; gedung: { nama: string } };
  lokasiAktual: { id: string; kodeRuangan: string; namaRuangan: string };
}

export interface StockOpname {
  id: string;
  nomor: number;
  tahunAnggaran: number;
  ruanganId: string;
  ruangan: RuanganSimple;
  adminId: string;
  admin: { id: string; nama: string; email: string };
  tanggalScan: string;
  waktuSelesai: string | null;
  status: StatusOpname;
  jumlahBarangScan: number;
  jumlahCocok: number;
  jumlahTidakCocok: number;
  jumlahTidakTerdaftar: number;
  jumlahHilang: number;
  catatan: string | null;
  detail: OpnameDetail[];
}

// ── Pengajuan ──────────────────────────────────────────────────────────────────

export type JenisPengajuan = "PEMINDAHAN" | "PEMELIHARAAN" | "KERUSAKAN" | "PENGHAPUSAN";
export type StatusPengajuan =
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
  | "REVISI"
  | "SELESAI"
  | "LANGSUNG_TERCATAT"
  | "DIBATALKAN";
export type SumberPenghapusan = "LAPORAN_KERUSAKAN" | "STOCK_OPNAME" | "MANUAL";

export interface Lampiran {
  id: string;
  path: string;
  tipe: string;
}

export interface Pengajuan {
  id: string;
  nomor: string;
  jenis: JenisPengajuan;
  barangId: string;
  barang: Pick<Barang, "id" | "kodeBarang" | "namaBarang"> & {
    jenis: JenisBarang;
    lokasiTerdaftar: RuanganSimple;
    lokasiAktual: RuanganSimple;
    kategoriApproval: KategoriApproval;
  };
  pengajuId: string;
  pengaju: { id: string; nama: string; email: string; role: string };
  lokasiAsalId: string | null;
  lokasiTujuanId: string | null;
  isAntarArea: boolean;
  approvalAsalBy: string | null;
  approvalTujuanBy: string | null;
  alasan: string;
  sumber: SumberPenghapusan | null;
  sumberRefId: string | null;
  status: StatusPengajuan;
  catatanAdmin: string | null;
  lampiran: Lampiran[];
  createdAt: string;
  updatedAt: string;
}

// ── Notifikasi ─────────────────────────────────────────────────────────────────

export interface Notifikasi {
  id: string;
  userId: string;
  tipe: string;
  pesan: string;
  pengajuanId: string | null;
  barangId: string | null;
  dibaca: boolean;
  createdAt: string;
}

// ── Label ──────────────────────────────────────────────────────────────────────

export interface KonfigurasiLabel {
  id: string;
  ukuranPanjang: number;
  ukuranLebar: number;
  jumlahPerA4: number;
  layoutKolom: number;
  fontKode: string;
  fontNama: string;
  logoPath: string | null;
}

export interface BarangForLabel {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  qr: Array<{ id: string; payload: string; aktif: boolean }>;
}

// ── Laporan ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  aktor: string;
  aksi: string;
  entitas: string;
  entitasId: string | null;
  detail: string | null;
  waktu: string;
}

export interface LokasiBarangItem {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kondisi: Kondisi;
  statusBarang: StatusBarang;
  jenis: JenisBarang;
  lokasiTerdaftar: RuanganSimple;
  lokasiAktual: RuanganSimple;
  updatedAt: string;
}

export interface JadwalMaintenanceItem {
  id: string;
  jenisId: string | null;
  barangId: string | null;
  intervalBulan: number;
  nextDueDate: string | null;
  createdAt: string;
}
