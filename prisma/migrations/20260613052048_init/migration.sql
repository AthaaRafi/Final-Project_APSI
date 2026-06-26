-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `role` ENUM('PENGGUNA', 'PJ_RUANG', 'LABORAN', 'INVENTARIS', 'PIMPINAN') NOT NULL DEFAULT 'PENGGUNA',
    `status` ENUM('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `emailVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_ruangan` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ruanganId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_ruangan_userId_ruanganId_key`(`userId`, `ruanganId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verification_token` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email_verification_token_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_otp` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_attempt` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `login_attempt_email_attemptedAt_idx`(`email`, `attemptedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gedung` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `gedung_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ruangan` (
    `id` VARCHAR(191) NOT NULL,
    `kode_ruangan` VARCHAR(191) NOT NULL,
    `nama_ruangan` VARCHAR(191) NOT NULL,
    `tipe` ENUM('KELAS', 'LABORATORIUM') NOT NULL DEFAULT 'KELAS',
    `lantai` INTEGER NULL,
    `gedungId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ruangan_kode_ruangan_key`(`kode_ruangan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jenis_barang` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `jenis_barang_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_approval` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `wajibApproval` BOOLEAN NOT NULL DEFAULT false,
    `deskripsi` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barang` (
    `id` VARCHAR(191) NOT NULL,
    `kodeBarang` VARCHAR(191) NOT NULL,
    `namaBarang` VARCHAR(191) NOT NULL,
    `jenisId` VARCHAR(191) NOT NULL,
    `tahunPembelian` INTEGER NOT NULL,
    `nomorUrut` INTEGER NOT NULL,
    `lokasiTerdaftarId` VARCHAR(191) NOT NULL,
    `lokasiAktualId` VARCHAR(191) NOT NULL,
    `kondisi` ENUM('BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT') NOT NULL DEFAULT 'BAIK',
    `statusBarang` ENUM('NORMAL', 'DILAPORKAN_RUSAK', 'MENUNGGU_VALIDASI', 'DALAM_PERAWATAN', 'TERJADWAL_PERAWATAN', 'HILANG', 'DIAJUKAN_HAPUS', 'NONAKTIF') NOT NULL DEFAULT 'NORMAL',
    `flagVerifikasi` ENUM('BELUM', 'TERVERIFIKASI', 'ANOMALI') NOT NULL DEFAULT 'BELUM',
    `kategoriApprovalId` VARCHAR(191) NOT NULL,
    `penguasaan` VARCHAR(191) NOT NULL,
    `fotoPath` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `barang_kodeBarang_key`(`kodeBarang`),
    INDEX `barang_lokasiAktualId_idx`(`lokasiAktualId`),
    INDEX `barang_lokasiTerdaftarId_idx`(`lokasiTerdaftarId`),
    INDEX `barang_statusBarang_idx`(`statusBarang`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qr_code` (
    `id` VARCHAR(191) NOT NULL,
    `tipe` ENUM('BARANG', 'RUANGAN') NOT NULL DEFAULT 'BARANG',
    `barangId` VARCHAR(191) NULL,
    `ruanganId` VARCHAR(191) NULL,
    `payload` TINYTEXT NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `qr_code_barangId_idx`(`barangId`),
    INDEX `qr_code_ruanganId_idx`(`ruanganId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan` (
    `id` VARCHAR(191) NOT NULL,
    `nomor` VARCHAR(191) NOT NULL,
    `jenis` ENUM('PEMINDAHAN', 'PEMELIHARAAN', 'KERUSAKAN', 'PENGHAPUSAN') NOT NULL,
    `barangId` VARCHAR(191) NOT NULL,
    `pengajuId` VARCHAR(191) NOT NULL,
    `lokasiAsalId` VARCHAR(191) NULL,
    `lokasiTujuanId` VARCHAR(191) NULL,
    `isAntarArea` BOOLEAN NOT NULL DEFAULT false,
    `approvalAsalBy` VARCHAR(191) NULL,
    `approvalTujuanBy` VARCHAR(191) NULL,
    `alasan` TEXT NOT NULL,
    `sumber` ENUM('LAPORAN_KERUSAKAN', 'STOCK_OPNAME', 'MANUAL') NULL,
    `sumberRefId` VARCHAR(191) NULL,
    `status` ENUM('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'REVISI', 'SELESAI', 'LANGSUNG_TERCATAT', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU',
    `catatanAdmin` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pengajuan_nomor_key`(`nomor`),
    INDEX `pengajuan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_barang` (
    `id` VARCHAR(191) NOT NULL,
    `barangId` VARCHAR(191) NOT NULL,
    `aktivitas` TEXT NOT NULL,
    `aktor` VARCHAR(191) NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_barang_barangId_idx`(`barangId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lampiran` (
    `id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `barangId` VARCHAR(191) NULL,
    `pengajuanId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_opname` (
    `id` VARCHAR(191) NOT NULL,
    `nomor` INTEGER NOT NULL AUTO_INCREMENT,
    `tahunAnggaran` INTEGER NOT NULL DEFAULT 0,
    `ruanganId` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `tanggalScan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `waktuSelesai` DATETIME(3) NULL,
    `status` ENUM('AKTIF', 'SELESAI', 'BATAL') NOT NULL DEFAULT 'AKTIF',
    `jumlahBarangScan` INTEGER NOT NULL DEFAULT 0,
    `jumlahCocok` INTEGER NOT NULL DEFAULT 0,
    `jumlahTidakCocok` INTEGER NOT NULL DEFAULT 0,
    `jumlahTidakTerdaftar` INTEGER NOT NULL DEFAULT 0,
    `jumlahHilang` INTEGER NOT NULL DEFAULT 0,
    `catatan` TEXT NULL,

    UNIQUE INDEX `stock_opname_nomor_key`(`nomor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_opname_detail` (
    `id` VARCHAR(191) NOT NULL,
    `opnameId` VARCHAR(191) NOT NULL,
    `kodeBarangScan` VARCHAR(191) NOT NULL,
    `barangId` VARCHAR(191) NULL,
    `statusMatching` ENUM('COCOK', 'TIDAK_COCOK', 'TIDAK_TERDAFTAR') NOT NULL,
    `keterangan` TEXT NULL,
    `ruanganAktualId` VARCHAR(191) NULL,
    `kondisi` ENUM('BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT') NULL,
    `fotoPath` VARCHAR(191) NULL,
    `waktuScan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_opname_detail_opnameId_idx`(`opnameId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `konfigurasi_label` (
    `id` VARCHAR(191) NOT NULL,
    `ukuranPanjang` DOUBLE NOT NULL DEFAULT 6,
    `ukuranLebar` DOUBLE NOT NULL DEFAULT 2.5,
    `jumlahPerA4` INTEGER NOT NULL DEFAULT 10,
    `layoutKolom` INTEGER NOT NULL DEFAULT 2,
    `fontKode` VARCHAR(191) NOT NULL DEFAULT 'Arial Bold 8pt',
    `fontNama` VARCHAR(191) NOT NULL DEFAULT 'Arial 6pt',
    `logoPath` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_cetak_label` (
    `id` VARCHAR(191) NOT NULL,
    `ruanganId` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `jumlahLabel` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `aktor` VARCHAR(191) NOT NULL,
    `aksi` VARCHAR(191) NOT NULL,
    `entitas` VARCHAR(191) NOT NULL,
    `entitasId` VARCHAR(191) NULL,
    `detail` TEXT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_entitas_entitasId_idx`(`entitas`, `entitasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jadwal_maintenance` (
    `id` VARCHAR(191) NOT NULL,
    `jenisId` VARCHAR(191) NULL,
    `barangId` VARCHAR(191) NULL,
    `intervalBulan` INTEGER NOT NULL,
    `nextDueDate` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifikasi` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tipe` ENUM('PENGAJUAN_DISETUJUI', 'PENGAJUAN_DITOLAK', 'PENGAJUAN_SELESAI', 'PENGAJUAN_REVISI', 'PENGAJUAN_DIBATALKAN', 'LAPORAN_BARU', 'LAPORAN_DIPROSES', 'LAPORAN_DITOLAK', 'LAPORAN_SELESAI', 'PENGAJUAN_BARU', 'PENGHAPUSAN_BARU', 'MAINTENANCE_JATUH_TEMPO') NOT NULL,
    `pesan` TEXT NOT NULL,
    `pengajuanId` VARCHAR(191) NULL,
    `laporanId` VARCHAR(191) NULL,
    `barangId` VARCHAR(191) NULL,
    `dibaca` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifikasi_userId_dibaca_idx`(`userId`, `dibaca`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_ruangan` ADD CONSTRAINT `user_ruangan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_ruangan` ADD CONSTRAINT `user_ruangan_ruanganId_fkey` FOREIGN KEY (`ruanganId`) REFERENCES `ruangan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ruangan` ADD CONSTRAINT `ruangan_gedungId_fkey` FOREIGN KEY (`gedungId`) REFERENCES `gedung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barang` ADD CONSTRAINT `barang_jenisId_fkey` FOREIGN KEY (`jenisId`) REFERENCES `jenis_barang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barang` ADD CONSTRAINT `barang_lokasiTerdaftarId_fkey` FOREIGN KEY (`lokasiTerdaftarId`) REFERENCES `ruangan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barang` ADD CONSTRAINT `barang_lokasiAktualId_fkey` FOREIGN KEY (`lokasiAktualId`) REFERENCES `ruangan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barang` ADD CONSTRAINT `barang_kategoriApprovalId_fkey` FOREIGN KEY (`kategoriApprovalId`) REFERENCES `kategori_approval`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_code` ADD CONSTRAINT `qr_code_barangId_fkey` FOREIGN KEY (`barangId`) REFERENCES `barang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_code` ADD CONSTRAINT `qr_code_ruanganId_fkey` FOREIGN KEY (`ruanganId`) REFERENCES `ruangan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan` ADD CONSTRAINT `pengajuan_barangId_fkey` FOREIGN KEY (`barangId`) REFERENCES `barang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan` ADD CONSTRAINT `pengajuan_pengajuId_fkey` FOREIGN KEY (`pengajuId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_barang` ADD CONSTRAINT `riwayat_barang_barangId_fkey` FOREIGN KEY (`barangId`) REFERENCES `barang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lampiran` ADD CONSTRAINT `lampiran_pengajuanId_fkey` FOREIGN KEY (`pengajuanId`) REFERENCES `pengajuan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_opname` ADD CONSTRAINT `stock_opname_ruanganId_fkey` FOREIGN KEY (`ruanganId`) REFERENCES `ruangan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_opname` ADD CONSTRAINT `stock_opname_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_opname_detail` ADD CONSTRAINT `stock_opname_detail_opnameId_fkey` FOREIGN KEY (`opnameId`) REFERENCES `stock_opname`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_opname_detail` ADD CONSTRAINT `stock_opname_detail_barangId_fkey` FOREIGN KEY (`barangId`) REFERENCES `barang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_opname_detail` ADD CONSTRAINT `stock_opname_detail_ruanganAktualId_fkey` FOREIGN KEY (`ruanganAktualId`) REFERENCES `ruangan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_cetak_label` ADD CONSTRAINT `log_cetak_label_ruanganId_fkey` FOREIGN KEY (`ruanganId`) REFERENCES `ruangan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
