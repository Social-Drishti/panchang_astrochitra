<?php $isAdmin = is_admin_role(); $meId = (int) ($_SESSION['admin']['id'] ?? 0); ?>

<?php if ($isAdmin): ?>
<div class="panel">
  <h2>Add user</h2>
  <form class="form-grid" method="post" action="/admin/users/create">
    <?= csrf_field() ?>
    <div class="field">
      <label for="new_name">Name</label>
      <input id="new_name" name="name" type="text" placeholder="Jane Doe">
    </div>
    <div class="field">
      <label for="new_email">Email</label>
      <input id="new_email" name="email" type="email" required placeholder="jane@example.com">
    </div>
    <div class="field">
      <label for="new_password">Password</label>
      <input id="new_password" name="password" type="password" required minlength="8" placeholder="At least 8 characters">
    </div>
    <div class="field">
      <label for="new_role">Role</label>
      <select id="new_role" name="role">
        <option value="admin">Admin</option>
        <option value="viewer">Viewer</option>
      </select>
    </div>
    <button type="submit">Add user</button>
  </form>
  <p class="muted font-14" style="margin-top:12px">Admins can manage users and API keys. Viewers can see every dashboard page but can't create, edit or delete anything.</p>
</div>
<?php endif; ?>

<div class="panel">
  <h2>Users (<?= number_format(count($users)) ?>)</h2>
  <?php if (!$isAdmin): ?>
    <p class="muted font-14" style="margin-top:-6px;margin-bottom:14px">Read-only — only admins can add, edit or delete users.</p>
  <?php endif; ?>

  <div class="edit-table">
    <?php if ($isAdmin): ?>
    <div class="edit-row head">
      <div>Name</div><div>Email</div><div>Role</div><div>New password</div><div>Actions</div>
    </div>
    <?php foreach ($users as $u): ?>
    <form class="edit-row" method="post" action="/admin/users/update">
      <?= csrf_field() ?>
      <input type="hidden" name="id" value="<?= e($u['id']) ?>">
      <input name="name" value="<?= e($u['name']) ?>" placeholder="Name">
      <input name="email" type="email" value="<?= e($u['email']) ?>" required>
      <select name="role">
        <option value="admin" <?= $u['role'] === 'admin' ? 'selected' : '' ?>>Admin</option>
        <option value="viewer" <?= $u['role'] === 'viewer' ? 'selected' : '' ?>>Viewer</option>
      </select>
      <input name="password" type="password" minlength="8" placeholder="Leave blank to keep">
      <div class="actions">
        <button type="submit" formaction="/admin/users/update" class="btn-sm save">Save</button>
        <button type="submit" formaction="/admin/users/delete" class="btn-sm danger"
          onclick="return confirm('Delete <?= e($u['email']) ?>? This can\'t be undone.')"
          <?= (int) $u['id'] === $meId ? 'disabled title="You can\'t delete your own account"' : '' ?>>Delete</button>
      </div>
    </form>
    <?php endforeach; ?>
    <?php else: ?>
    <table>
      <tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr>
      <?php foreach ($users as $u): ?>
      <tr>
        <td><?= e($u['name']) ?: '—' ?></td>
        <td class="mono"><?= e($u['email']) ?></td>
        <td><span class="pill <?= $u['role'] === 'admin' ? 'yes' : 'no' ?>"><?= e($u['role']) ?></span></td>
        <td><?= e($u['created_at']) ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
    <?php endif; ?>
    <?php if (!$users): ?><div class="empty">No users yet.</div><?php endif; ?>
  </div>
</div>
