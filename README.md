<div align="center">

# liora-lib

![Liora](https://qu.ax/Gamil.jpg)

</div>

**NOTE:** This library is **Linux-exclusive** and requires native dependencies. Running on other operating systems (Windows, macOS) or non-x64 architectures will fail.  
All prebuilt binaries are compiled for **Ubuntu 24.04 LTS (x64)**. Errors outside this environment are **not library bugs** unless dependencies are properly installed.

**Liora-lib** is a high-performance Node.js native addon providing multimedia and system-level utilities.  
It exposes modules for media conversion, sticker encoding, EXIF metadata handling, and optimized HTTP fetching — all implemented in C++ with an ES module interface.

---

## Features

- ⚡ **Linux-native performance** optimized for Ubuntu 24.04 LTS  
- 📦 **Prebuilt x64 binaries** with automatic fallback to source compilation  
- 🎬 **FFmpeg-powered converter** for audio/video transcoding  
- 🎨 **Sticker toolkit** with WebP encoding and EXIF metadata injection  
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

# Additional libraries for full functionality
sudo apt install -y libcurl4-openssl-dev libwebp-dev

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
| `convert` | High-performance media converter using FFmpeg backend | ffmpeg, libavcodec |
| `sticker` | WebP encoder and EXIF injector for animated/static stickers | ffmpeg, libwebp |
| `fetch` | Native HTTP/HTTPS client with optimized performance | libcurl |
| `addExif` | EXIF metadata injector for WebP images | libwebp |

---

## Usage Examples

All examples use ES modules and are compatible with Node.js 22+.

### Import the library

```js
import {
  addExif,
  sticker,
  convert,
  fetch
} from "liora-lib";
import fs from "fs/promises"; // Use promises API
```

---

### Example 1: Basic Media Conversion

Convert an MP3 file to Opus format:

```js
try {
  // Read input audio file
  const inputAudio = await fs.readFile("./input.mp3");
  
  // Convert to Opus format
  const outputBuffer = convert(inputAudio, {
    format: "opus",
    bitrate: "64k"
  });
  
  // Save the converted file
  await fs.writeFile("./output.opus", outputBuffer);
  console.log("✅ Conversion completed successfully");
} catch (error) {
  console.error("❌ Conversion failed:", error.message);
  
  // Check for common issues
  if (error.message.includes("FFmpeg")) {
    console.error("💡 Solution: Install FFmpeg with 'sudo apt install ffmpeg'");
  }
}
```

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
  console.error("❌ Sticker creation failed:", error.message);
  
  if (error.message.includes("Invalid image")) {
    console.error("💡 Ensure input is a valid image file (PNG, JPG, GIF, etc.)");
  }
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
  console.error("❌ EXIF injection failed:", error.message);
  
  if (error.message.includes("Invalid WebP")) {
    console.error("💡 Input must be a valid WebP file");
  }
}
```

---

### Example 4: Audio/Video Conversion with Advanced Options

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
  console.error("❌ Conversion failed:", error.message);
  
  // Common error handling
  if (error.message.includes("FFmpeg not found")) {
    console.error("💡 Install FFmpeg: sudo apt install ffmpeg");
  } else if (error.message.includes("Unsupported format")) {
    console.error("💡 Check that the input file is a valid audio/video format");
  }
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
  console.error("❌ Fetch failed:", error.message);
  
  if (error.message.includes("timeout")) {
    console.error("💡 Request timed out, try increasing timeout option");
  } else if (error.message.includes("DNS")) {
    console.error("💡 DNS resolution failed, check your internet connection");
  }
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
    }),
    timeout: 10000 // 10 second timeout
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  console.log("✅ Response:", result);
  
} catch (error) {
  console.error("❌ POST failed:", error.message);
  
  if (error.message.includes("HTTP error")) {
    console.error("💡 Server returned an error status code");
  }
}
```

---

### Example 7: Download Binary Data

```js
try {
  const response = await fetch("https://example.com/image.jpg");
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  
  // Get as ArrayBuffer
  const buffer = await response.arrayBuffer();
  
  // Convert to Node.js Buffer and save
  await fs.writeFile("./downloaded.jpg", Buffer.from(buffer));
  console.log("📥 Image downloaded successfully");
  
} catch (error) {
  console.error("❌ Download failed:", error.message);
  
  if (error.message.includes("404")) {
    console.error("💡 File not found on server");
  } else if (error.message.includes("timeout")) {
    console.error("💡 Download timed out, try a smaller file or increase timeout");
  }
}
```

---

## API Reference

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

**Throws:**
- `TypeError` - If buffer is not a valid Buffer
- `Error` - If input is not a valid WebP file

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

**Throws:**
- `TypeError` - If input is not a valid Buffer
- `Error` - If FFmpeg is not installed or accessible
- `Error` - If input format is not supported

**Example:**

```js
const img = await fs.readFile("photo.jpg");
const stickerBuffer = sticker(img, {
  crop: true,
  quality: 95,
  packName: "Summer 2025"
});
await fs.writeFile("summer.webp", stickerBuffer);
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

**Throws:**
- `TypeError` - If input is not a valid Buffer
- `Error` - If FFmpeg is not installed
- `Error` - If output format is not supported
- `Error` - If input file is corrupted or invalid

**Example:**

```js
const audio = await fs.readFile("song.mp3");
const opus = convert(audio, {
  format: "opus",
  bitrate: "128k",
  ptt: true // WhatsApp compatible
});
await fs.writeFile("song.opus", opus);
```

---

### `fetch(url, options?)`

Performs native HTTP/HTTPS requests with Fetch API compatibility.

**Parameters:**

| Param | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `url` | `string` | Yes | Target URL (must be valid HTTP/HTTPS) |
| `options` | `object` | No | Request options |

**Options:**

| Option | Type | Default | Description |
|:--------|:-----|:--------|:------------|
| `method` | `string` | `"GET"` | HTTP method (GET, POST, PUT, DELETE, PATCH, etc.) |
| `headers` | `object` | `{}` | Request headers (key-value pairs) |
| `body` | `string\|Buffer` | `undefined` | Request body (required for POST/PUT) |
| `timeout` | `number` | `30000` | Timeout in milliseconds (0 = no timeout) |

**Returns:** `Promise<Response>`

**Response Methods:**

- `.json()` → `Promise<any>` - Parse response as JSON
- `.text()` → `Promise<string>` - Get response as text string
- `.arrayBuffer()` → `Promise<ArrayBuffer>` - Get response as ArrayBuffer
- `.abort()` → `void` - Abort the ongoing request

**Response Properties:**

- `.status` → `number` - HTTP status code (200, 404, etc.)
- `.ok` → `boolean` - True if status is 200-299
- `.headers` → `object` - Response headers as key-value object
- `.statusText` → `string` - Status message ("OK", "Not Found", etc.)

**Throws:**
- `TypeError` - If URL is invalid
- `Error` - If request times out
- `Error` - If network error occurs
- `Error` - If DNS resolution fails

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
} else {
  console.error(`HTTP Error: ${res.status} ${res.statusText}`);
}
```

---

## Performance Notes

- **Media conversion:** Direct FFmpeg API calls, 3-5x faster than CLI spawning
- **HTTP fetch:** Native libcurl bindings, 2-3x faster than Node's `http` module
- **Sticker encoding:** Hardware-accelerated when available
- **Memory efficiency:** Streaming processing for large files (>100MB)

---

## Compatibility

| Node.js Version | Supported | Notes |
|:----------------|:----------|:------|
| 24.x | ✅ Yes | Recommended |
| 22.x | ✅ Yes | Fully tested |
| 20.x | ⚠️ Partial | May require manual rebuild |
| < 20 | ❌ No | Native module API incompatibility |

| Operating System | Supported | Notes |
|:-----------------|:----------|:------|
| Ubuntu 24.04 LTS | ✅ Yes | Primary target |
| Ubuntu 22.04 LTS | ⚠️ Partial | Requires rebuild from source |
| Debian 12+ | ⚠️ Partial | Requires rebuild from source |
| Other Linux | ❌ No | Not officially supported |
| Windows | ❌ No | Linux-only library |
| macOS | ❌ No | Linux-only library |

---

## Troubleshooting

### Error: "FFmpeg not found"

**Cause:** FFmpeg is not installed or not in system PATH

**Solution:**
```bash
sudo apt install ffmpeg libavcodec-dev libavformat-dev libavutil-dev
ffmpeg -version
```

### Error: "Cannot find module 'liora-lib'"

**Cause:** Prebuilt binary is incompatible with your system

**Solution:**
```bash
# Install build dependencies
sudo apt install build-essential python3

# Rebuild from source
npm rebuild liora-lib --build-from-source
```

### Error: "node-gyp rebuild failed"

**Cause:** Missing build tools

**Solution:**
```bash
sudo apt install build-essential python3 git
npm install -g node-gyp
npm rebuild liora-lib
```

### Segmentation fault or crashes

**Possible causes:**
- Not running on Ubuntu 24.04 LTS
- Missing runtime dependencies
- Corrupted input files
- Node.js version mismatch

**Solutions:**
1. Verify system: `lsb_release -a` (should show Ubuntu 24.04)
2. Check FFmpeg: `ffmpeg -version`
3. Check Node.js: `node -v` (must be 22.0.0+)
4. Validate input files before processing
5. Report issue with full error log and system info

### Error: "GLIBC version too old"

**Cause:** Your system uses an older version of GLIBC than the prebuilt binary requires

**Solution:**
```bash
# Rebuild from source
npm rebuild liora-lib --build-from-source
```

---

## License

Licensed under the **Apache-2.0 License**.  
© 2025 Naruya Izumi

See [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- **FFmpeg Team** - For the powerful multimedia framework
- **libcurl Team** - For the robust HTTP client library
- **WebP Team** - For the efficient image format
- **Node.js Community** - For the excellent native addon APIs

---

<div align="center">

**Made with ❤️ for high-performance Node.js applications**

[⭐ Star on GitHub](https://github.com/naruyaizumi/liora-lib) | [🐛 Report Bug](https://github.com/naruyaizumi/liora-lib/issues)

</div>