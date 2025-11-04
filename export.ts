import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

interface AddonOptions {
    packName?: string;
    authorName?: string;
    emojis?: string[];
}

interface StickerOptions extends AddonOptions {
    crop?: boolean;
    quality?: number;
    fps?: number;
    maxDuration?: number;
}

interface ConvertOptions {
    format?: string;
    bitrate?: string;
    channels?: number;
    sampleRate?: number;
    ptt?: boolean;
    vbr?: boolean;
}

interface StickerNativeAddon {
    addExif(buffer: Buffer, meta: AddonOptions): Buffer;
    sticker(buffer: Buffer, opts: StickerOptions): Buffer;
}

interface ConverterNativeAddon {
    convert(buffer: Buffer, opts: ConvertOptions): Buffer | Promise<Buffer>;
}

interface FetchResponse {
    status: number;
    statusText?: string;
    headers: Record<string, string>;
    url?: string;
    ok?: boolean;
    body: Buffer | ArrayBuffer | ArrayBufferView | number[] | null; 
    abort?: () => void;
}

interface FetchNativeAddon {
    startFetch?: (url: string, options: Record<string, any>) => { promise: Promise<FetchResponse>, abort: () => void };
    fetch?: (url: string, options: Record<string, any>) => Promise<FetchResponse>;
}

interface CustomResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    url: string;
    ok: boolean;
    body: Buffer;
    abort: () => void;
    arrayBuffer(): Promise<ArrayBuffer | SharedArrayBuffer>; 
    buffer(): Promise<Buffer>;
    text(): Promise<string>;
    json(): Promise<any>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function loadAddon<T>(name: string): T {
    const projectRoot = __dirname; 
    try {
        return require(path.join(projectRoot, `./build/Release/${name}.node`)) as T;
    } catch {
        try {
            return require(path.join(projectRoot, `./build/Debug/${name}.node`)) as T;
        } catch {
            throw new Error(`${name} Native addon is not built. Make sure you run 'pnpm run build:addon'.\n› Run: npm run build`);
        }
    }
}

const stickerNative = loadAddon<StickerNativeAddon>("sticker");
const converterNative = loadAddon<ConverterNativeAddon>("converter");
const fetchNative = loadAddon<FetchNativeAddon>("fetch");
const textDecoder = new TextDecoder("utf-8");

function isWebP(buf: Buffer): boolean {
    return (
        Buffer.isBuffer(buf) &&
        buf.length >= 12 &&
        buf.slice(0, 4).toString() === "RIFF" &&
        buf.slice(8, 12).toString() === "WEBP"
    );
}

interface AddExifOptions extends AddonOptions {}

function addExif(buffer: Buffer, meta: AddExifOptions = {}): Buffer {
    if (!Buffer.isBuffer(buffer)) throw new Error("addExif() input must be a Buffer");
    return stickerNative.addExif(buffer, meta);
}

function sticker(buffer: Buffer, options: StickerOptions = {}): Buffer {
    if (!Buffer.isBuffer(buffer)) throw new Error("sticker() input must be a Buffer");
    const opts: StickerOptions = {
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

function convert(input: Buffer | { data: Buffer }, options: ConvertOptions = {}): Buffer | Promise<Buffer> {
    const buf: Buffer = Buffer.isBuffer(input) ? input : input?.data;
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

type NativeFetchResult = { promise: Promise<FetchResponse>, abort?: () => void };

function fetch(url: string, options: Record<string, any> = {}): Promise<CustomResponse> {
    if (typeof url !== "string") throw new TypeError("fetch() requires a URL string");
    if (!fetchNative) throw new Error("Native fetch addon not loaded");
    
    const nativeFunc = fetchNative.startFetch || fetchNative.fetch;
    if (typeof nativeFunc !== "function") throw new Error("No valid native fetch entrypoint");
    
    const exec: NativeFetchResult = 
        typeof fetchNative.startFetch === "function"
            ? fetchNative.startFetch(url, options) 
            : { 
                promise: (nativeFunc(url, options) as Promise<FetchResponse>),
                abort: undefined
            };

    const promise = exec.promise;
    
    return promise
        .then((res) => {
            if (!res || typeof res !== "object") {
                throw new Error("Invalid response from native fetch");
            }
            
            let body: Buffer;
            
            if (Buffer.isBuffer(res.body)) {
                body = res.body;
            } else if (res.body instanceof ArrayBuffer) {
                body = Buffer.from(res.body);
            } else if (ArrayBuffer.isView(res.body)) {
                body = Buffer.from(res.body.buffer, res.body.byteOffset, res.body.byteLength);
            } else if (Array.isArray(res.body)) {
                body = Buffer.from(res.body as number[]);
            } else {
                body = Buffer.from([]);
            }
            
            const cachedTextRef: { val: string | null } = { val: null };
            
            const out: CustomResponse = {
                status: res.status,
                statusText: res.statusText || "",
                headers: res.headers || {},
                url: res.url || url,
                ok: res.status >= 200 && res.status < 300,
                body: body,
                abort: exec.abort || (() => {}), 
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
                            reject(new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`));
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