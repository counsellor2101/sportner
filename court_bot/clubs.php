<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(
    file_get_contents(
        __DIR__ . '/clubs_data.json'
    ),
    true
);

echo json_encode(
    $data['clubs_info'] ?? [],
    JSON_UNESCAPED_UNICODE
);