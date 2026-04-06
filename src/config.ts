import path from 'path';

export interface Config {
    paths: {
        posts: string;
        templates: string;
        dist: string;
        db: string;
    };
    columns: Record<string, string>;
    site: {
        title: string;
        description: string;
        baseUrl: string;
    };
}

const config: Config = {
    paths: {
        posts: path.join(__dirname, '../posts'),
        templates: path.join(__dirname, '../templates'),
        dist: path.join(__dirname, '../dist'),
        db: path.join(__dirname, '../database.json'),
    },
    columns: {
        '闲言碎语': 'casual',
        '精品文章': 'featured',
        '技术随笔': 'tech'
    },
    site: {
        title: 'QiTry 琪初',
        description: '分享技术随笔、精品文章与生活感悟。',
        baseUrl: '/'
    }
};

export default config;
