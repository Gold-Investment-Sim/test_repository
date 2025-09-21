// src/pages/SimulationDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import "../styles/SimulationDashboard.css";

const DATA_MIN = "2015-01-01";
const DATA_MAX = "2024-12-31";

type Row = {
  date: string;
  fx_rate: number | null;      // 원/USD
  vix: number | null;          // pt
  etf_volume: number | null;   // 주
  gold_close: number | null;   // 원/g
  pred_close: number | null;   // 원/g
};

type Unit = "10y" | "5y" | "1y" | "3m" | "1m" | "1w";
const UNITS: { key: Unit; label: string; days: number }[] = [
  { key: "10y", label: "10년", days: 3650 },
  { key: "5y",  label: "5년",  days: 1825 },
  { key: "1y",  label: "1년",  days: 365 },
  { key: "3m",  label: "3개월", days: 90 },
  { key: "1m",  label: "1개월", days: 30 },
  { key: "1w",  label: "1주일", days: 7 },
];

const nf0 = (n: number) => new Intl.NumberFormat().format(n ?? 0);
const nf1 = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n ?? 0);
const nf2 = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n ?? 0);

function minMaxScale(values: (number | null | undefined)[]) {
  const nums = values.filter((v): v is number => v != null && isFinite(v));
  if (!nums.length) return { to: (_: number | null | undefined) => null };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  return { to: (v: number | null | undefined) => (v == null ? null : ((v - min) / span) * 500) };
}

function xTickConfig(unit: Unit): { count: number; fmt: "yyyy" | "yyyy-MM" | "MM-dd" } {
  switch (unit) {
    case "10y": return { count: 12, fmt: "yyyy" };
    case "5y":  return { count: 10, fmt: "yyyy" };
    case "1y":  return { count: 12, fmt: "yyyy-MM" };
    case "3m":  return { count: 8,  fmt: "MM-dd" };
    case "1m":  return { count: 8,  fmt: "MM-dd" };
    case "1w":  return { count: 7,  fmt: "MM-dd" };
  }
}

function formatDateStr(d: string, fmt: "yyyy" | "yyyy-MM" | "MM-dd") {
  if (!d || d.length < 10) return d;
  const yyyy = d.slice(0, 4);
  const MM   = d.slice(5, 7);
  const dd   = d.slice(8, 10);
  if (fmt === "yyyy") return yyyy;
  if (fmt === "yyyy-MM") return `${yyyy}-${MM}`;
  return `${MM}-${dd}`;
}

export default function SimulationDashboard() {
  const [endDate, setEndDate] = useState<string>(DATA_MAX); // 모달에서 window.setSimEndDate로 변경 가능
  const [unit, setUnit] = useState<Unit>("1m");             // 범위 선택 UI는 첫 카드에만 표시
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 외부 모달 연동
  useEffect(() => {
    (window as any).setSimEndDate = (d: string) => setEndDate(d);
    return () => { delete (window as any).setSimEndDate; };
  }, []);

  // 시계열 데이터 조회
  useEffect(() => {
    const safeEnd =
      new Date(endDate) > new Date(DATA_MAX) ? DATA_MAX :
      new Date(endDate) < new Date(DATA_MIN) ? DATA_MIN : endDate;

    const qs = new URLSearchParams({ to: safeEnd, unit });
    setLoading(true);
    setErr("");
    fetch(`/api/simulation/quotes?${qs.toString()}`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: Row[]) => setRows(data ?? []))
      .catch((e) => setErr(e?.message || "데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, [endDate, unit]);

  const scaled = useMemo(() => {
    if (!rows.length) return [];
    const fxScale  = minMaxScale(rows.map((r) => r.fx_rate));
    const vixScale = minMaxScale(rows.map((r) => r.vix));
    const etfScale = minMaxScale(rows.map((r) => r.etf_volume));
    return rows.map((r) => ({
      ...r,
      fx_s:  fxScale.to(r.fx_rate),
      vix_s: vixScale.to(r.vix),
      etf_s: etfScale.to(r.etf_volume),
    }));
  }, [rows]);

  const rangeText = rows.length ? `${rows[0].date} ~ ${rows[rows.length - 1].date}` : "-";
  const { count: xTickCount, fmt } = xTickConfig(unit);
  const xTickFormatter = (d: string) => formatDateStr(d, fmt);

  // 범위 카드(한 번만 렌더)
  const RangeCards = (
    <div className="sim-range" role="radiogroup" aria-label="기간 선택">
      {UNITS.map((u) => (
        <button
          key={u.key}
          role="radio"
          aria-checked={unit === u.key}
          className={`range-card ${unit === u.key ? "active" : ""}`}
          onClick={() => setUnit(u.key)}
        >
          {u.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="sim-wrap">
      <div className="sim-grid">
        <div className="sim-left">
          {/* 그래프 1: 범위 UI 표시 */}
          <section className="card">
            <div className="card-head">
              <h2>환율 / VIX / ETF 거래량 · 스케일(0~500)</h2>
              <div className="card-actions">{RangeCards}</div>
            </div>
            <div className="card-body chart-300">
              {loading ? (
                <div className="empty">불러오는 중</div>
              ) : !scaled.length ? (
                <div className="empty">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scaled}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" interval="preserveStartEnd" tickCount={xTickCount} tickFormatter={xTickFormatter}/>
                    <YAxis tick={false} axisLine={false} width={0} />
                    <Tooltip
                      formatter={(v: any, name: any, p: any) => {
                        const row = p?.payload as Row;
                        if (p.dataKey === "fx_s")  return [`${nf2(row.fx_rate ?? 0)} 원/USD`, "환율(원값)"];
                        if (p.dataKey === "vix_s") return [`${nf1(row.vix ?? 0)} pt`, "VIX(원값)"];
                        if (p.dataKey === "etf_s") return [`${nf0(row.etf_volume ?? 0)} 주`, "ETF 거래량(원값)"];
                        return [v, name];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="fx_s"  name="환율(원/USD)"  stroke="#2563eb" dot={false} />
                    <Line type="monotone" dataKey="vix_s" name="VIX(pt)"       stroke="#ef4444" dot={false} />
                    <Line type="monotone" dataKey="etf_s" name="ETF 거래량(주)" stroke="#10b981" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="card-foot"><span className="muted">{rangeText}</span></div>
          </section>

          {/* 그래프 2: 범위 UI 없음 */}
          <section className="card">
            <div className="card-head">
              <h2>금 시세 vs LSTM 예측</h2>
            </div>
            <div className="card-body chart-320">
              {loading ? (
                <div className="empty">불러오는 중</div>
              ) : !rows.length ? (
                <div className="empty">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" interval="preserveStartEnd" tickCount={xTickCount} tickFormatter={xTickFormatter}/>
                    <YAxis tick={false} axisLine={false} width={0} />
                    <Tooltip
                      formatter={(v: any, name: any, p: any) => {
                        if (p.dataKey === "gold_close") return [`${nf1(v)} 원/g`, "실제 금 시세"];
                        if (p.dataKey === "pred_close") return [`${nf1(v)} 원/g`, "예측 금 시세"];
                        return [v, name];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="gold_close" name="실제 금 시세(원/g)" stroke="#fbc02d" dot={false}/>
                    <Line type="monotone" dataKey="pred_close" name="예측 금 시세(원/g)" stroke="#f57c00" dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="card-foot"><span className="muted">{rangeText}</span></div>
          </section>
        </div>

        {/* 뉴스: 선택 버튼 없음 */}
        <aside className="card news">
          <div className="card-head">
            <h2>관련 뉴스</h2>
          </div>
          <div className="card-body news-body">
            <div className="empty">뉴스 없음</div>
          </div>
        </aside>
      </div>

      {err && <div className="err">{err}</div>}
    </div>
  );
}
