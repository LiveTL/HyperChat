"""
End to end tests.
"""
import time
import os
from pathlib import Path

from autoparaselenium import configure, all_, Extension

import utils as u
from reporting import report_file
from ublock import ublock
from utils import TWeb, run_on, retry

dist = Path(__file__).parent / "../dist"

hc = Extension(
    firefox=str((dist / "HyperChat-Firefox.xpi").resolve()),
    chrome=str((dist / "HyperChat-Chrome.zip").resolve())
)

headed = bool(os.environ.get("HEADED", False))

configure(
    extensions=[hc, ublock],
    headless=not headed,
    selenium_dir=str((Path.home() / ".web-drivers").resolve())
)

chilled_cow = "https://www.youtube.com/watch?v=5qap5aO4i9A"

@run_on(all_)
def test_button_injection(web: TWeb):
    web.get(chilled_cow)
    u.switch_to_chatframe(web)

    # @retry
    # def _():
    #     assert len(web.find_elements_by_css_selector("#hc-buttons > div")) == 2, "not enough buttons"

    # hc_button, hc_settings_button = web.find_elements_by_css_selector("#hc-buttons > div")
    hc_button, hc_settings_button = u.get_hc_buttons(web)
    assert hc_button.get_attribute("data-tooltip") == "Disable HyperChat"
    assert hc_settings_button.get_attribute("data-tooltip") == "HyperChat Settings"


# @run_on(all_)
# def test_disable_reenable(web: TWeb):
#     web.get(chilled_cow)
#     switch_to_chatframe(web)
