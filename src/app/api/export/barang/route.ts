import { NextRequest, NextResponse } from "next/server";
import type { Kondisi, StatusBarang } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { toProblemResponse } from "@/lib/api/errors";
import { listLaporanInventaris } from "@/server/repositories/laporan.repo";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    await requireRole("INVENTARIS", "PIMPINAN");

    const { searchParams } = request.nextUrl;

    // Ambil semua data tanpa paginasi untuk export
    const [data] = await listLaporanInventaris(0, 10000, {
      ruanganId: searchParams.get("ruanganId") ?? undefined,
      jenisId: searchParams.get("jenisId") ?? undefined,
      kondisi: (searchParams.get("kondisi") as Kondisi) || undefined,
      statusBarang: (searchParams.get("statusBarang") as StatusBarang) || undefined,
      tahunPembelianMin: searchParams.get("tahunMin") ? Number(searchParams.get("tahunMin")) : undefined,
      tahunPembelianMax: searchParams.get("tahunMax") ? Number(searchParams.get("tahunMax")) : undefined,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistem Inventaris Fakultas";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Data Inventaris");

    // Header
    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Kode Barang", key: "kodeBarang", width: 22 },
      { header: "Nama Barang", key: "namaBarang", width: 30 },
      { header: "Jenis", key: "jenis", width: 18 },
      { header: "Tahun Pembelian", key: "tahunPembelian", width: 16 },
      { header: "Kondisi", key: "kondisi", width: 14 },
      { header: "Status", key: "status", width: 18 },
      { header: "Lokasi Terdaftar", key: "lokasiTerdaftar", width: 22 },
      { header: "Lokasi Aktual", key: "lokasiAktual", width: 22 },
      { header: "Penguasaan", key: "penguasaan", width: 22 },
      { header: "Flag Verifikasi", key: "flagVerifikasi", width: 16 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.border = {
      bottom: { style: "thin" },
    };

    // Data rows
    data.forEach((barang, idx) => {
      sheet.addRow({
        no: idx + 1,
        kodeBarang: barang.kodeBarang,
        namaBarang: barang.namaBarang,
        jenis: barang.jenis.nama,
        tahunPembelian: barang.tahunPembelian,
        kondisi: barang.kondisi,
        status: barang.statusBarang,
        lokasiTerdaftar: `${barang.lokasiTerdaftar.kodeRuangan} - ${barang.lokasiTerdaftar.namaRuangan}`,
        lokasiAktual: barang.lokasiAktual
          ? `${barang.lokasiAktual.kodeRuangan} - ${barang.lokasiAktual.namaRuangan}`
          : "-",
        penguasaan: barang.penguasaan ?? "-",
        flagVerifikasi: barang.flagVerifikasi,
      });
    });

    // Freeze header
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    // Auto-filter
    sheet.autoFilter = {
      from: "A1",
      to: `K1`,
    };

    const buffer = await workbook.xlsx.writeBuffer();

    const now = new Date();
    const filename = `inventaris-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return toProblemResponse(error);
  }
}
