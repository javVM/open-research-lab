"""Shared helpers for talking to the GBIF registry and reading a Darwin Core Archive.

Standard library only, on purpose: this directory holds throwaway research scripts and must
not grow a toolchain of its own. Nothing here is part of collection-validator.
"""

from __future__ import annotations

import hashlib
import json
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ElementTree
import zipfile
from pathlib import Path
from typing import Any

API = "https://api.gbif.org/v1"
USER_AGENT = "open-research-lab-validation-research/0.1 (research; contact via GitHub javVM)"


def get_json(url: str, params: dict[str, Any] | None = None) -> Any:
    if params:
        url = f"{url}?{urllib.parse.urlencode(params, doseq=True)}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.load(response)


def dataset(key: str) -> dict[str, Any]:
    return get_json(f"{API}/dataset/{key}")


def dataset_record_count(key: str) -> int:
    result = get_json(f"{API}/occurrence/search", {"datasetKey": key, "limit": 0})
    return int(result["count"])


def organization(key: str) -> dict[str, Any]:
    return get_json(f"{API}/organization/{key}")


def search_datasets(query: str, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    result = get_json(
        f"{API}/dataset/search",
        {"q": query, "type": "OCCURRENCE", "limit": limit, "offset": offset},
    )
    return list(result["results"])


def archive_endpoint(meta: dict[str, Any]) -> str | None:
    for endpoint in meta.get("endpoints", []):
        if endpoint.get("type") == "DWC_ARCHIVE":
            return str(endpoint["url"])
    return None


def download(url: str, target: Path) -> str:
    """Download to `target` and return the sha256 of the bytes written."""
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    digest = hashlib.sha256()
    with urllib.request.urlopen(request, timeout=600) as response, target.open("wb") as out:
        while chunk := response.read(1 << 20):
            digest.update(chunk)
            out.write(chunk)
    return digest.hexdigest()


def core_file(archive: Path, into: Path) -> tuple[Path, str, str]:
    """Extract the core data file of a Darwin Core Archive.

    Returns the extracted path, the declared row type and the declared field delimiter. The
    archive's own meta.xml decides which member is the core and how it is separated; we do not
    guess from file names, and we do not let the validator guess either.
    """
    into.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as zipped:
        names = zipped.namelist()
        if "meta.xml" not in names:
            raise ValueError(f"{archive.name}: no meta.xml, not a Darwin Core Archive")
        meta = ElementTree.fromstring(zipped.read("meta.xml"))
        namespace = {"dwc": "http://rs.tdwg.org/dwc/text/"}
        core = meta.find("dwc:core", namespace)
        if core is None:
            raise ValueError(f"{archive.name}: meta.xml declares no core")
        location = core.find("dwc:files/dwc:location", namespace)
        if location is None or location.text is None:
            raise ValueError(f"{archive.name}: core declares no file")
        member = location.text.strip()
        row_type = str(core.attrib.get("rowType", ""))
        declared = str(core.attrib.get("fieldsTerminatedBy", "\\t"))
        delimiter = declared.replace("\\t", "\t")
        extracted = into / Path(member).name
        with zipped.open(member) as source, extracted.open("wb") as out:
            while chunk := source.read(1 << 20):
                out.write(chunk)
    return extracted, row_type, delimiter
