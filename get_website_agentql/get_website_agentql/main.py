import agentql
import logging
import asyncio
import json
import os
import asyncio
import aiofiles
from http.cookiejar import CookieJar, Cookie
from datetime import datetime
import asyncio
import time
from playwright.sync_api import sync_playwright

os.environ["AGENTQL_API_KEY"] = "KboIsCoPp8c_H-gnQxqFM27WSqZDitRKffSkeOdEViGc7d_aa72DVw"

QUERY = """
{
    posts[] {
        username
        first_image_url
        caption
        number_of_comment
        number_of_likes
    }
}
"""
LOGIN_QUERY = """
    {
        username_fill_box
        password_fill_box
        login_button
    }
"""
NOTIFICATION_QUERY = """
{
    not_now_button
    turn_on_notification_button
}
"""    

def get_cookies(account_name, pwd):
    session = agentql.start_session(url="https://www.instagram.com")
    login_box = session.query(LOGIN_QUERY)
    login_box.username_fill_box.type(account_name)
    login_box.password_fill_box.type(pwd)
    login_box.login_button.click()

    time.sleep(5)
    cookie = session.get_user_auth_session()
    session.stop()
    return cookie 

def scroll(page, direction="down", speed="slow"):
    delay = lambda ms: time.sleep(ms / 10000)
    scroll_height = page.evaluate("document.body.scrollHeight")
    start = 0 if direction == "down" else scroll_height
    should_stop = lambda position: position > scroll_height if direction == "down" else position < 0
    increment = 100 if direction == "down" else -100
    delay_time = 1 if speed == "slow" else 0.01

    # Definite scroll
    # i = start
    # while not should_stop(i):
    #     page.evaluate(f"window.scrollTo(0, {i});")
    #     delay(delay_time * 1000)
    #     i += increment

    # Infinity scroll
    print("scrolling...")
    i = start
    for t in range(100):
        print(f"scrolling {t}")
        page.evaluate(f"window.scrollTo(0, {i});")
        delay(delay_time * 1000)
        i += increment

def save_website(session_cookie):
    print("Saving website...")
    session = agentql.start_session(url="https://www.instagram.com", user_auth_session=session_cookie)
    notification_box = session.query(NOTIFICATION_QUERY)
    notification_box.not_now_button.click()

    page = session.current_page
    scroll(page, direction="down", speed="slow")
    print("getting page content...")
    html = page.content()
    with open("page.html", "w") as f:
        f.write(html)
    print("page saved!")
    time.sleep(3)
    session.stop()
# def save_website(session_cookie):
#     with sync_playwright() as p:
#         browser = p.chromium.launch(headless = False)
#         context = browser.new_context()
#         context.add_cookies(session_cookie)

#         page = context.new_page()
#         page.goto("https://www.instagram.com", wait_until="domcontentloaded")

#         time.sleep(5)

#         html = page.content()
#         with open("page.html", "w") as f:
#             f.write(html)
#     print("page saved!")

def get_cookie():
    print("Getting cookie...")
    try:
        # Step 0: log in and get the cookies
        session_cookie = get_cookies("tinyfishtest3", "T!nyfish623")
        json.dump(session_cookie, open("session_cookie.json", "w"), indent=4)
    except Exception as e:
        print(f"Error: {e}")
    print("Cookie saved!")

def main():
    try:
        # Step 0: log in and get the cookies
        # get_cookie()
        
        # Step 1: save website
        session_cookie = json.load(open("session_cookie.json", "r"))
        save_website(session_cookie)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()