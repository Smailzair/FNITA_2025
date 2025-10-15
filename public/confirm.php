<?php
// confirm.php

// --- CONFIG ---
$id = $_GET['id'] ?? '';
$token = $_GET['token'] ?? '';

$dsn = 'pgsql:host=db.koxihdcxtqmvjktdafsb.supabase.co;port=5432;dbname=postgres';
$user = 'postgres';
$pass = 'TydXmFnN034sPT9t';

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Check user token
    $stmt = $pdo->prepare("SELECT token, confirmed FROM public.tb_login WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    $confirmed = false;
    $message = "Lien de confirmation invalide ou expiré.";

    if ($userData && !$userData['confirmed'] && $userData['token'] === $token) {
        $update = $pdo->prepare("UPDATE public.tb_login SET confirmed = true WHERE id = :id");
        $update->execute(['id' => $id]);
        $confirmed = true;
        $message = "Votre compte a été confirmé avec succès !";
    } elseif ($userData && $userData['confirmed']) {
        $message = "Votre compte est déjà confirmé.";
        $confirmed = true;
    }
} catch (Exception $e) {
    $message = "Erreur : " . $e->getMessage();
    $confirmed = false;
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmation du compte</title>
<style>
    body {
        font-family: "Segoe UI", Arial, sans-serif;
        background-color: #f7f9fc;
        margin: 0;
        padding: 0;
    }
    .content {
        max-width: 600px;
        margin: 40px auto;
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        overflow: hidden;
    }
    .main {
        padding: 40px 20px;
        text-align: center;
    }
    h2 {
        color: #134e4a;
        margin-bottom: 15px;
    }
    p {
        color: #374151;
        margin-bottom: 25px;
        font-size: 16px;
    }
    a.button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #134e4a;
        color: #f9fafb;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
    }
    a.button:hover {
        background-color: #0f3d39;
    }
    footer {
        background-color: #134e4a;
        color: #ffffff;
        text-align: center;
        padding: 10px 0;
        font-size: 12px;
    }
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" style="background-color: #134e4a; padding: 10px 0; text-align: center;">
  <tr>
    <td>
      <img src="https://fnita.com/LOGO_ALG.png" alt="LOGO_ALG" width="64" height="64" style="display: block; margin: 0 auto;" />
      <p style="color: #f9fafb; font-size: 13px; line-height: 1.4; margin: 8px 0 0 0;">
        République algérienne démocratique et populaire<br>
        Ministère de l’Agriculture et du Développement Rural<br>
        Fichier National d’Identification et Traçabilité Animale
      </p>
    </td>
  </tr>
</table>

<!-- CONTENT -->
<div class="content">
  <div class="main">
    <h2><?= htmlspecialchars($message) ?></h2>
    <?php if ($confirmed): ?>
      <p>Vous pouvez maintenant vous connecter à votre compte.</p>
      <a href="/login" class="button">Aller à la page de connexion</a>
    <?php else: ?>
      <p>Si vous pensez qu’il s’agit d’une erreur, contactez le support technique.</p>
    <?php endif; ?>
  </div>
</div>

<!-- FOOTER -->
<footer>
  Copyright &copy; <?= date('Y'); ?>. Al Baitar SoftVet
</footer>

</body>
</html>
