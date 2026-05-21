#!/usr/bin/env python3
"""自动制作邀请函工具。

从 JSON 文件读取活动信息和嘉宾名单，批量输出邀请函文本。
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from string import Template
from typing import Iterable

DEFAULT_TEMPLATE = Template(
    """尊敬的$guest_name：

您好！

诚挚邀请您参加「$event_name」。
时间：$event_time
地点：$event_location
主题：$event_topic

$custom_message

期待您的莅临！

主办方：$host_name
联系方式：$contact_info
"""
)


@dataclass
class EventInfo:
    event_name: str
    event_time: str
    event_location: str
    event_topic: str
    host_name: str
    contact_info: str
    custom_message: str = ""


def load_data(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def parse_event_info(data: dict) -> EventInfo:
    required_fields = [
        "event_name",
        "event_time",
        "event_location",
        "event_topic",
        "host_name",
        "contact_info",
    ]
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        raise ValueError(f"event_info 缺少必要字段: {', '.join(missing)}")

    return EventInfo(
        event_name=data["event_name"],
        event_time=data["event_time"],
        event_location=data["event_location"],
        event_topic=data["event_topic"],
        host_name=data["host_name"],
        contact_info=data["contact_info"],
        custom_message=data.get("custom_message", ""),
    )


def render_invitation(event: EventInfo, guest_name: str, template: Template) -> str:
    if not guest_name.strip():
        raise ValueError("guest_name 不能为空")

    mapping = {
        "guest_name": guest_name,
        "event_name": event.event_name,
        "event_time": event.event_time,
        "event_location": event.event_location,
        "event_topic": event.event_topic,
        "host_name": event.host_name,
        "contact_info": event.contact_info,
        "custom_message": event.custom_message or "欢迎您拨冗出席本次活动。",
    }
    return template.safe_substitute(mapping)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def batch_generate(output_dir: Path, event: EventInfo, guests: Iterable[str], template: Template) -> int:
    ensure_dir(output_dir)
    count = 0
    for guest in guests:
        invitation = render_invitation(event, guest, template)
        file_name = f"{guest.strip()}_邀请函.txt"
        (output_dir / file_name).write_text(invitation, encoding="utf-8")
        count += 1
    return count


def load_template(template_path: Path | None) -> Template:
    if template_path is None:
        return DEFAULT_TEMPLATE
    raw = template_path.read_text(encoding="utf-8")
    return Template(raw)


def main() -> None:
    parser = argparse.ArgumentParser(description="自动制作邀请函")
    parser.add_argument("--input", required=True, help="JSON 输入文件路径")
    parser.add_argument("--output", default="./invitations", help="邀请函输出目录")
    parser.add_argument("--template", help="自定义模板路径（可选）")
    args = parser.parse_args()

    input_data = load_data(Path(args.input))
    event = parse_event_info(input_data.get("event_info", {}))
    guests = input_data.get("guests", [])
    if not guests:
        raise ValueError("guests 不能为空")

    template = load_template(Path(args.template) if args.template else None)
    generated = batch_generate(Path(args.output), event, guests, template)
    print(f"已生成 {generated} 封邀请函，目录：{args.output}")


if __name__ == "__main__":
    main()
