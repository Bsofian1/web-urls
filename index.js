const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { parseStringPromise } = require('xml2js');
const path = require('path');

// Setting up the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to handle the POST request for scraping
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

// Function to determine the scraping method based on the presence of a sitemap
async function getAllUrlsFromSitemapOrPage(url) {
    try {
        const sitemapUrl = await getSitemapUrl(url);
        return sitemapUrl ? await getAllUrlsFromSitemap(sitemapUrl) : await getAllUrlsFromPage(url);
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Function to find a sitemap link on a given page
async function getSitemapUrl(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const sitemapLink = $('a[href*="sitemap"]').first().attr('href');
        return sitemapLink ? new URL(sitemapLink, url).href : null;
    } catch (error) {
        console.error('Error fetching sitemap URL:', error);
        throw error;
    }
}

// Function to fetch URLs from a sitemap
async function getAllUrlsFromSitemap(sitemapUrl) {
    try {
        const response = await axios.get(sitemapUrl);
        const xml = response.data;
        const parsedXml = await parseStringPromise(xml);
        return parsedXml.urlset ? parsedXml.urlset.url.map(url => url.loc[0]) : [];
    } catch (error) {
        console.error('Error fetching sitemap:', error);
        throw error;
    }
}

// Function to scrape URLs directly from a webpage
async function getAllUrlsFromPage(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const urls = [];
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.includes('#')) {
                urls.push(href);
            }
        });
        return urls;
    } catch (error) {
        console.error('Error fetching URLs from page:', error);
        throw error;
    }
}

// Function to generate an HTML table from scraped URLs
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
            <button onclick="copyTable()">Copy Table</button>
            <table id="pathsTable">
                <tr><th>#</th><th>Path</th></tr>
                ${urls.map((url, index) => `<tr><td>${index + 1}</td><td>${url}</td></tr>`).join('')}
            </table>
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
