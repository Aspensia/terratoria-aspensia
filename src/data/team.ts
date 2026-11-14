// The Aspensia team behind PROJECT: Terratoria.
export interface Member {
  name: string;
  role: string;
  work: string;
}

export const TEAM: Member[] = [
  {
    name: "Mak Chansereirath",
    role: "Lead Software Developer and Data Analyst",
    work: "Built the website and the data pipeline, analysed the datasets and led quality checks.",
  },
  {
    name: "Keo Amarak",
    role: "Software Developer and Data Analyst",
    work: "Developed the website, analysed data, drafted documentation and managed the GitHub repository.",
  },
  {
    name: "Sareth Puthyreach",
    role: "Data Analyst and Video Producer",
    work: "Analysed and drafted findings, shaped the project story and produces the submission video.",
  },
  {
    name: "Sun Panharath",
    role: "Storytelling Lead and Video Producer",
    work: "Leads the narrative and video production and reviews the project for accuracy.",
  },
  {
    name: "Yim Pichpanhasak",
    role: "Software Tuning and Quality Assurance",
    work: "Refined the website and software, verified data and sources, and edits the video.",
  },
  {
    name: "Lim Rothsothyr",
    role: "Research and Data Lead",
    work: "Sourced and analysed data, compiled the research, drafted content and supported the GitHub repository.",
  },
];

/** Two-letter monogram for avatar tiles, e.g. "Mak Chansereirath" → "MC". */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
