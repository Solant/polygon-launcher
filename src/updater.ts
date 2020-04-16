import { Storage } from '@google-cloud/storage';
import recursive from 'recursive-readdir';
import { createWriteStream, mkdirSync, statSync } from 'fs';
import { sep } from 'path';
import md5Promise from 'md5-file/promise';
import prettyBytes from 'pretty-bytes';
import request from 'request';
import { ComposedTask } from './task';
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

export async function getRemoteFiles(cb: (a: number) => void, limit: number): Promise<RemoteFile[]> {
    const [files] = await storage.bucket('polygon-updater.appspot.com').getFiles();

    const a = new ComposedTask(files, cb, limit);
    return await a.run(async (file) => {
        const resp = await file.getMetadata();
        const m = resp[0] as GoogleFileMetadata;
        return {
            path: m.name,
            md5: Buffer.from(m.md5Hash, 'base64').toString('hex'),
            size: Number.parseInt(m.size, 10),
            downloadLink: m.mediaLink,
        };
    });
}

export async function getLocalFiles( cb: (a: number) => void, limit: number): Promise<LocalFile[]> {
    mkdirSync('WindowsNoEditor', { recursive: true });
    const files = await recursive('WindowsNoEditor');

    const task = new ComposedTask(files, cb, limit);
    return task.run(async(f) => {
        const paths = f.split(sep);
        const index = paths.indexOf('WindowsNoEditor');
        return {
            path: paths.slice(index).join('/'),
            md5: await md5Promise(f),
            systemPath: f,
        }
    });
}

export async function downloadUpdates(files: RemoteFile[], cb: (arg: number) => void, limit: number) {
    const task = new ComposedTask(files, cb, limit);
    return task.run(async(f, fileProgress) => {
        const nativePath: string = toNativeDelimiter(f.path);
        createFolderForPath(nativePath);

        try {
            if (statSync(nativePath).isDirectory()) {
                return Promise.resolve();
            }
        } catch (e) {
            // skip if file is not created
        }

        await new Promise((res, rej) => {
            progress(request(f.downloadLink))
                // @ts-ignore
                .on('progress', (state: { percent: number }) => {
                    fileProgress(state.percent);
                })
                .on('error', (e: any) => rej(e))
                .on('end', () => {
                    fileProgress(1);
                    res();
                })
                .pipe(createWriteStream(nativePath));
        });
    });
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