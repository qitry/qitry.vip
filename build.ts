import path from 'path';
import fs from 'fs';
import config from './src/config';
import { ensureDir } from './src/utils';
import Database from './src/database';
import { processPosts } from './src/processor';
import Renderer from './src/renderer';

const startTime = Date.now();
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));

// ANSI color codes
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';
const bold = '\x1b[1m';

function formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

async function main(): Promise<void> {
    console.log();
    console.log(`${bold}${config.site.title}${reset} ${dim}v${pkg.version}${reset}`);
    console.log();

    try {
        // 1. 初始化环境
        console.log(`${dim}[${new Date().toLocaleTimeString()}]${reset} Building...`);
        ensureDir(path.join(config.paths.dist, 'posts'));
        ensureDir(path.join(config.paths.dist, 'column'));

        // 2. 初始化数据库
        const db = new Database(config.paths.db);

        // 3. 处理内容
        const allPosts = processPosts(config.paths.posts, db);

        if (allPosts.length === 0) {
            console.log(`  ${yellow}warn${reset} No posts found in posts/ directory.`);
            console.log();
            return;
        }

        console.log(`  ${green}✓${reset} ${dim}Parsed${reset} ${allPosts.length} post${allPosts.length > 1 ? 's' : ''}`);

        // 4. 渲染页面
        const renderer = new Renderer(config.paths.templates, config.paths.dist);
        const generatedFiles: { path: string; size: number }[] = [];

        // 拦截 fs.writeFileSync 来收集生成的文件及其大小
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = function(file: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, options?: fs.WriteFileOptions): void {
            originalWriteFileSync(file, data, options);
            if (typeof file === 'string' && file.startsWith(config.paths.dist)) {
                const relativePath = path.relative(config.paths.dist, file);
                const size = typeof data === 'string' ? Buffer.byteLength(data, 'utf-8') : data.byteLength;
                generatedFiles.push({ path: relativePath, size });
            }
        };

        renderer.renderAll(allPosts, config.columns);

        // 恢复原始函数
        fs.writeFileSync = originalWriteFileSync;

        // 5. 持久化数据
        db.save();

        // 6. 输出结果
        function formatSize(bytes: number): string {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }

        const maxPathLength = Math.max(...generatedFiles.map(f => f.path.length));
        const totalSize = generatedFiles.reduce((sum, f) => sum + f.size, 0);

        console.log();
        generatedFiles.sort((a, b) => a.path.localeCompare(b.path)).forEach((file, index) => {
            const isLast = index === generatedFiles.length - 1;
            const prefix = isLast ? `${dim}└─${reset}` : `${dim}├─${reset}`;
            const sizeStr = formatSize(file.size);
            const padding = ' '.repeat(maxPathLength - file.path.length);
            const sizeColor = file.size > 50 * 1024 ? yellow : dim;
            console.log(`  ${prefix} ${file.path}${padding}  ${sizeColor}${sizeStr}${reset}`);
        });

        console.log();
        console.log(`  ${dim}Total:${reset} ${bold}${generatedFiles.length} files${reset}  ${dim}(${formatSize(totalSize)})${reset}`);

        const elapsed = Date.now() - startTime;
        console.log();
        console.log(`  ${green}✓${reset} Built ${bold}in ${formatTime(elapsed)}${reset}`);
        console.log(`  ${dim}Output: ${config.paths.dist}/${reset}`);
        console.log();
    } catch (err) {
        console.log();
        console.log(`  ${bold}error${reset} Build failed`);
        console.error(err);
        console.log();
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
