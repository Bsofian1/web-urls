const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { parseStringPromise } = require('xml2js');
const path = require('path');
const url = require('url'); // Import URL module to parse URLs


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

app.post('/scrape', async (req, res) => {
    const inputUrl = req.body.url;
    try {
        let urls;
        if (inputUrl.endsWith('.xml')) {  // Check if URL is a sitemap
            urls = await getAllUrlsFromSitemap(inputUrl);
        } else {
            urls = await recursiveCrawl(inputUrl);
        }
        const html = generateHtmlTable(urls);
        res.send(html);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred while scraping the website.');
    }
});

async function recursiveCrawl(baseUrl, seenUrls = new Set(), baseHostname) {
    // Parse the base URL to get the hostname if it's not provided
    if (!baseHostname) {
        baseHostname = new URL(baseUrl).hostname;
    }

    // This checks if we've already processed this URL
    if (seenUrls.has(baseUrl)) {
        return [];
    }

    seenUrls.add(baseUrl); // Mark this URL as seen

    try {
        const response = await axios.get(baseUrl, {timeout: 5000}); // Added timeout for requests
        const $ = cheerio.load(response.data);
        const urls = [];

        $('a').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                const fullUrl = new URL(href, baseUrl).href; // Normalize the URL
                // Check if the URL belongs to the same domain and hasn't been seen
                if (new URL(fullUrl).hostname === baseHostname &&
                    !fullUrl.startsWith('mailto:') &&
                    !fullUrl.startsWith('tel:') &&
                    !fullUrl.includes('#') &&
                    !seenUrls.has(fullUrl)) {
                    urls.push(fullUrl);
                }
            }
        });

        // Recursively process each URL and flatten the results into a single array
        const results = await Promise.all(urls.map(url => recursiveCrawl(url, seenUrls, baseHostname)));
        return [baseUrl, ...results.flat()];

    } catch (error) {
        console.error(`Error crawling ${baseUrl}: ${error.message}`);
        return []; // Continue with other URLs if an error occurs
    }
}


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

function generateHtmlTable(urls) {
    // Deduplicate URLs for the table display
    const uniqueUrls = [...new Set(urls)];
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
                ${uniqueUrls.map((url, index) => `<tr><td>${index + 1}</td><td>${url}</td></tr>`).join('')}
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
