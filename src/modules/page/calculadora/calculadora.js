import { LightningElement } from 'lwc';

// ── Constants ──────────────────────────────────────────────────────────────
const BASELINE_REVENUE      = 15_000_000;
const DIRECT_REVENUE        = BASELINE_REVENUE * 0.80;   // $12M
const TARGET_REVENUE        = 30_000_000;
const EXPANSION_BASELINE    = 0.03;
const MARKETING_INFLUENCED  = 0.25;
const REALIZATION_FACTOR    = 0.75;                      // live month 3
const REVENUE_AT_RISK       = BASELINE_REVENUE * 0.15;   // $2.25M churn baseline
const NPS_BASELINE          = 25;
const PROMOTER_MAX          = 70 * (BASELINE_REVENUE / 70) * 0.20 * 0.30; // ~$900K

function fmt(v) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000)     return `$${Math.round(v / 1_000)}K`;
    return `$${Math.round(v)}`;
}

// ── Datatable column definitions ───────────────────────────────────────────
const COLUMNS = [
    { label: 'Palanca',      fieldName: 'palanca', type: 'text', wrapText: true },
    { label: 'Cloud',        fieldName: 'cloud',   type: 'text' },
    { label: 'Aporte anual', fieldName: 'aporte',  type: 'text' },
    { label: '% del total',  fieldName: 'pct',     type: 'text' },
];

export default class Calculadora extends LightningElement {
    // ── Slider state (reactive) ────────────────────────────────────────────
    productivity  = 27;
    expansion     = 10;
    marketing     = 30;
    churnReduction = 25;
    npsLift       = 20;

    breakdownColumns = COLUMNS;

    // ── Full-run-rate levers (Y2+, no realization discount) ───────────────
    get lever1FR() { return DIRECT_REVENUE * (this.productivity / 100); }
    get lever2FR() { return Math.max(0, (this.expansion / 100 - EXPANSION_BASELINE) * BASELINE_REVENUE); }
    get lever3FR() { return BASELINE_REVENUE * MARKETING_INFLUENCED * (this.marketing / 100); }
    get lever4FR() { return (this.churnReduction / 100) * REVENUE_AT_RISK; }
    get lever5FR() { return (this.npsLift / 40) * PROMOTER_MAX; }
    get totalFR()  { return this.lever1FR + this.lever2FR + this.lever3FR + this.lever4FR + this.lever5FR; }
    get salesFR()  { return this.lever1FR + this.lever2FR + this.lever3FR; }
    get csFR()     { return this.lever4FR + this.lever5FR; }

    // ── Y1 (with realization factor) ──────────────────────────────────────
    get totalY1() {
        return (this.lever1FR + this.lever2FR + this.lever3FR + this.lever4FR + this.lever5FR) * REALIZATION_FACTOR;
    }

    // ── Projections ───────────────────────────────────────────────────────
    get sf_y2()        { return BASELINE_REVENUE + this.totalFR; }
    get gapClosedPct() { return Math.round((this.totalFR / (TARGET_REVENUE - BASELINE_REVENUE)) * 100); }
    get gapRemaining() { return Math.max(0, TARGET_REVENUE - this.sf_y2); }
    get npsProjected() { return NPS_BASELINE + this.npsLift; }

    // ── Display values (metric cards) ─────────────────────────────────────
    get annualValue()      { return fmt(this.totalFR); }
    get y2Value()          { return fmt(this.sf_y2); }
    get gapValue()         { return `${this.gapClosedPct}%`; }
    get csValue()          { return fmt(this.csFR); }

    // ── Display values (slider contributions) ─────────────────────────────
    get productivityContrib() { return fmt(this.lever1FR); }
    get expansionContrib()    { return fmt(this.lever2FR); }
    get marketingContrib()    { return fmt(this.lever3FR); }
    get churnContrib()        { return fmt(this.lever4FR); }
    get npsContrib()          { return fmt(this.lever5FR); }
    get churnProtected()      { return fmt(this.lever4FR); }

    // ── NPS display ───────────────────────────────────────────────────────
    get npsBeforeDisplay() { return NPS_BASELINE; }
    get npsAfterDisplay()  { return this.npsProjected; }
    get npsZoneLabel() {
        if (this.npsProjected >= 30) return 'Promotor ✓';
        if (this.npsProjected >= 0)  return 'Pasivo';
        return 'Detractor';
    }

    // ── Narrative display ─────────────────────────────────────────────────
    get salesContrib() { return fmt(this.salesFR); }
    get csContrib()    { return fmt(this.csFR); }
    get remaining()    { return fmt(this.gapRemaining); }

    // ── Breakdown datatable ───────────────────────────────────────────────
    get breakdownData() {
        const total = this.totalFR;
        const pct = (v) => (total > 0 ? `${Math.round((v / total) * 100)}%` : '0%');
        return [
            { id: '1',     palanca: 'Productividad de ventas',   cloud: 'Sales Cloud',      aporte: fmt(this.lever1FR), pct: pct(this.lever1FR) },
            { id: '2',     palanca: 'Expansión en cuentas',       cloud: 'Sales Cloud',      aporte: fmt(this.lever2FR), pct: pct(this.lever2FR) },
            { id: '3',     palanca: 'ROI de Marketing',           cloud: 'Marketing Cloud',  aporte: fmt(this.lever3FR), pct: pct(this.lever3FR) },
            { id: '4',     palanca: 'Reducción de churn (CSAT)',  cloud: 'Service Cloud',    aporte: fmt(this.lever4FR), pct: pct(this.lever4FR) },
            { id: '5',     palanca: 'NPS lift → promotores',      cloud: 'Service Cloud',    aporte: fmt(this.lever5FR), pct: pct(this.lever5FR) },
            { id: 'total', palanca: 'TOTAL',                      cloud: '',                 aporte: fmt(total),         pct: '100%' },
        ];
    }

    // ── Event handlers ────────────────────────────────────────────────────
    handleProductivityChange(event)  { this.productivity   = Number(event.detail.value); }
    handleExpansionChange(event)     { this.expansion      = Number(event.detail.value); }
    handleMarketingChange(event)     { this.marketing      = Number(event.detail.value); }
    handleChurnChange(event)         { this.churnReduction = Number(event.detail.value); }
    handleNpsChange(event)           { this.npsLift        = Number(event.detail.value); }
}
