<?php $config = require dirname(__DIR__) . '/config/config.php'; ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle ?? 'Admin') ?> · <?= e($config['app_name']) ?></title>
<style>
:root {
  --bg: #f6f2ea; --card: #fff; --ink: #23180f; --muted: #8a7a6a;
  --accent: #c2410c; --line: #e6dccc; --ok: #15803d; --warn: #b45309;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: var(--bg); color: var(--ink); }
header { background: #2b1a0e; color: #f3ead9; padding: 14px 24px; display: flex;
  gap: 20px; align-items: center; flex-wrap: wrap; }
header .brand { font-weight: 700; letter-spacing: .3px; }
nav { display: flex; gap: 4px; flex: 1; flex-wrap: wrap; }
nav a { color: #dfd0bb; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 14px; }
nav a:hover, nav a.active { background: rgba(255,255,255,.08); color: #fff; }
nav a.active { background: var(--accent); color: #fff; }
header .meta { font-size: 13px; color: #bfab8f; display: flex; gap: 14px; align-items: center; }
main { max-width: 1100px; margin: 24px auto; padding: 0 24px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 28px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px 20px; }
.card .k { font-size: 12px; text-transform: uppercase; letter-spacing: .8px; color: var(--muted); }
.card .v { font-size: 30px; font-weight: 800; margin-top: 6px; }
.card .s { font-size: 12px; color: var(--muted); margin-top: 4px; }
.card .s.ok { color: var(--ok); } .card .s.warn { color: var(--warn); }
.panel { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 20px; margin-bottom: 22px; }
.panel h2 { margin: 0 0 14px; font-size: 16px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
tr:hover td { background: #faf6ee; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.pill { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.pill.yes { background: #dcfce7; color: var(--ok); }
.pill.no { background: #fef3c7; color: var(--warn); }
.trend { display: flex; align-items: flex-end; gap: 4px; height: 96px; }
.trend .bar { flex: 1; background: var(--accent); border-radius: 4px 4px 0 0; min-height: 2px; position: relative; }
.trend .bar:hover::after { content: attr(data-n); position: absolute; top: -22px; left: -4px; right: -4px;
  text-align: center; font-size: 11px; color: var(--ink); }
.trend .axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 4px; }
.trend.warm .bar { background: #d97706; }
.muted { color: var(--muted); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
@media (max-width: 800px) { .grid2 { grid-template-columns: 1fr; } }
a.btn { display: inline-block; background: var(--accent); color: #fff; padding: 8px 16px;
  border-radius: 9px; text-decoration: none; font-size: 14px; }
.flash { padding: 10px 14px; border-radius: 9px; margin-bottom: 16px; font-size: 14px; }
.flash.err { background: #fee2e2; color: #991b1b; }
.flash.ok { background: #dcfce7; color: #166534; }
.search { display: flex; gap: 8px; margin-bottom: 14px; }
.search input { flex: 1; padding: 9px 12px; border: 1px solid var(--line); border-radius: 9px; font-size: 14px; }
.search button { background: var(--accent); color: #fff; border: 0; border-radius: 9px; padding: 9px 16px; cursor: pointer; }
.empty { color: var(--muted); text-align: center; padding: 28px 0; }
.font-14 { font-size:14px }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; align-items: end; }
.form-grid label { margin: 0 0 5px; }
.form-grid .field input, .form-grid .field select { width: 100%; padding: 9px 12px; border: 1px solid var(--line); border-radius: 9px; font-size: 14px; background: #fdfaf5; }
.form-grid button { background: var(--accent); color: #fff; border: 0; border-radius: 9px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; height: 40px; }
.edit-table { display: flex; flex-direction: column; }
.edit-row { display: grid; grid-template-columns: 1.1fr 1.5fr .8fr 1.1fr auto; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
.edit-row.head { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: var(--muted); font-weight: 700; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
.edit-row input, .edit-row select { width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; background: #fdfaf5; }
.edit-row .actions { display: flex; gap: 6px; white-space: nowrap; }
.btn-sm { padding: 7px 12px; border-radius: 8px; border: 0; font-size: 12px; font-weight: 700; cursor: pointer; }
.btn-sm.save { background: var(--accent); color: #fff; }
.btn-sm.danger { background: #fee2e2; color: #991b1b; }
.btn-sm.ghost { background: #efe7d8; color: var(--ink); }
@media (max-width: 820px) { .edit-row { grid-template-columns: 1fr; gap: 6px; } .edit-row.head { display: none; } .edit-row { padding: 14px 0; } }
.key-reveal { background: #1d140c; color: #d9e0d8; border-radius: 12px; padding: 16px 18px; margin-bottom: 18px; }
.key-reveal .mono { font-size: 14px; word-break: break-all; color: #a7f3d0; display: block; margin: 8px 0; }
.scope-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #e0e7ff; color: #3730a3; font-weight: 700; }
.scope-badge.rw { background: #fef3c7; color: #92400e; }
</style>
</head>
<body>
<header>
  <div class="brand">🪐 <?= e($config['app_name']) ?> · Backend</div>
  <nav>
    <a href="/admin" class="<?= ($pageTitle ?? '') === 'Overview' ? 'active' : '' ?>">Overview</a>
    <a href="/admin/clients" class="<?= ($pageTitle ?? '') === 'Clients' ? 'active' : '' ?>">Clients</a>
    <a href="/admin/kundlis" class="<?= ($pageTitle ?? '') === 'Kundlis' ? 'active' : '' ?>">Kundlis</a>
    <?php if (is_admin_role()): ?>
    <a href="/admin/users" class="<?= ($pageTitle ?? '') === 'Users' ? 'active' : '' ?>">Users</a>
    <a href="/admin/api-keys" class="<?= ($pageTitle ?? '') === 'API Keys' ? 'active' : '' ?>">API Keys</a>
    <?php endif; ?>
  </nav>
  <div class="meta">
    <span>Hi, <?= e($_SESSION['admin']['name'] ?? 'admin') ?> <span class="pill <?= is_admin_role() ? 'yes' : 'no' ?>" style="margin-left:4px"><?= e($_SESSION['admin']['role'] ?? 'admin') ?></span></span>
    <a href="/admin/logout" class="font-14" style="color:#dfd0bb">Logout</a>
  </div>
</header>
<main>
<?php $flash = flash_get(); if ($flash !== null): ?>
  <div class="flash <?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
<?php endif; ?>
<?php require $__view; ?>
</main>
</body>
</html>