<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;
use App\Models\AstrochitraClient;
use App\Models\ConsultationClient;

/**
 * Admin screens for consultation leads.
 *
 * The only mutation here is releasing a phone-to-install binding. That exists
 * because this flow has no OTP: if someone clears their app data they come back
 * with a new install id and their old number is still bound, so without a way
 * to release it they are permanently locked out. The lead in the slots system
 * is left untouched — only the local link is removed.
 */
final class AdminConsultationController extends Controller
{
    public function index(): void
    {
        $q = trim((string) ($_GET['q'] ?? ''));
        $clients = ConsultationClient::paginated(200, 0, $q);
        $total = ConsultationClient::count($q);

        $pdo = \App\Core\Database::pdo();
        $pending = (int) $pdo->query("SELECT COUNT(*) FROM consultation_clients WHERE status = 'pending'")->fetchColumn();
        $failed = (int) $pdo->query("SELECT COUNT(*) FROM consultation_clients WHERE status = 'failed'")->fetchColumn();

        // Surfaces key/permission/rate-limit problems instead of hiding them
        // behind a lead that silently never appears.
        $ping = AstrochitraClient::ping();

        admin_view('dashboard/consultations', [
            'clients' => $clients,
            'total' => $total,
            'pending' => $pending,
            'failed' => $failed,
            'q' => $q,
            'ping' => $ping,
            'pageTitle' => 'Consultations',
        ]);
    }

    public function release(): void
    {
        $this->guard('/admin/consultations');

        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0) {
            flash_set('err', 'Unknown registration.');
            Response::redirect('/admin/consultations');
        }

        $row = ConsultationClient::findById($id);
        if ($row === null) {
            flash_set('err', 'That registration no longer exists.');
            Response::redirect('/admin/consultations');
        }

        if (ConsultationClient::release($id)) {
            flash_set(
                'ok',
                sprintf(
                    'Released %s (%s). The number can be registered again. The lead in the slots system was not deleted.',
                    $row['name'] !== '' ? $row['name'] : 'this registration',
                    $row['phone']
                )
            );
        } else {
            flash_set('err', 'Could not release that registration.');
        }

        Response::redirect('/admin/consultations');
    }

    public function resync(): void
    {
        $this->guard('/admin/consultations');

        $id = (int) ($_POST['id'] ?? 0);
        $row = ConsultationClient::findById($id);
        if ($row === null || !$row['astro_client_id']) {
            flash_set('err', 'That registration is not linked to a lead yet.');
            Response::redirect('/admin/consultations');
        }

        $result = AstrochitraClient::appointmentsForClient((int) $row['astro_client_id']);
        if (!$result['ok']) {
            flash_set('err', 'Upstream read failed: ' . $result['error']);
            Response::redirect('/admin/consultations');
        }

        $appointments = $result['body']['appointments'] ?? [];
        $count = \App\Models\ConsultationCache::replaceForClient(
            $id,
            (int) $row['astro_client_id'],
            is_array($appointments['offline'] ?? null) ? $appointments['offline'] : [],
            is_array($appointments['online'] ?? null) ? $appointments['online'] : []
        );
        ConsultationClient::markSynced($id, gmdate('Y-m-d H:i:s'));

        flash_set('ok', sprintf('Refreshed %s — %d appointment(s) cached.', $row['phone'], $count));
        Response::redirect('/admin/consultations');
    }

    private function guard(string $redirect): void
    {
        require_admin_role();

        if (!csrf_verify()) {
            flash_set('err', 'Session expired, please try again.');
            Response::redirect($redirect);
        }
    }
}
