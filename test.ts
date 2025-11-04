import { addExif, sticker, convert, fetch } from "./export.js";
import { Buffer } from "buffer";
import { strict as assert } from "assert";

const MP4_URL = "https://qu.ax/OeZRN.mp4";
const JPG_URL = "https://qu.ax/ETDnF.jpg";
const FETCH_BENCHMARK_URL = "https://www.google.com";

function isWebP(buf: Buffer): boolean {
    return (
        Buffer.isBuffer(buf) &&
        buf.length >= 12 &&
        buf.slice(0, 4).toString() === "RIFF" &&
        buf.slice(8, 12).toString() === "WEBP"
    );
}

async function downloadBuffer(url: string, description: string): Promise<Buffer> {
    console.log(`   > Downloading ${description} from ${url}...`);
    let res;
    try {
        res = await fetch(url);
    } catch (e) {
        throw new Error(`Failed to perform fetch for ${description}: ${e.message}`);
    }
    
    if (!res.ok) {
        throw new Error(`Failed to download ${description}. Status: ${res.status}`);
    }
    
    const buffer = await res.buffer();
    console.log(`   > Successfully downloaded ${description}: ${buffer.length} bytes.`);
    return buffer;
}

async function runTests() {
    console.log("--- Starting liora-lib Native Addon Tests ---");

    try {
        console.log("Native Addon modules loaded successfully.");
    } catch (e) {
        console.error("Failed to load Native Addons! Ensure 'npm run build:ts' and 'npm install' have been executed.");
        console.error(e);
        return;
    }
    
    let mp4Buffer: Buffer;
    let jpgBuffer: Buffer;
    try {
        mp4Buffer = await downloadBuffer(MP4_URL, "MP4 Video");
        jpgBuffer = await downloadBuffer(JPG_URL, "JPG Image");
        console.log("\n[PASS] Test data preparation successful.");
    } catch (e) {
        console.error("\n[FAIL] FAILED in data preparation (Ensure Native Addon Fetch works and URLs are available):", e.message);
        return;
    }

    console.log("\n[1] Testing sticker (JPG to WebP/Sticker) and addExif...");
    let webpSticker: Buffer = Buffer.from([]);

    try {
        console.log("   > Test 1.1: JPG -> Sticker (Conversion)");
        const result1 = sticker(jpgBuffer, { packName: "StickerTest", authorName: "LioraLib" });
        assert(Buffer.isBuffer(result1), "sticker (JPG) must return a Buffer.");
        assert(isWebP(result1), "Sticker output from JPG must be in WebP format.");
        webpSticker = result1;
        console.log("   [PASS] sticker (JPG to WebP) completed successfully.");

        console.log("   > Test 1.2: WebP Sticker -> addExif");
        const meta = { packName: "EXIFTest", authorName: "LioraLib", emojis: ["smile", "fire"] };
        const result2 = addExif(webpSticker, meta);
        
        assert(Buffer.isBuffer(result2), "addExif must return a Buffer.");
        assert(result2.length > webpSticker.length, "Buffer size must increase after EXIF addition.");
        assert(isWebP(result2), "addExif must remain in WebP format.");
        console.log("   [PASS] addExif executed successfully.");
        
    } catch (e) {
        console.error("   [FAIL] FAILED testing sticker/addExif:", e);
    }

    console.log("\n[2] Testing convert (MP4 to Audio)...");
    
    try {
        console.log("   > Test 2.1: MP4 -> MP3");
        let mp3Result = await convert(mp4Buffer, { format: "mp3", bitrate: "128k" });
        assert(Buffer.isBuffer(mp3Result), "convert (MP3) must return a Buffer.");
        console.log(`   [PASS] MP4 to MP3 conversion successful. Size: ${mp3Result.length} bytes.`);

        console.log("   > Test 2.2: MP4 -> OPUS (PTT)");
        let opusResult = await convert(mp4Buffer, { format: "opus", ptt: true });
        assert(Buffer.isBuffer(opusResult), "convert (OPUS) must return a Buffer.");
        console.log(`   [PASS] MP4 to OPUS (PTT) conversion successful. Size: ${opusResult.length} bytes.`);
        
    } catch (e) {
        console.error("   [FAIL] FAILED testing convert:", e);
    }

    console.log("\n[3] Testing native Fetch Addon (Benchmark www.google.com)...");
    
    try {
        const startTime = process.hrtime.bigint();
        const res = await fetch(FETCH_BENCHMARK_URL);
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        
        assert.equal(res.status, 200, "Fetch failed: Status must be 200.");
        assert.equal(res.ok, true, "Fetch failed: res.ok must be true.");
        
        const textBody = await res.text();
        assert(textBody.length > 1000, "Fetch failed: Body is too short (HTML expected).");
        
        console.log(`   [PASS] fetch successfully retrieved data from ${FETCH_BENCHMARK_URL} (Status: ${res.status}).`);
        console.log(`   -> Response time: ${durationMs.toFixed(2)} ms`);
        
    } catch (e) {
        console.error("   [FAIL] FAILED testing native fetch (Ensure internet connection is working):", e);
    }
    
    console.log("\n--- Tests Complete ---");
}

runTests();