import { Storage } from '@google-cloud/storage';
import recursive from 'recursive-readdir';
import { createWriteStream, mkdirSync, statSync } from 'fs';
import { resolve, sep } from 'path';
import md5Promise from 'md5-file/promise';
import prettyBytes from 'pretty-bytes';
import request from 'request';
const progress = require('request-progress');

const storage = new Storage();

type Bytes = number;

interface GoogleFileMetadata {
    md5Hash: string,
    crc32c: string,
    name: string,
    size: string,
    mediaLink: string,
}

interface FileData {
    path: string;
    md5: string;
}

interface RemoteFile extends FileData {
    size: Bytes,
    downloadLink: string,
}

interface LocalFile extends FileData {
    systemPath: string;
}

export async function getRemoteFiles(): Promise<RemoteFile[]> {
    const [files] = await storage.bucket('polygon-updater.appspot.com').getFiles();

    const promises = files
        .map(f => f.getMetadata())
        .map(p => p.then((resp) => {
            const m = resp[0] as GoogleFileMetadata;
            return {
                path: m.name,
                md5: Buffer.from(m.md5Hash, 'base64').toString('hex'),
                size: Number.parseInt(m.size, 10),
                downloadLink: m.mediaLink,
            };
        }));

    return Promise.all(promises);
}

export async function getLocalFiles(): Promise<LocalFile[]> {
    mkdirSync('WindowsNoEditor', { recursive: true });
    const files = await recursive('WindowsNoEditor');
    const hashes = await Promise.all(files.map(md5Promise));

    return files.map((f, i) => {
        const paths = f.split(sep);
        const index = paths.indexOf('WindowsNoEditor');
        return {
            path: paths.slice(index).join('/'),
            md5: hashes[i],
            systemPath: f,
        }
    })
}

export function findNewRemoteFiles(local: LocalFile[], remote: RemoteFile[]): RemoteFile[] {
    return remote.filter(r => {
        const localFile = local.find(l => l.path === r.path);

        return !(localFile && localFile.md5 === r.md5);
    });
}

export function getUpdateDownloadSize(files: RemoteFile[]): string {
    const size = files.reduce((p, c) => {
        return p += c.size;
    }, 0);
    return prettyBytes(size);
}

function toNativeDelimiter(path: string) {
    return path.replace(/\//g, sep);
}

function createFolderForPath(path: string) {
    const nativeFilePath = toNativeDelimiter(path);
    const folderPath = nativeFilePath.substring(0, nativeFilePath.lastIndexOf(sep));

    mkdirSync(folderPath, { recursive: true });
}

interface Cb {
    file: string,
    index: {
        current: number,
        all: number,
    }
    progress: number,
}
export async function downloadUpdates(files: RemoteFile[], cb: (arg: Cb) => void) {
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const nativePath: string = toNativeDelimiter(f.path);
        createFolderForPath(nativePath);

        try {
            if (statSync(nativePath).isDirectory()) {
                return Promise.resolve();
            }
        } catch (e) {
            // skip if file is not created
        }

        function last<T>(arg: Array<T>): T {
            return arg[arg.length - 1];
        }

        await new Promise((res, rej) => {
            progress(request(f.downloadLink))
                // @ts-ignore
                .on('progress', (state: { percent: number }) => {
                    cb({
                        file: last(f.path.split('/')),
                        progress: state.percent,
                        index: {
                            current: i,
                            all: files.length,
                        }
                    });
                })
                .on('error', () => rej())
                .on('end', () => res())
                .pipe(createWriteStream(nativePath));
        });
    }
}