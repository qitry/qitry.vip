import fs from 'fs';
import { getHash, PostData } from './utils';

export interface DatabaseData {
    posts: Record<string, Partial<PostData>>;
}

class Database {
    private path: string;
    public data: DatabaseData = { posts: {} };

    constructor(dbPath: string) {
        this.path = dbPath;
        this.load();
    }

    private load(): void {
        if (fs.existsSync(this.path)) {
            try {
                this.data = JSON.parse(fs.readFileSync(this.path, 'utf-8'));
            } catch (err) {
                console.warn('Database parse error, using empty one.');
            }
        }
    }

    public save(): void {
        fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    }

    public getPostHash(filename: string): string {
        if (!this.data.posts[filename]) {
            this.data.posts[filename] = { hash: getHash(filename) };
        }
        return this.data.posts[filename].hash!;
    }

    public updatePost(filename: string, postData: PostData): void {
        this.data.posts[filename] = postData;
    }
}

export default Database;
