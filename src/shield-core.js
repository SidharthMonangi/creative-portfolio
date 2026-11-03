/**
 * Heuristic prompt-injection rules shared by the in-browser shield, the local
 * assistant fallback and the /api/chat serverless function.
 */
export const RULES = [
  {
    cat: 'Instruction override', weight: 0.92,
    why: 'Tries to cancel the system prompt and install new orders.',
    re: [/\b(ignore|disregard|forget|override|bypass|skip)\b[^.]{0,40}\b(previous|prior|above|earlier|all|your|the)\b[^.]{0,25}\b(instructions?|rules?|prompts?|guidelines?|directives?|policy|policies)\b/i,
      /\bnew (instructions?|rules?)\b/i, /\bfrom now on\b/i, /\b(system|developer) (override|mode)\b/i, /\byou (must|will) now\b/i],
  },
  {
    cat: 'Prompt extraction', weight: 0.9,
    why: 'Fishes for the hidden system prompt or its secrets.',
    re: [/\b(repeat|print|reveal|show|display|output|leak|tell me|what (is|are|was))\b[^.]{0,40}\b(system prompt|instructions?|above|initial prompt|hidden|secret|canary|configuration|rules you)\b/i,
      /\bverbatim\b/i, /\beverything (above|before)\b/i, /zebra-?7731/i, /\bstarting with ['"]?you are\b/i],
  },
  {
    cat: 'Role-play jailbreak', weight: 0.86,
    why: 'Wraps the request in a persona that “has no rules”.',
    re: [/\bDAN\b/, /\b(pretend|act as|role-?play|you are now|imagine you are|stay in character|let'?s play a game)\b/i,
      /\b(no|without) (rules|restrictions|filters|limits|guidelines)\b/i, /\bjailbr(oken|eak)\b/i, /\bdeveloper mode\b/i, /\bevil (twin|ai|mode)\b/i],
  },
  {
    cat: 'Obfuscation', weight: 0.8,
    why: 'Hides the payload behind an encoding so filters miss it.',
    re: [/\b(base64|rot13|hex|binary|morse|unicode|leetspeak|caesar)\b/i, /\b(decode|decipher|deobfuscate|translate)\b[^.]{0,20}\b(this|following|and)\b/i,
      /[A-Za-z0-9+/]{16,}={0,2}/, /(\\x[0-9a-f]{2}){3,}/i, /\b1gn0r3\b|\bpr0mpt\b|\binstruct10ns\b/i],
  },
  {
    cat: 'Indirect injection', weight: 0.84,
    why: 'Smuggles instructions inside content the bot is asked to process.',
    re: [/<!--[\s\S]*-->/, /\[(system|assistant|inst)\]/i, /<\/?(system|instructions?|im_start|im_end)>/i,
      /\b(ai|assistant|bot|model)\s*[:,]\s*(please\s*)?(ignore|forward|send|email|exfiltrate|reveal)/i, /\b(forward|send|exfiltrate|post)\b[^.]{0,30}\b(data|credentials|password|history|to http|to evil)/i],
  },
];

export function classify(text) {
  const hits = [];
  for (const rule of RULES) {
    for (const re of rule.re) {
      const m = text.match(re);
      if (m) { hits.push({ rule, match: m[0] }); break; }
    }
  }
  if (!hits.length) return { blocked: false, score: Math.min(0.12, text.length / 900) };
  hits.sort((a, b) => b.rule.weight - a.rule.weight);
  const score = Math.min(0.99, hits[0].rule.weight + (hits.length - 1) * 0.04);
  return { blocked: true, score, hits };
}

