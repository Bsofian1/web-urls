const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/scrape', async (req, res) => {
    const rootUrl = req.body.url;
    let urlsToVisit = [new URL(rootUrl).pathname];  // Start with the path of the root URL
    let visitedUrls = new Set();

    async function crawl() {
        while (urlsToVisit.length > 0) {
            const path = urlsToVisit.shift();
            const fullUrl = new URL(path, rootUrl).href;  // Resolve the full URL

            if (!visitedUrls.has(path) && fullUrl.startsWith(rootUrl)) {
                visitedUrls.add(path);
                try {
                    const response = await axios.get(fullUrl);
                    const $ = cheerio.load(response.data);
                    $('a').each((i, link) => {
                        const href = $(link).attr('href');
                        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                            const resolvedUrl = new URL(href, rootUrl);
                            const resolvedPath = resolvedUrl.pathname;
                            if (resolvedPath !== '/' && resolvedPath !== '') {
                                urlsToVisit.push(resolvedPath);  // Push path, not full URL
                            }
                        }
                    });
                } catch (error) {
                    console.error('Failed to crawl:', fullUrl, error);
                }
            }
        }
    }

    await crawl();
    const pathsArray = Array.from(visitedUrls);
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
                ${pathsArray.map((path, index) => `<tr><td>${index + 1}</td><td>${path}</td></tr>`).join('')}
            </table>
            <button onclick="copyTable()">Copy Paths</button>
            <script>
                function copyTable() {
                    const rows = document.querySelectorAll('#pathsTable tr');
                    let textToCopy = '';
                    rows.forEach(row => {
                        textToCopy += row.cells[1].textContent + '\\n'; // Only copy the second cell (path)
                    });
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        alert('Paths copied to clipboard');
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
                }
            </script>
        </body>
        </html>
    `;
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
