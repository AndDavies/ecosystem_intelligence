export const assistantTestCases = [
  "Who could help maintain equipment at a remote site with intermittent connectivity?",
  "Who could help an off-site expert guide a technician without travelling to the job?",
  "Who could help a small ocean-technology company access waterfront testing facilities in Atlantic Canada?",
  "Who could detect deterioration inside rotating machinery before it causes a breakdown?",
  "Who can guarantee equipment support at a remote site with absolutely no communications connection?"
] as const;

export const assistantTestModes = ["lexical", "full-fresh", "full-cached", "hybrid-50", "hybrid-100", "answer-replay"] as const;
