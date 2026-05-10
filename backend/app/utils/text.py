import re
import unicodedata


def strip_emoji_symbols(value: str | None) -> str:
    if not value:
        return ""
    cleaned: list[str] = []
    for char in value:
        if char in {"\ufe0e", "\ufe0f", "\u200d"}:
            continue
        if unicodedata.category(char) == "So":
            continue
        cleaned.append(char)
    return "".join(cleaned)


def clean_seed_label(value: str | None) -> str:
    text = strip_emoji_symbols(value)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" \t\r\n-–—:•*")


def clean_seed_content(value: str | None) -> str:
    text = strip_emoji_symbols(value)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return text.strip()
