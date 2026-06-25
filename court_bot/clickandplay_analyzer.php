<?php

$url = 'https://clickandplay.bg/%D0%BF%D0%B0%D0%B4%D0%B5%D0%BB-%D0%BA%D0%BB%D1%83%D0%B1-%D1%81%D0%BE%D1%84%D0%B8%D1%8F-reservation-13.06.2026-40003.html';

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0',
    CURLOPT_HEADER => false
]);

$html = curl_exec($ch);

preg_match(
    '/var activeCourtHours = (\{.*?\});/s',
    $html,
    $m
);

var_dump(isset($m[1]));

if(isset($m[1])){
    echo substr($m[1], 0, 500);
}

curl_close($ch);