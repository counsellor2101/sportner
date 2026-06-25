<?php

error_reporting(E_ALL);

$url = 'https://clickandplay.bg/padel-club-sofia-reservation40003.html';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT =>
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    CURLOPT_ENCODING => '',
]);

$html = curl_exec($ch);

curl_close($ch);

file_put_contents(
    __DIR__ . '/response.html',
    $html
);

echo "saved";