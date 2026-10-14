"use server";

export interface BaziInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: "male" | "female";
}

export interface BaziResult {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  dayMaster: string;
  fiveElements: Record<string, number>;
  summary: string;
}

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

function getYearPillar(year: number): string {
  const stem = STEMS[(year - 4) % 10];
  const branch = BRANCHES[(year - 4) % 12];
  return `${stem}${branch}`;
}

function getDayPillar(): string {
  // Placeholder: real day pillar requires solar term calculation.
  return "丙午";
}

export async function calculateBazi(input: BaziInput): Promise<BaziResult> {
  // TODO: replace with real skill/API integration
  const yearPillar = getYearPillar(input.year);
  const dayPillar = getDayPillar();
  const monthPillar = `${STEMS[(input.month + 4) % 10]}${BRANCHES[(input.month + 2) % 12]}`;
  const hourPillar = `${STEMS[(input.hour + 8) % 10]}${BRANCHES[(input.hour + 2) % 12]}`;

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster: dayPillar[0],
    fiveElements: { 木: 2, 火: 2, 土: 1, 金: 1, 水: 2 },
    summary: "This is a placeholder Bazi reading. Replace calculateBazi with a real skill or API to generate accurate chart interpretations.",
  };
}
