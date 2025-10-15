<?php
$userId = $_GET["id"] ?? null;

if (!$userId) {
  echo "Invalid confirmation link.";
  exit;
}

// Supabase REST API endpoint
$supabaseUrl = "https://koxihdcxtqmvjktdafsb.supabase.co";
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveGloZGN4dHFtdmprdGRhZnNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ3OTQxMiwiZXhwIjoyMDc0MDU1NDEyfQ.oVlC8cczKaS1ymYT-VMdMkw0VtGTlCDabbmpS327hiU"; // ⚠️ Service Role Key, not anon key!

$ch = curl_init("$supabaseUrl/rest/v1/tb_login?id=eq.$userId");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "PATCH",
  CURLOPT_HTTPHEADER => [
    "apikey: $apiKey",
    "Authorization: Bearer $apiKey",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode(["confirmed" => true])
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 204) {
  echo "<h2>Your email has been confirmed successfully ✅</h2>";
} else {
  echo "<h2>Confirmation failed ❌</h2><pre>$response</pre>";
}
?>
