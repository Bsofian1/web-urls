# Web Scraper

This project provides a simple web scraper built with Node.js and Express. It allows users to either input a URL to scrape directly from the webpage or specify a sitemap.xml URL to extract all URLs listed in the sitemap.

## Features

- **Scrape from URL**: Enter any URL, and the scraper will recursively gather all links from the page, avoiding mailto, tel links, and removing duplicates.
- **Scrape from Sitemap**: Provide a direct link to a sitemap.xml to fetch all URLs listed.
- **Path Display**: Instead of showing full URLs, this tool extracts and displays only the pathnames.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to install the software and how to install them:

- Node.js
- npm (Node Package Manager)

You can download and install Node.js and npm from [Node.js official site](https://nodejs.org/).

### Installing

A step-by-step series of examples that tell you how to get a development environment running:

1. **Clone the repository**

   ```bash
   git clone [this-directory]

   ```

2. **Navigate to the directory**

   ```bash
   cd web-scraper

   ```

3. **Navigate to the directory**

   ```bash
   npm install

   ```

4. **Start the server**
   ```bash
   npm start
   ```

Navigate to http://localhost:3000 in your browser to see the application running.

## Usage

- Using the Web Interface
- Open your browser and go to http://localhost:3000.
- Enter a URL in the input box and click Generate to start scraping.
- The results will be displayed in a table format where you can copy the table to the clipboard.

## API Endpoints

POST /scrape: Sends a POST request with a JSON body containing the URL. Example:

   ```json
   { "url": "http://example.com/scrape" }

## Built With

Node.js - The runtime server environment
Express - Web application framework
Axios - Promise based HTTP client
Cheerio - Fast, flexible & lean implementation of core jQuery designed specifically for the server
Contributing
Please read CONTRIBUTING.md for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

Sofian Bettayeb

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
```
