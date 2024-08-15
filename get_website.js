const { chromium } = require('playwright');
const fs = require('fs');
const { CookieJar } = require('tough-cookie');

async function parseCookiesFromFile(filePath) {
    const cookieJar = new CookieJar();
    const cookieFileContent = fs.readFileSync(filePath, 'utf-8');

    const lines = cookieFileContent.split('\n');
    for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
            const parts = line.split('\t');
            if (parts.length >= 7) {
                const [domain, flag, path, secure, expiry, name, value] = parts;
                const cookie = {
                    domain: domain.startsWith('.') ? domain.substring(1) : domain,
                    path,
                    secure: secure === 'TRUE',
                    expires: new Date(Number(expiry) * 1000),
                    name,
                    value,
                };
                await cookieJar.setCookie(`${name}=${value}; Domain=${cookie.domain}; Path=${cookie.path}; Expires=${cookie.expires.toUTCString()}; ${cookie.secure ? 'Secure; ' : ''}`, `http://${cookie.domain}`);
            }
        }
    }

    return cookieJar;
}

async function setCookiesFromFile(context, filePath) {
    const cookieJar = await parseCookiesFromFile(filePath);
    const cookies = cookieJar.serializeSync().cookies;

    const playwrightCookies = cookies.map(cookie => ({
        name: cookie.key,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires ? Math.floor(new Date(cookie.expires).getTime() / 1000) : -1,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
    }));

    await context.addCookies(playwrightCookies);
}


async function saveCookies(page, cookiesPath) {
    const cookies = await page.context().cookies();
    await fs.writeFile(cookiesPath, JSON.stringify(cookies));
    console.log('Cookies saved successfully');
  }
  
  async function loadCookies(page, cookiesPath) {
    try {
      const cookiesString = await fs.readFile(cookiesPath);
      const cookies = JSON.parse(cookiesString);
      await page.context().addCookies(cookies);
      console.log('Cookies loaded successfully');
    } catch (error) {
      console.error('Error loading cookies:', error);
    }
  }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadPage(url, outputFile, cookieFilePath) {
    const browser = await chromium.launch({headless: false});
    const context = await browser.newContext();
    // await setCookiesFromFile(context, cookieFilePath);
    const page = await context.newPage();

    const cookiesPath = './cookies.json';
  
    // Example: Visit a website and save cookies
    await page.goto(url);
    await saveCookies(page, cookiesPath);
  
    // Close the browser
    await browser.close();
    
    let scroll = async (args) => {
        const {direction, speed} = args;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        const scrollHeight = () => document.body.scrollHeight;
        const start = direction === "down" ? 0 : scrollHeight();
        const shouldStop = (position) => direction === "down" ? position > scrollHeight() : position < 0;
        const increment = direction === "down" ? 100 : -100;
        const delayTime = speed === "slow" ? 100 : 10;
        console.error(start, shouldStop(start), increment)

        // definite scroll
        for (let i = start; !shouldStop(i); i += increment) {
            window.scrollTo(0, i);
            await delay(delayTime);
        }

        // infinity scroll 
        console.log("scrolling...")
        i=start
        for (let j = 0; j < 120; j++) {
            window.scrollTo(0, i);
            await delay(delayTime);
            i += increment
        }
    };
    await page.evaluate(scroll, {direction: "down", speed: "slow"});

    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await sleep(20000);

    
    const content = await page.content();
    fs.writeFileSync(outputFile, content);

    await browser.close();
}

const url = 'https://www.instagram.com/'
const outputFile = 'page.html';
const cookieFilePath = 'www.instagram.com_cookies.txt';

downloadPage(url, outputFile, cookieFilePath).then(() => {
    console.log(`Page downloaded and saved as ${outputFile}`);
}).catch(err => {
    console.error('Error:', err);
});