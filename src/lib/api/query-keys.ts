export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  master: {
    gedung: (page: number, size: number) => ["master", "gedung", page, size] as const,
    ruangan: (page: number, size: number) => ["master", "ruangan", page, size] as const,
    pjLaboranOptions: () => ["master", "ruangan", "pj-laboran-options"] as const,
    jenisBarang: (page: number, size: number) => ["master", "jenis-barang", page, size] as const,
  },
  kategoriApproval: {
    list: (page: number, size: number) => ["kategori-approval", page, size] as const,
  },
  users: {
    list: (page: number, size: number) => ["users", page, size] as const,
  },
  barang: {
    list: (page: number, size: number, filters?: Record<string, string>) =>
      ["barang", "list", page, size, filters] as const,
    detail: (id: string) => ["barang", "detail", id] as const,
    qr: (id: string) => ["barang", "qr", id] as const,
  },
  pengajuan: {
    list: (page: number, size: number, filters?: Record<string, string>) =>
      ["pengajuan", "list", page, size, filters] as const,
    mine: (page: number, size: number) => ["pengajuan", "mine", page, size] as const,
    detail: (id: string) => ["pengajuan", "detail", id] as const,
  },
  scan: {
    list: (page: number, size: number) => ["scan", "list", page, size] as const,
    detail: (id: string) => ["scan", "detail", id] as const,
    baseline: (id: string) => ["scan", "baseline", id] as const,
  },
  laporan: {
    lokasi: (page: number, size: number, filters?: Record<string, string>) =>
      ["laporan", "lokasi", page, size, filters] as const,
    inventaris: (page: number, size: number, filters?: Record<string, string>) =>
      ["laporan", "inventaris", page, size, filters] as const,
    audit: (page: number, size: number, filters?: Record<string, string>) =>
      ["laporan", "audit", page, size, filters] as const,
  },
  penghapusan: {
    histori: (tahun?: number) => ["penghapusan", "histori", tahun] as const,
  },
  label: {
    config: () => ["label", "config"] as const,
    barang: (ruanganId: string) => ["label", "barang", ruanganId] as const,
  },
  maintenance: {
    list: () => ["maintenance", "list"] as const,
  },
  dashboard: {
    stats: () => ["dashboard", "stats"] as const,
  },
  notifikasi: {
    list: (page: number, size: number) => ["notifikasi", "list", page, size] as const,
    unread: () => ["notifikasi", "unread"] as const,
  },
};
