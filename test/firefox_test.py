import sys, time
from selenium import webdriver
from selenium.webdriver.common.by import By

EXT = sys.argv[1] if len(sys.argv) > 1 else "."
opts = webdriver.FirefoxOptions(); opts.add_argument("-headless")
d = webdriver.Firefox(options=opts)
d.install_addon(EXT, temporary=True)  # loads the unpacked extension

def badge(wait=15):
    end = time.time() + wait
    while time.time() < end:
        els = d.find_elements(By.ID, "gb-pvr-badge")
        if els: return els
        time.sleep(0.3)
    return []

def check(url, expect):
    d.get(url)
    els = badge(15 if expect else 6)
    time.sleep(3)  # let observer churn; must stay a single badge
    els = d.find_elements(By.ID, "gb-pvr-badge")
    got = els[0].text if els else None
    ok = got == expect and len(els) <= 1
    parent = els[0].find_element(By.XPATH, "..").get_attribute("data-testid") if els else "-"
    print(("PASS" if ok else "FAIL"), url, "->", repr(got), "count", len(els), "parent", parent)
    return ok

r = [
  check("https://github.com/python/cpython", "Report a vulnerability"),
  check("https://github.com/curl/curl", "No private reporting"),
  check("https://github.com/curl/curl/issues", None),
  check("https://github.com/settings/profile", None),
]
# soft navigation: repo -> click Issues tab -> badge must disappear; back -> reappear
d.get("https://github.com/python/cpython"); badge()
d.find_element(By.CSS_SELECTOR, 'a[href$="/cpython/issues"]').click()
time.sleep(4); gone = not d.find_elements(By.ID, "gb-pvr-badge")
d.back(); back = badge()
print("PASS" if gone else "FAIL", "badge removed after soft nav to Issues")
print("PASS" if back else "FAIL", "badge back after history back")
d.quit()
sys.exit(0 if all(r) and gone and back else 1)
