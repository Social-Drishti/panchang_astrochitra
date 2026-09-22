<?php
function trend_bars(array $series): string {
  $max = 1;
  foreach ($series as $p) $max = max($max, (int) $p['n']);
  $html = '<div class="trend">';
  foreach ($series as $p) {
    $h = max(3, (int) round(((int) $p['n'] / $max) * 96));
    $html .= '<div class="bar" style="height:' . $h . 'px" data-n="' . e($p['n']) . '"></div>';
  }
  $html .= '</div><div class="axis"><span>' . e($series[0]['day'] ?? '') . '</span><span>' . e($series[count($series) - 1]['day'] ?? '') . '</span></div>';
  return $html;
}
$webShare = $totalClients > 0 ? round($totalInstalls / $totalClients * 100) : 0;
?>
<div class="cards">
  <div class="card">
    <div class="k">Web users</div>
    <div class="v"><?= number_format($totalClients) ?></div>
    <div class="s"><?= number_format($webToday) ?> new today</div>
  </div>
  <div class="card">
    <div class="k">Installs</div>
    <div class="v"><?= number_format($totalInstalls) ?></div>
    <div class="s ok"><?= number_format($installsToday) ?> new today</div>
  </div>
  <div class="card">
    <div class="k">Web → install</div>
    <div class="v"><?= $webShare ?>%</div>
    <div class="s">of all web users installed the PWA</div>
  </div>
  <div class="card">
    <div class="k">Kundlis saved</div>
    <div class="v"><?= number_format($totalKundlis) ?></div>
    <div class="s warn"><?= number_format($kundlisToday) ?> anonymous today</div>
  </div>
</div>

<div class="grid2">
  <div class="panel">
    <h2>New web users — last 14 days</h2>
    <?= trend_bars($clientTrend) ?>
  </div>
  <div class="panel">
    <h2>Kundlis saved — last 14 days</h2>
    <?= trend_bars($kundliTrend) ?>
  </div>
</div>

<div class="grid2">
  <div class="panel">
    <h2>Recent clients</h2>
    <table>
      <tr><th>Device</th><th>Platform</th><th>Installed</th><th>First seen</th></tr>
      <?php foreach ($recentClients as $c): ?>
      <tr>
        <td class="mono"><?= e($c['device_id']) ?></td>
        <td><?= e($c['platform']) ?: '—' ?></td>
        <td><?php if ((int)$c['is_installed']): ?><span class="pill yes">yes</span><?php else: ?><span class="pill no">web</span><?php endif; ?></td>
        <td><?= e($c['first_seen_at']) ?></td>
      </tr>
      <?php endforeach; ?>
      <?php if (!$recentClients): ?><tr><td colspan="4" class="empty">No clients yet — open the PWA once.</td></tr><?php endif; ?>
    </table>
  </div>
  <div class="panel">
    <h2>Recent kundlis</h2>
    <table>
      <tr><th>Place</th><th>Birth</th><th>Name</th></tr>
      <?php foreach ($recentKundlis as $k): ?>
      <tr>
        <td><?= e($k['place_name']) ?: '—' ?></td>
        <td class="mono"><?= e($k['date']) ?> <?= e($k['time']) ?></td>
        <td><?= e($k['birth_name']) ?: 'anonymous' ?></td>
      </tr>
      <?php endforeach; ?>
      <?php if (!$recentKundlis): ?><tr><td colspan="3" class="empty">No kundlis yet.</td></tr><?php endif; ?>
    </table>
  </div>
</div>

<?php if ($firstClient): ?>
<div class="panel muted" style="font-size:12px">Tracking since <?= e($firstClient) ?> UTC.</div>
<?php endif; ?>

<?php if (is_admin_role()): ?>
<div class="panel">
  <h2>Clear data</h2>
  <p class="muted font-14" style="margin:-6px 0 14px">
    Removes tracked analytics (clients) and saved kundlis. This cannot be undone.
  </p>

  <form class="form-grid" method="post" action="/admin/data/clear-range"
        onsubmit="return confirm('Delete all clients and kundlis created in this date range?')">
    <?= csrf_field() ?>
    <div class="field">
      <label for="clear_from">From</label>
      <input id="clear_from" name="from" type="date" required>
    </div>
    <div class="field">
      <label for="clear_to">To</label>
      <input id="clear_to" name="to" type="date" required>
    </div>
    <button type="submit">Clear data in range</button>
  </form>

  <form method="post" action="/admin/data/clear-all" style="margin-top:16px"
        onsubmit="return confirm('Delete ALL tracked data — every client and every saved kundli? This cannot be undone.')">
    <?= csrf_field() ?>
    <button type="submit" class="btn-sm danger" style="background:#fee2e2;color:#991b1b;padding:10px 18px;font-size:14px">
      Clear ALL data
    </button>
  </form>
</div>
<?php endif; ?>