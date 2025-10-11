/**
 * 每天抓取 Bing 壁纸并随机 302 重定向到其中一张
 * 需要绑定 KV：BING_WALL
 */

const BING_API = "https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1";
const BING_HOST = "https://cn.bing.com";
const KV_KEY = "bing_wallpaper_bases";   // 存储 base 列表(JSON 数组)，元素形如 https://cn.bing.com/th?id=...（无后缀）

export default {
  // HTTP 入口：
  //   GET  /?res=1920x1080 → 随机 302 重定向到一张指定分辨率图片（默认 1920x1080）
  //   GET  /json?res=UHD    → 查看已保存 base 列表，并附带按分辨率构造的完整 URL（调试）
  //   POST /refresh         → 手动刷新一次（写入当天 base）
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const resParam = (url.searchParams.get("res") || "1920x1080").trim();

    if (pathname === "/refresh" && request.method === "POST") {
      await updateBing(env);
      return jsonResponse({ ok: true });
    }

    if (pathname === "/json") {
      const bases = await getList(env);
      const urls = bases.map(b => toResolutionUrl(b, resParam));
      return jsonResponse({ count: bases.length, res: resParam, bases, urls });
    }

    // 默认：随机重定向
    let bases = await getList(env);
    if (bases.length === 0) {
      // 首次兜底拉取
      await updateBing(env);
      bases = await getList(env);
      if (bases.length === 0) {
        return new Response("No wallpapers available yet.", { status: 503 });
      }
    }

    const pickBase = bases[Math.floor(Math.random() * bases.length)];
    const finalUrl = toResolutionUrl(pickBase, resParam);

    // 302 重定向到指定分辨率原图
    return Response.redirect(finalUrl, 302);
  },

  // 定时任务：在 wrangler.toml 里配置 crons
  async scheduled(event, env, ctx) {
    ctx.waitUntil(updateBing(env));
  },
};

/** 从 KV 取列表（JSON 数组）*/
async function getList(env) {
  const raw = await env.BING_WALL.get(KV_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (_) {
    return [];
  }
}

/** 写回列表到 KV */
async function putList(env, list) {
  await env.BING_WALL.put(KV_KEY, JSON.stringify(list));
}

/** 拉取 Bing API 并把今日 base 追加到列表 */
async function updateBing(env) {
  const r = await fetch(BING_API, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!r.ok) throw new Error(`Fetch Bing API failed: ${r.status}`);
  const data = await r.json();

  const img = data?.images?.[0];
  if (!img) return;

  // 仅存 base：`${BING_HOST}${img.urlbase}`
  const base = `${BING_HOST}${img.urlbase}`

  if (!base) return;

  const list = await getList(env);
  if (!list.includes(base)) {
    list.push(base);
    await putList(env, list);
  }
}

/** 将 base + 分辨率拼成完整图片 URL。支持如 "1920x1080" 或 "UHD"。 */
function toResolutionUrl(base, res) {
  let r = (res || "1920x1080").toString().trim();
  return `${base}_${r}.jpg`;
}

/** JSON 响应 */
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}
