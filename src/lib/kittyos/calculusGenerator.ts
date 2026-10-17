export type CalculusDifficulty = "easy" | "medium" | "hard";

export type TemplateId =
  | "easy_poly_deriv"
  | "easy_poly_integral"
  | "easy_poly_limit"
  | "med_chain_rule"
  | "med_product_rule"
  | "med_cubic_integral"
  | "med_removable_limit"
  | "hard_limit_sin_kx"
  | "hard_limit_exp_kx"
  | "hard_deriv_exp_or_ln"
  | "hard_second_deriv"
  | "hard_trig_integral"
  | "hard_by_parts"
  | "hard_area_between_curves";

export interface GeneratedQuestion {
  prompt: string;
  answer: number;
  hint: string;
  topic: string;
  templateId: TemplateId;
}

export interface TemplateDefinition {
  id: TemplateId;
  difficulty: CalculusDifficulty;
  topic: string;
  generate: (rng: () => number) => GeneratedQuestion;
  evaluateExact: (q: GeneratedQuestion) => number;
  evaluateNumerical: (q: GeneratedQuestion) => number;
}

export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseIntegerAnswer(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\u2212/g, "-");
  if (!/^[+-]?\d+(\.0+)?$/.test(trimmed)) {
    return null;
  }
  const val = Number(trimmed);
  if (!Number.isFinite(val) || !Number.isInteger(val)) {
    return null;
  }
  return val === 0 ? 0 : val;
}

function randInt(min: number, max: number, rng: () => number, excludeZero = false): number {
  let val: number;
  do {
    val = Math.floor(rng() * (max - min + 1)) + min;
  } while (excludeZero && val === 0);
  return val;
}

function superscript(exp: number): string {
  const map: Record<number, string> = {
    0: "⁰",
    1: "¹",
    2: "²",
    3: "³",
    4: "⁴",
    5: "⁵",
    6: "⁶",
    7: "⁷",
    8: "⁸",
    9: "⁹",
  };
  return String(exp)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}

export function formatPoly(terms: { coeff: number; exp: number }[]): string {
  const active = terms.filter((t) => t.coeff !== 0);
  if (active.length === 0) return "0";

  let out = "";
  active.forEach((t, i) => {
    const isFirst = i === 0;
    const sign = t.coeff < 0 ? (isFirst ? "−" : " − ") : (isFirst ? "" : " + ");
    const abs = Math.abs(t.coeff);

    let body = "";
    if (t.exp === 0) {
      body = String(abs);
    } else if (t.exp === 1) {
      body = abs === 1 ? "x" : `${abs}x`;
    } else {
      const expStr = superscript(t.exp);
      body = abs === 1 ? `x${expStr}` : `${abs}x${expStr}`;
    }

    out += `${sign}${body}`;
  });

  return out;
}

export function formatLinear(a: number, b: number): string {
  if (a === 0) return String(b);
  const aStr = a === 1 ? "x" : a === -1 ? "−x" : `${a < 0 ? "−" + Math.abs(a) : a}x`;
  if (b === 0) return aStr;
  const bSign = b < 0 ? " − " : " + ";
  return `${aStr}${bSign}${Math.abs(b)}`;
}

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  easy_poly_deriv: {
    id: "easy_poly_deriv",
    difficulty: "easy",
    topic: "DERIVATIVES",
    generate: (rng) => {
      let a = 0;
      let b = 0;
      let c = 0;
      let d = 0;
      let x0 = 0;
      let ans = 0;
      do {
        a = randInt(-2, 2, rng, true);
        b = randInt(-4, 4, rng);
        c = randInt(-6, 6, rng);
        d = randInt(-8, 8, rng);
        x0 = randInt(-3, 3, rng);
        ans = 3 * a * x0 * x0 + 2 * b * x0 + c;
      } while (Math.abs(ans) > 500);

      const terms = [
        { coeff: a, exp: 3 },
        { coeff: b, exp: 2 },
        { coeff: c, exp: 1 },
        { coeff: d, exp: 0 },
      ];

      return {
        templateId: "easy_poly_deriv",
        prompt: `Find dy/dx of y = ${formatPoly(terms)} at x = ${x0}:`,
        answer: ans,
        hint: "power rule: d/dx xⁿ = n·xⁿ⁻¹",
        topic: "DERIVATIVES",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/Find dy\/dx of y = (.+) at x = (-?\d+):/);
      if (!match) return q.answer;
      const x0 = Number(match[2]);
      const f = parsePolyFromPrompt(match[1]);
      const h = 1e-5;
      return (f(x0 + h) - f(x0 - h)) / (2 * h);
    },
  },

  easy_poly_integral: {
    id: "easy_poly_integral",
    difficulty: "easy",
    topic: "DEFINITE INTEGRALS",
    generate: (rng) => {
      let k = 0;
      let m = 0;
      let n = 0;
      let p = 0;
      let q = 0;
      let ans = 0;
      do {
        k = randInt(-2, 2, rng);
        m = randInt(-3, 3, rng, k === 0);
        n = randInt(-5, 5, rng);
        p = randInt(-3, 2, rng);
        q = randInt(p + 1, p + 4, rng);

        const F = (x: number) => k * x * x * x + m * x * x + n * x;
        ans = F(q) - F(p);
      } while (Math.abs(ans) > 500);

      const terms = [
        { coeff: 3 * k, exp: 2 },
        { coeff: 2 * m, exp: 1 },
        { coeff: n, exp: 0 },
      ];

      return {
        templateId: "easy_poly_integral",
        prompt: `Evaluate: ∫ from ${p} to ${q} of (${formatPoly(terms)}) dx =`,
        answer: ans,
        hint: "find the antiderivative F(x) and evaluate F(b) − F(a)",
        topic: "DEFINITE INTEGRALS",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/∫ from (-?\d+) to (-?\d+) of \((.+)\) dx =/);
      if (!match) return q.answer;
      const p = Number(match[1]);
      const qVal = Number(match[2]);
      const f = parsePolyFromPrompt(match[3]);
      return simpsonsRule(f, p, qVal, 1000);
    },
  },

  easy_poly_limit: {
    id: "easy_poly_limit",
    difficulty: "easy",
    topic: "LIMITS",
    generate: (rng) => {
      let a = 0;
      let b = 0;
      let c = 0;
      let x0 = 0;
      let ans = 0;
      do {
        a = randInt(-3, 3, rng, true);
        b = randInt(-5, 5, rng);
        c = randInt(-8, 8, rng);
        x0 = randInt(-4, 4, rng);
        ans = a * x0 * x0 + b * x0 + c;
      } while (Math.abs(ans) > 500);

      const terms = [
        { coeff: a, exp: 2 },
        { coeff: b, exp: 1 },
        { coeff: c, exp: 0 },
      ];

      return {
        templateId: "easy_poly_limit",
        prompt: `Evaluate the limit: lim (x → ${x0}) of (${formatPoly(terms)}) =`,
        answer: ans,
        hint: "polynomials are continuous everywhere; evaluate by direct substitution",
        topic: "LIMITS",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/lim \(x → (-?\d+)\) of \((.+)\) =/);
      if (!match) return q.answer;
      const x0 = Number(match[1]);
      const f = parsePolyFromPrompt(match[2]);
      const eps = 1e-6;
      return (f(x0 + eps) + f(x0 - eps)) / 2;
    },
  },

  med_chain_rule: {
    id: "med_chain_rule",
    difficulty: "medium",
    topic: "CHAIN RULE",
    generate: (rng) => {
      let a = 0;
      let b = 0;
      let n = 2;
      let x0 = 0;
      let ans = 0;
      do {
        n = randInt(2, 3, rng);
        a = randInt(-3, 3, rng, true);
        x0 = randInt(-3, 3, rng);
        const u = randInt(-3, 3, rng);
        b = u - a * x0;
        ans = n * a * Math.pow(u, n - 1);
      } while (Math.abs(ans) > 500);

      return {
        templateId: "med_chain_rule",
        prompt: `Find dy/dx of y = (${formatLinear(a, b)})${superscript(n)} at x = ${x0}:`,
        answer: ans,
        hint: "chain rule: d/dx [g(x)]ⁿ = n·[g(x)]ⁿ⁻¹ · g'(x)",
        topic: "CHAIN RULE",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/y = \((.+)\)([²³⁴]) at x = (-?\d+):/);
      if (!match) return q.answer;
      const linearStr = match[1];
      const exp = match[2] === "²" ? 2 : match[2] === "³" ? 3 : 4;
      const x0 = Number(match[3]);
      const lin = parseLinear(linearStr);
      const f = (x: number) => Math.pow(lin(x), exp);
      const h = 1e-5;
      return (f(x0 + h) - f(x0 - h)) / (2 * h);
    },
  },

  med_product_rule: {
    id: "med_product_rule",
    difficulty: "medium",
    topic: "PRODUCT RULE",
    generate: (rng) => {
      let a = 0;
      let b = 0;
      let c = 0;
      let d = 0;
      let x0 = 0;
      let ans = 0;
      do {
        a = randInt(-3, 3, rng, true);
        b = randInt(-5, 5, rng);
        c = randInt(-3, 3, rng, true);
        d = randInt(-5, 5, rng);
        x0 = randInt(-3, 3, rng);
        ans = a * (c * x0 + d) + c * (a * x0 + b);
      } while (Math.abs(ans) > 500);

      return {
        templateId: "med_product_rule",
        prompt: `Find dy/dx of y = (${formatLinear(a, b)})(${formatLinear(c, d)}) at x = ${x0}:`,
        answer: ans,
        hint: "product rule: (u·v)' = u'·v + u·v'",
        topic: "PRODUCT RULE",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/y = \((.+)\)\((.+)\) at x = (-?\d+):/);
      if (!match) return q.answer;
      const u = parseLinear(match[1]);
      const v = parseLinear(match[2]);
      const x0 = Number(match[3]);
      const f = (x: number) => u(x) * v(x);
      const h = 1e-5;
      return (f(x0 + h) - f(x0 - h)) / (2 * h);
    },
  },

  med_cubic_integral: {
    id: "med_cubic_integral",
    difficulty: "medium",
    topic: "DEFINITE INTEGRALS",
    generate: (rng) => {
      let k = 0;
      let m = 0;
      let n = 0;
      let c = 0;
      let p = 0;
      let q = 0;
      let ans = 0;
      do {
        k = randInt(-2, 2, rng, true);
        m = randInt(-2, 2, rng);
        n = randInt(-3, 3, rng);
        c = randInt(-4, 4, rng);
        p = randInt(-2, 1, rng);
        q = randInt(p + 1, p + 3, rng);

        const F = (x: number) => k * Math.pow(x, 4) + m * Math.pow(x, 3) + n * Math.pow(x, 2) + c * x;
        ans = F(q) - F(p);
      } while (Math.abs(ans) > 500);

      const terms = [
        { coeff: 4 * k, exp: 3 },
        { coeff: 3 * m, exp: 2 },
        { coeff: 2 * n, exp: 1 },
        { coeff: c, exp: 0 },
      ];

      return {
        templateId: "med_cubic_integral",
        prompt: `Evaluate: ∫ from ${p} to ${q} of (${formatPoly(terms)}) dx =`,
        answer: ans,
        hint: "antiderivative of x³ is x⁴/4; evaluate F(b) − F(a)",
        topic: "DEFINITE INTEGRALS",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/∫ from (-?\d+) to (-?\d+) of \((.+)\) dx =/);
      if (!match) return q.answer;
      const p = Number(match[1]);
      const qVal = Number(match[2]);
      const f = parsePolyFromPrompt(match[3]);
      return simpsonsRule(f, p, qVal, 1000);
    },
  },

  med_removable_limit: {
    id: "med_removable_limit",
    difficulty: "medium",
    topic: "LIMITS",
    generate: (rng) => {
      const a = randInt(-12, 12, rng, true);
      const aSq = a * a;
      const ans = 2 * a;
      const den = a > 0 ? `x − ${a}` : `x + ${Math.abs(a)}`;

      return {
        templateId: "med_removable_limit",
        prompt: `Evaluate the limit: lim (x → ${a}) of (x² − ${aSq}) / (${den}) =`,
        answer: ans,
        hint: "factor the numerator as difference of squares: (x − a)(x + a)",
        topic: "LIMITS",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/lim \(x → (-?\d+)\) of \(x² − (\d+)\) \/ \((.+)\) =/);
      if (!match) return q.answer;
      const a = Number(match[1]);
      const aSq = Number(match[2]);
      const denFn = (x: number) => (a > 0 ? x - a : x + Math.abs(a));
      const f = (x: number) => (x * x - aSq) / denFn(x);
      const eps = 1e-6;
      return (f(a + eps) + f(a - eps)) / 2;
    },
  },

  hard_limit_sin_kx: {
    id: "hard_limit_sin_kx",
    difficulty: "hard",
    topic: "TRIG LIMITS",
    generate: (rng) => {
      const k = randInt(-15, 15, rng, true);
      const kStr = k === 1 ? "" : k === -1 ? "−" : `${k < 0 ? "−" + Math.abs(k) : k}`;

      return {
        templateId: "hard_limit_sin_kx",
        prompt: `Evaluate: lim (x → 0) of sin(${kStr}x) / x =`,
        answer: k,
        hint: "fundamental trig limit: lim (x → 0) sin(kx)/x = k",
        topic: "TRIG LIMITS",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const k = q.answer;
      const x = 1e-6;
      return Math.sin(k * x) / x;
    },
  },

  hard_limit_exp_kx: {
    id: "hard_limit_exp_kx",
    difficulty: "hard",
    topic: "EXPONENTIAL LIMITS",
    generate: (rng) => {
      const k = randInt(-15, 15, rng, true);

      return {
        templateId: "hard_limit_exp_kx",
        prompt: `Evaluate: lim (x → 0) of (e^(${k}x) − 1) / x =`,
        answer: k,
        hint: "use L'Hôpital's rule or definition of derivative: d/dx eᵏˣ at x = 0 is k",
        topic: "EXPONENTIAL LIMITS",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const k = q.answer;
      const x = 1e-6;
      return ((Math.exp(k * x) - 1) / x + (Math.exp(-k * x) - 1) / -x) / 2;
    },
  },

  hard_deriv_exp_or_ln: {
    id: "hard_deriv_exp_or_ln",
    difficulty: "hard",
    topic: "DERIVATIVES",
    generate: (rng) => {
      const isExp = rng() > 0.5;
      const c = randInt(-8, 8, rng, true);
      const k = randInt(-8, 8, rng, true);
      const ans = c * k;

      if (isExp) {
        const cStr = c === 1 ? "" : c === -1 ? "−" : `${c < 0 ? "−" + Math.abs(c) : c}`;
        return {
          templateId: "hard_deriv_exp_or_ln",
          prompt: `Find f'(0) if f(x) = ${cStr}e^(${k}x):`,
          answer: ans,
          hint: "chain rule: d/dx eᵏˣ = k·eᵏˣ; at x = 0, e⁰ = 1",
          topic: "DERIVATIVES",
        };
      } else {
        const cStr = c === 1 ? "" : c === -1 ? "−" : `${c < 0 ? "−" + Math.abs(c) : c}`;
        return {
          templateId: "hard_deriv_exp_or_ln",
          prompt: `Find f'(0) if f(x) = ${cStr}ln(${formatLinear(k, 1)}):`,
          answer: ans,
          hint: "chain rule: d/dx ln(kx + 1) = k/(kx + 1); evaluate at x = 0",
          topic: "DERIVATIVES",
        };
      }
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const expMatch = q.prompt.match(/f\(x\) = (.*)e\^\((-?\d+)x\):/);
      if (expMatch) {
        const rawC = expMatch[1];
        const c = rawC === "" ? 1 : rawC === "−" ? -1 : Number(rawC.replace("−", "-"));
        const k = Number(expMatch[2]);
        const f = (x: number) => c * Math.exp(k * x);
        const h = 1e-5;
        return (f(h) - f(-h)) / (2 * h);
      }
      const lnMatch = q.prompt.match(/f\(x\) = (.*)ln\((.+)\):/);
      if (lnMatch) {
        const rawC = lnMatch[1];
        const c = rawC === "" ? 1 : rawC === "−" ? -1 : Number(rawC.replace("−", "-"));
        const lin = parseLinear(lnMatch[2]);
        const f = (x: number) => c * Math.log(lin(x));
        const h = 1e-5;
        return (f(h) - f(-h)) / (2 * h);
      }
      return q.answer;
    },
  },

  hard_second_deriv: {
    id: "hard_second_deriv",
    difficulty: "hard",
    topic: "SECOND DERIVATIVES",
    generate: (rng) => {
      let a = 0;
      let b = 0;
      let c = 0;
      let d = 0;
      let e = 0;
      let x0 = 0;
      let ans = 0;
      do {
        a = randInt(-2, 2, rng, true);
        b = randInt(-3, 3, rng);
        c = randInt(-5, 5, rng);
        d = randInt(-6, 6, rng);
        e = randInt(-8, 8, rng);
        x0 = randInt(-2, 2, rng);
        ans = 12 * a * x0 * x0 + 6 * b * x0 + 2 * c;
      } while (Math.abs(ans) > 500);

      const terms = [
        { coeff: a, exp: 4 },
        { coeff: b, exp: 3 },
        { coeff: c, exp: 2 },
        { coeff: d, exp: 1 },
        { coeff: e, exp: 0 },
      ];

      return {
        templateId: "hard_second_deriv",
        prompt: `Find f''(${x0}) if f(x) = ${formatPoly(terms)}:`,
        answer: ans,
        hint: `differentiate twice using the power rule, then plug in x = ${x0}`,
        topic: "SECOND DERIVATIVES",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/Find f''\((-?\d+)\) if f\(x\) = (.+):/);
      if (!match) return q.answer;
      const x0 = Number(match[1]);
      const f = parsePolyFromPrompt(match[2]);
      const h = 1e-3;
      return (-f(x0 + 2 * h) + 16 * f(x0 + h) - 30 * f(x0) + 16 * f(x0 - h) - f(x0 - 2 * h)) / (12 * h * h);
    },
  },

  hard_trig_integral: {
    id: "hard_trig_integral",
    difficulty: "hard",
    topic: "TRIG INTEGRALS",
    generate: (rng) => {
      const k = randInt(-25, 25, rng, true);
      const kStr = k === 1 ? "" : k === -1 ? "−" : `${k < 0 ? "−" + Math.abs(k) : k}·`;

      return {
        templateId: "hard_trig_integral",
        prompt: `Evaluate: ∫ from 0 to π of (${kStr}sin x) dx =`,
        answer: 2 * k,
        hint: "antiderivative of sin x is −cos x; recall cos(π) = −1 and cos(0) = 1",
        topic: "TRIG INTEGRALS",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const k = q.answer / 2;
      const f = (x: number) => k * Math.sin(x);
      return simpsonsRule(f, 0, Math.PI, 1000);
    },
  },

  hard_by_parts: {
    id: "hard_by_parts",
    difficulty: "hard",
    topic: "INTEGRATION BY PARTS",
    generate: (rng) => {
      const k = randInt(-50, 50, rng, true);
      const kStr = k === 1 ? "" : k === -1 ? "−" : `${k < 0 ? "−" + Math.abs(k) : k}·`;

      return {
        templateId: "hard_by_parts",
        prompt: `Evaluate: ∫ from 0 to 1 of (${kStr}x·eˣ) dx =`,
        answer: k,
        hint: "integration by parts: ∫ u dv = uv − ∫ v du with u = x, dv = eˣ dx",
        topic: "INTEGRATION BY PARTS",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const k = q.answer;
      const f = (x: number) => k * x * Math.exp(x);
      return simpsonsRule(f, 0, 1, 1000);
    },
  },

  hard_area_between_curves: {
    id: "hard_area_between_curves",
    difficulty: "hard",
    topic: "AREA BETWEEN CURVES",
    generate: (rng) => {
      const validPairs: [number, number][] = [
        [2, 3], // 3*8/6 = 4
        [2, 6], // 6*8/6 = 8
        [3, 2], // 2*27/6 = 9
        [3, 4], // 4*27/6 = 18
        [3, 6], // 6*27/6 = 27
        [4, 3], // 3*64/6 = 32
        [4, 6], // 6*64/6 = 64
        [6, 1], // 1*216/6 = 36
        [6, 2], // 2*216/6 = 72
        [6, 3], // 3*216/6 = 108
      ];
      const [L, b] = validPairs[Math.floor(rng() * validPairs.length)];
      const a = b * L;
      const ans = (b * Math.pow(L, 3)) / 6;

      const curve1 = `${a}x`;
      const curve2 = b === 1 ? "x²" : `${b}x²`;

      return {
        templateId: "hard_area_between_curves",
        prompt: `Find the area enclosed between y = ${curve1} and y = ${curve2}:`,
        answer: ans,
        hint: `find intersections 0 and ${L}, then integrate top − bottom: ∫ from 0 to ${L} (${curve1} − ${curve2}) dx`,
        topic: "AREA BETWEEN CURVES",
      };
    },
    evaluateExact: (q) => q.answer,
    evaluateNumerical: (q) => {
      const match = q.prompt.match(/y = (\d+)x and y = (\d*)x²:/);
      if (!match) return q.answer;
      const a = Number(match[1]);
      const b = match[2] === "" ? 1 : Number(match[2]);
      const L = a / b;
      const f = (x: number) => a * x - b * x * x;
      return simpsonsRule(f, 0, L, 1000);
    },
  },
};

export const TEMPLATES_BY_DIFFICULTY: Record<CalculusDifficulty, TemplateId[]> = {
  easy: ["easy_poly_deriv", "easy_poly_integral", "easy_poly_limit"],
  medium: ["med_chain_rule", "med_product_rule", "med_cubic_integral", "med_removable_limit"],
  hard: [
    "hard_limit_sin_kx",
    "hard_limit_exp_kx",
    "hard_deriv_exp_or_ln",
    "hard_second_deriv",
    "hard_trig_integral",
    "hard_by_parts",
    "hard_area_between_curves",
  ],
};

export function generateCalculusQuestion(
  difficulty: CalculusDifficulty,
  options?: {
    excludePrompts?: Set<string>;
    rng?: () => number;
  }
): GeneratedQuestion {
  const rng = options?.rng ?? Math.random;
  const pool = TEMPLATES_BY_DIFFICULTY[difficulty] ?? TEMPLATES_BY_DIFFICULTY.easy;
  const exclude = options?.excludePrompts;

  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    const chosenId = pool[Math.floor(rng() * pool.length)];
    const template = TEMPLATES[chosenId];
    const q = template.generate(rng);
    if (!exclude || !exclude.has(q.prompt)) {
      return q;
    }
  }

  // Fallback if exclude pool is crowded
  const chosenId = pool[Math.floor(rng() * pool.length)];
  return TEMPLATES[chosenId].generate(rng);
}

// ----------------- Parsing & Numerical Helpers -----------------

function simpsonsRule(f: (x: number) => number, a: number, b: number, n: number): number {
  if (n % 2 !== 0) n++;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += i % 2 === 0 ? 2 * f(x) : 4 * f(x);
  }
  return (h / 3) * sum;
}

function parseLinear(s: string): (x: number) => number {
  const cleaned = s.replace(/\s+/g, "").replace(/−/g, "-");
  let a = 0;
  let b = 0;

  if (cleaned.includes("x")) {
    const parts = cleaned.split("x");
    const aPart = parts[0];
    if (aPart === "" || aPart === "+") a = 1;
    else if (aPart === "-") a = -1;
    else a = Number(aPart);

    const bPart = parts[1];
    if (bPart) {
      b = Number(bPart);
    }
  } else {
    b = Number(cleaned);
  }

  return (x: number) => a * x + b;
}

function parsePolyFromPrompt(raw: string): (x: number) => number {
  const norm = raw
    .replace(/−/g, "-")
    .replace(/\s*\+\s*/g, "+")
    .replace(/\s*-\s*/g, "-")
    .trim();

  // Split into tokens preserving +/-
  const tokens = norm.match(/[+-]?[^+-]+/g) || [norm];
  const terms: { coeff: number; exp: number }[] = [];

  for (const tok of tokens) {
    const t = tok.trim();
    if (!t) continue;

    if (!t.includes("x")) {
      terms.push({ coeff: Number(t), exp: 0 });
      continue;
    }

    let exp = 1;
    if (t.includes("⁴")) exp = 4;
    else if (t.includes("³")) exp = 3;
    else if (t.includes("²")) exp = 2;
    else if (t.includes("^4")) exp = 4;
    else if (t.includes("^3")) exp = 3;
    else if (t.includes("^2")) exp = 2;

    const coeffPart = t.split("x")[0];
    let coeff = 1;
    if (coeffPart === "" || coeffPart === "+") coeff = 1;
    else if (coeffPart === "-") coeff = -1;
    else coeff = Number(coeffPart);

    terms.push({ coeff, exp });
  }

  return (x: number) => {
    let sum = 0;
    for (const term of terms) {
      sum += term.coeff * Math.pow(x, term.exp);
    }
    return sum;
  };
}
