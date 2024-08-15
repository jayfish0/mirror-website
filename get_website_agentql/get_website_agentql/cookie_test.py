import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless = False)
    context = browser.new_context()
    page = context.new_page()
    page.goto("https://scrapingbee.com")
    
    # Save the cookies
    with open("cookies.json", "w") as f:
        f.write(json.dumps(context.cookies()))

    # Load the cookies
    with open("cookies.json", "r") as f:
        cookies = json.loads(f.read())
        context.add_cookies(cookies)
