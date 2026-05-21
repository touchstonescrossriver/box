# box

## 自动制作邀请函

本仓库提供一个可直接运行的脚本 `generate_invitation.py`，用于根据活动信息与嘉宾名单，批量生成邀请函文本文件。

### 功能

- 从 JSON 输入读取活动信息。
- 批量为多个嘉宾生成个性化邀请函。
- 支持默认模板与自定义模板。
- 输出为 `txt` 文件，便于二次编辑或发送。

### 快速开始

```bash
python3 generate_invitation.py --input sample_input.json --output ./output_invitations
```

执行后会在 `./output_invitations` 目录下生成每位嘉宾对应的邀请函。

### JSON 输入格式

```json
{
  "event_info": {
    "event_name": "活动名称",
    "event_time": "活动时间",
    "event_location": "活动地点",
    "event_topic": "活动主题",
    "host_name": "主办方",
    "contact_info": "联系方式",
    "custom_message": "可选，自定义邀请语"
  },
  "guests": ["嘉宾1", "嘉宾2"]
}
```

### 自定义模板（可选）

通过 `--template` 提供模板文件路径。模板变量支持：

- `$guest_name`
- `$event_name`
- `$event_time`
- `$event_location`
- `$event_topic`
- `$host_name`
- `$contact_info`
- `$custom_message`

示例：

```bash
python3 generate_invitation.py --input sample_input.json --output ./output_invitations --template ./my_template.txt
```
