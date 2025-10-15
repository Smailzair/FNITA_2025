<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") exit(0);

$data = json_decode(file_get_contents("php://input"), true);
$email = $data["email"];
$familyName = $data["familyName"];
$name = $data["name"];
$userId = $data["userId"];
$token = $data["token"];

$confirmLink = "https://fnita.com/confirm.php?id=" . urlencode($userId) . "&token=" . urlencode($token);

$apiKey = "re_dUJ6zHFz_EZ2wDGM2dsJxHgRmcLQGNvVq"; // Replace with your Resend API key
$year = date('Y');

// ✅ Your email HTML content
$html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Confirmation de compte</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 0;">
<table width="100%" style="background-color: #134e4a; padding: 10px 0; text-align: center;">
  <tr>
    <td>
      <img src="https://fnita.com/LOGO_ALG.png" alt="LOGO_ALG" width="64" height="64" style="display: block; margin: 0 auto;" />
      <p style="color: #f9fafb; font-size: 13px; line-height: 1.4; margin: 8px 0 0 0;">
        République algérienne démocratique et populaire<br>
        Ministère de l'Agriculture et du Développement Rural<br>
        Fichier National d'Identification et Traçabilité Animale
      </p>
    </td>
  </tr>
</table>
<div style="background-color: #ffffff; margin: 30px auto; padding: 30px; max-width: 600px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
  <h2 style="color: #134e4a;">Bienvenue M. {$name},</h2>
  <p style="font-size: 15px; color: #2d3748;">
    Veuillez confirmer votre compte en cliquant ci-dessous :
  </p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{$confirmLink}" target="_blank"
       style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 25px; border-radius: 6px;">
      Confirmer l'email
    </a>
  </p>
  <p style="font-size: 13px; color: #4a5568; text-align: center;">
    Ce lien expirera dans 24 heures.
  </p>
</div>
<footer style="background-color: #134e4a; color: #ffffff; text-align: center; padding: 10px 0; font-size: 12px;">
  Copyright &copy; {$year}. Al Baitar SoftVet
</footer>
</body>
</html>
HTML;

// ✅ Build the payload for Resend API
$payload = json_encode([
    "from" => "FNITA <support@fnita.com>",   // must be a verified domain in Resend
    "to" => [$email],
    "subject" => "Confirmation de votre compte",
    "html" => $html
]);

// ✅ Send using CURL
$ch = curl_init("https://api.resend.com/emails");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $apiKey",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// ✅ Check result
if ($http_status === 200 || $http_status === 201) {
    echo json_encode(["success" => true, "message" => "Email envoyé avec succès"]);
} else {
    echo json_encode(["success" => false, "message" => "Échec de l'envoi", "response" => $response]);
}
?>