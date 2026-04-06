import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { PostData } from './utils';
import config from './config';

class Renderer {
    private templatesDir: string;
    private distDir: string;
    private templates: Record<string, string> = {};

    constructor(templatesDir: string, distDir: string) {
        this.templatesDir = templatesDir;
        this.distDir = distDir;
        this.loadTemplates();
    }

    private loadTemplates(): void {
        ['index', 'archive', 'post', 'column', 'layout'].forEach(name => {
            const templatePath = path.join(this.templatesDir, `${name}.ejs`);
            if (fs.existsSync(templatePath)) {
                this.templates[name] = fs.readFileSync(templatePath, 'utf-8');
            } else {
                console.error(`Template not found: ${templatePath}`);
            }
        });
    }

    public renderPage(targetSubPath: string, title: string, body: string, options: { isHome?: boolean; currentPath?: string } = {}): void {
        if (!this.templates.layout) {
            throw new Error('Layout template not loaded');
        }

        const fullHtml = ejs.render(this.templates.layout, {
            title,
            body,
            isHome: options.isHome || false,
            currentPath: options.currentPath || '',
            site: config.site
        });
        
        const fullPath = path.join(this.distDir, targetSubPath);
        fs.writeFileSync(fullPath, fullHtml);
    }

    public renderAll(allPosts: PostData[], columnsMap: Record<string, string>): void {
        // 1. 生成详情页
        allPosts.forEach(post => {
            if (!this.templates.post) return;
            const body = ejs.render(this.templates.post, { post });
            this.renderPage(`posts/${post.hash}.html`, post.title, body, { currentPath: post.path });
        });

        // 2. 生成首页
        if (this.templates.index) {
            const indexBody = ejs.render(this.templates.index, { posts: allPosts });
            this.renderPage('index.html', `${config.site.title} - 个人主页`, indexBody, { isHome: true, currentPath: '/' });
        }

        // 3. 生成归档页
        if (this.templates.archive) {
            const archiveBody = ejs.render(this.templates.archive, { posts: allPosts });
            this.renderPage('archive.html', '归档与搜索', archiveBody, { currentPath: '/archive.html' });
        }

        // 4. 生成专栏页
        Object.keys(columnsMap).forEach(name => {
            const slug = columnsMap[name];
            const columnPosts = allPosts.filter(p => p.column === name);
            if (!this.templates.column) return;
            const body = ejs.render(this.templates.column, { columnName: name, posts: columnPosts });
            this.renderPage(`column/${slug}.html`, name, body, { currentPath: `/column/${slug}.html` });
        });
    }
}

export default Renderer;
