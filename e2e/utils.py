import time
from functools import wraps
from typing import Union

from autoparaselenium import run_on as a_run_on
from selenium import webdriver

from reporting import report_file

TWeb = Union[webdriver.Firefox, webdriver.Chrome]

def run_on(*args):
    def wrapper(func):
        @a_run_on(*args)
        @wraps(func)
        def inner(web):
            try:
                return func(web)
            except Exception as e:
                screenshot = f"failure-{func.__name__}-{browser_str(web)}.png"
                web.save_screenshot(screenshot)
                report_file(func.__name__, browser_str(web), screenshot)
                raise e
        return inner
    return wrapper

def browser_str(driver: TWeb):
    if isinstance(driver, webdriver.Chrome):
        return "chrome"
    if isinstance(driver, webdriver.Firefox):
        return "firefox"
    return "unknown"

def retry(cb, amount=30, interval=1):
    for i in range(amount):
        try:
            return cb()
        except Exception as e:
            if i == amount - 1:
                raise e
            time.sleep(interval)

def with_retry(amount=30, interval=0.5):
    return lambda cb: lambda *args, **kwargs: retry(lambda: cb(*args, **kwargs), amount, interval)

@with_retry()
def click_body(web: TWeb):
    web.execute_script("document.body.click()")

@with_retry()
def switch_to_youtube_parent_frame(web):
    while not web.find_elements_by_css_selector("video"):
        web.switch_to.parent_frame()

@with_retry()
def switch_to_chatframe(web: TWeb):
    web.switch_to.frame(web.find_element_by_css_selector("#chatframe"))

def initial_switch_to_chatframe(web: TWeb):
    switch_to_chatframe(web)
    switch_to_youtube_parent_frame(web)
    click_body(web)
    switch_to_chatframe(web)

@with_retry()
def get_hc_buttons(web: TWeb, expected_buttons=2):
    """
    Get HyperChat buttons.

    Needs to be in chatframe context.
    """
    buttons = web.find_elements_by_css_selector("#hc-buttons > div")
    assert len(buttons) == expected_buttons, "not correct amount of buttons"
    return buttons


def get_ytc_msgs(web: TWeb):
    return web.find_elements_by_css_selector("yt-live-chat-text-message-renderer")

@with_retry()
def has_yt_msgs(web: TWeb, expected: bool):
    assert bool(get_ytc_msgs(web)) == expected
