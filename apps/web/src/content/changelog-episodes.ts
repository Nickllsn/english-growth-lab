import episode475 from "../../../../content/changelog/the-changelog-475.md?raw";
import episode592 from "../../../../content/changelog/the-changelog-592.md?raw";
import episode84 from "../../../../content/changelog/ship-it-84.md?raw";
import episode156 from "../../../../content/changelog/go-time-156.md?raw";

export interface ChangelogEpisode {
  id: string;
  title: string;
  guest: string;
  show: string;
  why: string;
  pageUrl: string;
  audioUrl: string;
  transcriptUrl: string;
  transcript: string;
}

export const changelogEpisodes: ChangelogEpisode[] = [
  {
    id: "475",
    title: "Making the ZFS file system",
    guest: "Matt Ahrens",
    show: "The Changelog",
    why: "ZFS 的来历、copy-on-write、RAID 和快照。和存储工作最接近，适合作为第一集。",
    pageUrl: "https://changelog.com/podcast/475",
    audioUrl: "https://cdn.changelog.com/uploads/podcast/475/the-changelog-475.mp3",
    transcriptUrl:
      "https://github.com/thechangelog/transcripts/blob/master/podcast/the-changelog-475.md",
    transcript: episode475
  },
  {
    id: "592",
    title: "From Sun to Oxide",
    guest: "Bryan Cantrill",
    show: "The Changelog",
    why: "超过两小时。整集当泛听，只挑 ZFS 或 DTrace 的几分钟点文字精听。",
    pageUrl: "https://changelog.com/podcast/592",
    audioUrl: "https://cdn.changelog.com/uploads/podcast/592/the-changelog-592.mp3",
    transcriptUrl:
      "https://github.com/thechangelog/transcripts/blob/master/podcast/the-changelog-592.md",
    transcript: episode592
  },
  {
    id: "shipit-84",
    title: "Bare metal meets Talos Linux",
    guest: "Talos Linux",
    show: "Ship It",
    why: "他们怎么把 changelog.com 从 Kubernetes 换到更简单的机器。Talos 是主体，Rook 和 Ceph 只出现几句。",
    pageUrl: "https://changelog.com/shipit/84",
    audioUrl: "https://cdn.changelog.com/uploads/shipit/84/ship-it-84.mp3",
    transcriptUrl: "https://github.com/thechangelog/transcripts/blob/master/shipit/ship-it-84.md",
    transcript: episode84
  },
  {
    id: "gotime-156",
    title: "When distributed systems Go wrong",
    guest: "Go Time",
    show: "Go Time",
    why: "分布式系统出错时怎么发现、怎么查。接近开会时要听懂的那种讨论。",
    pageUrl: "https://changelog.com/gotime/156",
    audioUrl: "https://cdn.changelog.com/uploads/gotime/156/go-time-156.mp3",
    transcriptUrl: "https://github.com/thechangelog/transcripts/blob/master/gotime/go-time-156.md",
    transcript: episode156
  }
];

export function findEpisode(id: string | undefined): ChangelogEpisode | undefined {
  return changelogEpisodes.find((episode) => episode.id === id);
}
