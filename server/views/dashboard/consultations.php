<div class="panel">
  <h2>Consultation leads (<?= number_format($total) ?>)</h2>

  <?php if (!$ping['ok']): ?>
    <div class="flash err">
      <strong>Astrochitra API not reachable.</strong> <?= e($ping['error']) ?>
      Check <span class="mono">ASTROCHITRA_API_KEY</span> in <span class="mono">.env.local</span>
      and that the key is active with the <span class="mono">leads.create</span>,
      <span class="mono">clients.read</span> and <span class="mono">appointments.read</span> permissions.
    </div>
  <?php else: ?>
    <div class="flash ok">
      Connected to Astrochitra Slots as
      <strong><?= e($ping['body']['key_name'] ?? 'unknown key') ?></strong>.
    </div>
  <?php endif; ?>

  <div class="cards">
    <div class="card"><div class="k">Total</div><div class="v"><?= number_format($total) ?></div></div>
    <div class="card"><div class="k">Pending</div><div class="v"><?= number_format($pending) ?></div></div>
    <div class="card"><div class="k">Failed</div><div class="v"><?= number_format($failed) ?></div>
      <?php if ($failed > 0): ?><div class="s warn">Lead creation failed — check the error column</div><?php endif; ?>
    </div>
  </div>

  <form class="search" method="get" action="/admin/consultations">
    <input type="search" name="q" value="<?= e($q) ?>" placeholder="Search name, phone, device id or slots client id…">
    <button type="submit">Search</button>
  </form>

  <table>
    <tr>
      <th>ID</th><th>Name</th><th>Phone</th><th>Birth details</th>
      <th>Slots client</th><th>Status</th><th>Registered</th><th>Last sync</th><th></th>
    </tr>
    <?php foreach ($clients as $c): ?>
    <tr>
      <td class="mono">#<?= e($c['id']) ?></td>
      <td><?= e($c['name']) ?: '—' ?></td>
      <td class="mono"><?= e($c['phone']) ?></td>
      <td>
        <?php
        $birth = array_filter([$c['date_of_birth'], $c['birth_time'], $c['birth_place']]);
        echo $birth ? e(implode(' · ', $birth)) : '<span class="muted">—</span>';
        ?>
        <?php if ($c['question'] !== ''): ?>
          <div class="muted" style="font-size:12px;margin-top:3px"><?= e($c['question']) ?></div>
        <?php endif; ?>
      </td>
      <td class="mono"><?= $c['astro_client_id'] !== null ? '#' . e($c['astro_client_id']) : '—' ?></td>
      <td>
        <?php if ($c['status'] === 'linked'): ?>
          <span class="pill yes">linked</span>
        <?php elseif ($c['status'] === 'failed'): ?>
          <span class="pill no">failed</span>
          <div class="muted" style="font-size:11px;margin-top:3px"><?= e($c['last_error']) ?></div>
        <?php else: ?>
          <span class="pill no"><?= e($c['status']) ?></span>
        <?php endif; ?>
      </td>
      <td class="mono"><?= e($c['created_at']) ?></td>
      <td class="mono"><?= $c['last_synced_at'] !== null ? e($c['last_synced_at']) : '—' ?></td>
      <td>
        <div class="actions" style="display:flex;gap:6px">
          <?php if ($c['astro_client_id'] !== null): ?>
          <form method="post" action="/admin/consultations/resync">
            <?= csrf_field() ?>
            <input type="hidden" name="id" value="<?= e($c['id']) ?>">
            <button class="btn-sm ghost" type="submit">Refresh</button>
          </form>
          <?php endif; ?>
          <form method="post" action="/admin/consultations/release"
                onsubmit="return confirm('Release <?= e($c['phone']) ?>? The user will be able to register again from a new device. The lead in the slots system is kept.')">
            <?= csrf_field() ?>
            <input type="hidden" name="id" value="<?= e($c['id']) ?>">
            <button class="btn-sm danger" type="submit">Release</button>
          </form>
        </div>
      </td>
    </tr>
    <?php endforeach; ?>
    <?php if (!$clients): ?><tr><td colspan="9" class="empty">No consultation leads yet.</td></tr><?php endif; ?>
  </table>
</div>
