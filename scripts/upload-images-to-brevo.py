#!/usr/bin/env python3
"""Upload herobeelden uit images/nl/tips/ naar de Brevo image gallery en schrijf de URL's in de feeds.

Gebruik:
  python scripts/upload-images-to-brevo.py
De API-sleutel komt uit de omgevingsvariabele BREVO_API_KEY of uit .env in de repo-root
(kopieer .env.example naar .env). .env staat in .gitignore en wordt nooit gecommit.

Werkwijze:
  1. Zet het beeld als images/nl/tips/hero-<slug>.jpg (4:3, 1200x900) en commit + push het,
     zodat het via GitHub Pages bereikbaar is. Brevo accepteert alleen publieke URL's (max 2 MB).
  2. Voeg een regel toe aan images/nl/tips/manifest.json met "file", "feed_slug" (of null) en "alt".
  3. Draai dit script. Het slaat entries met een bestaande "brevo_url" over, uploadt de rest onder
     de naam trustoo-nl-tips-hero-<slug>.jpg en zet hero_image_url + hero_image_alt in de feed.
Alleen standaardbibliotheek, geen dependencies.
"""
import json, os, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "images", "nl", "tips", "manifest.json")
FEEDS = os.path.join(ROOT, "feeds", "nl", "tips")
PAGES_BASE = "https://ruttekut.github.io/trustoo-brevo-feeds/images/nl/tips/"
API = "https://api.brevo.com/v3/emailCampaigns/images"

def load_dotenv(path):
    """Lees KEY=value-regels uit .env (git-ignored) zonder bestaande omgevingsvariabelen te overschrijven."""
    if not os.path.exists(path):
        return
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

load_dotenv(os.path.join(ROOT, ".env"))
key = os.environ.get("BREVO_API_KEY")
if not key:
    sys.exit("Zet BREVO_API_KEY in de omgeving of in .env (zie .env.example).")

manifest = json.load(open(MANIFEST, encoding="utf-8"))

def save():
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

errors = 0
for m in manifest:
    if not m.get("brevo_url"):
        name = "trustoo-nl-tips-" + m["file"]
        body = json.dumps({"imageUrl": PAGES_BASE + m["file"], "name": name}).encode()
        req = urllib.request.Request(API, data=body, method="POST", headers={
            "api-key": key, "content-type": "application/json", "accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                m["brevo_url"] = json.loads(r.read())["url"]
                m["brevo_name"] = name
            save()
            print("uploaded", m["file"], "->", m["brevo_url"])
            time.sleep(0.4)
        except urllib.error.HTTPError as e:
            errors += 1
            print("FOUT", m["file"], e.code, e.read().decode(errors="replace")[:200])
            continue
    slug = m.get("feed_slug")
    if slug and m.get("brevo_url"):
        p = os.path.join(FEEDS, slug + ".json")
        feed = json.load(open(p, encoding="utf-8"))
        if feed["hero_image_url"] != m["brevo_url"] or feed["hero_image_alt"] != m["alt"]:
            feed["hero_image_url"] = m["brevo_url"]
            feed["hero_image_alt"] = m["alt"]
            with open(p, "w", encoding="utf-8") as f:
                json.dump(feed, f, ensure_ascii=False, indent=2)
                f.write("\n")
            print("feed bijgewerkt", slug)

sys.exit(1 if errors else 0)
