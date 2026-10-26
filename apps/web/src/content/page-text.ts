export interface PageReading {
  label: string;
  keywords: string[];
  paragraphs: string[];
  attribution?: string;
  audio: string;
}

export function englishNarration(paragraphs: string[]): string {
  return paragraphs.filter((paragraph) => !/[\u4e00-\u9fff]/.test(paragraph)).join("\n\n");
}

const studyLabel = "学习文本";

export const pageReadings: Record<string, PageReading> = {
  "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english_2026/ep-261022": {
    label: studyLabel,
    keywords: ["software engineer", "eight years", "distributed storage", "responsibility", "tail latency", "background"],
    audio: "self-intro.mp3",
    paragraphs: [
      "这一集的逐字稿属于 BBC，页面里不转载，也不按它的话题改写。听力只用它练耳朵。下面这篇是今天要读、要说的自我介绍。",
      "I have been working as a software engineer for eight years. Let me walk you through my background.",
      "I mainly focus on distributed storage. The data does not sit on one machine. It is spread across many disks, and the service has to keep working when one disk fails.",
      "My main responsibility is to keep data reliable. Reliable means a write that succeeds can be read later, even after a failure. A second responsibility is performance. Users notice slow requests more than they notice the average.",
      "One of the challenges is tail latency. Most requests can be fast while a few are very slow. Those slow ones are the tail. Finding them is part of the job.",
      "I am learning to explain this work in English. I do not need a perfect speech. I need a clear order: who I am, what I work on, what I am responsible for, and what is hard."
    ]
  },
  "https://www.youtube.com/watch?v=DbxddGtHl70": {
    label: studyLabel,
    keywords: ["row", "bytes", "block", "spinning disk", "SSD", "sector"],
    audio: "disk-rows.mp3",
    paragraphs: [
      "播放器里可以打开英文字幕。下面按这段的关键词重写，不照搬原片的句子和例子。",
      "A database stores each row as bytes on a disk. A row is the logical record you insert. Bytes are the physical bits the device actually keeps.",
      "The disk does not store one row in its own private place. It groups bytes into a block. A common block is larger than one row, so several rows share that block. The database then remembers which block holds which rows.",
      "A spinning disk finds a block by moving a head to a track and a sector. That movement takes time. An SSD has no moving head. It finds a block by address, so the same random lookup is usually cheaper.",
      "The next row is usually placed beside the previous row. Adjacent rows can share a block and can be read together. Finding a random place on a spinning disk takes longer, because the head has to move before the read starts.",
      "When you listen, separate two ideas. First, a row is logical. Second, a block on a spinning disk or an SSD is physical. The English you need is row, bytes, block, sector, spinning disk, and SSD."
    ]
  },
  "https://www.youtube.com/watch?v=DbxddGtHl70&t=720s": {
    label: studyLabel,
    keywords: ["sequential I/O", "random I/O", "latency", "throughput", "queue"],
    audio: "sequential-io.mp3",
    paragraphs: [
      "从 12 分钟看起。下面是同一批关键词的学习文本，不是字幕改写。",
      "Sequential I/O reads the next bytes. The device stays in the same neighborhood, so a spinning disk does not move the head for every row. Random I/O jumps around. Each jump can cost a seek.",
      "On a spinning disk, random I/O costs more time. An SSD still prefers sequential I/O for some workloads, but the penalty is smaller because there is no mechanical seek.",
      "Latency is that time. It is how long one read or write waits. Throughput is how many bytes move over a longer interval. A system can have high throughput and still have bad latency if some requests wait in a queue.",
      "Those two numbers answer different questions. Latency answers “how long did this one operation take?” Throughput answers “how much work finished?” IOPS counts the operations and does not, by itself, say how long each one waited.",
      "If a queue grows, new requests wait behind old ones. Queue time becomes part of latency. That is why a busy disk can look fine on average and still feel slow."
    ]
  },
  "https://docs.ceph.com/en/latest/start/ceph-cluster-components/": {
    label: studyLabel,
    keywords: ["monitor", "manager", "OSD", "pool", "placement group", "CRUSH", "quorum"],
    audio: "ceph-parts.mp3",
    paragraphs: [
      "A Ceph cluster runs a few programs on one or more machines. You do not have to remember every daemon. Start with monitor, manager, and OSD.",
      "A monitor keeps the maps of the cluster. Those maps say which daemons exist and where data is allowed to live. Clients and other daemons use the maps to find each other. Monitors also check one another. If too many monitors are down, they lose quorum, and the cluster stops serving new work.",
      "A manager tracks how full and how busy the cluster is. It is the place operators look for capacity, load, and health. It does not decide the bytes of every object.",
      "An OSD stores objects on one disk. It also copies them, rebuilds them after a failure, and moves them when the cluster changes. If an OSD stops answering, the others notice and can start recovery.",
      "Ceph puts objects into pools. It hashes an object name into a placement group, and CRUSH calculates which OSDs store that group. Clients do the same calculation, so nobody keeps a central lookup table.",
      "A useful sentence in an interview is: monitors keep the map, OSDs store the objects, and CRUSH removes the need for a central directory."
    ],
    attribution: "根据 Ceph 官方文档 The Parts of a Ceph Cluster 用相同关键词重写，不是逐字转载。"
  },
  "https://www.youtube.com/watch?v=7I9uxoEhUdY": {
    label: studyLabel,
    keywords: ["object", "block", "file", "cluster"],
    audio: "ceph-interfaces.mp3",
    paragraphs: [
      "只看前 12 分钟。下面不是逐字稿，是这三种接口的学习文本。",
      "Ceph can serve objects, blocks, and files from one cluster. The cluster is the set of machines and disks. The three words are three ways for a client to ask for the same stored data.",
      "An object has a name and a blob of bytes. A block device looks like a disk: the client reads and writes offsets. A file has a path, a directory, and the usual read and write calls.",
      "Object, block, and file are not three copies of the data by default. They are three front doors. Under them, the cluster still stores objects and places those objects with the same rules.",
      "Listen for those three words. When you hear one, ask which client is talking. An S3-style client wants objects. A virtual machine often wants a block device. A user workspace often wants files."
    ]
  },
  "https://www.youtube.com/watch?v=7I9uxoEhUdY&t=720s": {
    label: studyLabel,
    keywords: ["client", "location", "central server", "CRUSH"],
    audio: "crush-location.mp3",
    paragraphs: [
      "从 12 分钟看到大约 20 分钟。学习文本只覆盖“位置是算出来的”这一点。",
      "The client can calculate where an object lives. It knows the cluster map and the placement rule. It does not ask one central server for every location.",
      "A central lookup table becomes a bottleneck and a single point of failure. Every new object would need an update, and every reader would need to ask the same machine. CRUSH avoids that table. Given the same map, every client computes the same OSDs.",
      "That is what lets the cluster grow. Adding a disk changes the map. Clients learn the new map and calculate again. They do not wait for one directory to be rewritten object by object.",
      "Say it in one sentence: the client calculates the location, so the cluster does not keep a central server just to answer “where is this object?”"
    ]
  },
  "https://www.youtube.com/watch?v=7I9uxoEhUdY&t=1200s": {
    label: studyLabel,
    keywords: ["replication", "recovery", "rebalancing", "disk failure"],
    audio: "replication.mp3",
    paragraphs: [
      "从 20 分钟看起。这段的关键词是副本、恢复和再平衡。",
      "Replication stores another copy on a different disk. One copy is not enough, because a disk failure would lose the only bytes. The placement rule tries to put copies on different hosts, not only on different folders of the same machine.",
      "When a disk fails, recovery rebuilds the missing copy. The surviving copies are read, and a new copy is written to a healthy OSD. Until that finishes, the object is degraded but still readable if a copy remains.",
      "Rebalancing moves data when the cluster changes. A new disk should not stay empty, and a removed disk should not keep the only copy. The cluster moves placement groups until the rule is satisfied again.",
      "Do not mix the two verbs. Recovery answers a failure. Rebalancing answers a change in membership. Both move bytes, but the reason is different."
    ]
  },
  "https://ceph.io/en/discover/technology/": {
    label: studyLabel,
    keywords: ["RADOS", "CRUSH", "object", "block", "file"],
    audio: "ceph-rados.mp3",
    paragraphs: [
      "Ceph gives you object storage, block storage, and a file system from one cluster. Those are the services a client sees.",
      "RADOS is the object store under those three interfaces. Block images and files are still stored as objects in RADOS. If you can explain RADOS, you can explain why the three services share one placement and recovery path.",
      "CRUSH decides which disks keep each object. It does this without a central directory of locations. The inputs are the object name, the pool, and the current map. The output is a list of OSDs.",
      "Copies on other disks are what make a failed disk recoverable. CRUSH chooses those disks. RADOS stores the bytes. The interface on top only decides how the client names the data.",
      "A compact answer to “what is Ceph?” is: RADOS stores objects, CRUSH places them, and clients can use those objects as objects, blocks, or files."
    ],
    attribution: "根据 Ceph Technology 页面的关键词重写，不是逐字转载。"
  },
  "https://www.youtube.com/watch?v=fhBHvsi0Ql0": {
    label: studyLabel,
    keywords: ["observability", "bottleneck", "latency", "throughput", "CPU"],
    audio: "observe-first.mp3",
    paragraphs: [
      "只看前 12 分钟。下面不是这场演讲的逐字稿，是同一批性能关键词的学习文本。",
      "Start by observing the system. Do not start by guessing the fix. Observability means you can see the work, the waiting, and the errors while the machine is running.",
      "A high CPU number is not always the bottleneck. The CPU can look busy while the real wait is a lock, a disk, or a queue. The bottleneck is the resource that limits the operation you care about.",
      "Latency says how long one operation waits. Throughput says how much work finishes. You can raise throughput and still hurt latency if you build a longer queue.",
      "Before you name a tool, name the question. “Is the CPU actually the wait?” is a better start than “let me open a profiler.” The first twelve minutes are about that order: observe, then explain, then change."
    ]
  },
  "https://www.youtube.com/watch?v=fhBHvsi0Ql0&t=720s": {
    label: studyLabel,
    keywords: ["observability", "work", "waiting", "errors", "checklist", "tool"],
    audio: "work-waiting-errors.mp3",
    paragraphs: [
      "从 12 分钟看到大约 24 分钟。学习文本讲的是“先看见，再选工具”。",
      "Observability shows the work, the waiting, and the errors. Work is what the resource is doing. Waiting is who is stuck behind it. Errors are failures, not just slowness.",
      "Name the question before you name the tool. vmstat can show CPU and runnable tasks. iostat can show whether a disk is busy or waiting. A tool that cannot answer the question is noise.",
      "A checklist is there to keep the investigation short. You walk the resources in order instead of jumping to the last outage you remember. The checklist is not the diagnosis. It is how you avoid skipping a layer.",
      "Say this aloud: I observe the work, the waiting, and the errors. Then I pick one tool that answers one question."
    ]
  },
  "https://www.youtube.com/watch?v=fhBHvsi0Ql0&t=1440s": {
    label: studyLabel,
    keywords: ["utilization", "saturation", "errors", "method"],
    audio: "use-checks.mp3",
    paragraphs: [
      "从 24 分钟看起。这段对应 USE 这三个检查。",
      "A method is a way to stop guessing. Without a method, every incident becomes a search for the tool you used last time.",
      "Utilization asks how busy a resource is. A disk at a high percent busy, or a CPU with little idle time, is highly utilized. Busy does not always mean it is the bottleneck.",
      "Saturation asks who is waiting. A queue of I/O, a run queue of tasks, or a full TCP buffer means the resource cannot start new work immediately. A resource can be saturated before a simple average looks terrible.",
      "Errors ask what failed. Timeouts, device errors, and retries are not the same fact as high latency. A slow success and a failed request need different next steps.",
      "Use the method in this order: utilization, saturation, errors. Then name the resource: CPU, disk, or network."
    ]
  },
  "https://www.usenix.org/sites/default/files/conference/protected-files/lisa19_slides_gregg.pdf": {
    label: studyLabel,
    keywords: ["observability", "methodologies", "benchmarking", "profiling", "tracing", "tuning"],
    audio: "methodologies.mp3",
    paragraphs: [
      "幻灯片原文不转载。这里只用这一讲的六个关键词，把顺序讲清楚。",
      "Observability comes first. You look before you change anything. If you cannot see utilization, saturation, and errors, a later change is a guess.",
      "Methodologies are the questions you repeat. USE is one methodology. It tells you what to ask each resource. It does not itself fix the system.",
      "Benchmarking compares a change with a controlled load. A benchmark is useful only when the load looks like the real one. A faster benchmark and a slower production path can both be true.",
      "Profiling shows where CPU time goes inside a program. Tracing follows events, such as a slow I/O or a lock wait, that a profiler may not sample. Tuning is the change you make after those measurements, and you verify it with the same measurement.",
      "The order is the lesson: observe, choose a method, measure, then tune. Do not start at tuning."
    ]
  },
  "https://web.archive.org/web/20250106073356/https://www.brendangregg.com/usemethod.html": {
    label: studyLabel,
    keywords: ["utilization", "saturation", "errors", "CPU", "disk", "network", "queue"],
    audio: "use-definitions.mp3",
    paragraphs: [
      "USE 方法页面的原文不转载。下面用相同关键词写成今天的阅读。",
      "Utilization: how busy is this resource? For a CPU, look at idle time and what the busy time is spent on. For a disk, look at how much of the time the device is active. For a network link, look at how much of its capacity is in use.",
      "Saturation: is work waiting in a queue? A CPU run queue, a disk request queue, and a full socket buffer are three examples. The queue is the evidence that new work cannot start yet.",
      "Errors: what failed? Disk errors, packet errors, and application timeouts are errors. A request that succeeds slowly is a latency problem, not automatically an error.",
      "Try those three questions on the CPU, the disk, and the network before you invent a fourth theory. Write one sentence for each resource. If you cannot fill in saturation, you are still guessing.",
      "A disk can show moderate utilization and a long queue. In that case saturation, not the busy percentage, explains the latency."
    ]
  },
  "https://web.archive.org/web/20261014044803/https://www.brendangregg.com/linuxperf.html": {
    label: studyLabel,
    keywords: ["vmstat", "mpstat", "iostat", "question", "CPU", "disk"],
    audio: "linux-commands.mp3",
    paragraphs: [
      "工具清单的原文不转载。先写问题，再找一个能回答它的命令。",
      "vmstat and mpstat talk about the CPU. vmstat is a wide first look: runnable tasks, idle time, and memory pressure. mpstat can split that CPU time by core, so one hot core is not hidden by an idle average.",
      "iostat talks about the disks: how busy they are, how long I/O waits, and how much they move. Await or a similar latency column answers “how long did an I/O wait?” A throughput column answers “how many bytes moved?” Do not read one column and pretend it answered both.",
      "A command is useful only when you can say what question it answers. “The disk is the bottleneck” is not a question. “Is the disk saturated?” is a question, and iostat can help.",
      "Pick five commands, not fifty. For each one, write the resource and the question. If you cannot, skip it today."
    ]
  },
  "https://docs.kernel.org/mm/page_cache.html": {
    label: studyLabel,
    keywords: ["page cache", "O_DIRECT", "mmap", "buffered I/O", "cache miss"],
    audio: "page-cache.mp3",
    paragraphs: [
      "The page cache is the primary way that the user and the rest of the kernel interact with filesystems. It can be bypassed (e.g. with O_DIRECT), but normal reads, writes and mmaps go through the page cache.",
      "Buffered I/O is the normal path. The first read brings pages into the page cache. A later read of the same pages can return from memory and never touch the device. That is why a second run of a benchmark is often faster, and why the disk can look idle while the application is still reading.",
      "A cache miss is the read that does reach the device. Latency then includes the device and the queue, not only the memory copy. If you measure a warm cache and call it disk latency, the number answers the wrong question.",
      "O_DIRECT bypasses the page cache. The application talks to the device more directly. A database that keeps its own cache sometimes wants this, so two caches do not fight. Direct I/O does not make every workload faster. A small random read can get worse when it loses the kernel cache.",
      "mmap is not a third magic path around the cache. A normal mapping still uses the page cache. When you compare buffered I/O and direct I/O, say which cache is allowed to help, and measure both with the same request size."
    ],
    attribution:
      "第一段摘自 Linux 内核文档 Page Cache，以 GPL-2.0 发布。其余段落是用同一批关键词写的说明。出处：https://docs.kernel.org/mm/page_cache.html"
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
