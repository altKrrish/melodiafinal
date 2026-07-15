const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
const server = app.listen(3000, async () => {
    console.log('Server started on 3000');
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
        
        await page.goto('http://localhost:3000');
        await new Promise(r => setTimeout(r, 5000));
        
        await browser.close();
    } catch(e) {
        console.error(e);
    }
    server.close();
});
