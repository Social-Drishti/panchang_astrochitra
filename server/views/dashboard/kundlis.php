<div class="panel">
  <h2>Kundlis (<?= number_format(count($kundlis)) ?>)</h2>
  <table>
    <tr><th>ID</th><th>Client</th><th>Name</th><th>Birth</th><th>Place</th><th>JSON</th></tr>
    <?php foreach ($kundlis as $k): ?>
    <tr>
      <td class="mono">#<?= e($k['id']) ?></td>
      <td class="mono"><?= e($k['device_id']) ?: '—' ?></td>
      <td><?= e($k['birth_name']) ?: 'anonymous' ?></td>
      <td class="mono"><?= e($k['date']) ?> <?= e($k['time']) ?><br><span class="muted">UT <?= e($k['timezone']) ?></span></td>
      <td class="mono"><?= e($k['latitude']) ?>, <?= e($k['longitude']) ?><br><span class="muted"><?= e($k['place_name']) ?></span></td>
      <td><details><summary class="font-14">view <?= number_format(strlen((string)$k['kundli_json'])) ?>B</summary>
        <pre class="mono" style="max-height:280px; overflow:auto; white-space:pre-wrap; background:#1d140c; color:#d9e0d8; padding:12px; border-radius:9px"><?= e($k['kundli_json']) ?></pre>
      </details></td>
    </tr>
    <?php endforeach; ?>
    <?php if (!$kundlis): ?><tr><td colspan="6" class="empty">No kundlis saved yet.</td></tr><?php endif; ?>
  </table>
</div>