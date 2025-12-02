
const USER_COOKIE = "colorMode=dark; g_app_banner_close=1; g_quest_modal=1; i18n_redirected=en; last_login=meta; LOCALE=en; TKEY=zHH50hnnFJfjZgZoxeQMxREAsT9cLsq7tBYQvAR5OoT01ZdHb2hDyZqoYzflzZ6s; USERKEY=a40028f8f5244ae426667ef8717e6eb8";

const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = class NovelpiaGlobal {
    constructor() {
        this.id = "novelpia-global";
        this.name = "Novelpia Global (cookie login)";
        this.baseUrl = "https://global.novelpia.com";
        this.lang = "en";
        this.type = "novel";
        this.defaultHeaders = {
            "User-Agent": "Mozilla/5.0 (compatible; LNReaderRepo/1.0)",
            "Accept": "text/html,application/xhtml+xml",
            "Cookie": USER_COOKIE
        };
    }

    async _get(url, extraHeaders = {}) {
        const headers = Object.assign({}, this.defaultHeaders, extraHeaders);
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.text();
    }

    async popularNovels(page = 1) {
        const url = `${this.baseUrl}/series/ranking?page=${page}`;
        const html = await this._get(url);
        const $ = cheerio.load(html);
        let novels = [];
        $(".listBox .items").each((i, el) => {
            const title = $(el).find(".title").text().trim();
            const href = $(el).find("a").attr("href");
            const link = href ? this.baseUrl + href : null;
            const cover = $(el).find("img").attr("src");
            if (title && link) novels.push({ title, link, cover });
        });
        return novels;
    }

    async searchNovels(query) {
        const url = `${this.baseUrl}/search?word=${encodeURIComponent(query)}`;
        const html = await this._get(url);
        const $ = cheerio.load(html);
        let novels = [];
        $(".listBox .items").each((i, el) => {
            const title = $(el).find(".title").text().trim();
            const href = $(el).find("a").attr("href");
            const link = href ? this.baseUrl + href : null;
            const cover = $(el).find("img").attr("src");
            if (title && link) novels.push({ title, link, cover });
        });
        return novels;
    }

    async parseNovel(url) {
        const html = await this._get(url);
        const $ = cheerio.load(html);
        const title = $(".view_top .title").text().trim();
        const cover = $(".view_top img").attr("src");
        const author = $(".info .name").first().text().trim();
        const desc = $(".view_content").text().trim().replace(/\n+/g, "\n");
        let chapters = [];
        $(".epi_list .items").each((i, el) => {
            const chapterTitle = $(el).find(".title").text().trim();
            const href = $(el).find("a").attr("href");
            const link = href ? this.baseUrl + href : null;
            if (chapterTitle && link) chapters.push({ title: chapterTitle, link });
        });
        return { title, cover, author, description: desc, chapters };
    }

    async parseChapter(url) {
        const html = await this._get(url);
        const $ = cheerio.load(html);
        // Some premium chapters show a lock or different container. We'll try several selectors.
        let content = $(".view_content").html() || $("#content").html() || $(".chapter-body").html();
        if (!content) {
            // If locked, return a warning string that LN Reader can display.
            const locked = $("body").text().toLowerCase().includes("premium") || $("body").text().toLowerCase().includes("locked");
            return locked ? "<p><strong>Premium or locked chapter. Please purchase on Novelpia to read.</strong></p>" : "<p>No content available.</p>";
        }
        return content;
    }
};
