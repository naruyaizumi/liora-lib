<div align="center">

# liora-lib

![Liora](https://qu.ax/Gamil.jpg)

</div>

**Liora-lib** is a native Node.js addon providing multimedia and system-level utilities.
It offers modules for scheduling, media conversion, sticker encoding, EXIF metadata handling, and efficient HTTP fetching — all implemented in C++ with an ES module interface.

This library is optimized and tested primarily on **Linux (Ubuntu 24 LTS)** environments for maximum stability and performance.

---

## Features

- **Native performance** for media and network tasks  
- **Prebuilt binaries** for Linux (x64, arm64)  
- **Automatic fallback to local build** if no prebuild exists  
- **FFmpeg-based converter** with audio/video support  
- **Sticker toolkit** with WebP encoder and EXIF metadata support  
- **Cron-like scheduler** implemented in native code  
- **Native fetch()** implementation using a high-speed HTTP backend  

## Recommended Environment

- **Operating System:** Ubuntu 24.04 LTS (recommended)  
- **Node.js Version:** 22 or later  
- **Compiler Toolchain:** GCC / Clang with build-essential and Python 3  
- **Runtime:** Full ES Module support  

## Modules Overview

| Module | Description |
|---------|--------------|
| `convert` | High-performance media converter using FFmpeg backend |
| `sticker` | WebP encoder and EXIF injector for sticker creation |
| `cron` | Lightweight scheduler implemented in native C++ |
| `fetch` | Native HTTP client with low-level performance optimization |

## Installation

```bash
pnpm add liora-lib
# or
yarn add liora-lib
# or
npm install liora-lib
```
---

## Usage Example

The following examples show how to use **Liora-lib** for real-world use cases — including cron scheduling, media conversion, sticker creation, and optimized HTTP fetching.  
All functions are available as ES modules and compatible with Node.js 22+.

```js
import {
  schedule,
  addExif,
  sticker,
  convert,
  fetch
} from "liora-lib";
import fs from "fs";
```

### Example 1: Create and manage a native cron job
```js
const job = schedule("*/10 * * * * *", () => {
  const now = new Date().toLocaleTimeString();
  console.log(`[Cron] Triggered at ${now}`);
});

setTimeout(() => {
  console.log("Stopping cron job after 30 seconds...");
  job.stop();
}, 30000);
```

### Example 2: Create a WebP sticker from an image
```js
const inputImage = fs.readFileSync("./example.png");
const webpBuffer = sticker(inputImage, {
  crop: false,              // whether to crop or keep full frame
  quality: 90,              // 0–100 compression quality
  fps: 15,                  // for animated sources (if any)
  packName: "Liora Pack",   // sticker pack name
  authorName: "Izumi",      // author/creator name
  emojis: ["🌸", "🍥"]      // emojis associated with the sticker
});

// Save the sticker to file
fs.writeFileSync("./output.webp", webpBuffer);
console.log("🖼️ Sticker saved as output.webp");
```

### Example 3: Inject EXIF metadata into the WebP sticker
```js
const withExif = addExif(webpBuffer, {
  pack: "Liora Collection",
  author: "Naruya Izumi",
  categories: ["fun", "art"]
});
fs.writeFileSync("./sticker_with_exif.webp", withExif);
console.log("🧩 Sticker with EXIF metadata saved.");
```

### Example 4: Convert an audio file between formats
```js
const inputAudio = fs.readFileSync("./sample.mp3");
const converted = convert(inputAudio, {
  format: "opus",          // output format: opus, mp3, wav, etc.
  bitrate: "128k",
  channels: 2,
  sampleRate: 48000,
  ptt: true                // make it WhatsApp-compatible voice note
});
fs.writeFileSync("./sample_converted.opus", converted);
console.log("🎵 Converted audio saved as sample_converted.opus");
```

### Example 5: Fetch remote data using native C++ backend
```js
const response = await fetch("https://api.github.com/repos/naruyaizumi/liora-lib");
console.log("🌐 Status:", response.status);
console.log("📦 Content-Type:", response.headers?.["content-type"]);
console.log("🧾 Body:", await response.text().then(t => t.slice(0, 200) + "...")); // preview
```

### Example 6: Fetch and parse JSON directly
```js
const api = await fetch("https://api.github.com");
const json = await api.json();
console.log("🔍 JSON keys:", Object.keys(json));
```

## API Reference

### `schedule(expr, callback, options?)`
Schedules a job based on a cron expression.

- **expr**: Cron string (`*/5 * * * * *`)
- **callback**: Function to execute
- **options**: Optional config `{ timezone, immediate, once }`

Returns a `CronJob` instance with methods:
- `stop()` Stops the job
- `isRunning()` Checks if active
- `secondsToNext()` Returns seconds until next trigger


### `addExif(buffer, meta?)`
Injects EXIF metadata into a WebP buffer.

| Param | Type | Description |
|:------|:-----|:------------|
| buffer | `Buffer` | WebP image buffer |
| meta | `Object` | `{ packName, authorName, emojis }` |

Returns a new WebP buffer with EXIF tags.


### `sticker(buffer, options?)`
Converts images or videos into stickers.

| Option | Default | Description |
|:--------|:----------|:------------|
| crop | `false` | Crop to square |
| quality | `80` | Image quality (1-100) |
| fps | `15` | Frame rate for animated stickers |
| maxDuration | `15` | Max seconds for video sticker |
| packName | `""` | Sticker pack name |
| authorName | `""` | Author/creator name |
| emojis | `[]` | Array of emojis |


### `convert(input, options?)`
Converts audio/video files using native FFmpeg binding.

| Option | Default | Description |
|:--------|:----------|:------------|
| format | `"opus"` | Output format |
| bitrate | `"64k"` | Audio bitrate |
| channels | `2` | Audio channels |
| sampleRate | `48000` | Sampling rate |
| ptt | `false` | Push-to-talk compatibility |
| vbr | `true` | Variable bitrate |

Returns a `Buffer` with converted media.


### `fetch(url, options?)`
Performs a native HTTP fetch.

Returns an object compatible with the standard Fetch API:
```js
const res = await fetch("https://example.com");
const data = await res.json();
```

Methods:
- `.arrayBuffer()`
- `.text()`
- `.json()`
- `.abort()`

---

## License

Licensed under the **Apache-2.0 License**.
© 2025 Naruya Izumi