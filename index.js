const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { parseStringPromise } = require('xml2js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/scrape', async (req, res) => {
    const websiteUrl = req.body.url;
    try {
        const urls = await getAllUrlsFromSitemapOrPage(websiteUrl);
        const html = generateHtmlTable(urls);
        res.send(html);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred while scraping the website.');
    }
});

async function getAllUrlsFromSitemapOrPage(url) {
    try {
        // Check if a sitemap exists
        const sitemapUrl = await getSitemapUrl(url);
        if (sitemapUrl) {
            // Fetch URLs from the sitemap
            return await getAllUrlsFromSitemap(sitemapUrl);
        } else {
            // Fall back to scraping URLs from the page
            return await getAllUrlsFromPage(url);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function getSitemapUrl(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const sitemapLink = $('a[href*="sitemap"]').first().attr('href');
        if (sitemapLink) {
            const sitemapUrl = new URL(sitemapLink, url).href;
            return sitemapUrl;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching sitemap URL:', error);
        throw error;
    }
}

async function getAllUrlsFromSitemap(sitemapUrl) {
    try {
        const response = await axios.get(sitemapUrl);
        const xml = response.data;
        const parsedXml = await parseStringPromise(xml);
        let urls = [];
        if (parsedXml.urlset && parsedXml.urlset.url) {
            urls = parsedXml.urlset.url.map(url => url.loc[0]);
        } else if (parsedXml.sitemapindex && parsedXml.sitemapindex.sitemap) {
            const sitemaps = parsedXml.sitemapindex.sitemap;
            for (const sitemap of sitemaps) {
                const sitemapUrl = sitemap.loc[0];
                const urlsFromSitemap = await getAllUrlsFromSitemap(sitemapUrl);
                urls.push(...urlsFromSitemap);
            }
        }
        return urls;
    } catch (error) {
        console.error('Error fetching sitemap:', error);
        throw error;
    }
}

async function getAllUrlsFromPage(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const urls = [];
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                urls.push(href);
            }
        });
        return urls;
    } catch (error) {
        console.error('Error fetching URLs from page:', error);
        throw error;
    }
}

function generateHtmlTable(urls) {
    const html = `
        <html>
        <head>
            <title>Scrape Results</title>
            <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Scraped Paths</h1>
            <table id="pathsTable">
                <tr><th>#</th><th>Path</th></tr>
                ${urls.map((url, index) => `<tr><td>${index + 1}</td><td>${url}</td></tr>`).join('')}
            </table>
            <button onclick="copyTable()">Copy Table</button>
            <script>
                function copyTable() {
                    const table = document.getElementById('pathsTable');
                    const range = document.createRange();
                    range.selectNode(table);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    document.execCommand('copy');
                    window.getSelection().removeAllRanges();
                    alert('Table copied to clipboard');
                }
            </script>
        </body>
        </html>
    `;
    return html;
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
