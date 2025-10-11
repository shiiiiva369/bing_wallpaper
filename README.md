# 🌅 Bing Wallpaper

自动抓取每日必应壁纸，并提供随机访问功能。

## ✨ 功能特性

* 每天自动抓取最新必应壁纸并保存到 Cloudflare KV
* 随机重定向访问壁纸
* 支持不同分辨率（`1920x1080` / `UHD`）
* 提供 JSON 接口以获取完整壁纸列表
* 支持手动刷新当日壁纸
* 内置定时任务：每日自动更新

---

## 🚀 一键部署

点击下方按钮即可一键部署至 Cloudflare Workers：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/SunXin121/bing_wallpaper)

部署完成后，KV 中只会有今天的一张壁纸，可以将 urls.txt 中的数据复制到 KV 以获得更多壁纸。

---


## 🌐 路由说明

| 路径              | 方法     | 说明                          |
| --------------- | ------ | --------------------------- |
| `/`             | `GET`  | 随机重定向到一张 `1920x1080` 分辨率的壁纸 |
| `/?res=UHD`     | `GET`  | 随机重定向到一张 4K (`UHD`) 壁纸      |
| `/json`         | `GET`  | 返回保存的壁纸基础 URL 列表及完整拼接地址     |
| `/json?res=UHD` | `GET`  | 同上，但指定分辨率为 `UHD`            |
| `/refresh`      | `POST` | 手动刷新当日必应壁纸            |

示例：

```bash
# 获取随机壁纸
curl https://your-worker.yourdomain.workers.dev/

# 获取 UHD 壁纸的 JSON 数据
curl https://your-worker.yourdomain.workers.dev/json?res=UHD
```
