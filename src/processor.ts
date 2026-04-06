import fs from 'fs';
import path from 'path';
import fm from 'front-matter';
import { Marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { PostData } from './utils';
import Database from './database';

const marked = new Marked();
marked.use(gfmHeadingId());

export interface FrontMatterAttributes {
    title: string;
    date: Date | string;
    column: string;
    [key: string]: any;
}

/**
 * 解析 Markdown 目录中的所有文章
 */
export const processPosts = (postsDir: string, db: Database): PostData[] => {
    if (!fs.existsSync(postsDir)) {
        console.warn(`Posts directory ${postsDir} not found.`);
        return [];
    }

    const files = fs.readdirSync(postsDir);
    const allPosts: PostData[] = [];

    files.filter(f => f.endsWith('.md')).forEach(filename => {
        const filePath = path.join(postsDir, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { attributes, body } = fm<FrontMatterAttributes>(fileContent);
        
        const hash = db.getPostHash(filename);
        const postData: PostData = {
            ...attributes,
            title: attributes.title || '无标题',
            date: attributes.date instanceof Date 
                ? attributes.date.toISOString().split('T')[0] 
                : String(attributes.date || '2026-04-05'),
            column: attributes.column || '未分类',
            hash,
            source: filename,
            content: marked.parse(body) as string,
            rawContent: body,
            path: `/posts/${hash}.html`
        };

        db.updatePost(filename, postData);
        allPosts.push(postData);
    });

    return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse();
};
