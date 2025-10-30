import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function loadAddon(name) {
    try {
        return require(path.join(__dirname, `./build/Release/${name}.node`));
    } catch {
        try {
            return require(path.join(__dirname, `./build/Debug/${name}.node`));
        } catch {
            throw new Error(`${name} native addon is not built.\n› Run: npm run build`);
        }
    }
}

const stickerNative = loadAddon("sticker");

function isWebP(buf) {
    return (
        Buffer.isBuffer(buf) &&
        buf.length >= 12 &&
        buf.slice(0, 4).toString() === "RIFF" &&
        buf.slice(8, 12).toString() === "WEBP"
    );
}

function addExif(buffer, meta = {}) {
    if (!Buffer.isBuffer(buffer)) throw new Error("addExif() input must be a Buffer");
    return stickerNative.addExif(buffer, meta);
}

function sticker(buffer, options = {}) {
    if (!Buffer.isBuffer(buffer)) throw new Error("sticker() input must be a Buffer");
    const opts = {
        crop: options.crop ?? false,
        quality: options.quality ?? 80,
        fps: options.fps ?? 15,
        maxDuration: options.maxDuration ?? 15,
        packName: options.packName || "",
        authorName: options.authorName || "",
        emojis: options.emojis || [],
    };
    if (isWebP(buffer)) return stickerNative.addExif(buffer, opts);
    return stickerNative.sticker(buffer, opts);
}

const converterNative = loadAddon("converter");

function convert(input, options = {}) {
    const buf = Buffer.isBuffer(input) ? input : input?.data;
    if (!Buffer.isBuffer(buf)) throw new Error("convert() input must be a Buffer");
    return converterNative.convert(buf, {
        format: options.format || "opus",
        bitrate: options.bitrate || "64k",
        channels: options.channels ?? 2,
        sampleRate: options.sampleRate || 48000,
        ptt: !!options.ptt,
        vbr: options.vbr !== false,
    });
}

const fetchNative = loadAddon("fetch");
const textDecoder = new TextDecoder("utf-8");

function fetch(url, options = {}) {
    if (typeof url !== "string") throw new TypeError("fetch() requires a URL string");
    if (!fetchNative) throw new Error("Native fetch addon not loaded");
    
    const nativeFunc = fetchNative.startFetch || fetchNative.fetch;
    if (typeof nativeFunc !== "function") throw new Error("No valid native fetch entrypoint");
    
    const exec =
        typeof fetchNative.startFetch === "function"
            ? fetchNative.startFetch(url, options)
            : { promise: nativeFunc(url, options) };
    
    const promise = exec.promise || exec;
    
    return promise
        .then((res) => {
            if (!res || typeof res !== "object") {
                throw new Error("Invalid response from native fetch");
            }
            
            let body;
            
            if (Buffer.isBuffer(res.body)) {
                body = res.body;
            } else if (res.body instanceof ArrayBuffer) {
                body = Buffer.from(new Uint8Array(res.body));
            } else if (ArrayBuffer.isView(res.body)) {
                body = Buffer.from(res.body.buffer, res.body.byteOffset, res.body.byteLength);
            } else if (Array.isArray(res.body)) {
                if (res.body.buffer && res.body.buffer instanceof ArrayBuffer) {
                    body = Buffer.from(res.body.buffer);
                } else {
                    body = Buffer.from(res.body);
                }
            } else {
                body = Buffer.from(res.body || []);
            }
            
            const cachedTextRef = { val: null };
            
            const out = {
                status: res.status,
                statusText: res.statusText || "",
                headers: res.headers || {},
                url: res.url || url,
                ok: res.status >= 200 && res.status < 300,
                body: body,
                abort: exec.abort,
                arrayBuffer() {
                    return Promise.resolve(body.buffer.slice(
                        body.byteOffset,
                        body.byteOffset + body.byteLength
                    ));
                },
                buffer() {
                    return Promise.resolve(body);
                },
                text() {
                    if (cachedTextRef.val === null) {
                        cachedTextRef.val = textDecoder.decode(body);
                    }
                    return Promise.resolve(cachedTextRef.val);
                },
                json() {
                    return new Promise((resolve, reject) => {
                        try {
                            if (cachedTextRef.val === null) {
                                cachedTextRef.val = textDecoder.decode(body);
                            }
                            resolve(JSON.parse(cachedTextRef.val));
                        } catch (e) {
                            reject(new Error(`Invalid JSON: ${e.message}`));
                        }
                    });
                },
            };
            
            return out;
        })
        .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(msg);
        });
}

export {
    addExif,
    sticker,
    convert,
    fetch
};