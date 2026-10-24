export interface PageReading {
  label: string;
  paragraphs: string[];
  attribution?: string;
}

export const pageReadings: Record<string, PageReading> = {
  "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english_2026/ep-261022": {
    label: "今天要读的句子",
    paragraphs: [
      "这一集的逐字稿属于 BBC，页面里不转载。听力仍用上面的链接。下面这些句子是今天要学会说的。",
      "I have been working as a software engineer for eight years.",
      "I mainly focus on distributed storage.",
      "My main responsibility is to keep data reliable.",
      "One of the challenges is tail latency.",
      "Let me walk you through my background.",
      "I am learning to explain this work in English."
    ]
  },
  "https://www.youtube.com/watch?v=DbxddGtHl70": {
    label: "这一段要抓住的句子",
    paragraphs: [
      "播放器可以打开英文字幕。下面不是字幕逐字稿，是这段讲解里要听懂的意思。",
      "A database stores each row as bytes on a disk.",
      "A spinning disk and an SSD do not find those bytes in the same way.",
      "The next row is usually placed beside the previous row.",
      "Finding a random place on a spinning disk takes longer."
    ]
  },
  "https://www.youtube.com/watch?v=DbxddGtHl70&t=720s": {
    label: "这一段要抓住的句子",
    paragraphs: [
      "从 12 分钟看起，播放器里打开英文字幕。下面是要听懂的意思，不是逐字稿。",
      "Sequential I/O reads the next bytes. Random I/O jumps around.",
      "On a spinning disk, random I/O costs more time.",
      "Latency is that time. Throughput is how many bytes move.",
      "Those two numbers answer different questions."
    ]
  },
  "https://docs.ceph.com/en/latest/start/ceph-cluster-components/": {
    label: "午休阅读",
    paragraphs: [
      "A Ceph cluster runs a few programs on one or more machines.",
      "A monitor keeps the maps of the cluster. Clients and daemons use those maps to find each other. If too many monitors are down, the cluster stops.",
      "A manager tracks how full and how busy the cluster is.",
      "An OSD stores objects on one disk. It also copies them, rebuilds them after a failure, and moves them when the cluster changes.",
      "Ceph puts objects into pools. It hashes an object name into a placement group, and CRUSH calculates which OSDs store that group. Clients do the same calculation, so nobody keeps a central lookup table."
    ],
    attribution: "根据 Ceph 官方文档 The Parts of a Ceph Cluster 写成的阅读文本，不是逐字转载。"
  },
  "https://www.youtube.com/watch?v=7I9uxoEhUdY": {
    label: "这一段要抓住的句子",
    paragraphs: [
      "只看前 12 分钟，并打开英文字幕。下面不是逐字稿。",
      "Ceph can serve objects, blocks, and files from one cluster.",
      "Object, block, and file are three ways to use the same stored data.",
      "Listen for those three words."
    ]
  },
  "https://www.youtube.com/watch?v=7I9uxoEhUdY&t=720s": {
    label: "这一段要抓住的句子",
    paragraphs: [
      "从 12 分钟看到大约 20 分钟。英文字幕在播放器里。",
      "The client can calculate where an object lives.",
      "It does not ask one central server for every location.",
      "That is what lets the cluster grow."
    ]
  },
  "https://www.youtube.com/watch?v=7I9uxoEhUdY&t=1200s": {
    label: "这一段要抓住的句子",
    paragraphs: [
      "从 20 分钟看起。英文字幕在播放器里。",
      "Replication stores another copy on a different disk.",
      "When a disk fails, recovery rebuilds the missing copy.",
      "Rebalancing moves data when the cluster changes."
    ]
  },
  "https://ceph.io/en/discover/technology/": {
    label: "午休阅读",
    paragraphs: [
      "Ceph gives you object storage, block storage, and a file system from one cluster.",
      "RADOS is the object store under those three interfaces.",
      "CRUSH decides which disks keep each object. It does this without a central directory of locations.",
      "Copies on other disks are what make a failed disk recoverable."
    ],
    attribution: "根据 Ceph Technology 页面写成的阅读文本，不是逐字转载。"
  },
  "https://www.youtube.com/watch?v=fhBHvsi0Ql0": {
    label: "这一段要抓住的句子",
    paragraphs: [
      "只看前 12 分钟。播放器里打开英文字幕。下面不是 Brendan Gregg 的逐字稿。",
      "Start by observing the system. Do not start by guessing the fix.",
      "A high CPU number is not always the bottleneck.",
      "Latency says how long one operation waits. Throughput says how much work finishes."
    ]
  },
  "https://www.youtube.com/watch?v=fhBHvsi0Ql0&t=720s": {
    label: "这一段要抓住的句子",
    paragraphs: [
      "从 12 分钟看到大约 24 分钟，并打开英文字幕。",
      "Observability shows the work, the waiting, and the errors.",
      "Name the question before you name the tool.",
      "A checklist is there to keep the investigation short."
    ]
  },
  "https://www.youtube.com/watch?v=fhBHvsi0Ql0&t=1440s": {
    label: "这一段要抓住的句子",
    paragraphs: [
      "从 24 分钟看起，并打开英文字幕。",
      "A method is a way to stop guessing.",
      "Utilization asks how busy a resource is.",
      "Saturation asks who is waiting. Errors ask what failed."
    ]
  },
  "https://www.brendangregg.com/Slides/LISA2019_Linux_Systems_Performance/": {
    label: "午休阅读",
    paragraphs: [
      "幻灯片原文不转载。这一讲的六块是：observability，methodologies，benchmarking，profiling，tracing，tuning。",
      "Observability comes first. You look before you change anything.",
      "The other five parts are ways to measure, compare, and adjust after you can see the system."
    ]
  },
  "https://www.brendangregg.com/usemethod.html": {
    label: "午休阅读",
    paragraphs: [
      "USE 方法页面的原文不转载。今天只记三个检查。",
      "Utilization: how busy is this resource?",
      "Saturation: is work waiting in a queue?",
      "Errors: what failed? Failure is not the same thing as slowness.",
      "Try those three questions on the CPU, the disk, and the network."
    ]
  },
  "https://www.brendangregg.com/linuxperf.html": {
    label: "午休阅读",
    paragraphs: [
      "工具清单的原文不转载。先写问题，再找一个能回答它的命令。",
      "vmstat and mpstat talk about the CPU.",
      "iostat talks about the disks: how busy they are, how long I/O waits, and how much they move.",
      "A command is useful only when you can say what question it answers."
    ]
  },
  "https://docs.kernel.org/mm/page_cache.html": {
    label: "午休阅读",
    paragraphs: [
      "The page cache is the primary way that the user and the rest of the kernel interact with filesystems. It can be bypassed (e.g. with O_DIRECT), but normal reads, writes and mmaps go through the page cache.",
      "普通读写会进缓存。O_DIRECT 可以绕过它。绕过缓存不等于一定更快。"
    ],
    attribution:
      "第一段摘自 Linux 内核文档 Page Cache，以 GPL-2.0 发布。出处：https://docs.kernel.org/mm/page_cache.html"
  }
};

export function youtubeEmbed(url: string): { id: string; start: number } | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  const id = host === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
  if (!id || (host !== "youtube.com" && host !== "youtu.be" && host !== "m.youtube.com")) {
    return undefined;
  }
  const raw = parsed.searchParams.get("t") ?? parsed.searchParams.get("start") ?? "0";
  const start = Number(raw.replace(/s$/, ""));
  return { id, start: Number.isFinite(start) ? start : 0 };
}
