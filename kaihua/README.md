# 开化寺数字壁画漫游

继续使用现有静态 Three.js 网站及建筑布局。三面用户提供的数字壁画替换了旧的示例照片；建筑、佛像仍是解释性模型，并非测绘复原。前壁不放壁画。

## 启动和验证

在本目录运行 `npm ci`（建议 Node.js 22 或更新版本）。素材已预处理并提交，日常启动不必重新切图。

```powershell
npm run build
npm test
# 从仓库根目录启动，打开 http://127.0.0.1:8080/kaihua/
python -m http.server 8080 --bind 127.0.0.1
```

浏览器回归测试在服务器运行时另开终端，从 kaihua 目录执行：

```powershell
npx playwright install chromium
npm run test:browser
# 或使用本机 Chrome：
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
npm run test:browser
```

`KAIHUA_TEST_URL` 可改变测试地址；`KAIHUA_SCREENSHOTS` 可指定截图输出目录。build 是静态资源校验，无需打包即可部署 GitHub Pages。测试通过 HTTP 响应注入检查接口，生产代码不导出调试状态。

## 原始素材与重新处理

已检查的来源目录为 `C:/Users/NickAlphaWhite/Desktop/kaihua`，9 张输入全部存在。原图未改写，未加入部署包。实际后壁前缀是 **back_wall_02**，不是任务初稿中的 back_wall_01。

| 前缀 | level4.webp 尺寸 / 大小 | level3.png 尺寸 / 大小 | level2.png 尺寸 / 大小 |
| --- | --- | --- | --- |
| left_wall_01 | 3246×1125 / 1.25 MiB | 6492×2251 / 28.97 MiB | 12985×4503 / 117.61 MiB |
| back_wall_02 | 3284×1158 / 0.81 MiB | 6568×2317 / 20.56 MiB | 13136×4635 / 81.06 MiB |
| right_wall_01 | 3187×1156 / 1.19 MiB | 6374×2313 / 28.47 MiB | 12748×4626 / 113.16 MiB |

每个前缀分别加 `_level4.webp`、`_level3.png`、`_level2.png`。迁移到其他电脑时将这 9 个文件放进同一个来源目录，然后：

```powershell
npm run prepare:assets -- --source 'C:/Users/NickAlphaWhite/Desktop/kaihua'
npm run build
```

脚本基于 Sharp/libvips，限制缓存并顺序处理图像；中间文件在被 git 忽略的 `.cache/murals/`。原始文件尺寸、字节数与 SHA-256 记于 `data/mural-inspection.json`。没有访问素材平台的运行时请求。

`data/mural-sources.json` 集中配置裁切、场景位置和热点。外部白底只移除与图片边缘连通的近白区域；内部白色修补痕迹保留。后壁分为左右两个画面，原来的门洞空白不贴到墙上。三面的上部花纹独立裁出放到上部；图像保持比例适配现有墙面，不拉伸、不镜像、不改变建筑比例。裁切与安装位置是依据当前图片的人工校准，不代表测绘结论。详情保留整张原图的坐标系统，包括后壁两幅画和上部花纹。

## 资源结构与托管

- `data/murals.json`：生成的路径、原图尺寸、版本、像素命中掩码与部署统计，运行时统一读取。
- `assets/murals/{left,back,right}/{内容版本}/`：带透明背景的 level4 场景裁片、2048 兼容纹理、level3 `full-preview.webp`、`zoom.dzi` 和 `zoom_files/`。
- `assets/mural-data.js`：统一解析资源根地址。
- `assets/mural-scene.js`：只载入 level4 裁片，按 GPU 限制选用兼容尺寸。
- `assets/mural-viewer.js` / `.css`：按需载入本地 OpenSeadragon，全屏预览、缩放、平移和销毁。
- `assets/mural-hotspots.js`：归一化坐标热点覆盖层。
- `assets/static-batch.js`：静态构件按材质合批，保留形状、法线、UV 和原碰撞对象。
- `sw-murals.js`：同源版本化高清资源按需缓存，最多 256 条。

部署资源约 110.5 MiB，其中 3,915 张高清图块约 87.2 MiB。无大于 GitHub 单文件限制的文件。它们是静态文件，可直接由 Pages 托管；不要部署 node_modules、.cache 或桌面原图。更新素材后可以在确认旧版已不再引用时移除旧版本目录。DZI 目录自身的 0/1 等级是由本次 level2 派生的小缩略图，**并非**素材平台的第 0/1 层原图。

迁移对象存储时，复制 `assets/murals/` 下三面墙的目录结构，修改 `data/murals.json` 中的 `assetBaseUrl`，或在加载模块之前设置：

```html
<script>window.KAIHUA_MURAL_BASE_URL='https://your-authorized-storage.example/murals/';</script>
```

根地址须以 `/` 结尾。对象存储需允许本站跨域读取，并为带内容版本路径的文件配置长期缓存。当前 Service Worker 只缓存同源文件，异源资源由 OpenSeadragon 内存缓存和对象存储的 HTTP 缓存处理。更换根地址不改组件内路径。请由资源持有人确认公开托管授权；来源 ID 只是资源标识，不是授权证明。

## 交互及清晰度

WASD 沿视线水平方向行走，点击画面进入鼠标锁定，Esc 解锁；锁定时对准壁画点击或按 E，未锁定时也可点击可见壁画。墙面命中会避开透明区并检查柱子、佛坛遮挡。滚轮在漫游中提供有限的光学放大；查看细节请进入壁画详情。

详情默认为完整适配的深色全屏视图，先载入保持 level3 尺寸的 WebP 预览，图块就绪后替换。初始图块至少采用 level3 对应的分辨率；放大后按需请求来自 level2 的最高层图块。滚轮放大、拖动平移，按钮或 Home/0 返回全图，Esc 返回原位置和视角。最大缩放以原像素约 1.1 倍限制。Three.js 在详情打开期间暂停渲染；关闭详情销毁查看器和预览，不重新建立场景。

256 像素图块带 1 像素重叠，WebP 质量 91，不向浏览器下载原始巨型 PNG。查看器内存缓存最多 256 张，并限制并发加载为 6。首屏不加载 OpenSeadragon、level3 预览或高清图块。影像缓存不能保证离线访问整个壁画。

## 后续添加真实热点

在对应墙面的 `data/mural-sources.json` 的 `hotspots` 数组中添加有来源的内容，再运行预处理：

```json
{"id":"verified-detail-id","x":0.42,"y":0.58,"title":"经核实的标题","text":"经核实的说明"}
```

x/y 相对于**完整原图**左上角归一化，范围 0–1，包括后壁原图的门洞空白。热点由 OpenSeadragon 图像坐标定位，随缩放和平移保持对齐；正文以文本节点呈现。当前数组全部为空，没有编造研究内容。未来可扩充图片或来源字段。

## 验证范围

单元测试检查鼠标生命周期、防突然转向、光学缩放、白底掩码、像素命中、比例和资源一致性。浏览器测试检查三墙真实点击路径、前壁无图、四柱布局、遮挡、不同帧率移动、返回相机状态、高清层实际请求、缩放平移、缓存、测试热点对齐、地面分离和 WebGL 失败回退。

当前软件渲染测试同一视角的 draw calls 从约 423 降至 25；这说明合批有效，不等于保证所有电脑都达到 60 FPS。实际帧率仍取决于显卡、分辨率和浏览器。模型的佛像和构架仍是现有简化模型，本次仅补足用户指出的藻井承接结构，未将其改造成测绘模型。
