// src/pages/SimulationDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import "../styles/SimulationDashboard.css";

// --- [복원] 팀원분의 원래 코드 시작 ---
const DATA_MIN = "2015-01-01";
const DATA_MAX = "2024-12-31";

type Row = {
    date: string;
    fx_rate: number | null;
    vix: number | null;
    etf_volume: number | null;
    gold_close: number | null;
    pred_close: number | null;
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
// --- [복원] 팀원분의 원래 코드 끝 ---

// --- [추가] 거래 시뮬레이션 결과 타입 ---
type SimResult = {
    buyPrice: number; sellPrice: number; buyAmount: number;
    purchasedGrams: number; finalValue: number; totalProfitLoss: number;
    yieldRate: number; portfolioHistory: { date: string; value: number }[];
};

const signNf2 = (n?: number | null) => {
    const num = n ?? 0;
    return num > 0 ? `+${nf2(num)}` : nf2(num);
};

export default function SimulationDashboard() {
    const [endDate, setEndDate] = useState<string>(DATA_MAX);
    const [unit, setUnit] = useState<Unit>("1m");
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // --- [추가] 거래 시뮬레이션 상태 ---
    const [tradeForm, setTradeForm] = useState({ buyDate: "2024-01-02", sellDate: "2024-01-31", buyAmount: "1000000" });
    const [simResult, setSimResult] = useState<SimResult | null>(null);
    const [simLoading, setSimLoading] = useState(false);
    const [simErr, setSimErr] = useState("");

    useEffect(() => {
        (window as any).setSimEndDate = (d: string) => setEndDate(d);
        return () => { delete (window as any).setSimEndDate; };
    }, []);

    useEffect(() => {
        const safeEnd = new Date(endDate) > new Date(DATA_MAX) ? DATA_MAX : new Date(endDate) < new Date(DATA_MIN) ? DATA_MIN : endDate;
        const qs = new URLSearchParams({ to: safeEnd, unit });
        setLoading(true); setErr("");
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
        return rows.map((r) => ({ ...r, fx_s: fxScale.to(r.fx_rate), vix_s: vixScale.to(r.vix), etf_s: etfScale.to(r.etf_volume) }));
    }, [rows]);

    const rangeText = rows.length ? `${rows[0].date} ~ ${rows[rows.length - 1].date}` : "-";
    const { count: xTickCount, fmt } = xTickConfig(unit);
    const xTickFormatter = (d: string) => formatDateStr(d, fmt);

    // --- [추가] 거래 시뮬레이션 실행 함수 ---
    const runTradeSimulation = async (e: React.FormEvent) => {
        e.preventDefault();
        setSimLoading(true); setSimErr(""); setSimResult(null);
        try {
            const res = await fetch("/api/simulation/trade", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...tradeForm, buyAmount: Number(tradeForm.buyAmount) }), });
            if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.message || "시뮬레이션 요청에 실패했습니다."); }
            setSimResult(await res.json());
        } catch (e: any) { setSimErr(e.message); } finally { setSimLoading(false); }
    };

    return (
        <main className="sim-wrap">
            <div className="sim-grid">
                <div className="sim-left">
                    {/* 그래프 1: 원래 코드 복원 */}
                    <section className="card">
                        <div className="card-head">
                            <h2>환율 / VIX / ETF 거래량 · 스케일(0~500)</h2>
                            <div className="sim-range">
                                {UNITS.map((u) => ( <button key={u.key} role="radio" aria-checked={unit === u.key} className={`range-card ${unit === u.key ? "active" : ""}`} onClick={() => setUnit(u.key)}> {u.label} </button> ))}
                            </div>
                        </div>
                        <div className="card-body chart-300">
                            {loading ? ( <div className="empty">불러오는 중</div> ) : !scaled.length ? ( <div className="empty">데이터 없음</div> ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={scaled}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" interval="preserveStartEnd" tickCount={xTickCount} tickFormatter={xTickFormatter}/>
                                        <YAxis tick={false} axisLine={false} width={0} />
                                        <Tooltip formatter={(v: any, name: any, p: any) => {
                                            const row = p?.payload as Row;
                                            if (p.dataKey === "fx_s")  return [`${nf2(row.fx_rate ?? 0)} 원/USD`, "환율(원값)"];
                                            if (p.dataKey === "vix_s") return [`${nf1(row.vix ?? 0)} pt`, "VIX(원값)"];
                                            if (p.dataKey === "etf_s") return [`${nf0(row.etf_volume ?? 0)} 주`, "ETF 거래량(원값)"];
                                            return [v, name];
                                        }} />
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

                    {/* 그래프 2: 원래 코드 복원 */}
                    <section className="card">
                        <div className="card-head"> <h2>금 시세 vs LSTM 예측</h2> </div>
                        <div className="card-body chart-320">
                            {loading ? ( <div className="empty">불러오는 중</div> ) : !rows.length ? ( <div className="empty">데이터 없음</div> ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={rows}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" interval="preserveStartEnd" tickCount={xTickCount} tickFormatter={xTickFormatter}/>
                                        <YAxis tickFormatter={(v) => nf0(v as number)} domain={['dataMin - 1000', 'dataMax + 1000']} />
                                        <Tooltip formatter={(v: any, name: any, p: any) => {
                                            if (p.dataKey === "gold_close") return [`${nf1(v)} 원/g`, "실제 금 시세"];
                                            if (p.dataKey === "pred_close") return [`${nf1(v)} 원/g`, "예측 금 시세"];
                                            return [v, name];
                                        }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="gold_close" name="실제 금 시세(원/g)" stroke="#fbc02d" dot={false}/>
                                        <Line type="monotone" dataKey="pred_close" name="예측 금 시세(원/g)" stroke="#f57c00" dot={false}/>
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="card-foot"><span className="muted">{rangeText}</span></div>
                    </section>

                    {/* 거래 시뮬레이션 UI (새로 추가) */}
                    <section className="card">
                        <div className="card-head"><h2>거래 시뮬레이션</h2></div>
                        <form className="card-body sim-trade-form" onSubmit={runTradeSimulation}>
                            <div className="field"> <label>매수일</label> <input type="date" value={tradeForm.buyDate} onChange={e => setTradeForm(s => ({...s, buyDate: e.target.value}))} /> </div>
                            <div className="field"> <label>매도일</label> <input type="date" value={tradeForm.sellDate} onChange={e => setTradeForm(s => ({...s, sellDate: e.target.value}))} /> </div>
                            <div className="field"> <label>매수금액(원)</label> <input type="number" value={tradeForm.buyAmount} onChange={e => setTradeForm(s => ({...s, buyAmount: e.target.value}))} /> </div>
                            <button className="sim-btn" type="submit" disabled={simLoading}>{simLoading ? "계산 중..." : "수익률 계산"}</button>
                        </form>
                    </section>

                    {/* 시뮬레이션 결과 (새로 추가) */}
                    {simErr ? <div className="card-body sim-err">{simErr}</div> : simResult &&
                        <section className="card">
                            <div className="card-head"><h2>시뮬레이션 결과</h2></div>
                            <div className="card-body">
                                <div className="sim-results">
                                    <div><span>수익률</span><strong>{signNf2(simResult.yieldRate)}%</strong></div>
                                    <div><span>총 손익</span><strong>{signNf2(simResult.totalProfitLoss)}원</strong></div>
                                    <div><span>최종 금액</span><strong>{nf0(simResult.finalValue)}원</strong></div>
                                </div>
                                <div className="chart-300">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={simResult.portfolioHistory}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tickFormatter={xTickFormatter} />
                                            <YAxis domain={['dataMin', 'dataMax']} tickFormatter={(v:number) => `${(v/10000).toFixed(0)}만`} />
                                            <Tooltip formatter={(v: any) => [`${nf0(v)} 원`, "포트폴리오 가치"]} />
                                            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>
                    }
                </div>
                <aside className="card news">
                    <div className="card-head"><h2>관련 뉴스</h2></div>
                    <div className="card-body news-body"><div className="empty">뉴스 없음</div></div>
                </aside>
            </div>
            {err && <div className="err">{err}</div>}
        </main>
    );
}