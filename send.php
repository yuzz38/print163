<?php
/**
 * Fancy Look · PRINT163 — обработчик заявок с сайта
 * Отправляет заявку на e-mail (с файлами во вложении) и, при настройке, в Telegram-бот.
 * © 2026 Полунин Лев. Все права защищены.
 */

// ================= НАСТРОЙКИ =================
const MAIL_TO      = 'FL163@mail.ru';          // куда приходят заявки
const MAIL_FROM    = 'no-reply@print163.ru';   // ящик на домене сайта (иначе письма уйдут в спам)
const TG_BOT_TOKEN = '';                       // токен бота от @BotFather (необязательно)
const TG_CHAT_ID   = '';                       // id чата/группы менеджеров (необязательно)
const MAX_FILE_MB  = 25;
const ALLOWED_EXT  = ['jpg','jpeg','png','webp','heic','pdf','psd','cdr','tif','tiff','ai','eps','svg','doc','docx'];
// =============================================

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function out($ok, $extra = []) { echo json_encode(array_merge(['ok' => $ok], $extra), JSON_UNESCAPED_UNICODE); exit; }
function clean($v, $max = 2000) { return mb_substr(trim(strip_tags((string)$v)), 0, $max); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); out(false, ['error' => 'method']); }
if (!empty($_POST['website'])) out(true, ['num' => 'spam']);                       // honeypot


$name    = clean($_POST['name'] ?? '', 100);
$phone   = clean($_POST['phone'] ?? '', 40);
$channel = clean($_POST['channel'] ?? '', 40);
$comment = clean($_POST['comment'] ?? '', 3000);
$summary = clean($_POST['summary'] ?? '', 3000);
$product = clean($_POST['product'] ?? '', 200);
$page    = clean($_POST['page'] ?? '', 500);
$num     = preg_replace('/[^0-9\-]/', '', $_POST['order_no'] ?? '') ?: ('163-' . substr((string)time(), -5));

if (mb_strlen($name) < 2 || strlen(preg_replace('/\D/', '', $phone)) < 10) { http_response_code(422); out(false, ['error' => 'validation']); }

// простая защита от флуда: не чаще 1 заявки в 20 секунд с одного IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$lock = sys_get_temp_dir() . '/p163_' . md5($ip);
if (file_exists($lock) && time() - filemtime($lock) < 20) { http_response_code(429); out(false, ['error' => 'too_often']); }
@touch($lock);


// ---------- файлы ----------
$files = [];
if (!empty($_FILES['files']) && is_array($_FILES['files']['name'])) {
  foreach ($_FILES['files']['name'] as $i => $fn) {
    if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) continue;
    $ext = strtolower(pathinfo($fn, PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXT, true)) continue;
    if ($_FILES['files']['size'][$i] > MAX_FILE_MB * 1048576) continue;
    $files[] = ['name' => preg_replace('/[^\w\.\-а-яА-ЯёЁ ]/u', '_', $fn), 'tmp' => $_FILES['files']['tmp_name'][$i], 'type' => 'application/octet-stream'];
  }
}

// ---------- текст ----------
$text  = "Заявка с сайта №$num\n";
if ($product) $text .= "Тема: $product\n";
$text .= "Имя: $name\nТелефон: $phone\n";
if ($channel) $text .= "Связаться: $channel\n";
if ($summary) $text .= "\n— Расчёт —\n$summary\n";
if ($comment) $text .= "\nКомментарий: $comment\n";
if ($files)   $text .= "\nФайлы: " . implode(', ', array_column($files, 'name')) . "\n";
$text .= "\nСтраница: $page\nIP: $ip\nДата: " . date('d.m.Y H:i');

// ---------- e-mail ----------
$boundary = md5(uniqid('', true));
$subject  = '=?UTF-8?B?' . base64_encode("Заявка №$num — $name, $phone") . '?=';
$headers  = "From: PRINT163 <" . MAIL_FROM . ">\r\nReply-To: " . MAIL_FROM . "\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
$body  = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text)) . "\r\n";
foreach ($files as $f) {
  $body .= "--$boundary\r\nContent-Type: {$f['type']}; name=\"=?UTF-8?B?" . base64_encode($f['name']) . "?=\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"=?UTF-8?B?" . base64_encode($f['name']) . "?=\"\r\n\r\n" . chunk_split(base64_encode(file_get_contents($f['tmp']))) . "\r\n";
}
$body .= "--$boundary--";
$mailOk = @mail(MAIL_TO, $subject, $body, $headers);

// ---------- Telegram (необязательно) ----------
$tgOk = false;
if (TG_BOT_TOKEN && TG_CHAT_ID && function_exists('curl_init')) {
  $api = 'https://api.telegram.org/bot' . TG_BOT_TOKEN;
  $ch = curl_init("$api/sendMessage");
  curl_setopt_array($ch, [CURLOPT_POST => 1, CURLOPT_RETURNTRANSFER => 1, CURLOPT_TIMEOUT => 10, CURLOPT_POSTFIELDS => ['chat_id' => TG_CHAT_ID, 'text' => mb_substr($text, 0, 4000)]]);
  $tgOk = (bool)curl_exec($ch); curl_close($ch);
  foreach ($files as $f) {
    $ch = curl_init("$api/sendDocument");
    curl_setopt_array($ch, [CURLOPT_POST => 1, CURLOPT_RETURNTRANSFER => 1, CURLOPT_TIMEOUT => 30, CURLOPT_POSTFIELDS => ['chat_id' => TG_CHAT_ID, 'caption' => "№$num", 'document' => new CURLFile($f['tmp'], 'application/octet-stream', $f['name'])]]);
    curl_exec($ch); curl_close($ch);
  }
}

if (!$mailOk && !$tgOk) { http_response_code(500); out(false, ['error' => 'send', 'num' => $num]); }
out(true, ['num' => $num]);
