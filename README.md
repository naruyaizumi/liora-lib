<div align="center">

# liora-lib

![Liora](https://qu.ax/Gamil.jpg)

</div>

**NOTE:** This library is **Linux-exclusive** and requires native dependencies. Running on other operating systems (Windows, macOS) or non-x64 architectures will fail.  
All prebuilt binaries are compiled for **Ubuntu 24.04 LTS (x64)**. Errors outside this environment are **not library bugs** unless dependencies are properly installed.

**Liora-lib** is a high-performance Node.js native addon providing multimedia and system-level utilities.  
It exposes modules for cron scheduling, media conversion, sticker encoding, EXIF metadata handling, and optimized HTTP fetching — all implemented in C++ with an ES module interface.

---

## Features

- ⚡ **Linux-native performance** optimized for Ubuntu 24.04 LTS  
- 📦 **Prebuilt x64 binaries** with automatic fallback to source compilation  
- 🎬 **FFmpeg-powered converter** for audio/video transcoding  
- 🎨 **Sticker toolkit** with WebP encoding and EXIF metadata injection  
- ⏰ **Native cron scheduler** implemented in C++  
- 🌐 **High-performance HTTP client** with native fetch() implementation  
- 🔧 **Zero JavaScript overhead** for performance-critical operations

---

## System Requirements

### Mandatory

- **Operating System:** Ubuntu 24.04 LTS (64-bit) or compatible Debian-based distro  
- **Node.js Version:** 22.0.0 or higher  
- **Architecture:** x86_64 (ARM64 requires manual compilation)

### Build Dependencies (required if prebuilt binary fails)

```bash
sudo apt update
sudo apt install -y build-essential python3 git

# Install Node.js build tools
npm install -g node-gyp
```

### Runtime Dependencies (required for all installations)

```bash
# FFmpeg is REQUIRED for convert() and sticker() functions
sudo apt install -y ffmpeg libavcodec-dev libavformat-dev libavutil-dev libswscale-dev

# Verify FFmpeg installation
ffmpeg -version
```

> ⚠️ **Critical:** Without FFmpeg installed, `convert()` and `sticker()` functions will fail with runtime errors.

---

## Installation

```bash
# Using pnpm (recommended)
pnpm add liora-lib

# Using yarn
yarn add liora-lib

# Using npm
npm install liora-lib
```

### Troubleshooting Installation

**If prebuilt binary fails to load:**

```bash
# Install build dependencies first (see above)
npm rebuild liora-lib --build-from-source
```

**Common errors:**

- `Error: FFmpeg not found` → Install FFmpeg: `sudo apt install ffmpeg`
- `MODULE_NOT_FOUND` → Ensure Node.js version is 22+
- `GLIBC version mismatch` → You're not on Ubuntu 24.04; rebuild from source
- `node-gyp errors` → Install `build-essential` and `python3`

---

## Modules Overview

| Module | Description | Dependencies |
|---------|--------------|--------------|
| `convert` | High-performance media converter using FFmpeg backend | FFmpeg |
| `sticker` | WebP encoder and EXIF injector for animated/static stickers | FFmpeg |
| `cron` | Lightweight native scheduler with cron expression support | None |
| `fetch` | Native HTTP/HTTPS client with optimized performance | None |
| `addExif` | EXIF metadata injector for WebP images | None |

---

## Usage Examples

All examples use ES modules and are compatible with Node.js 22+.

### Import the library

```js
import {
  schedule,
  addExif,
  sticker,
  convert,
  fetch
} from "liora-lib";
import fs from "fs/promises"; // Use promises API
```

---

### Example 1: Native Cron Scheduler

Create a recurring job that runs every 10 seconds:

```js
// Schedule a job using cron syntax
const job = schedule("*/10 * * * * *", () => {
  const now = new Date().toLocaleTimeString();
  console.log(`[Cron] Triggered at ${now}`);
});

// Stop the job after 30 seconds
setTimeout(() => {
  console.log("Stopping cron job...");
  job.stop();
  
  console.log("Job running?", job.isRunning()); // false
}, 30000);

// Check status
console.log("Seconds until next run:", job.secondsToNext());
console.log("Is running:", job.isRunning()); // true
```

**Cron expression format:** `second minute hour day month weekday`

---

### Example 2: Create WebP Stickers

Convert any image or video to a WhatsApp-compatible sticker:

```js
try {
  // Read input image
  const inputImage = await fs.readFile("./example.png");
  
  // Create sticker with metadata
  const webpBuffer = sticker(inputImage, {
    crop: true,               // Crop to 512x512 square
    quality: 90,              // High quality (1-100)
    fps: 15,                  // For animated sources
    maxDuration: 10,          // Max 10 seconds for videos
    packName: "Liora Pack",   // Sticker pack name
    authorName: "Izumi",      // Creator name
    emojis: ["🌸", "🍥"]      // Associated emojis (WhatsApp)
  });

  // Save the sticker
  await fs.writeFile("./output.webp", webpBuffer);
  console.log("🖼️ Sticker saved as output.webp");
} catch (error) {
  console.error("Sticker creation failed:", error.message);
}
```

---

### Example 3: Add EXIF Metadata

Inject or update EXIF metadata in existing WebP files:

```js
try {
  const existingSticker = await fs.readFile("./output.webp");
  
  // Add/update EXIF data
  const withExif = addExif(existingSticker, {
    packName: "Liora Collection",
    authorName: "Naruya Izumi",
    emojis: ["😊", "🎨", "✨"]
  });
  
  await fs.writeFile("./sticker_with_exif.webp", withExif);
  console.log("🧩 EXIF metadata injected successfully");
} catch (error) {
  console.error("EXIF injection failed:", error.message);
}
```

---

### Example 4: Audio/Video Conversion

Convert media files with FFmpeg backend:

```js
try {
  const inputAudio = await fs.readFile("./sample.mp3");
  
  // Convert to Opus format (WhatsApp voice note compatible)
  const converted = convert(inputAudio, {
    format: "opus",          // Output: opus, mp3, wav, aac, m4a, ogg
    bitrate: "128k",         // Audio bitrate
    channels: 2,             // Stereo
    sampleRate: 48000,       // 48kHz
    ptt: true,               // Push-to-talk mode (WhatsApp)
    vbr: true                // Variable bitrate for better quality
  });
  
  await fs.writeFile("./sample_converted.opus", converted);
  console.log("🎵 Audio converted successfully");
} catch (error) {
  console.error("Conversion failed:", error.message);
  // Common: "FFmpeg not found" - install FFmpeg
}
```

**Supported formats:**
- Audio: `opus`, `mp3`, `aac`, `wav`, `ogg`, `m4a`
- Video: `mp4`, `webm`, `mkv`, `avi`

---

### Example 5: Native HTTP Fetch

High-performance HTTP client with standard Fetch API:

```js
try {
  // GET request
  const response = await fetch("https://api.github.com/repos/naruyaizumi/liora-lib");
  
  console.log("Status:", response.status);        // 200
  console.log("OK:", response.ok);                // true
  console.log("Headers:", response.headers);      // Object
  
  // Parse JSON
  const data = await response.json();
  console.log("Repository:", data.name);
  console.log("Stars:", data.stargazers_count);
  
} catch (error) {
  console.error("Fetch failed:", error.message);
}
```

---

### Example 6: POST Request with Headers

```js
try {
  const response = await fetch("https://httpbin.org/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "liora-lib/1.0"
    },
    body: JSON.stringify({
      message: "Hello from native fetch!"
    })
  });
  
  const result = await response.json();
  console.log("Response:", result);
  
} catch (error) {
  console.error("POST failed:", error.message);
}
```

---

### Example 7: Download Binary Data

```js
try {
  const response = await fetch("https://example.com/image.jpg");
  
  // Get as ArrayBuffer
  const buffer = await response.arrayBuffer();
  
  // Convert to Node.js Buffer and save
  await fs.writeFile("./downloaded.jpg", Buffer.from(buffer));
  console.log("📥 Image downloaded");
  
} catch (error) {
  console.error("Download failed:", error.message);
}
```

---

## API Reference

### `schedule(expression, callback, options?)`

Creates a native cron job scheduler.

**Parameters:**

| Param | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `expression` | `string` | Yes | Cron expression (6 fields: `* * * * * *`) |
| `callback` | `function` | Yes | Function to execute on trigger |
| `options` | `object` | No | Additional configuration |

**Options:**

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `timezone` | `string` | `"UTC"` | Timezone (e.g., `"America/New_York"`) |
| `immediate` | `boolean` | `false` | Run immediately on creation |
| `once` | `boolean` | `false` | Run only once then stop |

**Returns:** `CronJob` instance

**CronJob Methods:**

- `stop()` - Stops the scheduled job
- `isRunning()` - Returns `boolean` indicating if job is active
- `secondsToNext()` - Returns `number` of seconds until next execution

**Example:**

```js
const job = schedule("0 0 * * * *", () => {
  console.log("Runs every hour");
}, { timezone: "Asia/Tokyo" });

job.stop(); // Stop the job
```

---

### `addExif(buffer, metadata?)`

Injects EXIF metadata into a WebP image buffer.

**Parameters:**

| Param | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `buffer` | `Buffer` | Yes | WebP image buffer |
| `metadata` | `object` | No | EXIF metadata to inject |

**Metadata Object:**

| Field | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `packName` | `string` | `""` | Sticker pack name (WhatsApp) |
| `authorName` | `string` | `""` | Creator/author name |
| `emojis` | `string[]` | `[]` | Associated emoji array |

**Returns:** `Buffer` - New WebP with EXIF data

**Example:**

```js
const webp = await fs.readFile("sticker.webp");
const withExif = addExif(webp, {
  packName: "My Pack",
  authorName: "John Doe",
  emojis: ["😊", "🎉"]
});
```

---

### `sticker(input, options?)`

Converts images or videos into WebP stickers with optional EXIF metadata.

**Parameters:**

| Param | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `input` | `Buffer` | Yes | Input image/video buffer |
| `options` | `object` | No | Conversion options |

**Options:**

| Option | Type | Default | Description |
|:--------|:-----|:--------|:------------|
| `crop` | `boolean` | `false` | Crop to 512x512 square |
| `quality` | `number` | `80` | Output quality (1-100) |
| `fps` | `number` | `15` | Frame rate for animated stickers |
| `maxDuration` | `number` | `15` | Max video duration in seconds |
| `packName` | `string` | `""` | Sticker pack name |
| `authorName` | `string` | `""` | Author name |
| `emojis` | `string[]` | `[]` | Associated emojis |

**Returns:** `Buffer` - WebP sticker with optional EXIF

**Example:**

```js
const img = await fs.readFile("photo.jpg");
const sticker = sticker(img, {
  crop: true,
  quality: 95,
  packName: "Summer 2025"
});
```

---

### `convert(input, options?)`

Converts audio/video files using native FFmpeg bindings.

**Parameters:**

| Param | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `input` | `Buffer` | Yes | Input media buffer |
| `options` | `object` | No | Conversion options |

**Options:**

| Option | Type | Default | Description |
|:--------|:-----|:--------|:------------|
| `format` | `string` | `"opus"` | Output format (opus, mp3, aac, wav, etc.) |
| `bitrate` | `string` | `"64k"` | Audio bitrate (e.g., `"128k"`, `"320k"`) |
| `channels` | `number` | `2` | Audio channels (1=mono, 2=stereo) |
| `sampleRate` | `number` | `48000` | Sampling rate in Hz |
| `ptt` | `boolean` | `false` | Push-to-talk mode (WhatsApp voice notes) |
| `vbr` | `boolean` | `true` | Variable bitrate encoding |

**Returns:** `Buffer` - Converted media

**Example:**

```js
const audio = await fs.readFile("song.mp3");
const opus = convert(audio, {
  format: "opus",
  bitrate: "128k",
  ptt: true // WhatsApp compatible
});
```

---

### `fetch(url, options?)`

Performs native HTTP/HTTPS requests with Fetch API compatibility.

**Parameters:**

| Param | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `url` | `string` | Yes | Target URL |
| `options` | `object` | No | Request options |

**Options:**

| Option | Type | Default | Description |
|:--------|:-----|:--------|:------------|
| `method` | `string` | `"GET"` | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `headers` | `object` | `{}` | Request headers |
| `body` | `string\|Buffer` | `undefined` | Request body |
| `timeout` | `number` | `30000` | Timeout in milliseconds |

**Returns:** `Promise<Response>`

**Response Methods:**

- `.json()` - Parse as JSON
- `.text()` - Get as text string
- `.arrayBuffer()` - Get as ArrayBuffer
- `.abort()` - Abort the request

**Response Properties:**

- `.status` - HTTP status code
- `.ok` - Boolean (true if 200-299)
- `.headers` - Response headers object
- `.statusText` - Status message

**Example:**

```js
const res = await fetch("https://api.example.com/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "value" }),
  timeout: 5000
});

if (res.ok) {
  const data = await res.json();
  console.log(data);
}
```

---

## Performance Notes

- **Cron scheduler:** Native C++ implementation with microsecond precision
- **Media conversion:** Direct FFmpeg API calls, 3-5x faster than CLI spawning
- **HTTP fetch:** Native libcurl bindings, 2-3x faster than Node's `http` module
- **Sticker encoding:** Hardware-accelerated when available

---

## Compatibility

| Node.js Version | Supported | Notes |
|:----------------|:----------|:------|
| 24.x | ✅ Yes | Recommended |
| 22.x | ✅ Yes | Tested |
| 20.x | ⚠️ Partial | May require rebuild |
| -20 | ❌ No | Native module incompatibility |

---

## Troubleshooting

### Error: "FFmpeg not found"

```bash
sudo apt install ffmpeg
ffmpeg -version
```

### Error: "Cannot find module 'liora-lib'"

```bash
npm rebuild liora-lib --build-from-source
```

### Error: "node-gyp rebuild failed"

```bash
sudo apt install build-essential python3
npm install -g node-gyp
npm rebuild liora-lib
```

### Segmentation fault or crashes

- Ensure you're on Ubuntu 24.04 LTS
- Verify FFmpeg installation: `ffmpeg -version`
- Check Node.js version: `node -v` (must be 22+)
- Report with full error log and system info

---

## License

Licensed under the **Apache-2.0 License**.  
© 2025 Naruya Izumi

---

## Support

- **Issues:** [GitHub Issues](https://github.com/naruyaizumi/liora-lib/issues)
- **Documentation:** [Full API Docs](https://github.com/naruyaizumi/liora-lib/wiki)
- **Discussions:** [GitHub Discussions](https://github.com/naruyaizumi/liora-lib/discussions)

---

<div align="center">

**Made with ❤️ for high-performance Node.js applications**

</div>