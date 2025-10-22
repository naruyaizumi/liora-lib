import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = "naruyaizumi/liora-lib";
const outDir = path.join(__dirname, "../build/Release");

function getArch() {
  const archMap = {
    x64: "x64",
    arm64: "arm64",
    ia32: "x64",
  };
  
  const mappedArch = archMap[process.arch];
  if (!mappedArch) {
    throw new Error(`Unsupported architecture: ${process.arch}`);
  }
  return mappedArch;
}

function getPlatform() {
  const platformMap = {
    linux: "Linux",
    darwin: "macOS",
    win32: "Windows",
  };
  
  const mappedPlatform = platformMap[os.platform()];
  if (!mappedPlatform) {
    throw new Error(`Unsupported platform: ${os.platform()}`);
  }
  return mappedPlatform;
}

async function latestTag() {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { "User-Agent": "node" },
    });
    
    if (!res.ok) {
      throw new Error(`GitHub API request failed with status ${res.status}`);
    }
    
    const json = await res.json();
    
    if (!json.tag_name) {
      throw new Error("Release tag not found in API response");
    }
    
    return json.tag_name;
  } catch (error) {
    throw new Error(`Failed to fetch latest release: ${error.message}`);
  }
}

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Download failed with status ${res.status}`);
    }
    
    const buffer = Buffer.from(await res.arrayBuffer());
    
    if (buffer.length === 0) {
      throw new Error("Downloaded file is empty");
    }
    
    fs.writeFileSync(dest, buffer);
    return true;
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

function extractArchive(archivePath, destination, isWindows) {
  try {
    if (isWindows) {
      const escapedArchive = archivePath.replace(/'/g, "''");
      const escapedDest = destination.replace(/'/g, "''");
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Path '${escapedArchive}' -DestinationPath '${escapedDest}' -Force"`,
        { stdio: "inherit" }
      );
    } else {
      execSync(`tar -xzf "${archivePath}" -C "${destination}"`, { 
        stdio: "inherit",
        timeout: 60000
      });
    }
  } catch (error) {
    throw new Error(`Failed to extract archive: ${error.message}`);
  }
}

(async () => {
  let tmp;
  
  try {
    const arch = getArch();
    const platformName = getPlatform();
    const isWindows = os.platform() === "win32";
    
    console.log(`Downloading prebuild for ${platformName} ${arch}...`);
    
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "liora-prebuild-"));
    
    const tag = await latestTag();
    console.log(`Latest release: ${tag}`);
    
    const ext = isWindows ? "zip" : "tar.gz";
    const name = `prebuild-${platformName}-${arch}.${ext}`;
    const url = `https://github.com/${repo}/releases/download/${tag}/${name}`;
    const dest = path.join(tmp, name);
    
    console.log(`Downloading from: ${url}`);
    await downloadFile(url, dest);
    
    const stats = fs.statSync(dest);
    if (stats.size === 0) {
      throw new Error("Downloaded file is empty");
    }
    
    console.log(`Downloaded ${stats.size} bytes`);
    
    fs.mkdirSync(outDir, { recursive: true });
    
    console.log(`Extracting to: ${outDir}`);
    extractArchive(dest, outDir, isWindows);
    
    console.log("Prebuild installation completed successfully");
    process.exit(0);
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    if (tmp) {
      try {
        fs.rmSync(tmp, { recursive: true, force: true });
      } catch (err) {
        console.warn(`Warning: Failed to clean up temporary directory: ${err.message}`);
      }
    }
  }
})();