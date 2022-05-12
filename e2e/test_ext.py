"""
End to end tests.
"""
import time
import os
from contextlib import suppress
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

    hc_button, hc_settings_button = u.get_hc_buttons(web)
    assert hc_button.get_attribute("data-tooltip") == "Disable HyperChat"
    assert hc_settings_button.get_attribute("data-tooltip") == "HyperChat Settings"


@run_on(all_)
def test_disable_reenable(web: TWeb):
    web.get(chilled_cow)
    u.initial_switch_to_chatframe(web)

    u.get_hc_buttons(web)[0].click()
    u.has_yt_msgs(web, True)

    u.get_hc_buttons(web, expected_buttons=1)[0].click()
    u.has_yt_msgs(web, False)


@run_on(all_)
def test_persistent_mode(web: TWeb):
    web.get(chilled_cow)
    u.initial_switch_to_chatframe(web)

    # switch to ytc
    u.get_hc_buttons(web)[0].click()
    u.has_yt_msgs(web, True)

    web.refresh()

    # assert that we are still in ytc mode
    u.initial_switch_to_chatframe(web)
    u.has_yt_msgs(web, True)

    # go back to hc
    u.get_hc_buttons(web, expected_buttons=1)[0].click()
    u.has_yt_msgs(web, False)

    web.refresh()

    # assert that hc mode persisted and we are still in hc mode
    u.initial_switch_to_chatframe(web)
    u.has_yt_msgs(web, False)
