<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(
    file_get_contents(
        __DIR__ . '/clubs_data.json'
    ),
    true
);

$clubId = $_GET['club_id'] ?? null;

if (!$clubId) {

    echo json_encode([
        'error' => 'missing club_id'
    ]);

    exit;
}

echo json_encode([
    'generated_at' => $data['generated_at'] ?? null,
    'club' => $data['clubs'][$clubId] ?? []
]);