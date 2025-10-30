import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = "naruyaizumi/liora-lib";
const outDir = path.join(__dirname, "./build/Release");
const MAX_DOWNLOAD_SIZE = 100 * 1024 * 1024;

function getArch() {
  const archMap = { 
    x64: "x64",
    arm64: "arm64"
  };
  const mappedArch = archMap[process.arch];
  if (!mappedArch) throw new Error(`Unsupported architecture: ${process.arch}`);
  return mappedArch;
}

function detectDebian() {
  try {
    if (!fs.existsSync("/etc/os-release")) return false;
    const info = fs.readFileSync("/etc/os-release", "utf8");
    return /debian/i.test(info);
  } catch {
    return false;
  }
}

async function latestTag() {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { "User-Agent": "node", Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (!json.tag_name) throw new Error("Release tag not found");
  return json.tag_name;
}

async function downloadFile(url, dest, retries = 3) {
  let lastError;
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "node" } });
      if (!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);

      const contentLength = res.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > MAX_DOWNLOAD_SIZE) {
        throw new Error(`File too large: ${contentLength} bytes`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) throw new Error("File is empty");
      if (buffer.length > MAX_DOWNLOAD_SIZE) throw new Error("File exceeds size limit");

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buffer);
      return buffer.length;
    } catch (err) {
      lastError = err;
      if (i < retries) {
        console.log(`Retry ${i}/${retries} after error: ${err.message}`);
        await new Promise(r => setTimeout(r, i * 1000));
      }
    }
  }
  throw new Error(`Download failed after ${retries} attempts: ${lastError.message}`);
}

function extractArchive(archivePath, destination) {
  if (!fs.existsSync(archivePath)) throw new Error("Archive not found");
  const stats = fs.statSync(archivePath);
  if (stats.size === 0) throw new Error("Archive is empty");

  fs.mkdirSync(destination, { recursive: true });
  
  try {
    execSync(`tar -xzf "${archivePath}" -C "${destination}"`, { stdio: "inherit" });
  } catch (err) {
    throw new Error(`Extraction failed: ${err.message}`);
  }

  const extractedFiles = fs.readdirSync(destination);
  if (!extractedFiles.length) throw new Error("No files found after extraction");

  console.log(`Extracted ${extractedFiles.length} file(s): ${extractedFiles.join(", ")}`);
  
  const hasValidFile = extractedFiles.some(file => {
    const filePath = path.join(destination, file);
    const stat = fs.statSync(filePath);
    return stat.isFile() && stat.size > 0;
  });
  
  if (!hasValidFile) {
    throw new Error("No valid files found after extraction");
  }
}

function manualBuild() {
  console.log("Attempting manual build...");
  try {
    execSync("npm run build", { stdio: "inherit" });
  } catch (err) {
    throw new Error(`Manual build command failed: ${err.message}`);
  }
}

function cleanup(tmpDir) {
  if (!tmpDir) return;
  
  try {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.log("Cleanup completed.");
    }
  } catch (err) {
    console.warn(`Cleanup warning: ${err.message}`);
  }
}

(async () => {
  let tmp;
  try {
    if (os.platform() !== "linux") {
      throw new Error("Prebuilds are only available for Linux");
    }

    const arch = getArch();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "liora-prebuild-"));

    console.log("Fetching latest release...");
    const tag = await latestTag();
    console.log(`Latest tag: ${tag}`);

    const isDebian = detectDebian();
    const fileName = isDebian 
      ? `build-linux-${arch}-debian12.tar.gz` 
      : `build-linux-${arch}.tar.gz`;
    const url = `https://github.com/${repo}/releases/download/${tag}/${fileName}`;
    const dest = path.join(tmp, fileName);

    console.log(`Detected: ${isDebian ? "Debian 12" : "Generic Linux"} (${arch})`);
    console.log("Downloading official release build...");
    console.log(`URL: ${url}`);
    
    const size = await downloadFile(url, dest);
    console.log(`Downloaded ${(size / 1024 / 1024).toFixed(2)} MB`);

    fs.mkdirSync(outDir, { recursive: true });
    console.log("Extracting archive...");
    extractArchive(dest, outDir);

    console.log("✓ Prebuild installed successfully.");
    cleanup(tmp);
    process.exit(0);
  } catch (error) {
    console.error(`✗ Prebuild failed: ${error.message}`);
    cleanup(tmp);

    try {
      manualBuild();
      console.log("✓ Manual build completed successfully.");
      process.exit(0);
    } catch (fallbackErr) {
      console.error(`✗ Fallback build failed: ${fallbackErr.message}`);
      console.error("Please ensure you have the required build tools installed.");
      process.exit(1);
    }
  }
})();