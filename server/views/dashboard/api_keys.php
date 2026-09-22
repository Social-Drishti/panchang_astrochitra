<?php $isAdmin = is_admin_role(); ?>

<?php if (!empty($newKey)): ?>
<div class="key-reveal">
  <strong>API key created — copy it now, it won't be shown again.</strong>
  <span class="mono"><?= e($newKey) ?></span>
  <span class="muted font-14">Name: <?= e($newKeyName ?? '') ?> · Send it as <span class="mono">Authorization: Bearer &lt;key&gt;</span> or <span class="mono">X-Api-Key: &lt;key&gt;</span>.</span>
</div>
<?php endif; ?>

<?php if ($isAdmin): ?>
<div class="panel">
  <h2>Create API key</h2>
  <form class="form-grid" method="post" action="/admin/api-keys/create">
    <?= csrf_field() ?>
    <div class="field">
      <label for="key_name">Name</label>
      <input id="key_name" name="name" type="text" required placeholder="e.g. Partner integration">
    </div>
    <div class="field">
      <label for="key_scope">Scope</label>
      <select id="key_scope" name="scope">
        <option value="read">Read-only</option>
        <option value="read_write">Read &amp; write</option>
      </select>
    </div>
    <button type="submit">Generate key</button>
  </form>
  <p class="muted font-14" style="margin-top:12px">
    <strong>Read-only</strong> keys can call the GET data endpoints (stats, clients, kundlis).
    <strong>Read &amp; write</strong> keys can also delete clients and kundlis via the API.
    See the API documentation for full request/response details.
  </p>
</div>
<?php endif; ?>

<div class="panel">
  <h2>API keys (<?= number_format(count($keys)) ?>)</h2>
  <?php if (!$isAdmin): ?>
    <p class="muted font-14" style="margin-top:-6px;margin-bottom:14px">Read-only — only admins can create or revoke API keys.</p>
  <?php endif; ?>
  <table>
    <tr><th>Name</th><th>Key</th><th>Scope</th><th>Created by</th><th>Last used</th><th>Status</th><?php if ($isAdmin): ?><th></th><?php endif; ?></tr>
    <?php foreach ($keys as $k): ?>
    <tr>
      <td><?= e($k['name']) ?></td>
      <td class="mono"><?= e($k['key_prefix']) ?>…</td>
      <td><span class="scope-badge <?= $k['scope'] === 'read_write' ? 'rw' : '' ?>"><?= e($k['scope']) ?></span></td>
      <td><?= e($k['creator_name'] ?: $k['creator_email'] ?: '—') ?></td>
      <td><?= e($k['last_used_at']) ?: '<span class="muted">never</span>' ?></td>
      <td>
        <?php if ((int) $k['is_active']): ?>
          <span class="pill yes">active</span>
        <?php else: ?>
          <span class="pill no">revoked</span>
        <?php endif; ?>
      </td>
      <?php if ($isAdmin): ?>
      <td>
        <?php if ((int) $k['is_active']): ?>
        <form method="post" action="/admin/api-keys/revoke" onsubmit="return confirm('Revoke &quot;<?= e($k['name']) ?>&quot;? Any integration using it will stop working immediately.')">
          <?= csrf_field() ?>
          <input type="hidden" name="id" value="<?= e($k['id']) ?>">
          <button type="submit" class="btn-sm danger">Revoke</button>
        </form>
        <?php endif; ?>
      </td>
      <?php endif; ?>
    </tr>
    <?php endforeach; ?>
    <?php if (!$keys): ?><tr><td colspan="<?= $isAdmin ? 7 : 6 ?>" class="empty">No API keys yet.</td></tr><?php endif; ?>
  </table>
</div>
