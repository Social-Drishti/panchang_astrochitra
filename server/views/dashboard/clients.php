<div class="panel">
  <h2>Clients (<?= number_format(count($clients)) ?>)</h2>
  <form class="search" method="get" action="/admin/clients">
    <input type="search" name="q" value="<?= e($q) ?>" placeholder="Search device id, platform, user agent…">
    <button type="submit">Search</button>
  </form>
  <table>
    <tr><th>ID</th><th>Device</th><th>Platform</th><th>Mobile</th><th>Installed</th><th>First seen</th><th>Last seen</th></tr>
    <?php foreach ($clients as $c): ?>
    <tr>
      <td class="mono">#<?= e($c['id']) ?></td>
      <td class="mono"><?= e($c['device_id']) ?></td>
      <td><?= e($c['platform']) ?: '—' ?></td>
      <td><?= (int)$c['is_mobile'] ? '📱' : '💻' ?></td>
      <td><?php if ((int)$c['is_installed']): ?><span class="pill yes">yes</span><?php else: ?><span class="pill no">web</span><?php endif; ?></td>
      <td><?= e($c['first_seen_at']) ?></td>
      <td><?= e($c['last_seen_at']) ?></td>
    </tr>
    <?php endforeach; ?>
    <?php if (!$clients): ?><tr><td colspan="7" class="empty">No clients match.</td></tr><?php endif; ?>
  </table>
</div>