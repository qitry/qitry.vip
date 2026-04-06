import path from 'path';
import config from './src/config';
import { ensureDir } from './src/utils';
import Database from './src/database';
import { processPosts } from './src/processor';
import Renderer from './src/renderer';

async function main(): Promise<void> {
    try {
        console.log('🚀 启动 TypeScript 构建流程...');

        // 1. 初始化环境
        ensureDir(path.join(config.paths.dist, 'posts'));
        ensureDir(path.join(config.paths.dist, 'column'));

        // 2. 初始化数据库
        const db = new Database(config.paths.db);

        // 3. 处理内容
        const allPosts = processPosts(config.paths.posts, db);
        console.log(`📝 解析完成，共 ${allPosts.length} 篇文章`);

        if (allPosts.length === 0) {
            console.warn('⚠️ 未发现任何文章，请检查 posts/ 目录。');
        }

        // 4. 渲染页面
        const renderer = new Renderer(config.paths.templates, config.paths.dist);
        renderer.renderAll(allPosts, config.columns);

        // 5. 持久化数据
        db.save();

        console.log('✨ 构建成功！输出目录: dist/');
    } catch (err) {
        console.error('❌ 构建失败:', err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
