"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_PENGAJUAN_LABEL, STATUS_PENGAJUAN_VARIANT } from "@/lib/pengajuan-constants";
import type { StatusPengajuan } from "@/types/master";

export function StatusPengajuanBadge({ status }: { status: StatusPengajuan }) {
  return (
    <Badge variant={STATUS_PENGAJUAN_VARIANT[status]}>
      {STATUS_PENGAJUAN_LABEL[status]}
    </Badge>
  );
}
