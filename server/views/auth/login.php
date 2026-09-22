<?php $config = require dirname(__DIR__, 2) . '/config/config.php'; ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin Login · <?= e($config['app_name']) ?></title>
<style>
:root { --bg:#f6f2ea; --card:#fff; --ink:#23180f; --accent:#c2410c; --line:#e6dccc; }
* { box-sizing: border-box; }
body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: radial-gradient(1200px 600px at 80% -10%, #fde8d7 0%, var(--bg) 55%); min-height:100vh;
  display:flex; align-items:center; justify-content:center; color:var(--ink); }
.box { width: 100%; max-width: 380px; background: var(--card); border:1px solid var(--line);
  border-radius: 18px; padding: 34px 32px; box-shadow: 0 20px 50px rgba(43,26,14,.08); }
.brand { font-weight: 800; font-size: 20px; display:flex; align-items:center; gap:8px; }
.brand small { font-weight:400; color:#8a7a6a; font-size:13px; display:block; }
p.sub { color:#8a7a6a; font-size:14px; margin:6px 0 22px; }
label { display:block; font-size:13px; font-weight:600; margin:14px 0 5px; }
input { width:100%; padding:11px 13px; border:1px solid var(--line); border-radius:10px;
  font-size:15px; background:#fdfaf5; }
input:focus { outline:2px solid var(--accent); border-color:transparent; }
button { width:100%; margin-top:22px; padding:12px; background:var(--accent); color:#fff; border:0;
  border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; }
.error { background:#fee2e2; color:#991b1b; padding:10px 12px; border-radius:9px; font-size:13px; margin-top:16px; }
.foot { text-align:center; margin-top:18px; font-size:12px; color:#8a7a6a; }
</style>
</head>
<body>
  <form class="box" method="post" action="/admin/login">
    <div class="brand">🪐 <?= e($config['app_name']) ?><small>Backend Admin</small></div>
    <p class="sub">Sign in to view analytics.</p>
    <?php if (!empty($error)): ?><div class="error"><?= e($error) ?></div><?php endif; ?>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required autofocus autocomplete="username">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required autocomplete="current-password">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <button type="submit">Sign in</button>
    <div class="foot">First time? Create an admin user with
      <span class="mono">php scripts/create-admin.php</span></div>
  </form>
</body>
</html>