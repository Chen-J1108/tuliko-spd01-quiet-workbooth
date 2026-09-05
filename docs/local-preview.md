# 本地网页常驻服务

固定地址：http://127.0.0.1:4174/ （支持 /cases/、/story/ 等页面）。

Windows 计划任务 `Tuliko Local Preview 4174` 在当前用户登录时启动，独立于 Codex 和终端运行。后台脚本会在网页进程退出后重试，不显示命令行窗口，也不抢占其他程序已经使用的 4174 端口。任务仅监听本机地址，不提供互联网分享。

关闭 Codex 后继续运行；关机、注销或睡眠期间不可访问，登录或恢复运行后可再次访问。首次自动启动可能需要几秒钟。

服务读取 `dist/client` 的构建结果。页面源码修改后执行 `npm run build`，刷新浏览器即可查看新版本。保留项目目录和 Node.js 安装；移动项目后重新执行安装脚本。

维护入口：Windows「任务计划程序」→「任务计划程序库」→ `Tuliko Local Preview 4174`。日志保存在 `%LOCALAPPDATA%\Tuliko\local-preview\service.log`，超过 2 MB 时在下次重试前轮换。

安装／重新注册：在项目目录运行 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-local-preview.ps1`。

取消以后自动启动：在任务计划程序中禁用该任务。已经启动的网页进程会持续到注销或关机；需要立即停止时先结束该任务，再仅结束命令行包含本项目 `vite.js preview --host 127.0.0.1 --port 4174 --strictPort` 的 Node.js 进程，不要批量结束其他 Node.js 任务。
