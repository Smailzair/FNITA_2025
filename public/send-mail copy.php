<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  exit(0);
}

$data = json_decode(file_get_contents("php://input"), true);
$email = $data["email"];
$name = $data["name"];
$userId = $data["userId"];

$confirmLink = "https://fnita.com/confirm.php?id=" . urlencode($userId);

// Send email via Resend API
$apiKey = "re_dUJ6zHFz_EZ2wDGM2dsJxHgRmcLQGNvVq"; // Replace with your Resend API key

$payload = [
  "from" => "FNITA <support@fnita.com>",
  "to" => $email,
  "subject" => "Confirm your registration",
  "html" => "
    <h2>Hello $name,</h2>
    <p>Thanks for registering!</p>
    <p>Please confirm your email:</p>
    <a href='$confirmLink' target='_blank'>Confirm Email</a>
  "
];

$ch = curl_init("https://api.resend.com/emails");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer $apiKey",
    "Content-Type: application/json"
  ],
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode($payload)
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200 || $httpCode == 201) {
  echo json_encode(["success" => true]);
} else {
  echo json_encode(["success" => false, "response" => $response]);
}
?>
