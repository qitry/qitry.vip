import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

/**
 * 生成 7 位 MD5 哈希
 */
export const getHash = (str: string): string => 
    crypto.createHash('md5').update(str).digest('hex').substring(0, 7);

/**
 * 递归确保目录存在
 */
export const ensureDir = (dir: string): void => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export interface PostData {
    title: string;
    date: string;
    column: string;
    hash: string;
    source: string;
    content: string;
    rawContent: string;
    path: string;
    [key: string]: any;
}
