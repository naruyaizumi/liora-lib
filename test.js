import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { schedule, addExif, sticker, convert, fetch } from "./src/bridge.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tempFiles = new Set()

async function fetchSample(url, filename) {
    console.log(`Downloading: ${filename} from ${url}`)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const filePath = path.join(__dirname, filename)
    fs.writeFileSync(filePath, buf)
    tempFiles.add(filePath)
    console.log(`${filename} saved`)
    return filePath
}

async function testCron() {
    console.log("\n[1] Testing Cron...")
    return new Promise((resolve) => {
        let count = 0
        const job = schedule("testJob", () => {
            count++
            console.log(`  tick ${count} ✓`)
            if (count >= 10) {
                job.stop()
                console.log("Cron stopped ✓")
                resolve()
            }
        }, { intervalSeconds: 1 })
    })
}

async function testSticker() {
    console.log("\n[2] Testing Sticker...")
    try {
        const imgPath = await fetchSample("https://qu.ax/Gamil.jpg", "sample.jpg")
        const buf = fs.readFileSync(imgPath)

        const webp = sticker(buf, { packName: "Liora Test", authorName: "Izumi" })
        const outWebp = path.join(__dirname, "out.webp")
        fs.writeFileSync(outWebp, webp)
        tempFiles.add(outWebp)
        console.log("Sticker created → out.webp")

        const exif = addExif(webp, { pack: "Liora Test", author: "Izumi" })
        const outExif = path.join(__dirname, "out_exif.webp")
        fs.writeFileSync(outExif, exif)
        tempFiles.add(outExif)
        console.log("Exif metadata added → out_exif.webp")
    } catch (e) {
        console.error("Sticker test error:", e)
    }
}

async function testConverter() {
    console.log("\n[3] Testing Converter...")
    try {
        const mp4Path = await fetchSample("https://qu.ax/zaxZx.mp4", "sample.mp4")
        const buf = fs.readFileSync(mp4Path)
        const out = convert(buf, { format: "opus", ptt: true })
        const outOpus = path.join(__dirname, "out.opus")
        fs.writeFileSync(outOpus, out)
        tempFiles.add(outOpus)
        console.log("Converted sample.mp4 → out.opus")
    } catch (e) {
        console.error("Converter test error:", e)
    }
}

async function testFetch() {
    console.log("\n[4] Testing Fetch (10 parallel requests to google.com)...")
    try {
        const results = await Promise.all(
            Array.from({ length: 10 }, async (_, i) => {
                const res = await fetch("https://www.google.com")
                const text = await res.text().catch(() => "(invalid)")
                return { id: i + 1, status: res.status, length: text.length }
            })
        )
        results.forEach((r) =>
            console.log(`Request #${r.id} → Status: ${r.status}, Length: ${r.length}`)
        )
    } catch (e) {
        console.error("Fetch test error:", e)
    }
}

function cleanup() {
    console.log("\n🧹 Cleaning up temporary files...")
    for (const file of tempFiles) {
        try {
            fs.rmSync(file, { force: true })
            console.log(`  deleted ${path.basename(file)}`)
        } catch {
            console.warn(`  failed to delete ${file}`)
        }
    }
    console.log("Cleanup complete ✓")
}

async function runTests() {
    console.log("=== Starting Liora Native Addon Test ===")

    await testCron()
    console.log("Cron test complete ✓")

    await testSticker()
    console.log("Sticker test complete ✓")

    await testConverter()
    console.log("Converter test complete ✓")

    await testFetch()
    console.log("Fetch test complete ✓")

    cleanup()
    console.log("\n=== All tests finished successfully ===")
    process.exit(0)
}

runTests().catch((e) => {
    console.error("Fatal test error:", e)
    cleanup()
    process.exit(1)
})