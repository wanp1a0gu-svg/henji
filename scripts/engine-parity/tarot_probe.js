/** MT19937 种子精度微验证：对比 Python random.Random(seed) 的前两个 random() 值 */
"use strict";
const { PyRandom } = require("../../lib/tarot-engine.js");

const SEEDS = [
  "0", "1", "123", "255", "256", "65535", "65536", "16777215", "16777216",
  "2147483647", "2147483648", "4294967295", "4294967296",
  "1234567890123456789", "9223372036854775808",
];

for (const s of SEEDS) {
  const r = new PyRandom(BigInt(s));
  const v1 = r.random();
  const v2 = r.random();
  console.log(s, ["%.15f".replace("%.15f", v1.toFixed(15)), v2.toFixed(15)].join(" "));
}
